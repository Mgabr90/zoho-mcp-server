import { z } from 'zod';
import { ZohoCRMClient } from '../lib/clients/crm-client.js';
import { ZohoCRMRecord } from '../lib/types/index.js';

export interface CreateRecordParams {
  module_name: string;
  data: Record<string, any>;
  trigger_workflow?: boolean;
  duplicate_check_fields?: string[];
  // Subform support based on CRM API v8
  subform_data?: Array<{
    subform_name: string;
    records: Record<string, any>[];
  }>;
}

export interface UpdateRecordParams {
  module_name: string;
  record_id: string;
  data: Record<string, any>;
  trigger_workflow?: boolean;
  // Subform support based on CRM API v8
  subform_updates?: Array<{
    subform_name: string;
    records: Array<{
      id?: string; // Include ID for existing subform records
      _delete?: null; // Set to null to delete specific subform records
      [key: string]: any;
    }>;
  }>;
}

export interface DeleteRecordParams {
  module_name: string;
  record_ids: string[];
  trigger_workflow?: boolean;
}

export interface GetRecordsParams {
  module_name: string;
  fields?: string[];
  page?: number;
  per_page?: number;
  sort_order?: 'asc' | 'desc';
  sort_by?: string;
  converted?: string;
  approved?: string;
  territory_id?: string;
  include_child?: string;
  cv_id?: string;
  ids?: string[];
  // Subform support based on CRM API v8
  subform_name?: string;
  parent_record_id?: string;
  include_subforms?: boolean;
}

export interface BulkCreateParams {
  module_name: string;
  data: Record<string, any>[];
  trigger_workflow?: boolean;
  duplicate_check_fields?: string[];
}

export interface BulkUpdateParams {
  module_name: string;
  data: Record<string, any>[];
  trigger_workflow?: boolean;
}

export interface UpsertRecordsParams {
  module_name: string;
  data: Record<string, any>[];
  duplicate_check_fields: string[];
  trigger_workflow?: boolean;
}

export interface SearchRecordsParams {
  module_name: string;
  criteria: string;
  email?: string;
  phone?: string;
  word?: string;
  converted?: string;
  approved?: string;
  page?: number;
  per_page?: number;
  fields?: string[];
  validate_fields?: boolean;
}

export interface CloneRecordParams {
  module_name: string;
  record_id: string;
  trigger_workflow?: boolean;
}

export interface GetRichTextFieldsParams {
  module_name: string;
  record_id: string;
  fields?: string[];
}

export interface GetTimelineParams {
  module_name: string;
  record_id: string;
  timeline_types?: string[];
  include_inner_details?: boolean;
  page?: number;
  per_page?: number;
}

export interface GetDeletedRecordsParams {
  module_name: string;
  type: 'all' | 'recycle' | 'permanent';
  page?: number;
  per_page?: number;
}

export interface GetRecordCountParams {
  module_name: string;
  criteria?: string;
  email?: string;
  phone?: string;
  word?: string;
  converted?: string;
  approved?: string;
}

export interface GetFieldsParams {
  module_name: string;
  field_id?: string;
}

export interface ValidateCriteriaParams {
  module_name: string;
  criteria: string;
}

export class CRMRecordsTools {
  constructor(private crmClient: ZohoCRMClient) {}

  /**
   * Create MCP-compliant error response
   */
  private createErrorResponse(message: string, suggestions?: string[]): any {
    return {
      isError: true,
      content: [{
        type: "text",
        text: suggestions 
          ? `${message}\n\nSuggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`
          : message
      }]
    };
  }

  /**
   * Validate Zoho API v8 criteria format
   */
  private validateCriteriaFormat(criteria: string): { valid: boolean; error?: string } {
    // Check basic format: ((field:operator:value))
    const basicPattern = /^\(\(.+\)\)$/;
    if (!basicPattern.test(criteria)) {
      return {
        valid: false,
        error: 'Criteria must follow format: ((field_API_name:operator:value)) or compound: ((field1:op:val1) and (field2:op:val2))'
      };
    }

    // Check for valid operators
    const validOperators = ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in', 'starts_with'];
    const operatorPattern = new RegExp(`:(${validOperators.join('|')}):`);
    if (!operatorPattern.test(criteria)) {
      return {
        valid: false,
        error: `Invalid operator. Valid operators: ${validOperators.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Get fields metadata for a CRM module using Zoho API v8
   */
  async getFields(params: GetFieldsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found.`,
          [
            'Check available modules using crm_get_modules',
            'Use exact module API names (e.g., "Leads", "Installments", "CustomModule3")',
            'Custom modules may have different API names than display names'
          ]
        );
      }

      const fields = await this.crmClient.getFields(moduleApiName);
      
      // Format fields for LLM consumption
      const formattedFields = fields.map((field: any) => ({
        api_name: field.api_name,
        display_label: field.display_label || field.field_label,
        data_type: field.data_type,
        required: field.required,
        custom_field: field.custom_field,
        read_only: field.read_only,
        pick_list_values: field.pick_list_values?.map((plv: any) => plv.actual_value) || null,
        lookup_details: field.lookup && {
          module: field.lookup.module,
          display_label: field.lookup.display_label
        }
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            module: moduleApiName,
            total_fields: formattedFields.length,
            fields: formattedFields,
            usage_tips: [
              'Use api_name in search criteria, not display_label',
              'Date fields use ISO8601 format: 2025-07-22T00:00:00+00:00',
              'Picklist fields must use exact values from pick_list_values',
              'Use operators appropriate for data_type (see crm_validate_criteria)'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to get fields for module '${params.module_name}': ${error.message}`,
        [
          'Verify the module exists and is accessible',
          'Check your API permissions for field metadata access',
          'Try using the exact API name from crm_get_modules'
        ]
      );
    }
  }

  /**
   * Validate search criteria format and field names
   */
  async validateCriteria(params: ValidateCriteriaParams): Promise<any> {
    try {
      // First validate basic format
      const formatCheck = this.validateCriteriaFormat(params.criteria);
      if (!formatCheck.valid) {
        return this.createErrorResponse(
          `Invalid criteria format: ${formatCheck.error}`,
          [
            'Correct format: ((field_API_name:operator:value))',
            'Compound: ((field1:equals:value1) and (field2:greater_than:value2))',
            'Example: ((Modified_Time:equals:2025-07-22))',
            'Example: ((Due_Date:greater_than:2025-06-30) and (Payment_Status:in:Payment Collected,Partial Payment))'
          ]
        );
      }

      // Get module fields for validation
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found for validation.`,
          ['Use crm_get_modules to see available modules']
        );
      }

      const fields = await this.crmClient.getFields(moduleApiName);
      const fieldMap = new Map(fields.map((f: any) => [f.api_name, f]));

      // Extract field names from criteria - fixed to match all fields, not just first one
      const fieldPattern = /\((\w+):/g;
      const fieldMatches = [...params.criteria.matchAll(fieldPattern)];
      const usedFields = fieldMatches.map(match => match[1]);

      const validation = {
        format_valid: true,
        fields_validation: usedFields.map(fieldName => {
          const field = fieldMap.get(fieldName);
          return {
            field_name: fieldName,
            exists: !!field,
            data_type: field?.data_type,
            suggested_operators: this.getValidOperators(field?.data_type),
            pick_list_values: field?.pick_list_values?.map((plv: any) => plv.actual_value)
          };
        }),
        suggestions: [] as string[]
      };

      // Add suggestions for invalid fields
      const invalidFields = validation.fields_validation.filter(f => !f.exists);
      if (invalidFields.length > 0) {
        validation.suggestions = [
          `Invalid field names: ${invalidFields.map(f => f.field_name).join(', ')}`,
          'Use crm_get_fields to see available field API names',
          'Field names use underscores (e.g., Modified_Time, not Modified Time)'
        ];
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(validation, null, 2)
        }]
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to validate criteria: ${error.message}`,
        ['Check module name and criteria format']
      );
    }
  }

  /**
   * Get valid operators for a field data type
   */
  private getValidOperators(dataType: string): string[] {
    const operatorMap: Record<string, string[]> = {
      'date': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between'],
      'datetime': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between'],
      'integer': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in'],
      'currency': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in'],
      'decimal': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in'],
      'boolean': ['equals', 'not_equal'],
      'lookup': ['equals', 'not_equal', 'in'],
      'picklist': ['equals', 'not_equal', 'in'],
      'text': ['equals', 'not_equal', 'starts_with', 'in'],
      'email': ['equals', 'not_equal', 'starts_with', 'in'],
      'phone': ['equals', 'not_equal', 'starts_with', 'in'],
      'website': ['equals', 'not_equal', 'starts_with', 'in'],
      'multiselectpicklist': ['equals', 'not_equal', 'in', 'starts_with'],
      'autonumber': ['equals', 'not_equal', 'in'],
      'bigint': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in'],
      'percent': ['equals', 'not_equal', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'between', 'in']
    };

    return operatorMap[dataType?.toLowerCase()] || ['equals'];
  }

  /**
   * Create a single record in any CRM module
   */
  async createRecord(params: CreateRecordParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.createRecord(moduleApiName, params.data);
    } catch (error: any) {
      throw new Error(`Failed to create record in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Update a single record in any CRM module
   */
  async updateRecord(params: UpdateRecordParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.updateRecord(moduleApiName, params.record_id, params.data);
    } catch (error: any) {
      throw new Error(`Failed to update record ${params.record_id} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Delete one or more records from any CRM module
   */
  async deleteRecords(params: DeleteRecordParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      if (params.record_ids.length === 0) {
        throw new Error('At least one record ID must be provided');
      }

      if (params.record_ids.length > 100) {
        throw new Error('Cannot delete more than 100 records at once');
      }

      // Use single record deletion for single records, bulk for multiple
      if (params.record_ids.length === 1) {
        return await this.crmClient.deleteRecord(moduleApiName, params.record_ids[0]);
      } else {
        return await this.crmClient.deleteRecordsBulk(
          moduleApiName,
          params.record_ids,
          {
            trigger_workflow: params.trigger_workflow
          }
        );
      }
    } catch (error: any) {
      throw new Error(`Failed to delete records from ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get records from any CRM module
   */
  async getRecords(params: GetRecordsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.getRecords(
        moduleApiName,
        {
          fields: params.fields,
          page: params.page || 1,
          per_page: params.per_page || 200
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to get records from ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(params: { module_name: string; record_id: string; fields?: string[] }): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }
      
      return await this.crmClient.getRecord(moduleApiName, params.record_id);
    } catch (error: any) {
      throw new Error(`Failed to get record ${params.record_id} from ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Create multiple records in any CRM module (bulk operation)
   */
  async createRecordsBulk(params: BulkCreateParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.createRecordsBulk(
        moduleApiName,
        params.data,
        {
          trigger_workflow: params.trigger_workflow,
          duplicate_check_fields: params.duplicate_check_fields
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to create records in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Update multiple records in any CRM module (bulk operation)
   */
  async updateRecordsBulk(params: BulkUpdateParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      // Validate that all records have an ID
      for (const record of params.data) {
        if (!record.id) {
          throw new Error('All records must have an ID field for bulk update');
        }
      }

      return await this.crmClient.updateRecordsBulk(
        moduleApiName,
        params.data as Array<{ id: string } & Record<string, any>>,
        {
          trigger_workflow: params.trigger_workflow
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to update records in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Upsert records (create or update based on duplicate check)
   */
  async upsertRecords(params: UpsertRecordsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.upsertRecords(
        moduleApiName,
        params.data,
        params.duplicate_check_fields,
        {
          trigger_workflow: params.trigger_workflow
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to upsert records in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Search for records in any CRM module with enhanced validation and error handling
   */
  async searchRecords(params: SearchRecordsParams): Promise<any> {
    try {
      // Validate criteria format first
      const formatCheck = this.validateCriteriaFormat(params.criteria);
      if (!formatCheck.valid) {
        return this.createErrorResponse(
          `Invalid search criteria format: ${formatCheck.error}`,
          [
            'Correct format: ((field_API_name:operator:value))',
            'Compound format: ((field1:equals:value1) and (field2:greater_than:value2))',
            'Example for Installments: ((Modified_Time:equals:2025-07-22))',
            'Example compound: ((Due_Date:greater_than:2025-06-30) and (Payment_Status:in:Payment Collected,Partial Payment))',
            'Use crm_validate_criteria to check your syntax before searching'
          ]
        );
      }

      // Get and validate module
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found or not accessible.`,
          [
            'Check available modules with crm_get_modules',
            'For Installments, try: "Installments" or "CustomModule3"',
            'Module names are case-sensitive',
            'Custom modules may have different API names than display names'
          ]
        );
      }

      // Optional field validation if requested
      if (params.validate_fields !== false) {
        try {
          const fields = await this.crmClient.getFields(moduleApiName);
          const fieldMap = new Map(fields.map((f: any) => [f.api_name, f]));
          
          // Extract field names from criteria
          const fieldPattern = /\(\((\w+):/g;
          const fieldMatches = [...params.criteria.matchAll(fieldPattern)];
          const usedFields = fieldMatches.map(match => match[1]);
          
          const invalidFields = usedFields.filter(fieldName => !fieldMap.has(fieldName));
          if (invalidFields.length > 0) {
            const suggestions = fields
              .filter((f: any) => f.api_name.toLowerCase().includes('date') || 
                                 f.api_name.toLowerCase().includes('payment') ||
                                 f.api_name.toLowerCase().includes('status') ||
                                 f.api_name.toLowerCase().includes('amount'))
              .map((f: any) => f.api_name)
              .slice(0, 10);

            return this.createErrorResponse(
              `Invalid field names in criteria: ${invalidFields.join(', ')}.`,
              [
                `Use crm_get_fields with module_name="${params.module_name}" to see all available fields`,
                'Field names use underscores (e.g., Modified_Time, Due_Date, Payment_Status)',
                'Common fields for Installments might include: ' + suggestions.join(', '),
                'To skip field validation, set validate_fields: false'
              ]
            );
          }
        } catch (fieldError) {
          // Continue with search even if field validation fails
          console.warn('Field validation failed:', fieldError);
        }
      }

      // Execute search
      const result = await this.crmClient.searchRecords(
        moduleApiName,
        params.criteria,
        {
          page: params.page || 1,
          per_page: Math.min(params.per_page || 200, 200),
          fields: params.fields
        }
      );

      // Format successful response
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            module: moduleApiName,
            criteria: params.criteria,
            total_records: result.data?.length || 0,
            records: result.data || [],
            info: result.info || {},
            search_tips: [
              'Use exact field API names (get them with crm_get_fields)',
              'Date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss+00:00',
              'For multiple values use "in" operator: field:in:value1,value2',
              'Maximum 2000 records can be retrieved per search'
            ]
          }, null, 2)
        }]
      };

    } catch (error: any) {
      return this.createErrorResponse(
        `Search failed for module '${params.module_name}': ${error.message}`,
        [
          'Check your criteria format with crm_validate_criteria',
          'Verify field names with crm_get_fields',
          'Ensure module exists with crm_get_modules',
          'Check API permissions for the module',
          'Try a simpler criteria to test: ((id:not_equal:null))'
        ]
      );
    }
  }

  /**
   * Clone a record in any CRM module
   */
  async cloneRecord(params: CloneRecordParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.cloneRecord(
        moduleApiName,
        params.record_id,
        {
          trigger_workflow: params.trigger_workflow
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to clone record ${params.record_id} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get rich text fields for a record
   */
  async getRichTextFields(params: GetRichTextFieldsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.getRichTextFields(
        moduleApiName,
        params.record_id,
        params.fields
      );
    } catch (error: any) {
      throw new Error(`Failed to get rich text fields for record ${params.record_id} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get timeline for a record
   * Note: Timeline API requires exact module names as they appear in Zoho CRM,
   * so we bypass getModuleApiName() transformation and use the direct module name
   */
  async getTimeline(params: GetTimelineParams): Promise<any> {
    try {
      if (!params.module_name || params.module_name.trim() === '') {
        throw new Error('Module name cannot be empty');
      }

      return await this.crmClient.getTimeline(
        params.module_name,
        params.record_id,
        {
          timeline_types: params.timeline_types,
          include_inner_details: params.include_inner_details,
          page: params.page,
          per_page: params.per_page
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to get timeline for record ${params.record_id} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get deleted records from a module
   */
  async getDeletedRecords(params: GetDeletedRecordsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.getDeletedRecords(
        moduleApiName,
        params.type,
        {
          page: params.page,
          per_page: params.per_page
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to get deleted records from ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Search records by timeline events (module-generic)
   * Find records that were modified within a specific date range
   */
  async searchByTimeline(params: {
    module_name: string;
    date_from: string;
    date_to?: string;
    action?: 'created' | 'updated' | 'deleted';
    modified_by?: string;
    per_page?: number;
    page?: number;
  }): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found.`,
          ['Use crm_get_modules to see available modules']
        );
      }

      // Build timeline-based search criteria
      const dateFrom = new Date(params.date_from).toISOString();
      let criteria = `((Modified_Time:greater_equal:${dateFrom}))`;
      
      if (params.date_to) {
        const dateTo = new Date(params.date_to).toISOString();
        criteria = `((Modified_Time:greater_equal:${dateFrom}) and (Modified_Time:less_equal:${dateTo}))`;
      }

      const searchResult = await this.crmClient.searchRecords(moduleApiName, criteria, {
        page: params.page || 1,
        per_page: params.per_page || 50
      });

      return {
        type: 'timeline_search',
        module: params.module_name,
        criteria: {
          date_from: params.date_from,
          date_to: params.date_to,
          action: params.action,
          modified_by: params.modified_by
        },
        results: searchResult,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Timeline search failed for ${params.module_name}: ${error.message}`,
        [
          'Check date format (YYYY-MM-DD or ISO 8601)',
          'Verify module name is correct',
          'Use crm_get_fields to check available modules'
        ]
      );
    }
  }

  /**
   * Get field change history for records (module-generic)
   * Track what changed in specific fields over time
   */
  async getFieldChanges(params: {
    module_name: string;
    record_ids?: string[];
    field_names?: string[];
    date_from: string;
    date_to?: string;
    per_page?: number;
  }): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found.`,
          ['Use crm_get_modules to see available modules']
        );
      }

      const fieldChanges = [];
      const recordIds = params.record_ids || [];
      
      // If no specific records provided, get recent records
      if (recordIds.length === 0) {
        const recentRecords = await this.searchByTimeline({
          module_name: params.module_name,
          date_from: params.date_from,
          date_to: params.date_to,
          per_page: 10
        });
        
        if (recentRecords.results?.data) {
          recordIds.push(...recentRecords.results.data.map((r: any) => r.id));
        }
      }

      // Get timeline for each record and analyze field changes
      for (const recordId of recordIds.slice(0, 10)) { // Limit to prevent overload
        try {
          const timeline = await this.crmClient.getTimeline(moduleApiName, recordId, {
            per_page: params.per_page || 20
          });
          
          if (timeline.__timeline) {
            const relevantChanges = timeline.__timeline.filter((entry: any) => {
              const entryDate = new Date(entry.audited_time);
              const fromDate = new Date(params.date_from);
              const toDate = params.date_to ? new Date(params.date_to) : new Date();
              
              return entryDate >= fromDate && entryDate <= toDate;
            }).map((entry: any) => ({
              record_id: recordId,
              action: entry.action,
              audited_time: entry.audited_time,
              done_by: entry.done_by,
              field_changes: entry.field_history?.filter((field: any) => 
                !params.field_names || params.field_names.includes(field.api_name)
              ) || []
            })).filter((entry: any) => entry.field_changes.length > 0);
            
            fieldChanges.push(...relevantChanges);
          }
        } catch (error) {
          console.warn(`Could not get timeline for record ${recordId}:`, error);
        }
      }

      return {
        type: 'field_changes',
        module: params.module_name,
        criteria: {
          date_from: params.date_from,
          date_to: params.date_to,
          field_names: params.field_names,
          record_count: recordIds.length
        },
        changes: fieldChanges,
        summary: {
          total_changes: fieldChanges.length,
          records_analyzed: recordIds.length,
          unique_fields_changed: [...new Set(fieldChanges.flatMap(c => 
            c.field_changes.map((f: any) => f.api_name)))]
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Field changes analysis failed for ${params.module_name}: ${error.message}`,
        [
          'Check date format and range',
          'Verify record IDs exist',
          'Ensure field names are correct (use crm_get_fields)'
        ]
      );
    }
  }

  /**
   * Analyze activity patterns in timeline data (module-generic)
   * Identify trends and patterns in record modifications
   */
  async analyzeActivityPatterns(params: {
    module_name: string;
    date_from: string;
    date_to?: string;
    group_by?: 'user' | 'field' | 'day' | 'hour';
    per_page?: number;
  }): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `Module '${params.module_name}' not found.`,
          ['Use crm_get_modules to see available modules']
        );
      }

      // Get recent records to analyze
      const recentRecords = await this.searchByTimeline({
        module_name: params.module_name,
        date_from: params.date_from,
        date_to: params.date_to,
        per_page: params.per_page || 20
      });

      const patterns: any = {
        by_user: {},
        by_field: {},
        by_day: {},
        by_hour: {},
        total_activities: 0
      };

      if (recentRecords.results?.data) {
        for (const record of recentRecords.results.data.slice(0, 10)) {
          try {
            const timeline = await this.crmClient.getTimeline(moduleApiName, record.id, {
              per_page: 20
            });
            
            if (timeline.__timeline) {
              for (const entry of timeline.__timeline) {
                const entryDate = new Date(entry.audited_time);
                const fromDate = new Date(params.date_from);
                const toDate = params.date_to ? new Date(params.date_to) : new Date();
                
                if (entryDate >= fromDate && entryDate <= toDate) {
                  patterns.total_activities++;
                  
                  // Group by user
                  const user = entry.done_by?.name || 'Unknown';
                  patterns.by_user[user] = (patterns.by_user[user] || 0) + 1;
                  
                  // Group by field changes
                  if (entry.field_history) {
                    for (const field of entry.field_history) {
                      patterns.by_field[field.api_name] = (patterns.by_field[field.api_name] || 0) + 1;
                    }
                  }
                  
                  // Group by day
                  const day = entryDate.toISOString().split('T')[0];
                  patterns.by_day[day] = (patterns.by_day[day] || 0) + 1;
                  
                  // Group by hour
                  const hour = entryDate.getHours();
                  patterns.by_hour[hour] = (patterns.by_hour[hour] || 0) + 1;
                }
              }
            }
          } catch (error) {
            console.warn(`Could not analyze timeline for record ${record.id}:`, error);
          }
        }
      }

      // Sort results for better presentation
      const sortedPatterns = {
        by_user: Object.entries(patterns.by_user).sort(([,a], [,b]) => (b as number) - (a as number)),
        by_field: Object.entries(patterns.by_field).sort(([,a], [,b]) => (b as number) - (a as number)),
        by_day: Object.entries(patterns.by_day).sort(([a], [b]) => a.localeCompare(b)),
        by_hour: Object.entries(patterns.by_hour).sort(([a], [b]) => parseInt(a) - parseInt(b))
      };

      return {
        type: 'activity_patterns',
        module: params.module_name,
        period: {
          from: params.date_from,
          to: params.date_to || new Date().toISOString()
        },
        summary: {
          total_activities: patterns.total_activities,
          most_active_user: sortedPatterns.by_user[0]?.[0],
          most_changed_field: sortedPatterns.by_field[0]?.[0],
          records_analyzed: recentRecords.results?.data?.length || 0
        },
        patterns: sortedPatterns,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Activity pattern analysis failed for ${params.module_name}: ${error.message}`,
        [
          'Check date format and range',
          'Ensure sufficient data exists in the time period',
          'Try a broader date range for better analysis'
        ]
      );
    }
  }

  /**
   * Get record count in a module
   */
  async getRecordCount(params: GetRecordCountParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      return await this.crmClient.getRecordCount(
        moduleApiName,
        {
          criteria: params.criteria,
          email: params.email,
          phone: params.phone,
          word: params.word,
          converted: params.converted,
          approved: params.approved
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to get record count from ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get the API name for a module
   */
  private async getModuleApiName(moduleName: string): Promise<string | null> {
    try {
      const modules = await this.crmClient.getModules();
      
      // Standard module name mappings
      const moduleMap: Record<string, string> = {
        'leads': 'Leads',
        'accounts': 'Accounts', 
        'contacts': 'Contacts',
        'deals': 'Deals',
        'tasks': 'Tasks',
        'events': 'Events',
        'calls': 'Calls',
        'products': 'Products',
        'quotes': 'Quotes',
        'sales_orders': 'Sales_Orders',
        'purchase_orders': 'Purchase_Orders',
        'invoices': 'Invoices',
        'cases': 'Cases',
        'solutions': 'Solutions',
        'campaigns': 'Campaigns',
        'vendors': 'Vendors',
        'price_books': 'Price_Books'
      };
      
      // First try direct mapping
      const lowerModuleName = moduleName.toLowerCase().replace(/\s+/g, '_');
      if (moduleMap[lowerModuleName]) {
        return moduleMap[lowerModuleName];
      }
      
      // Then try to find by API name or module name
      const module = modules.find(m => 
        m.api_name.toLowerCase() === moduleName.toLowerCase() ||
        m.module_name.toLowerCase() === moduleName.toLowerCase() ||
        m.plural_label.toLowerCase() === moduleName.toLowerCase() ||
        m.singular_label.toLowerCase() === moduleName.toLowerCase()
      );
      
      return module ? module.api_name : null;
    } catch (error) {
      console.error('Error getting module API name:', error);
      return null;
    }
  }
}

// Schema exports for type validation
export const CreateRecordParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  data: z.record(z.any()).describe('Record data with field values'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)'),
  duplicate_check_fields: z.array(z.string()).optional().describe('Fields to check for duplicates')
});

export const UpdateRecordParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  record_id: z.string().describe('Unique record ID to update'),
  data: z.record(z.any()).describe('Record data with field values to update'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)')
});

export const DeleteRecordsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  record_ids: z.array(z.string()).describe('Array of record IDs to delete (max 100)'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)')
});

export const GetRecordsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  fields: z.array(z.string()).optional().describe('Specific fields to retrieve'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Records per page (max 200)'),
  sort_order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  sort_by: z.string().optional().describe('Field to sort by'),
  converted: z.string().optional().describe('Filter by conversion status (for Leads)'),
  approved: z.string().optional().describe('Filter by approval status'),
  territory_id: z.string().optional().describe('Filter by territory'),
  cv_id: z.string().optional().describe('Custom view ID to apply'),
  ids: z.array(z.string()).optional().describe('Specific record IDs to retrieve')
});

export const BulkCreateParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  data: z.array(z.record(z.any())).describe('Array of record data objects (max 100)'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)'),
  duplicate_check_fields: z.array(z.string()).optional().describe('Fields to check for duplicates')
});

export const BulkUpdateParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  data: z.array(z.record(z.any())).describe('Array of record objects with id field (max 100)'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)')
});

export const UpsertRecordsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  data: z.array(z.record(z.any())).describe('Array of record data objects (max 100)'),
  duplicate_check_fields: z.array(z.string()).describe('Fields to check for duplicates (required for upsert)'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)')
});

export const SearchRecordsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals", "installments")'),
  criteria: z.string().describe('Search criteria in Zoho API v8 format: ((field_API_name:operator:value))'),
  email: z.string().optional().describe('Search by email address'),
  phone: z.string().optional().describe('Search by phone number'),
  word: z.string().optional().describe('Search by word/keyword'),
  converted: z.string().optional().describe('Filter by conversion status (for Leads)'),
  approved: z.string().optional().describe('Filter by approval status'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Records per page (max 200)'),
  fields: z.array(z.string()).optional().describe('Specific fields to return (use API names)'),
  validate_fields: z.boolean().default(true).optional().describe('Validate field names before search (default: true)')
});

export const CloneRecordParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  record_id: z.string().describe('ID of the record to clone'),
  trigger_workflow: z.boolean().optional().describe('Whether to trigger workflows (default: true)')
});

export const GetRichTextFieldsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  record_id: z.string().describe('ID of the record'),
  fields: z.array(z.string()).optional().describe('Specific rich text fields to retrieve')
});

export const GetTimelineParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  record_id: z.string().describe('ID of the record'),
  timeline_types: z.array(z.string()).optional().describe('Types of timeline entries to include'),
  include_inner_details: z.boolean().optional().describe('Include detailed inner information'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Entries per page (max 200)')
});

export const GetDeletedRecordsParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  type: z.enum(['all', 'recycle', 'permanent']).describe('Type of deleted records to retrieve'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Records per page (max 200)')
});

export const GetRecordCountParamsSchema = z.object({
  module_name: z.string().describe('Module name (e.g., "leads", "accounts", "contacts", "deals")'),
  criteria: z.string().optional().describe('Search criteria expression'),
  email: z.string().optional().describe('Filter by email address'),
  phone: z.string().optional().describe('Filter by phone number'),
  word: z.string().optional().describe('Filter by word/keyword'),
  converted: z.string().optional().describe('Filter by conversion status (for Leads)'),
  approved: z.string().optional().describe('Filter by approval status')
});

export const GetFieldsParamsSchema = z.object({
  module_name: z.string().describe('Module name to get field metadata for (e.g., "leads", "installments", "custommodule3")'),
  field_id: z.string().optional().describe('Optional specific field ID to get detailed information')
});

export const ValidateCriteriaParamsSchema = z.object({
  module_name: z.string().describe('Module name to validate criteria against'),
  criteria: z.string().describe('Search criteria to validate in format: ((field_API_name:operator:value))')
});

export const SearchByTimelineParamsSchema = z.object({
  module_name: z.string().describe('Module name (standard or custom)'),
  date_from: z.string().describe('Start date (YYYY-MM-DD or ISO 8601)'),
  date_to: z.string().optional().describe('End date (YYYY-MM-DD or ISO 8601)'),
  action: z.enum(['created', 'updated', 'deleted']).optional().describe('Filter by action type'),
  modified_by: z.string().optional().describe('Filter by user who made changes'),
  per_page: z.number().min(1).max(200).optional().describe('Records per page (max 200)'),
  page: z.number().min(1).optional().describe('Page number for pagination')
});

export const GetFieldChangesParamsSchema = z.object({
  module_name: z.string().describe('Module name (standard or custom)'),
  record_ids: z.array(z.string()).optional().describe('Specific record IDs to analyze'),
  field_names: z.array(z.string()).optional().describe('Specific field names to track'),
  date_from: z.string().describe('Start date (YYYY-MM-DD or ISO 8601)'),
  date_to: z.string().optional().describe('End date (YYYY-MM-DD or ISO 8601)'),
  per_page: z.number().min(1).max(200).optional().describe('Timeline entries per record (max 200)')
});

export const AnalyzeActivityPatternsParamsSchema = z.object({
  module_name: z.string().describe('Module name (standard or custom)'),
  date_from: z.string().describe('Start date (YYYY-MM-DD or ISO 8601)'),
  date_to: z.string().optional().describe('End date (YYYY-MM-DD or ISO 8601)'),
  group_by: z.enum(['user', 'field', 'day', 'hour']).optional().describe('How to group the analysis'),
  per_page: z.number().min(1).max(200).optional().describe('Records to analyze (max 200)')
});