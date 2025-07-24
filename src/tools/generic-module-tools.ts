import { ZohoCRMClient } from '../lib/clients/crm-client';
import { ZohoCRMRecord } from '../lib/types';

export interface GenericModuleAnalysis {
  total_count: number;
  field_breakdown: Record<string, number>;
  numeric_breakdown?: Record<string, number>;
  summary_stats?: {
    total_sum: number;
    average: number;
    min: number;
    max: number;
  };
  records: ZohoCRMRecord[];
}

export interface GenericModuleParams {
  module_name: string;
  breakdown_field: string;
  numeric_field?: string;
  page?: number;
  per_page?: number;
  filter_field?: string;
  filter_value?: string;
  date_from?: string;
  date_to?: string;
}

export class GenericModuleTools {
  constructor(private crmClient: ZohoCRMClient) {}

  /**
   * Analyze any custom module with any custom field
   */
  async analyzeCustomModule(params: GenericModuleParams): Promise<GenericModuleAnalysis> {
    try {
      // Get module API name mapping
      const moduleApiName = await this.getModuleApiName(params.module_name);
      
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      // Get all records from the module with automatic pagination
      const response = await this.crmClient.getRecordsWithPagination(moduleApiName, {
        page: params.page || 1,
        per_page: params.per_page || 200,
        fields: this.getRequiredFields(params),
        auto_paginate: true,
        max_records: 5000 // Limit to prevent excessive data retrieval
      });

      const records = response.data;
      const analysis: GenericModuleAnalysis = {
        total_count: records.length,
        field_breakdown: {},
        records: records
      };

      // Filter records if needed
      let filteredRecords = records;
      if (params.filter_field && params.filter_value) {
        filteredRecords = records.filter(record => {
          const fieldValue = record[params.filter_field!];
          return fieldValue && fieldValue.toString().toLowerCase().includes(params.filter_value!.toLowerCase());
        });
        analysis.total_count = filteredRecords.length;
      }

      // Date filtering if specified
      if (params.date_from || params.date_to) {
        filteredRecords = this.filterByDate(filteredRecords, params.date_from, params.date_to);
        analysis.total_count = filteredRecords.length;
      }

      // Analyze breakdown field
      filteredRecords.forEach(record => {
        const fieldValue = record[params.breakdown_field] || 'Unknown';
        const fieldKey = typeof fieldValue === 'object' ? fieldValue.name || fieldValue.id || 'Unknown' : fieldValue.toString();
        
        analysis.field_breakdown[fieldKey] = (analysis.field_breakdown[fieldKey] || 0) + 1;
      });

      // Analyze numeric field if specified
      if (params.numeric_field) {
        analysis.numeric_breakdown = {};
        const numericValues: number[] = [];

        filteredRecords.forEach(record => {
          const fieldValue = record[params.breakdown_field] || 'Unknown';
          const fieldKey = typeof fieldValue === 'object' ? fieldValue.name || fieldValue.id || 'Unknown' : fieldValue.toString();
          const numericValue = this.parseNumericValue(record[params.numeric_field!]);
          
          if (numericValue !== null) {
            analysis.numeric_breakdown![fieldKey] = (analysis.numeric_breakdown![fieldKey] || 0) + numericValue;
            numericValues.push(numericValue);
          }
        });

        // Calculate summary statistics
        if (numericValues.length > 0) {
          const totalSum = numericValues.reduce((sum, val) => sum + val, 0);
          analysis.summary_stats = {
            total_sum: totalSum,
            average: totalSum / numericValues.length,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues)
          };
        }
      }

      return analysis;
    } catch (error: any) {
      throw new Error(`Failed to analyze module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get records from any custom module with flexible filtering
   */
  async getCustomModuleRecords(params: {
    module_name: string;
    filter_field?: string;
    filter_value?: string;
    page?: number;
    per_page?: number;
    fields?: string[];
  }): Promise<ZohoCRMRecord[]> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      const response = await this.crmClient.getRecordsWithPagination(moduleApiName, {
        page: params.page || 1,
        per_page: params.per_page || 200,
        fields: params.fields,
        auto_paginate: true,
        max_records: 5000 // Limit to prevent excessive data retrieval
      });

      let records = response.data;

      // Apply filtering if specified
      if (params.filter_field && params.filter_value) {
        records = records.filter(record => {
          const fieldValue = record[params.filter_field!];
          if (!fieldValue) return false;
          
          const valueStr = typeof fieldValue === 'object' 
            ? fieldValue.name || fieldValue.id || fieldValue.toString()
            : fieldValue.toString();
          
          return valueStr.toLowerCase().includes(params.filter_value!.toLowerCase());
        });
      }

      return records;
    } catch (error: any) {
      throw new Error(`Failed to get records from module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get field analysis for any module
   */
  async getFieldAnalysis(params: {
    module_name: string;
    field_name: string;
    analysis_type: 'count' | 'sum' | 'avg' | 'min' | 'max';
    group_by_field?: string;
  }): Promise<Record<string, any>> {
    try {
      const moduleApiName = await this.getModuleApiName(params.module_name);
      
      if (!moduleApiName) {
        throw new Error(`Module ${params.module_name} not found or not accessible`);
      }

      const response = await this.crmClient.getRecordsWithPagination(moduleApiName, {
        page: 1,
        per_page: 200,
        fields: [params.field_name, params.group_by_field].filter(Boolean) as string[],
        auto_paginate: true,
        max_records: 5000 // Limit to prevent excessive data retrieval
      });

      const records = response.data;
      const results: Record<string, any> = {};

      if (params.group_by_field) {
        // Group analysis
        const groups: Record<string, any[]> = {};
        
        records.forEach(record => {
          const groupValue = record[params.group_by_field!] || 'Unknown';
          const groupKey = typeof groupValue === 'object' ? groupValue.name || groupValue.id || 'Unknown' : groupValue.toString();
          
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(record[params.field_name]);
        });

        // Calculate analysis for each group
        Object.entries(groups).forEach(([groupKey, values]) => {
          results[groupKey] = this.calculateFieldAnalysis(values, params.analysis_type);
        });
      } else {
        // Simple field analysis
        const values = records.map(record => record[params.field_name]);
        results.total = this.calculateFieldAnalysis(values, params.analysis_type);
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to analyze field ${params.field_name} in module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get the API name for a module
   */
  private async getModuleApiName(moduleName: string): Promise<string | null> {
    try {
      const modules = await this.crmClient.getModules();
      
      // Module name mappings
      const moduleMap: Record<string, string> = {
        'accounts': 'Accounts',
        'contacts': 'Contacts',
        'deals': 'Deals',
        'leads': 'Leads',
        'tasks': 'Tasks',
        'events': 'Events',
        'meetings': 'Events',
        'calls': 'Calls',
        'products': 'Products',
        'units': 'Products',
        'quotes': 'Quotes',
        'sales_orders': 'Sales_Orders',
        'purchase_orders': 'Purchase_Orders',
        'invoices': 'Invoices',
        'cases': 'Cases',
        'solutions': 'Solutions',
        'campaigns': 'Campaigns',
        'vendors': 'Vendors',
        'price_books': 'Price_Books',
        'notes': 'Notes',
        'attachments': 'Attachments',
        'payment_receipt': 'Payment_Receipt',
        'payment_receipts': 'Payment_Receipt',
        'broker': 'Broker',
        'brokers': 'Broker',
        'referral': 'Referral',
        'referrals': 'Referral',
        'installments': 'Installments',
        'reservation': 'Reservation',
        'reservations': 'Reservation',
        'commission': 'Commission',
        'commissions': 'Commission',
        'payment_plan': 'Payment_Plan',
        'payment_plans': 'Payment_Plan',
        'refund_plans': 'Refund_Plans',
        'refund_installments': 'Refund_Installments',
        'proposals': 'Proposals',
        'project': 'Project',
        'projects': 'Project',
        'chart_of_accounts': 'Chart_of_Accounts',
        'parking': 'Parking',
        'sold_out_parking': 'Sold_Out_Parking',
        'eoi': 'EOI',
        'dynamic_payment_plan': 'Payment_Plan_New',
        'sample_installment': 'Sample_Installment'
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

  /**
   * Get required fields for analysis
   */
  private getRequiredFields(params: GenericModuleParams): string[] {
    const fields = ['id', params.breakdown_field];
    
    if (params.numeric_field) {
      fields.push(params.numeric_field);
    }
    
    if (params.filter_field) {
      fields.push(params.filter_field);
    }
    
    return fields;
  }

  /**
   * Parse numeric value from field
   */
  private parseNumericValue(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(numValue) ? null : numValue;
  }

  /**
   * Filter records by date range
   */
  private filterByDate(records: ZohoCRMRecord[], dateFrom?: string, dateTo?: string): ZohoCRMRecord[] {
    if (!dateFrom && !dateTo) {
      return records;
    }
    
    return records.filter(record => {
      // Try common date fields
      const dateFields = ['Created_Time', 'Modified_Time', 'Date', 'Due_Date', 'Start_Date', 'End_Date'];
      
      for (const field of dateFields) {
        if (record[field]) {
          const recordDate = new Date(record[field]);
          
          if (dateFrom && recordDate < new Date(dateFrom)) {
            return false;
          }
          
          if (dateTo && recordDate > new Date(dateTo)) {
            return false;
          }
          
          return true;
        }
      }
      
      return true; // If no date field found, include the record
    });
  }

  /**
   * Calculate field analysis based on type
   */
  private calculateFieldAnalysis(values: any[], analysisType: string): any {
    const numericValues = values
      .map(val => this.parseNumericValue(val))
      .filter(val => val !== null) as number[];

    switch (analysisType) {
      case 'count':
        return values.length;
      case 'sum':
        return numericValues.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
      case 'min':
        return numericValues.length > 0 ? Math.min(...numericValues) : null;
      case 'max':
        return numericValues.length > 0 ? Math.max(...numericValues) : null;
      default:
        return null;
    }
  }
}