import { z } from 'zod';
import { ZohoPeopleClient, ZohoPeopleRecord } from '../lib/clients/people-client';

export interface PeopleGetModulesParams {
  // No parameters needed - returns all available People modules
}

export interface PeopleGetFieldsParams {
  module_name: string;
  field_id?: string;
}

export interface PeopleSearchRecordsParams {
  module_name: string;
  criteria: string;
  fields?: string[];
  page?: number;
  per_page?: number;
}

export interface PeopleGetTimelineParams {
  module_name: string;
  record_id: string;
  timeline_types?: string[];
  include_inner_details?: boolean;
  page?: number;
  per_page?: number;
}

export class PeopleTools {
  constructor(private peopleClient: ZohoPeopleClient) {}

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
   * Get all available People modules (Employees, Departments, Attendance, etc.)
   */
  async getAllModules(params: PeopleGetModulesParams): Promise<any> {
    try {
      const modules = await this.peopleClient.getModules();
      
      // Format modules for LLM consumption
      const formattedModules = modules.map((module: any) => ({
        api_name: module.api_name,
        module_name: module.module_name,
        plural_label: module.plural_label,
        singular_label: module.singular_label,
        supported_operations: module.supported_operations,
        capabilities: {
          creatable: module.creatable,
          deletable: module.deletable,
          editable: module.editable,
          viewable: module.viewable
        }
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            product: 'Zoho People',
            total_modules: formattedModules.length,
            modules: formattedModules,
            common_modules: [
              'employees - Employee records and profiles',
              'departments - Department/team structure',
              'attendance - Attendance tracking records',
              'leave - Leave requests and balances',
              'performance - Performance reviews and goals',
              'training - Training programs and records'
            ],
            usage_tips: [
              'Use exact module API names in other People tools',
              'Check supported_operations before attempting operations',
              'Employees module is the core module for most HR operations',
              'Custom forms appear as additional modules'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to get People modules: ${error.message}`,
        [
          'Check your Zoho People API access permissions',
          'Verify your authentication tokens are valid',
          'Ensure People product is enabled in your Zoho organization'
        ]
      );
    }
  }

  /**
   * Get fields metadata for a People module
   */
  async getFields(params: PeopleGetFieldsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `People module '${params.module_name}' not found.`,
          [
            'Check available modules using people_get_all_modules',
            'Use exact module API names (e.g., "employees", "departments", "attendance")',
            'Custom forms may have different API names than display names'
          ]
        );
      }

      const fields = await this.peopleClient.getFields(moduleApiName);
      
      // Format fields for LLM consumption
      const formattedFields = fields.map((field: any) => ({
        api_name: field.api_name,
        display_label: field.display_label,
        data_type: field.data_type,
        required: field.required,
        read_only: field.read_only,
        custom_field: field.custom_field,
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
            product: 'Zoho People',
            total_fields: formattedFields.length,
            fields: formattedFields,
            usage_tips: [
              'Use api_name in search criteria and record operations',
              'Date fields typically use YYYY-MM-DD format',
              'Picklist fields must use exact values from pick_list_values',
              'Required fields must be provided when creating records'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to get fields for People module '${params.module_name}': ${error.message}`,
        [
          'Verify the module exists and is accessible',
          'Check your API permissions for field metadata access',
          'Try using the exact API name from people_get_all_modules'
        ]
      );
    }
  }

  /**
   * Search records in a People module with generic search capabilities
   */
  async searchRecords(params: PeopleSearchRecordsParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `People module '${params.module_name}' not found.`,
          [
            'Check available modules with people_get_all_modules',
            'Use exact module API names (e.g., "employees", "departments")',
            'Module names are case-sensitive'
          ]
        );
      }

      const result = await this.peopleClient.searchRecords(
        moduleApiName,
        params.criteria,
        {
          fields: params.fields,
          page: params.page || 1,
          per_page: Math.min(params.per_page || 200, 200)
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            module: moduleApiName,
            product: 'Zoho People',
            search_criteria: params.criteria,
            total_records: result.data?.length || 0,
            records: result.data || [],
            pagination: result.info || {},
            search_tips: [
              'People search uses text-based matching',
              'Try partial matches for better results',
              'Use specific field names when available',
              'Consider using broader search terms if no results found'
            ]
          }, null, 2)
        }]
      };

    } catch (error: any) {
      return this.createErrorResponse(
        `Search failed for People module '${params.module_name}': ${error.message}`,
        [
          'Check your search criteria format',
          'Verify the module exists with people_get_all_modules',
          'Ensure you have read permissions for the module',
          'Try a simpler search term to test connectivity'
        ]
      );
    }
  }

  /**
   * Get timeline/activity data for a People record
   */
  async getTimeline(params: PeopleGetTimelineParams): Promise<any> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      if (!moduleApiName) {
        return this.createErrorResponse(
          `People module '${params.module_name}' not found.`,
          [
            'Check available modules with people_get_all_modules',
            'Use exact module API names'
          ]
        );
      }

      const timeline = await this.peopleClient.getTimeline(
        moduleApiName,
        params.record_id,
        {
          timeline_types: params.timeline_types,
          include_inner_details: params.include_inner_details,
          page: params.page,
          per_page: params.per_page
        }
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            module: moduleApiName,
            product: 'Zoho People',
            record_id: params.record_id,
            timeline_entries: timeline.__timeline || [],
            total_entries: timeline.__timeline?.length || 0,
            warning: timeline.warning,
            timeline_info: [
              'Timeline shows activity history for the record',
              'May include status changes, field updates, and comments',
              'Not all People modules support detailed timeline data',
              'Use for audit trails and activity tracking'
            ]
          }, null, 2)
        }]
      };

    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to get timeline for People record ${params.record_id} in module '${params.module_name}': ${error.message}`,
        [
          'Verify the record ID exists',
          'Check if timeline is supported for this module',
          'Ensure you have read permissions for the record',
          'Some People modules may not have timeline functionality'
        ]
      );
    }
  }

  /**
   * Get module API name from various input formats
   */
  private async getModuleApiName(moduleName: string): Promise<string | null> {
    try {
      const modules = await this.peopleClient.getModules();
      
      // Standard module name mappings for People
      const moduleMap: Record<string, string> = {
        'employee': 'employees',
        'emp': 'employees',
        'department': 'departments',
        'dept': 'departments',
        'attendance': 'attendance',
        'leave': 'leave',
        'leaves': 'leave',
        'performance': 'performance',
        'training': 'training',
        'trainings': 'training'
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
      console.error('Error getting People module API name:', error);
      return null;
    }
  }
}

// Schema exports for type validation
export const PeopleGetModulesParamsSchema = z.object({
  // No parameters needed
}).describe('Get all available Zoho People modules (Employees, Departments, Attendance, etc.)');

export const PeopleGetFieldsParamsSchema = z.object({
  module_name: z.string().describe('People module name (e.g., "employees", "departments", "attendance", "leave")'),
  field_id: z.string().optional().describe('Optional specific field ID for detailed information')
});

export const PeopleSearchRecordsParamsSchema = z.object({
  module_name: z.string().describe('People module name (e.g., "employees", "departments", "attendance", "leave")'),
  criteria: z.string().describe('Search criteria - text to search for in records'),
  fields: z.array(z.string()).optional().describe('Specific fields to return (use API names)'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Records per page (max 200)')
});

export const PeopleGetTimelineParamsSchema = z.object({
  module_name: z.string().describe('People module name (e.g., "employees", "departments")'),
  record_id: z.string().describe('ID of the People record'),
  timeline_types: z.array(z.string()).optional().describe('Types of timeline entries to include'),
  include_inner_details: z.boolean().optional().describe('Include detailed inner information'),
  page: z.number().min(1).optional().describe('Page number for pagination'),
  per_page: z.number().min(1).max(200).optional().describe('Entries per page (max 200)')
});