import { z } from 'zod';
import { ZohoDeskClient, ZohoDeskRecord, ZohoDeskDepartment, ZohoDeskField } from '../lib/clients/desk-client.js';

// Schema definitions for validation
export const DeskGetDepartmentsParamsSchema = z.object({
  // No parameters needed - returns all departments
});

export const DeskGetEntityFieldsParamsSchema = z.object({
  department_id: z.string().min(1, 'Department ID is required'),
  entity_type: z.string().min(1, 'Entity type is required (e.g., tickets, contacts, accounts)')
});

export const DeskSearchEntitiesParamsSchema = z.object({
  department_id: z.string().min(1, 'Department ID is required'),
  entity_type: z.string().min(1, 'Entity type is required (e.g., tickets, contacts, accounts)'),
  search_str: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  view_id: z.string().optional(),
  sort_by: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  from: z.number().min(0).default(0),
  fields: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
  auto_paginate: z.boolean().default(false),
  max_records: z.number().min(1).max(5000).default(1000)
});

export const DeskGetEntityTimelineParamsSchema = z.object({
  department_id: z.string().min(1, 'Department ID is required'),
  entity_type: z.string().min(1, 'Entity type is required (e.g., tickets, contacts, accounts)'),
  record_id: z.string().min(1, 'Record ID is required'),
  limit: z.number().min(1).max(100).default(20),
  from: z.number().min(0).default(0),
  include: z.array(z.string()).optional()
});

// Type definitions
export interface DeskGetDepartmentsParams {}

export interface DeskGetEntityFieldsParams {
  department_id: string;
  entity_type: string;
}

export interface DeskSearchEntitiesParams {
  department_id: string;
  entity_type: string;
  search_str?: string;
  email?: string;
  phone?: string;
  view_id?: string;
  sort_by?: string;
  limit?: number;
  from?: number;
  fields?: string[];
  include?: string[];
  auto_paginate?: boolean;
  max_records?: number;
}

export interface DeskGetEntityTimelineParams {
  department_id: string;
  entity_type: string;
  record_id: string;
  limit?: number;
  from?: number;
  include?: string[];
}

export class DeskTools {
  constructor(private deskClient: ZohoDeskClient) {}

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
   * Get all departments in Zoho Desk
   */
  async getAllDepartments(params: DeskGetDepartmentsParams): Promise<any> {
    try {
      const departments = await this.deskClient.getDepartments();
      
      // Format departments for LLM consumption
      const formattedDepartments = departments.map((dept: ZohoDeskDepartment) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        is_enabled: dept.isEnabled,
        has_logo: dept.hasLogo,
        logo_url: dept.logoUrl,
        created_time: dept.createdTime,
        modified_time: dept.modifiedTime
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            product: 'Zoho Desk',
            total_departments: formattedDepartments.length,
            departments: formattedDepartments,
            supported_entities: [
              'tickets - Support tickets and service requests',
              'contacts - Customer contacts and end users',
              'accounts - Customer accounts and organizations', 
              'agents - Support agents and staff members',
              'products - Products and services offered',
              'articles - Knowledge base articles',
              'tasks - Support tasks and follow-ups',
              'calls - Support calls and phone interactions',
              'events - Calendar events and appointments'
            ],
            workflow_guidance: {
              prerequisites: [
                'Get department ID from this list',
                'Choose appropriate entity type for your use case',
                'Support tickets are typically the primary entity in Desk'
              ],
              next_steps: [
                'Use desk_get_entity_fields to discover available fields for entities',
                'Use desk_search_entities to find specific records',
                'Use desk_get_entity_timeline to track record activity history'
              ],
              common_patterns: [
                'Ticket Management: departments → tickets → timeline → resolution',
                'Customer Support: departments → contacts → tickets → activities',
                'Knowledge Base: departments → articles → search → content'
              ]
            },
            usage_tips: [
              'Each department may have different field configurations',
              'Use exact department IDs in subsequent Desk operations',
              'Tickets entity is central to most support workflows',
              'Timeline provides complete activity history for records'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return this.createErrorResponse(
        `Failed to get Desk departments: ${error.message}`,
        [
          'Check your Zoho Desk API access permissions',
          'Verify your authentication tokens are valid',
          'Ensure Desk product is enabled in your Zoho organization',
          'Contact your admin if you need access to specific departments'
        ]
      );
    }
  }

  /**
   * Get fields for a specific entity in a department
   */
  async getEntityFields(params: DeskGetEntityFieldsParams): Promise<any> {
    try {
      // Validate parameters
      const validatedParams = DeskGetEntityFieldsParamsSchema.parse(params);
      
      const fields = await this.deskClient.getEntityFields(
        validatedParams.department_id,
        validatedParams.entity_type
      );
      
      // Format fields for LLM consumption
      const formattedFields = fields.map((field: ZohoDeskField) => ({
        id: field.id,
        api_name: field.apiName,
        display_label: field.displayLabel,
        data_type: field.dataType,
        is_required: field.isRequired,
        is_visible: field.isVisible,
        is_custom_field: field.isCustomField,
        default_value: field.defaultValue,
        max_length: field.maxLength,
        precision: field.precision,
        picklist_values: field.pickListValues?.map(plv => ({
          id: plv.id,
          value: plv.value,
          is_inactive: plv.isInactive
        })),
        lookup_details: field.lookupDetails ? {
          id: field.lookupDetails.id,
          lookup_api_name: field.lookupDetails.lookupApiName,
          module: field.lookupDetails.module
        } : undefined
      }));

      // Categorize fields by type for better understanding
      const fieldsByType = {
        required_fields: formattedFields.filter(f => f.is_required),
        custom_fields: formattedFields.filter(f => f.is_custom_field),
        picklist_fields: formattedFields.filter(f => f.picklist_values && f.picklist_values.length > 0),
        lookup_fields: formattedFields.filter(f => f.lookup_details),
        text_fields: formattedFields.filter(f => f.data_type === 'text' || f.data_type === 'textarea'),
        number_fields: formattedFields.filter(f => f.data_type === 'number' || f.data_type === 'decimal'),
        date_fields: formattedFields.filter(f => f.data_type === 'date' || f.data_type === 'datetime')
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            product: 'Zoho Desk',
            department_id: validatedParams.department_id,
            entity_type: validatedParams.entity_type,
            total_fields: formattedFields.length,
            all_fields: formattedFields,
            fields_by_type: fieldsByType,
            workflow_guidance: {
              prerequisites: [
                'Department ID obtained from desk_get_all_departments',
                'Valid entity type selected (tickets, contacts, accounts, etc.)'
              ],
              next_steps: [
                'Use field api_name values in search and filter operations',
                'Check required_fields before creating new records',
                'Use picklist_values for dropdown field options',
                'Reference lookup_details for related record connections'
              ],
              common_patterns: [
                'Field Discovery: get_entity_fields → identify key fields → use in searches',
                'Record Creation: get_entity_fields → prepare data → create record',
                'Advanced Search: get_entity_fields → build criteria → search_entities'
              ]
            },
            usage_tips: [
              'Use api_name (not display_label) in API operations',
              'Required fields must be provided when creating records',
              'Custom fields are organization-specific configurations',
              'Picklist fields have predefined value options',
              'Lookup fields reference other entities/modules'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return this.createErrorResponse(
          `Invalid parameters: ${error.errors.map((e: any) => e.message).join(', ')}`,
          [
            'Provide a valid department_id (get from desk_get_all_departments)',
            'Specify entity_type (e.g., tickets, contacts, accounts)',
            'Ensure parameters match expected data types'
          ]
        );
      }
      
      return this.createErrorResponse(
        `Failed to get entity fields: ${error.message}`,
        [
          'Verify the department_id exists (use desk_get_all_departments)',
          'Check that entity_type is valid for this department',
          'Ensure you have permission to access this entity type',
          'Common entity types: tickets, contacts, accounts, agents, products'
        ]
      );
    }
  }

  /**
   * Search entities in a specific department
   */
  async searchEntities(params: DeskSearchEntitiesParams): Promise<any> {
    try {
      // Validate parameters
      const validatedParams = DeskSearchEntitiesParamsSchema.parse(params);
      
      const searchOptions = {
        searchStr: validatedParams.search_str,
        email: validatedParams.email,
        phone: validatedParams.phone,
        viewId: validatedParams.view_id,
        sortBy: validatedParams.sort_by,
        limit: validatedParams.limit,
        from: validatedParams.from,
        fields: validatedParams.fields,
        include: validatedParams.include,
        auto_paginate: validatedParams.auto_paginate,
        max_records: validatedParams.max_records
      };

      let result;
      if (validatedParams.auto_paginate) {
        result = await this.deskClient.getAllEntities(
          validatedParams.department_id,
          validatedParams.entity_type,
          searchOptions
        );
      } else {
        const response = await this.deskClient.searchEntities(
          validatedParams.department_id,
          validatedParams.entity_type,
          searchOptions
        );
        result = {
          data: response.data || [],
          totalRecords: response.data?.length || 0,
          hasMore: false,
          currentPage: 1
        };
      }

      // Format records for better readability
      const formattedRecords = result.data.map((record: ZohoDeskRecord) => {
        const formatted: any = { id: record.id };
        
        // Add key fields based on entity type
        if (validatedParams.entity_type === 'tickets') {
          formatted.subject = record.subject;
          formatted.status = record.status;
          formatted.priority = record.priority;
          formatted.department_id = record.departmentId;
          formatted.contact_id = record.contactId;
          formatted.created_time = record.createdTime;
          formatted.modified_time = record.modifiedTime;
        } else if (validatedParams.entity_type === 'contacts') {
          formatted.first_name = record.firstName;
          formatted.last_name = record.lastName;
          formatted.email = record.email;
          formatted.phone = record.phone;
          formatted.account_id = record.accountId;
        } else if (validatedParams.entity_type === 'accounts') {
          formatted.account_name = record.accountName;
          formatted.website = record.website;
          formatted.industry = record.industry;
          formatted.phone = record.phone;
        }
        
        // Add all other fields
        Object.keys(record).forEach(key => {
          if (!formatted[key] && key !== 'id') {
            formatted[key] = record[key];
          }
        });
        
        return formatted;
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            product: 'Zoho Desk',
            department_id: validatedParams.department_id,
            entity_type: validatedParams.entity_type,
            search_params: {
              search_str: validatedParams.search_str,
              email: validatedParams.email,
              phone: validatedParams.phone,
              auto_paginate: validatedParams.auto_paginate
            },
            results: {
              total_records: result.totalRecords,
              returned_records: formattedRecords.length,
              has_more: result.hasMore,
              current_page: result.currentPage,
              records: formattedRecords
            },
            workflow_guidance: {
              prerequisites: [
                'Department ID from desk_get_all_departments',
                'Entity type determined (tickets, contacts, accounts, etc.)',
                'Optional: field names from desk_get_entity_fields for specific field filtering'
              ],
              next_steps: [
                'Use record IDs for desk_get_entity_timeline to see activity history',
                'Apply specific search criteria to narrow results',
                'Enable auto_paginate=true for large datasets',
                'Use returned field data for record analysis and reporting'
              ],
              common_patterns: [
                'Ticket Search: search by status, priority, contact, or subject',
                'Contact Lookup: search by email, phone, or name',
                'Account Discovery: search by company name or industry'
              ],
              error_recovery: [
                'If no results: broaden search criteria or check entity permissions',
                'If too many results: add more specific search filters',
                'For timeouts: reduce max_records or enable pagination'
              ]
            },
            usage_tips: [
              'Use specific search_str for text-based searches',
              'Email and phone searches are exact matches',
              'auto_paginate=true retrieves all matching records (up to max_records)',
              'Include specific fields to reduce response size',
              'Sort results using sortBy parameter'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return this.createErrorResponse(
          `Invalid parameters: ${error.errors.map((e: any) => e.message).join(', ')}`,
          [
            'Provide valid department_id (from desk_get_all_departments)',
            'Specify entity_type (tickets, contacts, accounts, etc.)',
            'Ensure numeric parameters (limit, from) are valid numbers',
            'Check that arrays (fields, include) contain string values'
          ]
        );
      }
      
      return this.createErrorResponse(
        `Failed to search entities: ${error.message}`,
        [
          'Verify department_id and entity_type are correct',
          'Check your search criteria - too restrictive may return no results',
          'Ensure you have permission to access this entity type',
          'Try reducing search complexity or max_records if timing out',
          'For large datasets, use auto_paginate=true with smaller max_records'
        ]
      );
    }
  }

  /**
   * Get timeline/activity history for a specific entity record
   */
  async getEntityTimeline(params: DeskGetEntityTimelineParams): Promise<any> {
    try {
      // Validate parameters
      const validatedParams = DeskGetEntityTimelineParamsSchema.parse(params);
      
      const timeline = await this.deskClient.getEntityTimeline(
        validatedParams.department_id,
        validatedParams.entity_type,
        validatedParams.record_id,
        {
          limit: validatedParams.limit,
          from: validatedParams.from,
          include: validatedParams.include
        }
      );

      // Format timeline entries for better understanding
      const formattedEntries = (timeline.data || []).map((entry: any) => ({
        id: entry.id,
        type: entry.type,
        actor: {
          id: entry.actor?.id,
          name: entry.actor?.name,
          type: entry.actor?.type
        },
        content: entry.content,
        summary: this.generateTimelineSummary(entry),
        created_time: entry.createdTime,
        modified_time: entry.modifiedTime
      }));

      // Categorize timeline entries by type
      const entriesByType = formattedEntries.reduce((acc: any, entry: any) => {
        const type = entry.type || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entry);
        return acc;
      }, {});

      // Generate activity summary
      const activitySummary = {
        total_activities: formattedEntries.length,
        activity_types: Object.keys(entriesByType),
        latest_activity: formattedEntries.length > 0 ? formattedEntries[0] : null,
        activity_count_by_type: Object.keys(entriesByType).reduce((acc: any, type: string) => {
          acc[type] = entriesByType[type].length;
          return acc;
        }, {})
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            product: 'Zoho Desk',
            department_id: validatedParams.department_id,
            entity_type: validatedParams.entity_type,
            record_id: validatedParams.record_id,
            timeline_summary: activitySummary,
            timeline_entries: formattedEntries,
            entries_by_type: entriesByType,
            workflow_guidance: {
              prerequisites: [
                'Record ID from desk_search_entities or known entity ID',
                'Department ID from desk_get_all_departments',
                'Valid entity type (tickets, contacts, accounts, etc.)'
              ],
              next_steps: [
                'Analyze activity patterns for insights',
                'Track record lifecycle and status changes',
                'Identify key interactions and touchpoints',
                'Monitor agent performance and response times'
              ],
              common_patterns: [
                'Ticket Timeline: creation → agent assignment → status updates → resolution',
                'Contact Timeline: profile updates → ticket associations → interaction history',
                'Account Timeline: contact changes → ticket patterns → service history'
              ],
              error_recovery: [
                'If no timeline: check record exists and you have view permissions',
                'If incomplete timeline: adjust include parameters or check data retention',
                'For large timelines: use pagination with from/limit parameters'
              ]
            },
            analysis_insights: {
              activity_patterns: `${activitySummary.total_activities} total activities across ${activitySummary.activity_types.length} different types`,
              recent_activity: activitySummary.latest_activity ? 
                `Latest: ${activitySummary.latest_activity.type} at ${activitySummary.latest_activity.created_time}` : 
                'No recent activity found',
              engagement_level: activitySummary.total_activities > 10 ? 'High' : 
                               activitySummary.total_activities > 5 ? 'Medium' : 'Low'
            },
            usage_tips: [
              'Timeline is ordered by most recent activity first',
              'Use include parameter to get detailed content for activities',
              'Actor information shows who performed each action',
              'Content field contains specific details about each activity',
              'Track status changes and escalations through timeline'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return this.createErrorResponse(
          `Invalid parameters: ${error.errors.map((e: any) => e.message).join(', ')}`,
          [
            'Provide valid department_id, entity_type, and record_id',
            'Ensure numeric parameters (limit, from) are positive numbers',
            'Check that include array contains valid activity types'
          ]
        );
      }
      
      return this.createErrorResponse(
        `Failed to get entity timeline: ${error.message}`,
        [
          'Verify the department_id, entity_type, and record_id are correct',
          'Check that the record exists using desk_search_entities first',
          'Ensure you have permission to view this record\'s timeline',
          'Try with basic parameters first, then add includes if needed',
          'For old records, some timeline data may not be available'
        ]
      );
    }
  }

  /**
   * Generate a human-readable summary for a timeline entry
   */
  private generateTimelineSummary(entry: any): string {
    const type = entry.type || 'Unknown';
    const actor = entry.actor?.name || 'System';
    const time = entry.createdTime || 'Unknown time';
    
    switch (type.toLowerCase()) {
      case 'ticket_created':
        return `${actor} created the ticket at ${time}`;
      case 'status_changed':
        return `${actor} changed status at ${time}`;
      case 'comment_added':
        return `${actor} added a comment at ${time}`;
      case 'assignment_changed':
        return `${actor} changed assignment at ${time}`;
      case 'priority_changed':
        return `${actor} changed priority at ${time}`;
      case 'contact_updated':
        return `${actor} updated contact information at ${time}`;
      default:
        return `${actor} performed ${type} at ${time}`;
    }
  }
}