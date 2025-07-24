import { EnhancedToolResponse, WorkflowContext, QuickAction } from '../types/index.js';

/**
 * Workflow Intelligence Service
 * Generates smart suggestions and workflow context for tool responses
 */
export class WorkflowIntelligence {
  
  /**
   * Enhance a tool response with workflow intelligence
   */
  static enhanceResponse(toolName: string, originalData: any, params?: any): EnhancedToolResponse {
    const workflowContext = this.generateWorkflowContext(toolName, originalData, params);
    const suggestedNextTools = this.getSuggestedNextTools(toolName, originalData);
    const quickActions = this.generateQuickActions(toolName, originalData, params);
    const workflowTips = this.getWorkflowTips(toolName, originalData);

    return {
      data: originalData,
      suggested_next_tools: suggestedNextTools,
      workflow_context: workflowContext,
      quick_actions: quickActions,
      workflow_tips: workflowTips
    };
  }

  /**
   * Generate workflow context based on current tool and data
   */
  private static generateWorkflowContext(toolName: string, data: any, params?: any): WorkflowContext {
    // CRM Discovery Workflow
    if (toolName === 'crm_get_all_modules') {
      return {
        current_step: 'Module Discovery',
        completion_percentage: 20,
        next_recommended_actions: ['Select target module', 'Discover fields', 'Validate search criteria'],
        workflow_type: 'discovery'
      };
    }

    if (toolName === 'crm_get_fields') {
      return {
        current_step: 'Field Discovery',
        completion_percentage: 40,
        next_recommended_actions: ['Validate search criteria', 'Build search query', 'Execute search'],
        workflow_type: 'discovery'
      };
    }

    if (toolName === 'crm_validate_criteria') {
      return {
        current_step: 'Criteria Validation',
        completion_percentage: 60,
        next_recommended_actions: ['Execute search with validated criteria', 'Analyze results'],
        workflow_type: 'discovery'
      };
    }

    if (toolName === 'crm_search_records') {
      const recordCount = data?.records?.length || 0;
      return {
        current_step: 'Record Search',
        completion_percentage: recordCount > 0 ? 80 : 70,
        next_recommended_actions: recordCount > 0 
          ? ['Analyze individual records', 'Get timeline history', 'Generate insights']
          : ['Refine search criteria', 'Try broader filters'],
        workflow_type: 'search'
      };
    }

    // CRM Analysis Workflow
    if (toolName === 'crm_get_timeline') {
      return {
        current_step: 'Timeline Analysis',
        completion_percentage: 90,
        next_recommended_actions: ['Analyze field changes', 'Identify patterns', 'Generate reports'],
        workflow_type: 'analysis'
      };
    }

    // Books Financial Workflow
    if (toolName === 'books_get_customers') {
      const customerCount = data?.customers?.length || 0;
      return {
        current_step: 'Customer Discovery',
        completion_percentage: 25,
        next_recommended_actions: customerCount > 0 
          ? ['Select customer', 'Get customer details', 'Create invoice']
          : ['Create new customer', 'Check customer filters'],
        workflow_type: 'financial'
      };
    }

    if (toolName === 'books_create_invoice') {
      return {
        current_step: 'Invoice Creation',
        completion_percentage: 75,
        next_recommended_actions: ['Record payment', 'Send invoice', 'Track payment status'],
        workflow_type: 'financial'
      };
    }

    // People HR Workflow
    if (toolName === 'people_get_all_modules') {
      return {
        current_step: 'HR Module Discovery',
        completion_percentage: 20,
        next_recommended_actions: ['Select HR module', 'Discover employee fields', 'Search records'],
        workflow_type: 'hr'
      };
    }

    // Desk Support Workflow
    if (toolName === 'desk_get_all_departments') {
      return {
        current_step: 'Department Discovery',
        completion_percentage: 20,
        next_recommended_actions: ['Select department', 'Search tickets/contacts', 'Analyze support data'],
        workflow_type: 'support'
      };
    }

    // Default context
    return {
      current_step: 'Data Processing',
      completion_percentage: 50,
      next_recommended_actions: ['Analyze results', 'Take next action'],
      workflow_type: 'discovery'
    };
  }

  /**
   * Get suggested next tools based on current tool and results
   */
  private static getSuggestedNextTools(toolName: string, data: any): string[] {
    // CRM Discovery Chain
    if (toolName === 'crm_get_all_modules') {
      return ['crm_get_fields', 'crm_get_module_details'];
    }

    if (toolName === 'crm_get_fields') {
      return ['crm_validate_criteria', 'crm_get_picklist_values'];
    }

    if (toolName === 'crm_validate_criteria') {
      return ['crm_search_records'];
    }

    if (toolName === 'crm_search_records') {
      const hasRecords = data?.records?.length > 0;
      return hasRecords 
        ? ['crm_get_timeline', 'crm_get_field_changes', 'crm_analyze_activity_patterns']
        : ['crm_validate_criteria', 'crm_get_fields'];
    }

    // Books Financial Chain
    if (toolName === 'books_get_customers') {
      return ['books_get_customer', 'books_get_items', 'books_create_invoice'];
    }

    if (toolName === 'books_get_items') {
      return ['books_create_invoice', 'books_create_item'];
    }

    if (toolName === 'books_create_invoice') {
      return ['books_create_payment', 'books_get_invoice'];
    }

    // People HR Chain
    if (toolName === 'people_get_all_modules') {
      return ['people_get_fields', 'people_search_records'];
    }

    // Desk Support Chain
    if (toolName === 'desk_get_all_departments') {
      return ['desk_get_entity_fields', 'desk_search_entities'];
    }

    return [];
  }

  /**
   * Generate quick actions with suggested parameters
   */
  private static generateQuickActions(toolName: string, data: any, params?: any): QuickAction[] {
    const actions: QuickAction[] = [];

    // CRM Quick Actions
    if (toolName === 'crm_get_all_modules' && data?.modules) {
      // Suggest popular modules
      const popularModules = ['Leads', 'Deals', 'Contacts', 'Accounts'];
      data.modules.filter((m: any) => popularModules.includes(m.module_name))
        .slice(0, 3)
        .forEach((module: any) => {
          actions.push({
            tool_name: 'crm_get_fields',
            description: `Get fields for ${module.module_name}`,
            suggested_params: { module_name: module.module_name },
            priority: 'high'
          });
        });
    }

    if (toolName === 'crm_search_records' && data?.records?.length > 0) {
      const firstRecord = data.records[0];
      if (firstRecord?.id) {
        actions.push({
          tool_name: 'crm_get_timeline',
          description: `Get timeline for first record`,
          suggested_params: { 
            module_name: params?.module_name || 'Leads', 
            record_id: firstRecord.id 
          },
          priority: 'high'
        });
      }
    }

    // Books Quick Actions
    if (toolName === 'books_get_customers' && data?.customers?.length > 0) {
      const firstCustomer = data.customers[0];
      if (firstCustomer?.customer_id) {
        actions.push({
          tool_name: 'books_create_invoice',
          description: `Create invoice for ${firstCustomer.contact_name || 'customer'}`,
          suggested_params: { customer_id: firstCustomer.customer_id },
          priority: 'high'
        });
      }
    }

    return actions;
  }

  /**
   * Get workflow tips for the current step
   */
  private static getWorkflowTips(toolName: string, data: any): string[] {
    const tips: string[] = [];

    if (toolName === 'crm_get_all_modules') {
      tips.push('💡 Start with standard modules like Leads or Deals for common workflows');
      tips.push('🔍 Use module API names in subsequent tools, not display names');
    }

    if (toolName === 'crm_search_records' && (!data?.records || data.records.length === 0)) {
      tips.push('🔄 Try broader search criteria or check field names with crm_validate_criteria');
      tips.push('📝 Ensure you\'re using field API names, not display names');
    }

    if (toolName === 'books_get_customers' && (!data?.customers || data.customers.length === 0)) {
      tips.push('📋 Create customers first using books_create_customer before invoicing');
      tips.push('🔍 Check your search filters - try broader criteria');
    }

    return tips;
  }
}