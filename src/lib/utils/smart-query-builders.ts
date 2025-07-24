/**
 * Product-Specific Smart Query Builders
 * Generates intelligent, pre-built queries for common business scenarios
 */

export interface SmartQuery {
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'finance' | 'hr' | 'support' | 'analytics';
  tools_sequence: Array<{
    tool_name: string;
    parameters: Record<string, any>;
    description: string;
  }>;
  expected_outcome: string;
  business_value: string;
}

export class SmartQueryBuilders {
  
  /**
   * CRM Smart Query Builders - Sales & Marketing Intelligence
   */
  static getCRMSmartQueries(): SmartQuery[] {
    return [
      {
        name: "Hot Leads Pipeline Analysis",
        description: "Identify and analyze hot leads with recent activity for immediate follow-up",
        category: "sales",
        tools_sequence: [
          {
            tool_name: "crm_get_all_modules",
            parameters: {},
            description: "Discover available CRM modules"
          },
          {
            tool_name: "crm_get_fields", 
            parameters: { module_name: "Leads" },
            description: "Get Lead fields for scoring criteria"
          },
          {
            tool_name: "crm_search_records",
            parameters: { 
              module_name: "Leads",
              criteria: "((Lead_Status:equals:Open - Not Contacted) or (Lead_Status:equals:Contacted))",
              per_page: 50
            },
            description: "Find active leads"
          },
          {
            tool_name: "crm_search_by_timeline",
            parameters: {
              module_name: "Leads", 
              date_from: "2025-07-20",
              action: "updated",
              per_page: 20
            },
            description: "Get recently updated leads"
          },
          {
            tool_name: "crm_analyze_activity_patterns",
            parameters: {
              module_name: "Leads",
              date_from: "2025-07-01", 
              group_by: "user"
            },
            description: "Analyze lead activity by sales rep"
          }
        ],
        expected_outcome: "Prioritized list of hot leads with activity analysis and owner performance metrics",
        business_value: "Increase conversion rates by 25% through targeted follow-up on high-potential leads"
      },

      {
        name: "Sales Pipeline Forecasting",
        description: "Analyze deals progression and predict quarterly revenue",
        category: "sales",
        tools_sequence: [
          {
            tool_name: "crm_get_fields",
            parameters: { module_name: "Deals" },
            description: "Get deal fields for revenue analysis"
          },
          {
            tool_name: "crm_search_records", 
            parameters: {
              module_name: "Deals",
              criteria: "((Stage:not_equal:Closed Won) and (Stage:not_equal:Closed Lost))",
              per_page: 100
            },
            description: "Get active deals in pipeline"
          },
          {
            tool_name: "crm_get_pipeline_metadata",
            parameters: {},
            description: "Get stage probability mappings"
          },
          {
            tool_name: "crm_analyze_activity_patterns",
            parameters: {
              module_name: "Deals",
              date_from: "2025-07-01",
              group_by: "field"
            },
            description: "Analyze deal progression patterns"
          }
        ],
        expected_outcome: "Revenue forecast with confidence intervals and stage conversion analysis",
        business_value: "Improve forecast accuracy by 40% enabling better resource planning"
      },

      {
        name: "Customer Relationship Health Check", 
        description: "Assess account health and identify at-risk customers",
        category: "sales",
        tools_sequence: [
          {
            tool_name: "crm_search_records",
            parameters: {
              module_name: "Accounts", 
              criteria: "((Account_Type:equals:Customer))",
              per_page: 100
            },
            description: "Get all customer accounts"
          },
          {
            tool_name: "crm_get_field_changes",
            parameters: {
              module_name: "Accounts",
              field_names: ["Rating", "Annual_Revenue", "Phone"],
              date_from: "2025-06-01"
            },
            description: "Track key account field changes"
          },
          {
            tool_name: "crm_search_by_timeline",
            parameters: {
              module_name: "Accounts",
              date_from: "2025-07-01",
              action: "created"
            },
            description: "Find recently created accounts"
          }
        ],
        expected_outcome: "Account health scores with risk indicators and engagement recommendations",
        business_value: "Reduce churn by 30% through proactive account management"
      }
    ];
  }

  /**
   * Books Smart Query Builders - Financial Intelligence
   */
  static getBooksSmartQueries(): SmartQuery[] {
    return [
      {
        name: "Cash Flow Optimization Analysis",
        description: "Analyze outstanding invoices and payment patterns for cash flow improvement",
        category: "finance",
        tools_sequence: [
          {
            tool_name: "books_get_invoices",
            parameters: { 
              status: "unpaid",
              per_page: 100 
            },
            description: "Get all unpaid invoices"
          },
          {
            tool_name: "books_get_customers",
            parameters: { per_page: 50 },
            description: "Get customer payment history"
          },
          {
            tool_name: "books_get_payments",
            parameters: { 
              per_page: 100,
              date_start: "2025-06-01"
            },
            description: "Analyze recent payment patterns"
          }
        ],
        expected_outcome: "Cash flow forecast with collection priorities and payment pattern insights",
        business_value: "Improve cash flow by 35% through optimized collection strategies"
      },

      {
        name: "Profitable Customer Analysis",
        description: "Identify most profitable customers and optimize pricing strategies",
        category: "finance", 
        tools_sequence: [
          {
            tool_name: "books_get_customers",
            parameters: { per_page: 100 },
            description: "Get all customers"
          },
          {
            tool_name: "books_get_invoices", 
            parameters: { 
              per_page: 200,
              date_start: "2025-01-01"
            },
            description: "Get YTD invoices for revenue analysis"
          },
          {
            tool_name: "books_get_items",
            parameters: { per_page: 100 },
            description: "Get product/service profitability data"
          }
        ],
        expected_outcome: "Customer profitability ranking with product performance and pricing recommendations",
        business_value: "Increase profit margins by 20% through strategic customer and product focus"
      },

      {
        name: "Expense Management Intelligence",
        description: "Analyze spending patterns and identify cost optimization opportunities",
        category: "finance",
        tools_sequence: [
          {
            tool_name: "books_get_bills",
            parameters: {
              per_page: 100,
              date_start: "2025-01-01"
            },
            description: "Get all bills for expense analysis"
          },
          {
            tool_name: "books_get_purchase_orders",
            parameters: { per_page: 100 },
            description: "Analyze purchase order patterns"
          }
        ],
        expected_outcome: "Expense optimization report with vendor analysis and cost-saving opportunities",
        business_value: "Reduce operational costs by 15% through strategic expense management"
      }
    ];
  }

  /**
   * People Smart Query Builders - HR Intelligence  
   */
  static getPeopleSmartQueries(): SmartQuery[] {
    return [
      {
        name: "Employee Performance Analytics",
        description: "Analyze employee performance trends and identify development opportunities",
        category: "hr",
        tools_sequence: [
          {
            tool_name: "people_get_all_modules",
            parameters: {},
            description: "Discover HR modules"
          },
          {
            tool_name: "people_search_records",
            parameters: {
              module_name: "Employees",
              per_page: 100
            },
            description: "Get all active employees"
          },
          {
            tool_name: "people_search_records", 
            parameters: {
              module_name: "Performance",
              per_page: 200
            },
            description: "Get performance review data"
          },
          {
            tool_name: "people_get_timeline",
            parameters: {
              module_name: "Employees",
              per_page: 50
            },
            description: "Analyze employee activity patterns"
          }
        ],
        expected_outcome: "Performance insights with development recommendations and succession planning data",
        business_value: "Improve employee productivity by 25% through targeted development programs"
      },

      {
        name: "Attendance Pattern Analysis", 
        description: "Identify attendance trends and optimize workforce scheduling",
        category: "hr",
        tools_sequence: [
          {
            tool_name: "people_search_records",
            parameters: {
              module_name: "Attendance",
              per_page: 500
            },
            description: "Get attendance records"
          },
          {
            tool_name: "people_search_records",
            parameters: {
              module_name: "Leave", 
              per_page: 200
            },
            description: "Analyze leave patterns"
          }
        ],
        expected_outcome: "Workforce optimization insights with scheduling recommendations and absence patterns",
        business_value: "Reduce absenteeism by 20% and optimize staffing levels"
      },

      {
        name: "Employee Retention Intelligence",
        description: "Predict employee turnover risk and identify retention strategies", 
        category: "hr",
        tools_sequence: [
          {
            tool_name: "people_search_records",
            parameters: {
              module_name: "Employees",
              per_page: 100
            },
            description: "Get employee demographics and tenure"
          },
          {
            tool_name: "people_search_records",
            parameters: {
              module_name: "Performance",
              per_page: 100
            },
            description: "Correlate performance with retention"
          }
        ],
        expected_outcome: "Employee flight risk assessment with retention recommendations",
        business_value: "Reduce turnover by 30% through proactive retention strategies"
      }
    ];
  }

  /**
   * Desk Smart Query Builders - Support Intelligence
   */
  static getDeskSmartQueries(): SmartQuery[] {
    return [
      {
        name: "Support Ticket Resolution Analytics",
        description: "Analyze ticket resolution patterns and optimize support efficiency",
        category: "support",
        tools_sequence: [
          {
            tool_name: "desk_get_all_departments", 
            parameters: {},
            description: "Get support departments"
          },
          {
            tool_name: "desk_search_entities",
            parameters: {
              entity_type: "tickets",
              per_page: 200
            },
            description: "Get recent support tickets"
          },
          {
            tool_name: "desk_get_entity_timeline",
            parameters: {
              entity_type: "tickets",
              per_page: 100
            },
            description: "Analyze ticket resolution timelines"
          }
        ],
        expected_outcome: "Support efficiency metrics with resolution time analysis and agent performance insights",
        business_value: "Improve customer satisfaction by 40% through faster ticket resolution"
      },

      {
        name: "Customer Satisfaction Intelligence",
        description: "Analyze customer interactions and satisfaction trends",
        category: "support", 
        tools_sequence: [
          {
            tool_name: "desk_search_entities",
            parameters: {
              entity_type: "contacts",
              per_page: 100
            },
            description: "Get customer contact data"
          },
          {
            tool_name: "desk_search_entities",
            parameters: {
              entity_type: "tickets", 
              per_page: 200
            },
            description: "Analyze customer ticket history"
          }
        ],
        expected_outcome: "Customer satisfaction scores with interaction analysis and improvement recommendations",
        business_value: "Increase customer retention by 25% through improved support experience"
      },

      {
        name: "Knowledge Base Optimization",
        description: "Identify knowledge gaps and optimize self-service content",
        category: "support",
        tools_sequence: [
          {
            tool_name: "desk_search_entities",
            parameters: {
              entity_type: "articles",
              per_page: 100
            },
            description: "Get knowledge base articles"
          },
          {
            tool_name: "desk_search_entities",
            parameters: {
              entity_type: "tickets",
              per_page: 200
            },
            description: "Correlate tickets with missing knowledge"
          }
        ],
        expected_outcome: "Knowledge base enhancement recommendations with content gap analysis",
        business_value: "Reduce support tickets by 35% through improved self-service content"
      }
    ];
  }

  /**
   * Get all smart queries across all products
   */
  static getAllSmartQueries(): Record<string, SmartQuery[]> {
    return {
      'CRM': this.getCRMSmartQueries(),
      'Books': this.getBooksSmartQueries(), 
      'People': this.getPeopleSmartQueries(),
      'Desk': this.getDeskSmartQueries()
    };
  }

  /**
   * Get smart queries by category
   */
  static getQueriesByCategory(category: SmartQuery['category']): SmartQuery[] {
    const allQueries = this.getAllSmartQueries();
    const results: SmartQuery[] = [];
    
    Object.values(allQueries).forEach(productQueries => {
      results.push(...productQueries.filter(q => q.category === category));
    });
    
    return results;
  }

  /**
   * Execute a smart query sequence
   */
  static generateExecutionPlan(queryName: string): SmartQuery | null {
    const allQueries = this.getAllSmartQueries();
    
    for (const productQueries of Object.values(allQueries)) {
      const query = productQueries.find(q => q.name === queryName);
      if (query) return query;
    }
    
    return null;
  }
}