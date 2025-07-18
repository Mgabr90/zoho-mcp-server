import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

import { ZohoAuthManager } from './auth/oauth-manager.js';
import { ZohoCRMClient } from './clients/crm-client.js';
import { ZohoBooksClient } from './clients/books-client.js';
import { ZohoSyncTools } from './tools/sync-tools.js';
import { BooksItemsTools, BooksEstimatesTools, BooksPaymentsTools, BooksInvoicesTools, BooksCustomersTools, BooksSalesOrdersTools, BooksCreditNotesTools, BooksPurchaseOrdersTools, BooksBillsTools } from './tools/books-tools.js';
import { CRMTasksTools, CRMEventsTools, CRMNotesTools, CRMAttachmentsTools, CRMEmailTools } from './tools/crm-activities-tools.js';
import { GenericModuleTools } from './tools/generic-module-tools.js';
import { ZohoCRMMetadataTools } from './tools/metadata-tools.js';
import { ConfigManagementTools } from './tools/config-tools.js';
import { ZohoConfigManager } from './utils/config-manager.js';
import { 
  ZohoConfig,
  ServerConfig,
  SyncParamsSchema,
  CreateInvoiceParamsSchema,
  SearchParamsSchema
} from './types/index.js';
import {
  ItemParamsSchema,
  GetItemsParamsSchema,
  EstimateParamsSchema,
  GetEstimatesParamsSchema,
  PaymentParamsSchema,
  GetPaymentsParamsSchema,
  InvoiceParamsSchema,
  GetInvoicesParamsSchema,
  CustomerParamsSchema,
  GetCustomersParamsSchema,
  SalesOrderParamsSchema,
  GetSalesOrdersParamsSchema,
  CreditNoteParamsSchema,
  GetCreditNotesParamsSchema,
  PurchaseOrderParamsSchema,
  GetPurchaseOrdersParamsSchema,
  BillParamsSchema,
  GetBillsParamsSchema
} from './tools/books-tools.js';
import {
  TaskParamsSchema,
  GetTasksParamsSchema,
  EventParamsSchema,
  GetEventsParamsSchema,
  NoteParamsSchema,
  GetNotesParamsSchema,
  EmailParamsSchema,
  GetAttachmentsParamsSchema
} from './tools/crm-activities-tools.js';

// Load environment variables
dotenv.config();

export class ZohoMCPServer {
  private server!: Server;
  private authManager!: ZohoAuthManager;
  private crmClient!: ZohoCRMClient;
  private booksClient!: ZohoBooksClient;
  private syncTools!: ZohoSyncTools;
  private booksItemsTools!: BooksItemsTools;
  private booksEstimatesTools!: BooksEstimatesTools;
  private booksPaymentsTools!: BooksPaymentsTools;
  private booksInvoicesTools!: BooksInvoicesTools;
  private booksCustomersTools!: BooksCustomersTools;
  private booksSalesOrdersTools!: BooksSalesOrdersTools;
  private booksCreditNotesTools!: BooksCreditNotesTools;
  private booksPurchaseOrdersTools!: BooksPurchaseOrdersTools;
  private booksBillsTools!: BooksBillsTools;
  private crmTasksTools!: CRMTasksTools;
  private crmEventsTools!: CRMEventsTools;
  private crmNotesTools!: CRMNotesTools;
  private crmAttachmentsTools!: CRMAttachmentsTools;
  private crmEmailTools!: CRMEmailTools;
  private genericModuleTools!: GenericModuleTools;
  private metadataTools!: ZohoCRMMetadataTools;
  private configTools!: ConfigManagementTools;
  private configManager!: ZohoConfigManager;
  private config!: ServerConfig;
  private zohoConfig!: ZohoConfig;

  constructor() {
    this.loadConfiguration();
    this.server = new Server(
      {
        name: this.config.mcpServerName,
        version: this.config.mcpServerVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.initializeClients();
    this.setupHandlers();
  }

  private loadConfiguration(): void {
    this.config = {
      port: parseInt(process.env.PORT || '3000'),
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      cacheTtl: parseInt(process.env.CACHE_TTL || '300000'),
      mcpServerName: process.env.MCP_SERVER_NAME || 'zoho-crm-books-server',
      mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
      pagination: {
        defaultPageSize: parseInt(process.env.PAGINATION_DEFAULT_PAGE_SIZE || '200'),
        maxPageSize: parseInt(process.env.PAGINATION_MAX_PAGE_SIZE || '200'),
        enableAutoPagination: process.env.PAGINATION_ENABLE_AUTO === 'true',
        rateLimitDelay: parseInt(process.env.PAGINATION_RATE_LIMIT_DELAY || '1000'),
        maxRetries: parseInt(process.env.PAGINATION_MAX_RETRIES || '3'),
        usePageTokens: process.env.PAGINATION_USE_PAGE_TOKENS !== 'false',
        maxRecordsPerBatch: parseInt(process.env.PAGINATION_MAX_RECORDS_PER_BATCH || '5000')
      },
      multiConfig: {
        enabled: process.env.MULTI_CONFIG_ENABLED === 'true',
        currentEnvironment: process.env.MULTI_CONFIG_ENVIRONMENT || 'default',
        configPath: process.env.MULTI_CONFIG_PATH,
        autoSwitch: process.env.MULTI_CONFIG_AUTO_SWITCH === 'true'
      }
    };

    // Initialize configuration manager
    this.configManager = new ZohoConfigManager(this.config.multiConfig.configPath);
    
    // Get active configuration
    this.zohoConfig = this.configManager.getActiveConfig();

    // Validate required configuration
    if (!this.zohoConfig.clientId || !this.zohoConfig.clientSecret) {
      throw new Error('Missing required Zoho OAuth configuration');
    }
  }

  private initializeClients(): void {
    this.authManager = new ZohoAuthManager(this.zohoConfig);
    this.crmClient = new ZohoCRMClient(this.authManager, this.zohoConfig.dataCenter, this.config.pagination);
    
    // For Books client, we need organization ID from the active configuration
    const organizationId = this.zohoConfig.organizationId || '';
    if (!organizationId) {
      console.warn('No Zoho Books organization ID provided - Books functionality will be limited');
    }
    
    this.booksClient = new ZohoBooksClient(this.authManager, this.zohoConfig.dataCenter, organizationId);
    this.syncTools = new ZohoSyncTools(this.crmClient, this.booksClient);
    this.booksItemsTools = new BooksItemsTools(this.booksClient);
    this.booksEstimatesTools = new BooksEstimatesTools(this.booksClient);
    this.booksPaymentsTools = new BooksPaymentsTools(this.booksClient);
    this.booksInvoicesTools = new BooksInvoicesTools(this.booksClient);
    this.booksCustomersTools = new BooksCustomersTools(this.booksClient);
    this.booksSalesOrdersTools = new BooksSalesOrdersTools(this.booksClient);
    this.booksCreditNotesTools = new BooksCreditNotesTools(this.booksClient);
    this.booksPurchaseOrdersTools = new BooksPurchaseOrdersTools(this.booksClient);
    this.booksBillsTools = new BooksBillsTools(this.booksClient);
    this.crmTasksTools = new CRMTasksTools(this.crmClient);
    this.crmEventsTools = new CRMEventsTools(this.crmClient);
    this.crmNotesTools = new CRMNotesTools(this.crmClient);
    this.crmAttachmentsTools = new CRMAttachmentsTools(this.crmClient);
    this.crmEmailTools = new CRMEmailTools(this.crmClient);
    this.genericModuleTools = new GenericModuleTools(this.crmClient);
    this.metadataTools = new ZohoCRMMetadataTools(this.crmClient);
    this.configTools = new ConfigManagementTools(this.configManager);
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // === TOOL DISCOVERY & NAVIGATION ===
          {
            name: 'list_tool_categories',
            description: 'Get organized list of all tool categories with descriptions. Perfect starting point for LLMs to understand available functionality.',
            inputSchema: {
              type: 'object',
              title: 'Tool Categories Directory',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Tool Discovery',
              properties: {}
            }
          },
          {
            name: 'list_tools_by_category',
            description: 'Get all tools in a specific category with their descriptions and purposes.',
            inputSchema: {
              type: 'object',
              title: 'Category Tools Listing',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Tool Discovery',
              properties: {
                category: {
                  type: 'string',
                  enum: ['Data Synchronization', 'Books - Customer Management', 'Books - Inventory Management', 'Books - Financial Documents', 'Books - Purchase Management', 'CRM - Activity Management', 'CRM - Analytics & Reporting', 'CRM - Administration', 'Configuration Management'],
                  description: 'Category to list tools for'
                }
              },
              required: ['category']
            }
          },
          {
            name: 'sync_accounts_to_customers',
            description: 'Sync CRM accounts to Books customers (CRM → Books direction). Creates or updates customer records in Books based on account data from CRM.\n\nExample: Sync 50 accounts\n{"source_module": "accounts", "target_module": "customers", "filters": {"limit": 50}}',
            inputSchema: {
              type: 'object',
              title: 'CRM to Books Sync',
              readOnlyHint: false,
              idempotentHint: true,
              openWorldHint: true,
              category: 'Data Synchronization',
              properties: {
                source_module: { type: 'string', enum: ['accounts'], description: 'Source module: accounts (CRM)' },
                target_module: { type: 'string', enum: ['customers'], description: 'Target module: customers (Books)' },
                filters: {
                  type: 'object',
                  description: 'Filter and pagination options for sync',
                  properties: {
                    limit: { type: 'number', minimum: 1, maximum: 200, description: 'Maximum records to sync per batch' },
                    page: { type: 'number', minimum: 1, description: 'Page number for batch processing' }
                  }
                }
              },
              required: ['source_module', 'target_module']
            }
          },
          {
            name: 'sync_contacts_to_customers',
            description: 'Sync CRM contacts to Books customers (CRM → Books direction). Creates or updates customer records in Books based on contact data from CRM.\n\nWorkflow: Typically run after CRM data updates. Follow with books_get_customers to verify sync results',
            inputSchema: {
              type: 'object',
              title: 'CRM to Books Sync',
              readOnlyHint: false,
              idempotentHint: true,
              openWorldHint: true,
              category: 'Data Synchronization',
              properties: {
                source_module: { type: 'string', enum: ['contacts'], description: 'Source module: contacts (CRM)' },
                target_module: { type: 'string', enum: ['customers'], description: 'Target module: customers (Books)' },
                filters: {
                  type: 'object',
                  description: 'Filter and pagination options for sync',
                  properties: {
                    limit: { type: 'number', minimum: 1, maximum: 200, description: 'Maximum records to sync per batch' },
                    page: { type: 'number', minimum: 1, description: 'Page number for batch processing' }
                  }
                }
              },
              required: ['source_module', 'target_module']
            }
          },
          {
            name: 'sync_customers_to_contacts',
            description: 'Sync Books customers to CRM contacts (Books → CRM direction). Creates or updates contact records in CRM based on customer data from Books.',
            inputSchema: {
              type: 'object',
              title: 'Books to CRM Sync',
              readOnlyHint: false,
              idempotentHint: true,
              openWorldHint: true,
              category: 'Data Synchronization',
              properties: {
                source_module: { type: 'string', enum: ['customers'], description: 'Source module: customers (Books)' },
                target_module: { type: 'string', enum: ['contacts'], description: 'Target module: contacts (CRM)' },
                filters: {
                  type: 'object',
                  description: 'Filter and pagination options for sync',
                  properties: {
                    limit: { type: 'number', minimum: 1, maximum: 200, description: 'Maximum records to sync per batch' },
                    page: { type: 'number', minimum: 1, description: 'Page number for batch processing' }
                  }
                }
              },
              required: ['source_module', 'target_module']
            }
          },
          {
            name: 'create_invoice_from_deal',
            description: 'Create a Books invoice from a CRM deal. Automatically transfers deal information, products, and pricing to create a professional invoice.\n\nWorkflow: CRM deal → Books invoice → books_send_invoice_email → books_create_payment (when paid)',
            inputSchema: {
              type: 'object',
              title: 'CRM Deal to Invoice',
              readOnlyHint: false,
              idempotentHint: false,
              openWorldHint: true,
              category: 'Data Synchronization',
              properties: {
                deal_id: { type: 'string', description: 'CRM deal ID (get from CRM deals)' },
                customer_id: { type: 'string', description: 'Books customer ID (get from books_get_customers)' },
                invoice_date: { type: 'string', format: 'date', description: 'Invoice date in YYYY-MM-DD format (e.g., "2024-12-31")' },
                due_date: { type: 'string', format: 'date', description: 'Due date in YYYY-MM-DD format (e.g., "2024-12-31")' },
                include_line_items: { type: 'boolean', default: true, description: 'Include deal products as invoice line items' },
                send_email: { type: 'boolean', default: false, description: 'Send invoice email to customer automatically' }
              },
              required: ['deal_id']
            }
          },
          {
            name: 'search_records',
            description: 'Search across CRM and Books records using flexible criteria. Use for finding specific records by name, email, phone, or other fields.\n\nExample: Search for contacts\n{"module": "contacts", "criteria": "john@example.com", "fields": ["id", "Full_Name", "Email"]}',
            inputSchema: {
              type: 'object',
              title: 'Cross-Module Search',
              readOnlyHint: true,
              idempotentHint: true,
              openWorldHint: true,
              category: 'Data Discovery',
              properties: {
                module: { 
                  type: 'string',
                  description: 'Module name to search in (e.g., "accounts", "contacts", "deals", "leads", "customers", "invoices")'
                },
                criteria: { type: 'string', description: 'Search criteria (e.g., "John Smith", "john@example.com", "555-1234")' },
                fields: { type: 'array', items: { type: 'string' }, description: 'Specific fields to return (e.g., ["id", "name", "email"])' },
                page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination' },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20, description: 'Number of results per page' }
              },
              required: ['module', 'criteria']
            }
          },
          // Books Customers Management Tools
          {
            name: 'books_get_customers',
            description: 'Get customer list from Books with filtering and pagination. Use for finding customers before creating invoices/payments or browsing customer directory.\n\nExample: Find customers by name\n{"search_text": "John", "per_page": 10}',
            inputSchema: {
              type: 'object',
              title: 'Books Customer List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Customer Management',
              properties: {
                page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination (starts at 1)' },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20, description: 'Number of customers per page (1-200)', multipleOf: 1 },
                contact_name: { type: 'string', description: 'Filter by contact name (partial match)' },
                company_name: { type: 'string', description: 'Filter by company name (partial match)' },
                first_name: { type: 'string', description: 'Filter by first name (partial match)' },
                last_name: { type: 'string', description: 'Filter by last name (partial match)' },
                address: { type: 'string', description: 'Filter by address (partial match)' },
                email: { type: 'string', description: 'Filter by email address (partial match)', format: 'email' },
                phone: { type: 'string', description: 'Filter by phone number (partial match)' },
                contact_type: { type: 'string', enum: ['customer', 'vendor', 'employee'], description: 'Filter by contact type' },
                customer_sub_type: { type: 'string', enum: ['business', 'individual'], description: 'Filter by customer subtype' },
                filter_by: { type: 'string', description: 'Advanced filter field (e.g., "Status.Active", "CustomerType.Business")' },
                search_text: { type: 'string', description: 'Global search across all customer fields' },
                sort_column: { type: 'string', description: 'Column to sort by (e.g., "contact_name", "company_name", "created_time")' },
                sort_order: { type: 'string', enum: ['A', 'D'], description: 'Sort order: A=ascending, D=descending' }
              }
            }
          },
          {
            name: 'books_get_customer',
            description: 'Get detailed information for a specific customer from Books by ID. Returns complete customer profile including contact details, billing/shipping addresses, and account status.\n\nRelated tools: books_get_customers (to find IDs), books_create_invoice (to bill customer), books_create_payment (to record payments)',
            inputSchema: {
              type: 'object',
              title: 'Books Customer Details',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Customer Management',
              properties: {
                customer_id: { type: 'string', description: 'Unique customer ID (get from books_get_customers)' }
              },
              required: ['customer_id']
            }
          },
          {
            name: 'books_create_customer',
            description: 'Create a new customer in Books',
            inputSchema: {
              type: 'object',
              title: 'Books Customer Creator',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Customer Management',
              properties: {
                contact_name: { type: 'string' },
                company_name: { type: 'string' },
                contact_type: { type: 'string', enum: ['customer', 'vendor', 'employee'] },
                customer_sub_type: { type: 'string', enum: ['business', 'individual'] },
                credit_limit: { type: 'number' },
                website: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    street2: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                shipping_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    street2: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                contact_persons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      first_name: { type: 'string' },
                      last_name: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                      mobile: { type: 'string' },
                      designation: { type: 'string' },
                      department: { type: 'string' },
                      is_primary_contact: { type: 'boolean' },
                      enable_portal: { type: 'boolean' }
                    }
                  }
                },
                currency_id: { type: 'string' },
                payment_terms: { type: 'number' },
                payment_terms_label: { type: 'string' },
                notes: { type: 'string' },
                tax_id: { type: 'string' },
                tax_name: { type: 'string' },
                tax_percentage: { type: 'number' },
                is_taxable: { type: 'boolean' },
                gst_no: { type: 'string' },
                gst_treatment: { type: 'string' },
                tax_treatment: { type: 'string' },
                vat_treatment: { type: 'string' },
                vat_reg_no: { type: 'string' }
              },
              required: ['contact_name']
            }
          },
          {
            name: 'books_update_customer',
            description: 'Update an existing customer in Books',
            inputSchema: {
              type: 'object',
              title: 'Books Customer Updater',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Customer Management',
              properties: {
                customer_id: { type: 'string' },
                contact_name: { type: 'string' },
                company_name: { type: 'string' },
                contact_type: { type: 'string', enum: ['customer', 'vendor', 'employee'] },
                customer_sub_type: { type: 'string', enum: ['business', 'individual'] },
                credit_limit: { type: 'number' },
                website: { type: 'string' },
                notes: { type: 'string' },
                tax_id: { type: 'string' },
                tax_name: { type: 'string' },
                tax_percentage: { type: 'number' },
                is_taxable: { type: 'boolean' }
              },
              required: ['customer_id']
            }
          },
          {
            name: 'books_delete_customer',
            description: 'Delete a customer from Books',
            inputSchema: {
              type: 'object',
              title: 'Books Customer Deleter',
              readOnlyHint: false,
              idempotentHint: false,
              destructiveHint: true,
              category: 'Books - Customer Management',
              properties: {
                customer_id: { type: 'string' }
              },
              required: ['customer_id']
            }
          },
          // Books Items Management Tools
          {
            name: 'books_get_items',
            description: 'Get all items from Books',
            inputSchema: {
              type: 'object',
              title: 'Books Items List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Inventory Management',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_get_item',
            description: 'Get a specific item from Books by ID',
            inputSchema: {
              type: 'object',
              title: 'Books Item Details',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Inventory Management',
              properties: {
                item_id: { type: 'string' }
              },
              required: ['item_id']
            }
          },
          {
            name: 'books_create_item',
            description: 'Create a new product or service item in Books inventory. Use for adding products to sell, services to offer, or items to include in invoices.\n\nExample: Create service item\n{"name": "Consulting Services", "description": "Business consulting", "rate": 150, "unit": "hrs", "item_type": "sales"}',
            inputSchema: {
              type: 'object',
              title: 'Books Item Creator',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Inventory Management',
              properties: {
                name: { type: 'string', description: 'Item name or product title' },
                description: { type: 'string', description: 'Detailed item description' },
                rate: { type: 'number', description: 'Item price or rate' },
                unit: { type: 'string', description: 'Unit of measure (e.g., "pcs", "hrs", "kg")' },
                sku: { type: 'string', description: 'Stock Keeping Unit (SKU) code' },
                product_type: { type: 'string', description: 'Product type (e.g., "goods", "service")' },
                is_taxable: { type: 'boolean', description: 'Whether item is subject to tax' },
                tax_id: { type: 'string', description: 'Tax ID if item is taxable' },
                item_type: { type: 'string', description: 'Item type (e.g., "sales", "purchases", "sales_and_purchases")' }
              },
              required: ['name']
            }
          },
          {
            name: 'books_update_item',
            description: 'Update an existing item in Books',
            inputSchema: {
              type: 'object',
              title: 'Books Item Updater',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Inventory Management',
              properties: {
                item_id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                rate: { type: 'number' },
                unit: { type: 'string' },
                sku: { type: 'string' },
                product_type: { type: 'string' },
                is_taxable: { type: 'boolean' },
                tax_id: { type: 'string' },
                item_type: { type: 'string' }
              },
              required: ['item_id']
            }
          },
          {
            name: 'books_delete_item',
            description: 'Delete an item from Books',
            inputSchema: {
              type: 'object',
              title: 'Books Item Deleter',
              readOnlyHint: false,
              idempotentHint: false,
              destructiveHint: true,
              category: 'Books - Inventory Management',
              properties: {
                item_id: { type: 'string' }
              },
              required: ['item_id']
            }
          },
          // Books Estimates Management Tools
          {
            name: 'books_get_estimates',
            description: 'Get all estimates from Books',
            inputSchema: {
              type: 'object',
              title: 'Books Estimates List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Estimate Management',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                customer_id: { type: 'string' },
                status: { type: 'string' },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_create_estimate',
            description: 'Create a new estimate in Books',
            inputSchema: {
              type: 'object',
              title: 'Books Estimate Creator',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Estimate Management',
              properties: {
                customer_id: { type: 'string' },
                estimate_date: { type: 'string' },
                expiry_date: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number' },
                discount_type: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' }
              },
              required: ['customer_id', 'line_items']
            }
          },
          {
            name: 'books_convert_estimate_to_invoice',
            description: 'Convert a Books estimate to an invoice',
            inputSchema: {
              type: 'object',
              title: 'Books Estimate to Invoice Converter',
              readOnlyHint: false,
              idempotentHint: false,
              category: 'Books - Estimate Management',
              properties: {
                estimate_id: { type: 'string' }
              },
              required: ['estimate_id']
            }
          },
          // Books Payments Management Tools
          {
            name: 'books_get_payments',
            description: 'Get all payments from Books',
            inputSchema: {
              type: 'object',
              title: 'Books Payments List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Books - Payment Processing',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                customer_id: { type: 'string' },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_create_payment',
            description: 'Create a payment in Books to apply against specific invoices. First use books_get_invoices to find invoice IDs and amounts, then create payment to apply against those invoices.\n\nExample workflow:\n1. books_get_invoices({customer_id: "123"}) // Find unpaid invoices\n2. books_create_payment({customer_id: "123", amount: 1000, invoices: [{invoice_id: "inv-456", amount_applied: 1000}]})',
            inputSchema: {
              type: 'object',
              title: 'Books Payment Creator',
              readOnlyHint: false,
              idempotentHint: false,
              openWorldHint: true,
              category: 'Books - Payment Processing',
              properties: {
                customer_id: { type: 'string', description: 'Customer ID (get from books_get_customers)', minLength: 1 },
                payment_mode: { type: 'string', description: 'Payment method (e.g., "cash", "check", "bank_transfer", "credit_card")' },
                amount: { type: 'number', minimum: 0.01, description: 'Total payment amount (must equal sum of amount_applied across invoices)', multipleOf: 0.01 },
                date: { type: 'string', description: 'Payment date in YYYY-MM-DD format (e.g., "2024-12-31")', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                reference_number: { type: 'string', description: 'Reference number (check number, transaction ID, etc.)' },
                description: { type: 'string', description: 'Payment description or notes' },
                invoices: {
                  type: 'array',
                  description: 'List of invoices to apply payment against (get invoice details from books_get_invoices first)',
                  items: {
                    type: 'object',
                    properties: {
                      invoice_id: { type: 'string', description: 'Invoice ID to apply payment against' },
                      invoice_number: { type: 'string', description: 'Invoice number for reference' },
                      amount_applied: { type: 'number', minimum: 0, description: 'Amount to apply to this invoice (cannot exceed invoice balance)' },
                      tax_amount_withheld: { type: 'number', minimum: 0, description: 'Tax withheld amount (if applicable)' }
                    },
                    required: ['invoice_id', 'invoice_number', 'amount_applied']
                  }
                },
                bank_charges: { type: 'number', minimum: 0, description: 'Bank processing fees or charges' },
                currency_code: { type: 'string', description: 'Currency code (e.g., "USD", "EUR")' },
                exchange_rate: { type: 'number', minimum: 0, description: 'Exchange rate if different from base currency' }
              },
              required: ['customer_id', 'payment_mode', 'amount', 'date', 'invoices']
            }
          },
          // Books Invoices Management Tools
          {
            name: 'books_get_invoices',
            description: 'Get invoices from Books with filtering and pagination. Use to find invoices for payments, get invoice details, or browse invoice history.\n\nRelated tools: books_create_invoice (to create), books_create_payment (to pay), books_get_customer (customer details)',
            inputSchema: {
              type: 'object',
              title: 'Books Invoice List',
              readOnlyHint: true,
              idempotentHint: true,
              properties: {
                page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination (starts at 1)' },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20, description: 'Number of invoices per page (1-200)' },
                customer_id: { type: 'string', description: 'Filter by customer ID (get from books_get_customers)' },
                status: { type: 'string', description: 'Filter by invoice status (e.g., "sent", "paid", "overdue", "draft")' },
                search_text: { type: 'string', description: 'Search across invoice numbers, customer names, and content' },
                filter_by: { type: 'string', description: 'Advanced filter (e.g., "Status.All", "Date.LastMonth")' },
                sort_column: { type: 'string', description: 'Column to sort by (e.g., "invoice_number", "date", "total", "balance")' },
                sort_order: { type: 'string', enum: ['A', 'D'], description: 'Sort order: A=ascending, D=descending' }
              }
            }
          },
          {
            name: 'books_get_invoice',
            description: 'Get a specific invoice from Books by ID',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string' }
              },
              required: ['invoice_id']
            }
          },
          {
            name: 'books_create_invoice',
            description: 'Create a new invoice in Books',
            inputSchema: {
              type: 'object',
              properties: {
                customer_id: { type: 'string' },
                invoice_date: { type: 'string' },
                due_date: { type: 'string' },
                invoice_number: { type: 'string' },
                reference_number: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number' },
                discount_type: { type: 'string' },
                is_discount_before_tax: { type: 'boolean' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                payment_terms: { type: 'string' },
                payment_terms_label: { type: 'string' },
                shipping_charge: { type: 'number' },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                is_inclusive_tax: { type: 'boolean' },
                salesperson_id: { type: 'string' },
                template_id: { type: 'string' }
              },
              required: ['customer_id', 'line_items']
            }
          },
          {
            name: 'books_update_invoice',
            description: 'Update an existing invoice in Books',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string' },
                customer_id: { type: 'string' },
                invoice_date: { type: 'string' },
                due_date: { type: 'string' },
                invoice_number: { type: 'string' },
                reference_number: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number' },
                discount_type: { type: 'string' },
                is_discount_before_tax: { type: 'boolean' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                payment_terms: { type: 'string' },
                payment_terms_label: { type: 'string' },
                shipping_charge: { type: 'number' },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                is_inclusive_tax: { type: 'boolean' },
                salesperson_id: { type: 'string' },
                template_id: { type: 'string' }
              },
              required: ['invoice_id']
            }
          },
          {
            name: 'books_delete_invoice',
            description: 'Delete an invoice from Books',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string' }
              },
              required: ['invoice_id']
            }
          },
          {
            name: 'books_send_invoice_email',
            description: 'Send an invoice via email',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string' },
                to_mail_ids: { type: 'array', items: { type: 'string' } },
                subject: { type: 'string' },
                body: { type: 'string' }
              },
              required: ['invoice_id', 'to_mail_ids']
            }
          },
          {
            name: 'books_get_invoice_pdf',
            description: 'Get an invoice as PDF',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string' }
              },
              required: ['invoice_id']
            }
          },
          // Books Credit Notes Management Tools
          {
            name: 'books_get_credit_notes',
            description: 'Get all credit notes from Books',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                customer_id: { type: 'string' },
                invoice_id: { type: 'string' },
                creditnote_number: { type: 'string' },
                reference_number: { type: 'string' },
                status: { type: 'string', enum: ['draft', 'open', 'closed', 'void'] },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_get_credit_note',
            description: 'Get a specific credit note from Books by ID',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_create_credit_note',
            description: 'Create a new credit note in Books',
            inputSchema: {
              type: 'object',
              properties: {
                customer_id: { type: 'string' },
                creditnote_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                invoice_id: { type: 'string' },
                reason: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      warehouse_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                shipping_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                crm_owner_id: { type: 'string' },
                crm_custom_reference_id: { type: 'string' },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['customer_id', 'line_items']
            }
          },
          {
            name: 'books_update_credit_note',
            description: 'Update an existing credit note in Books',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                customer_id: { type: 'string' },
                creditnote_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                invoice_id: { type: 'string' },
                reason: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      warehouse_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                shipping_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                crm_owner_id: { type: 'string' },
                crm_custom_reference_id: { type: 'string' },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_delete_credit_note',
            description: 'Delete a credit note from Books',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_convert_credit_note_to_open',
            description: 'Convert a credit note to open status',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_void_credit_note',
            description: 'Void a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_email_credit_note',
            description: 'Email a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                to_mail_ids: { type: 'array', items: { type: 'string' } },
                cc_mail_ids: { type: 'array', items: { type: 'string' } },
                subject: { type: 'string' },
                body: { type: 'string' },
                send_customer_statement: { type: 'boolean' },
                send_attachment: { type: 'boolean' }
              },
              required: ['creditnote_id', 'to_mail_ids']
            }
          },
          {
            name: 'books_get_credit_note_refunds',
            description: 'Get refunds for a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_refund_credit_note',
            description: 'Create a refund for a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                amount: { type: 'number', minimum: 0 },
                date: { type: 'string', format: 'date' },
                refund_mode: { type: 'string' },
                reference_number: { type: 'string' },
                description: { type: 'string' },
                from_account_id: { type: 'string' },
                exchange_rate: { type: 'number', minimum: 0 }
              },
              required: ['creditnote_id', 'amount', 'date', 'refund_mode']
            }
          },
          {
            name: 'books_apply_credit_note_to_invoice',
            description: 'Apply a credit note to an invoice',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                invoice_id: { type: 'string' },
                amount_applied: { type: 'number', minimum: 0 }
              },
              required: ['creditnote_id', 'invoice_id', 'amount_applied']
            }
          },
          {
            name: 'books_bulk_export_credit_notes',
            description: 'Export credit notes in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                export_type: { type: 'string', enum: ['pdf', 'csv', 'xls'] },
                filter_by: { type: 'string' },
                search_text: { type: 'string' },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                status: { type: 'string' },
                customer_id: { type: 'string' }
              },
              required: ['export_type']
            }
          },
          {
            name: 'books_bulk_print_credit_notes',
            description: 'Print credit notes in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_ids: { type: 'array', items: { type: 'string' } },
                orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                template_id: { type: 'string' }
              },
              required: ['creditnote_ids']
            }
          },
          {
            name: 'books_get_credit_note_comments',
            description: 'Get comments for a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' }
              },
              required: ['creditnote_id']
            }
          },
          {
            name: 'books_add_credit_note_comment',
            description: 'Add a comment to a credit note',
            inputSchema: {
              type: 'object',
              properties: {
                creditnote_id: { type: 'string' },
                description: { type: 'string' },
                show_comment_to_clients: { type: 'boolean' }
              },
              required: ['creditnote_id', 'description']
            }
          },
          // Books Purchase Orders Management Tools
          {
            name: 'books_get_purchase_orders',
            description: 'Get all purchase orders from Books',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                vendor_id: { type: 'string' },
                purchaseorder_number: { type: 'string' },
                reference_number: { type: 'string' },
                status: { type: 'string', enum: ['draft', 'open', 'billed', 'cancelled', 'pending_approval', 'approved'] },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_get_purchase_order',
            description: 'Get a specific purchase order from Books by ID',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_create_purchase_order',
            description: 'Create a new purchase order in Books',
            inputSchema: {
              type: 'object',
              properties: {
                vendor_id: { type: 'string' },
                purchaseorder_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                expected_delivery_date: { type: 'string', format: 'date' },
                delivery_date: { type: 'string', format: 'date' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      warehouse_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                delivery_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['vendor_id', 'line_items']
            }
          },
          {
            name: 'books_update_purchase_order',
            description: 'Update an existing purchase order in Books',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' },
                vendor_id: { type: 'string' },
                purchaseorder_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                expected_delivery_date: { type: 'string', format: 'date' },
                delivery_date: { type: 'string', format: 'date' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      warehouse_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                delivery_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_delete_purchase_order',
            description: 'Delete a purchase order from Books',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_mark_purchase_order_as_open',
            description: 'Mark a purchase order as open',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_mark_purchase_order_as_billed',
            description: 'Mark a purchase order as billed',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_cancel_purchase_order',
            description: 'Cancel a purchase order',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_email_purchase_order',
            description: 'Email a purchase order',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' },
                to_mail_ids: { type: 'array', items: { type: 'string' } },
                cc_mail_ids: { type: 'array', items: { type: 'string' } },
                subject: { type: 'string' },
                body: { type: 'string' },
                send_attachment: { type: 'boolean' }
              },
              required: ['purchase_order_id', 'to_mail_ids']
            }
          },
          {
            name: 'books_submit_purchase_order_for_approval',
            description: 'Submit a purchase order for approval',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_approve_purchase_order',
            description: 'Approve a purchase order',
            inputSchema: {
              type: 'object',
              properties: {
                purchase_order_id: { type: 'string' }
              },
              required: ['purchase_order_id']
            }
          },
          {
            name: 'books_bulk_export_purchase_orders',
            description: 'Export purchase orders in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                export_type: { type: 'string', enum: ['pdf', 'csv', 'xls'] },
                filter_by: { type: 'string' },
                search_text: { type: 'string' },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                status: { type: 'string' },
                vendor_id: { type: 'string' }
              },
              required: ['export_type']
            }
          },
          {
            name: 'books_bulk_print_purchase_orders',
            description: 'Print purchase orders in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                purchaseorder_ids: { type: 'array', items: { type: 'string' } },
                orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                template_id: { type: 'string' }
              },
              required: ['purchaseorder_ids']
            }
          },
          // Books Bills Management Tools
          {
            name: 'books_get_bills',
            description: 'Get all bills from Books',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                vendor_id: { type: 'string' },
                bill_number: { type: 'string' },
                reference_number: { type: 'string' },
                status: { type: 'string', enum: ['draft', 'open', 'overdue', 'paid', 'void', 'partially_paid'] },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                search_text: { type: 'string' },
                filter_by: { type: 'string' },
                sort_column: { type: 'string' },
                sort_order: { type: 'string', enum: ['A', 'D'] }
              }
            }
          },
          {
            name: 'books_get_bill',
            description: 'Get a specific bill from Books by ID',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_create_bill',
            description: 'Create a new bill in Books',
            inputSchema: {
              type: 'object',
              properties: {
                vendor_id: { type: 'string' },
                bill_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                due_date: { type: 'string', format: 'date' },
                purchaseorder_id: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      account_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      project_id: { type: 'string' },
                      customer_id: { type: 'string' },
                      expense_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['vendor_id', 'line_items']
            }
          },
          {
            name: 'books_update_bill',
            description: 'Update an existing bill in Books',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' },
                vendor_id: { type: 'string' },
                bill_number: { type: 'string' },
                reference_number: { type: 'string' },
                date: { type: 'string', format: 'date' },
                due_date: { type: 'string', format: 'date' },
                purchaseorder_id: { type: 'string' },
                line_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      line_item_id: { type: 'string' },
                      item_id: { type: 'string' },
                      account_id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0 },
                      unit: { type: 'string' },
                      rate: { type: 'number', minimum: 0 },
                      amount: { type: 'number', minimum: 0 },
                      tax_id: { type: 'string' },
                      tax_percentage: { type: 'number', minimum: 0 },
                      discount_amount: { type: 'number', minimum: 0 },
                      discount_percentage: { type: 'number', minimum: 0 },
                      project_id: { type: 'string' },
                      customer_id: { type: 'string' },
                      expense_id: { type: 'string' },
                      item_custom_fields: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['name', 'quantity', 'rate']
                  }
                },
                currency_code: { type: 'string' },
                discount: { type: 'number', minimum: 0 },
                discount_type: { type: 'string', enum: ['entity_level', 'item_level'] },
                is_discount_before_tax: { type: 'boolean' },
                is_inclusive_tax: { type: 'boolean' },
                shipping_charge: { type: 'number', minimum: 0 },
                adjustment: { type: 'number' },
                adjustment_description: { type: 'string' },
                notes: { type: 'string' },
                terms: { type: 'string' },
                billing_address: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    zip: { type: 'string' },
                    country: { type: 'string' },
                    phone: { type: 'string' },
                    fax: { type: 'string' }
                  }
                },
                template_id: { type: 'string' },
                custom_fields: { type: 'array', items: { type: 'object' } }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_delete_bill',
            description: 'Delete a bill from Books',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_mark_bill_as_open',
            description: 'Mark a bill as open',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_void_bill',
            description: 'Void a bill',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_mark_bill_as_paid',
            description: 'Mark a bill as paid',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_record_bill_payment',
            description: 'Record a payment for a bill',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' },
                amount: { type: 'number', minimum: 0 },
                date: { type: 'string', format: 'date' },
                payment_mode: { type: 'string' },
                reference_number: { type: 'string' },
                description: { type: 'string' },
                from_account_id: { type: 'string' },
                exchange_rate: { type: 'number', minimum: 0 }
              },
              required: ['bill_id', 'amount', 'date', 'payment_mode']
            }
          },
          {
            name: 'books_get_bill_payments',
            description: 'Get payments for a bill',
            inputSchema: {
              type: 'object',
              properties: {
                bill_id: { type: 'string' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 }
              },
              required: ['bill_id']
            }
          },
          {
            name: 'books_bulk_export_bills',
            description: 'Export bills in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                export_type: { type: 'string', enum: ['pdf', 'csv', 'xls'] },
                filter_by: { type: 'string' },
                search_text: { type: 'string' },
                date_from: { type: 'string', format: 'date' },
                date_to: { type: 'string', format: 'date' },
                status: { type: 'string' },
                vendor_id: { type: 'string' }
              },
              required: ['export_type']
            }
          },
          {
            name: 'books_bulk_print_bills',
            description: 'Print bills in bulk',
            inputSchema: {
              type: 'object',
              properties: {
                bill_ids: { type: 'array', items: { type: 'string' } },
                orientation: { type: 'string', enum: ['portrait', 'landscape'] },
                template_id: { type: 'string' }
              },
              required: ['bill_ids']
            }
          },
          // CRM Activities Tools
          {
            name: 'crm_get_tasks',
            description: 'Get all tasks from CRM',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                sort_by: { type: 'string' },
                sort_order: { type: 'string', enum: ['asc', 'desc'] },
                status: { type: 'string' },
                due_date: { type: 'string' }
              }
            }
          },
          {
            name: 'crm_create_task',
            description: 'Create a task in CRM linked to accounts, contacts, or deals. Tasks can have due dates, priorities, and reminders for follow-up activities.\n\nExample: Create follow-up task\n{"Subject": "Follow up on proposal", "Due_Date": "2024-12-31", "Priority": "High", "What_Id": "deal-123", "Who_Id": "contact-456"}',
            inputSchema: {
              type: 'object',
              title: 'CRM Task Creator',
              readOnlyHint: false,
              idempotentHint: false,
              openWorldHint: true,
              category: 'CRM - Activity Management',
              properties: {
                Subject: { type: 'string', description: 'Task title/subject (e.g., "Follow up on proposal")' },
                Status: { type: 'string', description: 'Task status (e.g., "Not Started", "In Progress", "Completed", "Deferred")' },
                Priority: { type: 'string', description: 'Priority level (e.g., "High", "Medium", "Low")' },
                Due_Date: { type: 'string', description: 'Due date in YYYY-MM-DD format (e.g., "2024-12-31")', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                What_Id: { type: 'string', description: 'Related record ID - Account, Deal, or other business record this task relates to' },
                Who_Id: { type: 'string', description: 'Contact ID - Person this task is about (get from CRM contacts)' },
                Description: { type: 'string', description: 'Detailed task description or notes' },
                Related_To: { type: 'string', description: 'Additional related record reference' },
                Remind_At: { type: 'string', description: 'Reminder datetime in YYYY-MM-DD HH:MM format' },
                Recurring_Activity: { type: 'string', description: 'Recurrence pattern (e.g., "Daily", "Weekly", "Monthly")' }
              },
              required: ['Subject']
            }
          },
          {
            name: 'crm_get_events',
            description: 'Get calendar events from CRM with filtering and pagination. Use for viewing meetings, appointments, and scheduled activities.\n\nRelated tools: crm_create_event (to schedule), crm_create_task (for follow-ups), crm_get_notes (meeting notes)',
            inputSchema: {
              type: 'object',
              title: 'CRM Event List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'CRM - Calendar Management',
              properties: {
                page: { type: 'number', minimum: 1, default: 1, description: 'Page number for pagination (starts at 1)' },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20, description: 'Number of events per page (1-200)' },
                sort_by: { type: 'string', description: 'Column to sort by (e.g., "Event_Title", "Start_DateTime", "End_DateTime")' },
                sort_order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order: asc=ascending, desc=descending' },
                start_date: { type: 'string', description: 'Filter events from this date (YYYY-MM-DD format)' },
                end_date: { type: 'string', description: 'Filter events until this date (YYYY-MM-DD format)' }
              }
            }
          },
          {
            name: 'crm_create_event',
            description: 'Create a new event in CRM',
            inputSchema: {
              type: 'object',
              properties: {
                Subject: { type: 'string' },
                Start_DateTime: { type: 'string' },
                End_DateTime: { type: 'string' },
                Description: { type: 'string' },
                Location: { type: 'string' },
                What_Id: { type: 'string' },
                Who_Id: { type: 'string' },
                Event_Title: { type: 'string' },
                All_day: { type: 'boolean' },
                Participants: { type: 'array', items: { type: 'string' } },
                Remind_At: { type: 'string' },
                Recurring_Activity: { type: 'string' }
              },
              required: ['Subject', 'Start_DateTime', 'End_DateTime']
            }
          },
          {
            name: 'crm_get_notes',
            description: 'Get notes for a specific CRM record',
            inputSchema: {
              type: 'object',
              properties: {
                module: { type: 'string' },
                record_id: { type: 'string' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 }
              },
              required: ['module', 'record_id']
            }
          },
          {
            name: 'crm_create_note',
            description: 'Create a new note for a CRM record',
            inputSchema: {
              type: 'object',
              properties: {
                module: { type: 'string' },
                record_id: { type: 'string' },
                Note_Title: { type: 'string' },
                Note_Content: { type: 'string' },
                Parent_Id: { type: 'string' }
              },
              required: ['module', 'record_id', 'Note_Title', 'Note_Content']
            }
          },
          {
            name: 'crm_send_email',
            description: 'Send email for a CRM record',
            inputSchema: {
              type: 'object',
              properties: {
                module: { type: 'string' },
                record_id: { type: 'string' },
                to: { type: 'array', items: { type: 'string' } },
                cc: { type: 'array', items: { type: 'string' } },
                bcc: { type: 'array', items: { type: 'string' } },
                subject: { type: 'string' },
                content: { type: 'string' },
                mail_format: { type: 'string' },
                template_id: { type: 'string' }
              },
              required: ['module', 'record_id', 'to', 'subject', 'content']
            }
          },
          {
            name: 'crm_get_attachments',
            description: 'Get attachments for a CRM record',
            inputSchema: {
              type: 'object',
              properties: {
                module: { type: 'string' },
                record_id: { type: 'string' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 }
              },
              required: ['module', 'record_id']
            }
          },
          // Generic Module Analysis Tools
          {
            name: 'analyze_custom_module',
            description: 'Analyze any CRM module with statistical breakdown by field values. Perfect for generating reports, understanding data distribution, and identifying patterns.\n\nWorkflow: First use crm_get_all_modules to discover available modules, then get_custom_module_records to explore data, finally analyze_custom_module for insights',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module to analyze (e.g., payment_receipt, broker, etc.)' },
                breakdown_field: { type: 'string', description: 'Field to breakdown and count by (e.g., Receipt_Status, Status, etc.)' },
                numeric_field: { type: 'string', description: 'Optional numeric field to sum by breakdown (e.g., Amount, Total, etc.)' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 200 },
                filter_field: { type: 'string', description: 'Optional field to filter by' },
                filter_value: { type: 'string', description: 'Optional value to filter by' },
                date_from: { type: 'string', description: 'Optional start date for filtering' },
                date_to: { type: 'string', description: 'Optional end date for filtering' }
              },
              required: ['module_name', 'breakdown_field']
            }
          },
          {
            name: 'get_custom_module_records',
            description: 'Get records from any custom module with flexible filtering',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module to get records from' },
                filter_field: { type: 'string', description: 'Optional field to filter by' },
                filter_value: { type: 'string', description: 'Optional value to filter by' },
                page: { type: 'number', minimum: 1, default: 1 },
                per_page: { type: 'number', minimum: 1, maximum: 200, default: 20 },
                fields: { type: 'array', items: { type: 'string' }, description: 'Specific fields to retrieve' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'analyze_module_field',
            description: 'Perform statistical analysis on any field in any module',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module to analyze' },
                field_name: { type: 'string', description: 'Name of the field to analyze' },
                analysis_type: { type: 'string', enum: ['count', 'sum', 'avg', 'min', 'max'], description: 'Type of analysis to perform' },
                group_by_field: { type: 'string', description: 'Optional field to group results by' }
              },
              required: ['module_name', 'field_name', 'analysis_type']
            }
          },
          // CRM Metadata Tools
          {
            name: 'crm_get_all_modules',
            description: 'Get all CRM modules with metadata',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_module_details',
            description: 'Get detailed metadata for a specific module',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_module_fields',
            description: 'Get fields for a module with pagination and filtering to avoid large responses',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' },
                page: { type: 'number', default: 1, minimum: 1, description: 'Page number for pagination' },
                per_page: { type: 'number', default: 50, minimum: 1, maximum: 200, description: 'Fields per page' },
                field_type: { type: 'string', enum: ['picklist', 'lookup', 'text'], description: 'Filter by field type' },
                search_term: { type: 'string', description: 'Search fields by name' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_field_details',
            description: 'Get detailed metadata for a specific field',
            inputSchema: {
              type: 'object',
              properties: {
                field_id: { type: 'string', description: 'ID of the field' },
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['field_id', 'module_name']
            }
          },
          {
            name: 'crm_get_picklist_fields',
            description: 'Get only picklist fields for a specific module - optimized for finding disposition/status fields',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_search_fields',
            description: 'Search fields by name pattern - use to find specific fields like "disposition" or "status"',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' },
                search_term: { type: 'string', description: 'Search term (e.g., "disposition", "status")' }
              },
              required: ['module_name', 'search_term']
            }
          },
          {
            name: 'crm_get_layouts',
            description: 'Get all layouts for modules',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Optional module name to filter layouts' }
              },
              required: []
            }
          },
          {
            name: 'crm_get_layout_details',
            description: 'Get detailed metadata for a specific layout',
            inputSchema: {
              type: 'object',
              properties: {
                layout_id: { type: 'string', description: 'ID of the layout' }
              },
              required: ['layout_id']
            }
          },
          {
            name: 'crm_update_layout',
            description: 'Update layout configuration',
            inputSchema: {
              type: 'object',
              properties: {
                layout_id: { type: 'string', description: 'ID of the layout' },
                layout_data: { type: 'object', description: 'Layout configuration data' }
              },
              required: ['layout_id', 'layout_data']
            }
          },
          {
            name: 'crm_get_all_profiles',
            description: 'Get all profiles in the organization',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_create_profile',
            description: 'Create a new profile',
            inputSchema: {
              type: 'object',
              properties: {
                profile_data: { type: 'object', description: 'Profile data' }
              },
              required: ['profile_data']
            }
          },
          {
            name: 'crm_update_profile',
            description: 'Update profile permissions',
            inputSchema: {
              type: 'object',
              properties: {
                profile_id: { type: 'string', description: 'ID of the profile' },
                profile_data: { type: 'object', description: 'Profile data to update' }
              },
              required: ['profile_id', 'profile_data']
            }
          },
          {
            name: 'crm_get_all_roles',
            description: 'Get all roles in the organization',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_role_details',
            description: 'Get detailed metadata for a specific role',
            inputSchema: {
              type: 'object',
              properties: {
                role_id: { type: 'string', description: 'ID of the role' }
              },
              required: ['role_id']
            }
          },
          {
            name: 'crm_create_role',
            description: 'Create a new role',
            inputSchema: {
              type: 'object',
              properties: {
                role_data: { type: 'object', description: 'Role data' }
              },
              required: ['role_data']
            }
          },
          {
            name: 'crm_update_role',
            description: 'Update role details',
            inputSchema: {
              type: 'object',
              properties: {
                role_id: { type: 'string', description: 'ID of the role' },
                role_data: { type: 'object', description: 'Role data to update' }
              },
              required: ['role_id', 'role_data']
            }
          },
          {
            name: 'crm_delete_role',
            description: 'Delete a role',
            inputSchema: {
              type: 'object',
              properties: {
                role_id: { type: 'string', description: 'ID of the role' }
              },
              required: ['role_id']
            }
          },
          {
            name: 'crm_get_all_users',
            description: 'Get all users in the organization',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Optional type filter (AllUsers, AdminUsers, etc.)' }
              },
              required: []
            }
          },
          {
            name: 'crm_get_user_details',
            description: 'Get detailed metadata for a specific user',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: { type: 'string', description: 'ID of the user' }
              },
              required: ['user_id']
            }
          },
          {
            name: 'crm_create_user',
            description: 'Create a new user',
            inputSchema: {
              type: 'object',
              properties: {
                user_data: { type: 'object', description: 'User data' }
              },
              required: ['user_data']
            }
          },
          {
            name: 'crm_get_organization_details',
            description: 'Get organization details and settings',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_organization_features',
            description: 'Get organization features and limits',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_custom_views',
            description: 'Get all custom views for a module',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_custom_view_details',
            description: 'Get detailed metadata for a specific custom view',
            inputSchema: {
              type: 'object',
              properties: {
                custom_view_id: { type: 'string', description: 'ID of the custom view' },
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['custom_view_id', 'module_name']
            }
          },
          {
            name: 'crm_get_related_lists',
            description: 'Get all related lists for a module',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_all_territories',
            description: 'Get all territories',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_all_currencies',
            description: 'Get all currencies',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_pipeline_metadata',
            description: 'Get pipeline metadata',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_assignment_rules',
            description: 'Get assignment rules',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_blueprint_metadata',
            description: 'Get blueprint metadata',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_metadata_summary',
            description: 'Get comprehensive metadata summary for the entire CRM',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'crm_get_complete_module_configuration',
            description: 'Get complete module configuration including fields, layouts, custom views, and related lists',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_analyze_module_permissions',
            description: 'Analyze module permissions and accessibility',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_picklist_values',
            description: 'Get picklist values for a specific field in a module',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' },
                field_name: { type: 'string', description: 'Name of the field' }
              },
              required: ['module_name', 'field_name']
            }
          },
          {
            name: 'crm_analyze_picklist_dependencies',
            description: 'Analyze picklist dependencies and relationships in a module. Identifies field dependencies, picklist chains, and relationship patterns.',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module to analyze' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_dependent_fields',
            description: 'Get fields that depend on a specific field in a module. Useful for understanding field relationships and dependencies.',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' },
                field_name: { type: 'string', description: 'Name of the field to find dependents for' }
              },
              required: ['module_name', 'field_name']
            }
          },
          {
            name: 'crm_get_field_relationships',
            description: 'Get all field relationships and dependencies in a module. Provides comprehensive analysis of field connections.',
            inputSchema: {
              type: 'object',
              properties: {
                module_name: { type: 'string', description: 'Name of the module' }
              },
              required: ['module_name']
            }
          },
          {
            name: 'crm_get_global_fields',
            description: 'Get global fields across all modules (global picklists and lookups)',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          // Configuration Management Tools
          {
            name: 'config_list_environments',
            description: 'List all available environments',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'config_switch_environment',
            description: 'Switch to a different environment',
            inputSchema: {
              type: 'object',
              properties: {
                environmentName: { type: 'string', description: 'Name of the environment to switch to' }
              },
              required: ['environmentName']
            }
          },
          {
            name: 'config_list_profiles',
            description: 'List all profiles in the current environment',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'config_switch_profile',
            description: 'Switch to a different profile within the current environment',
            inputSchema: {
              type: 'object',
              properties: {
                profileName: { type: 'string', description: 'Name of the profile to switch to' }
              },
              required: ['profileName']
            }
          },
          {
            name: 'config_add_profile',
            description: 'Add a new profile to the current environment',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name of the profile' },
                description: { type: 'string', description: 'Description of the profile' },
                clientId: { type: 'string', description: 'Zoho Client ID' },
                clientSecret: { type: 'string', description: 'Zoho Client Secret' },
                redirectUri: { type: 'string', description: 'Redirect URI' },
                refreshToken: { type: 'string', description: 'Refresh Token' },
                dataCenter: { type: 'string', description: 'Data Center (com, eu, in, com.au, jp)' },
                scopes: { type: 'array', items: { type: 'string' }, description: 'API Scopes' },
                organizationId: { type: 'string', description: 'Books Organization ID' }
              },
              required: ['name', 'clientId', 'clientSecret', 'redirectUri', 'refreshToken', 'dataCenter', 'scopes']
            }
          },
          {
            name: 'config_remove_profile',
            description: 'Remove a profile from the current environment',
            inputSchema: {
              type: 'object',
              properties: {
                profileName: { type: 'string', description: 'Name of the profile to remove' }
              },
              required: ['profileName']
            }
          },
          {
            name: 'config_update_profile',
            description: 'Update an existing profile',
            inputSchema: {
              type: 'object',
              properties: {
                profileName: { type: 'string', description: 'Name of the profile to update' },
                updates: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    clientId: { type: 'string' },
                    clientSecret: { type: 'string' },
                    redirectUri: { type: 'string' },
                    refreshToken: { type: 'string' },
                    dataCenter: { type: 'string' },
                    scopes: { type: 'array', items: { type: 'string' } },
                    organizationId: { type: 'string' }
                  },
                  description: 'Profile updates'
                }
              },
              required: ['profileName', 'updates']
            }
          },
          {
            name: 'config_get_status',
            description: 'Get current configuration status',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'config_export_to_env',
            description: 'Export current configuration to .env format',
            inputSchema: {
              type: 'object',
              properties: {
                profileName: { type: 'string', description: 'Name of the profile to export (defaults to active profile)' }
              }
            }
          },
          {
            name: 'config_add_environment',
            description: 'Add a new environment',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name of the environment' },
                description: { type: 'string', description: 'Description of the environment' }
              },
              required: ['name']
            }
          },
          {
            name: 'config_remove_environment',
            description: 'Remove an environment',
            inputSchema: {
              type: 'object',
              title: 'Configuration Environment Remover',
              readOnlyHint: false,
              idempotentHint: false,
              destructiveHint: true,
              category: 'Configuration Management',
              properties: {
                name: { type: 'string', description: 'Name of the environment to remove' }
              },
              required: ['name']
            }
          },
          {
            name: 'list_tools_by_category',
            description: 'List all available tools grouped by category. Use this to discover tools for specific tasks like customer management, invoice processing, or CRM activities.\n\nExample: List all customer management tools\n{"category": "Books - Customer Management"}',
            inputSchema: {
              type: 'object',
              title: 'Tool Category Discovery',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Tool Discovery',
              properties: {
                category: { 
                  type: 'string', 
                  description: 'Specific category to list (optional). Leave empty to see all categories.',
                  enum: [
                    'Data Synchronization',
                    'Data Discovery',
                    'Books - Customer Management',
                    'Books - Inventory Management',
                    'Books - Estimate Management',
                    'Books - Payment Processing',
                    'Books - Invoice Management',
                    'Books - Credit Note Management',
                    'Books - Purchase Order Management',
                    'Books - Bill Management',
                    'CRM - Activity Management',
                    'CRM - Calendar Management',
                    'CRM - Metadata & Analysis',
                    'Configuration Management',
                    'Tool Discovery'
                  ]
                }
              }
            }
          },
          {
            name: 'list_available_categories',
            description: 'List all available tool categories. Use this to understand the organization of tools and find the right category for your task.',
            inputSchema: {
              type: 'object',
              title: 'Category List',
              readOnlyHint: true,
              idempotentHint: true,
              category: 'Tool Discovery',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // === TOOL DISCOVERY HANDLERS ===
          case 'list_tool_categories':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    categories: [
                      {
                        name: 'Data Synchronization',
                        description: 'Sync data between CRM and Books systems',
                        tool_count: 5,
                        common_use_cases: ['Data migration', 'Keeping systems in sync', 'Cross-platform workflows']
                      },
                      {
                        name: 'Books - Customer Management',
                        description: 'Manage customer records in Books',
                        tool_count: 5,
                        common_use_cases: ['Customer onboarding', 'Contact management', 'Customer data updates']
                      },
                      {
                        name: 'Books - Inventory Management',
                        description: 'Manage products and services in Books',
                        tool_count: 5,
                        common_use_cases: ['Product catalog', 'Inventory tracking', 'Service offerings']
                      },
                      {
                        name: 'Books - Financial Documents',
                        description: 'Create and manage invoices, estimates, payments, credit notes',
                        tool_count: 30,
                        common_use_cases: ['Billing customers', 'Payment processing', 'Financial reporting']
                      },
                      {
                        name: 'Books - Purchase Management',
                        description: 'Manage purchase orders and bills',
                        tool_count: 25,
                        common_use_cases: ['Vendor management', 'Purchase tracking', 'Expense management']
                      },
                      {
                        name: 'CRM - Activity Management',
                        description: 'Manage tasks, events, notes, and communications',
                        tool_count: 8,
                        common_use_cases: ['Activity tracking', 'Calendar management', 'Communication logging']
                      },
                      {
                        name: 'CRM - Analytics & Reporting',
                        description: 'Analyze data and generate insights',
                        tool_count: 5,
                        common_use_cases: ['Data analysis', 'Custom reporting', 'Business intelligence']
                      },
                      {
                        name: 'CRM - Administration',
                        description: 'Manage CRM configuration and metadata',
                        tool_count: 35,
                        common_use_cases: ['System configuration', 'User management', 'Customization']
                      },
                      {
                        name: 'Configuration Management',
                        description: 'Manage server configuration and environments',
                        tool_count: 12,
                        common_use_cases: ['Environment switching', 'Profile management', 'System setup']
                      }
                    ],
                    total_categories: 9,
                    total_tools: 130,
                    usage_tip: 'Use list_tools_by_category to see tools in a specific category'
                  }, null, 2)
                }
              ]
            };

          case 'list_tools_by_category':
            const categoryMap = {
              'Data Synchronization': ['sync_accounts_to_customers', 'sync_contacts_to_customers', 'sync_customers_to_contacts', 'create_invoice_from_deal', 'search_records'],
              'Books - Customer Management': ['books_get_customers', 'books_get_customer', 'books_create_customer', 'books_update_customer', 'books_delete_customer'],
              'Books - Inventory Management': ['books_get_items', 'books_get_item', 'books_create_item', 'books_update_item', 'books_delete_item'],
              'Books - Financial Documents': ['books_get_invoices', 'books_get_invoice', 'books_create_invoice', 'books_update_invoice', 'books_delete_invoice', 'books_send_invoice_email', 'books_get_invoice_pdf', 'books_get_estimates', 'books_create_estimate', 'books_convert_estimate_to_invoice', 'books_get_payments', 'books_create_payment', 'books_get_credit_notes', 'books_get_credit_note', 'books_create_credit_note', 'books_update_credit_note', 'books_delete_credit_note'],
              'CRM - Activity Management': ['crm_get_tasks', 'crm_create_task', 'crm_get_events', 'crm_create_event', 'crm_get_notes', 'crm_create_note', 'crm_send_email', 'crm_get_attachments'],
              'CRM - Analytics & Reporting': ['analyze_custom_module', 'get_custom_module_records', 'analyze_module_field'],
              'CRM - Administration': ['crm_get_all_modules', 'crm_get_module_details', 'crm_get_module_fields', 'crm_get_field_details', 'crm_get_layouts', 'crm_get_layout_details', 'crm_update_layout', 'crm_get_all_profiles', 'crm_create_profile', 'crm_update_profile', 'crm_get_all_roles', 'crm_get_role_details', 'crm_create_role', 'crm_update_role', 'crm_delete_role', 'crm_get_all_users', 'crm_get_user_details', 'crm_create_user'],
              'Configuration Management': ['config_list_environments', 'config_switch_environment', 'config_list_profiles', 'config_switch_profile', 'config_add_profile', 'config_remove_profile', 'config_update_profile', 'config_get_status', 'config_export_to_env', 'config_add_environment', 'config_remove_environment']
            };

            const requestedCategory = args?.category;
            const categoryTools = categoryMap[requestedCategory as keyof typeof categoryMap];
            
            if (!categoryTools) {
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      error: 'Invalid category',
                      available_categories: Object.keys(categoryMap)
                    }, null, 2)
                  }
                ]
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    category: requestedCategory,
                    tools: categoryTools,
                    tool_count: categoryTools.length,
                    usage_tip: 'Use these tool names directly in your requests'
                  }, null, 2)
                }
              ]
            };
          case 'sync_accounts_to_customers':
            const syncParams = SyncParamsSchema.parse(args);
            const syncResult = await this.syncTools.syncAccountsToCustomers(syncParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Sync completed',
                    success: syncResult.success,
                    failed: syncResult.failed,
                    results: syncResult.results
                  }, null, 2)
                }
              ]
            };

          case 'sync_contacts_to_customers':
            const contactsToCustomersParams = SyncParamsSchema.parse(args);
            const contactsToCustomersResult = await this.syncTools.syncContactsToCustomers(contactsToCustomersParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Contacts to customers sync completed',
                    success: contactsToCustomersResult.success,
                    failed: contactsToCustomersResult.failed,
                    results: contactsToCustomersResult.results
                  }, null, 2)
                }
              ]
            };

          case 'sync_customers_to_contacts':
            const customersToContactsParams = SyncParamsSchema.parse(args);
            const customersToContactsResult = await this.syncTools.syncCustomersToContacts(customersToContactsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Customers to contacts sync completed',
                    success: customersToContactsResult.success,
                    failed: customersToContactsResult.failed,
                    results: customersToContactsResult.results
                  }, null, 2)
                }
              ]
            };

          case 'create_invoice_from_deal':
            const invoiceParams = CreateInvoiceParamsSchema.parse(args);
            const invoice = await this.syncTools.createInvoiceFromDeal(invoiceParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Invoice created successfully',
                    invoice_id: invoice.invoice_id,
                    invoice_number: invoice.invoice_number,
                    total: invoice.total,
                    status: invoice.status
                  }, null, 2)
                }
              ]
            };

          case 'search_records':
            const searchParams = SearchParamsSchema.parse(args);
            const searchResults = await this.syncTools.searchRecords(searchParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: 'Search completed',
                    total_results: searchResults.total_results,
                    crm_results: searchResults.crm_results,
                    books_results: searchResults.books_results
                  }, null, 2)
                }
              ]
            };

          // Books Sales Orders Management Tools
          case 'books_get_sales_orders':
            const getSalesOrdersParams = GetSalesOrdersParamsSchema.parse(args);
            const salesOrdersResult = await this.booksSalesOrdersTools.getSalesOrders(getSalesOrdersParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(salesOrdersResult, null, 2)
                }
              ]
            };

          case 'books_get_sales_order':
            const getSalesOrderResult = await this.booksSalesOrdersTools.getSalesOrder(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_create_sales_order':
            const createSalesOrderParams = SalesOrderParamsSchema.parse(args);
            const createSalesOrderResult = await this.booksSalesOrdersTools.createSalesOrder(createSalesOrderParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_update_sales_order':
            const { sales_order_id, ...updateSalesOrderData } = args || {};
            const updateSalesOrderParams = SalesOrderParamsSchema.partial().parse(updateSalesOrderData);
            const updateSalesOrderResult = await this.booksSalesOrdersTools.updateSalesOrder(sales_order_id as string, updateSalesOrderParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_delete_sales_order':
            const deleteSalesOrderResult = await this.booksSalesOrdersTools.deleteSalesOrder(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deleteSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_mark_sales_order_open':
            const markSalesOrderOpenResult = await this.booksSalesOrdersTools.markSalesOrderOpen(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markSalesOrderOpenResult, null, 2)
                }
              ]
            };

          case 'books_mark_sales_order_void':
            const markSalesOrderVoidResult = await this.booksSalesOrdersTools.markSalesOrderVoid(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markSalesOrderVoidResult, null, 2)
                }
              ]
            };

          case 'books_email_sales_order':
            const { sales_order_id: emailSalesOrderId, to_mail_ids: salesOrder_to_mail_ids, cc_mail_ids: salesOrder_cc_mail_ids, subject: salesOrder_subject, body: salesOrder_body, send_customer_statement, send_attachment: salesOrder_send_attachment } = args || {};
            const emailSalesOrderResult = await this.booksSalesOrdersTools.emailSalesOrder(emailSalesOrderId as string, {
              to_mail_ids: salesOrder_to_mail_ids as string[],
              subject: salesOrder_subject as string,
              body: salesOrder_body as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(emailSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_submit_sales_order':
            const submitSalesOrderResult = await this.booksSalesOrdersTools.submitSalesOrder(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(submitSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_approve_sales_order':
            const approveSalesOrderResult = await this.booksSalesOrdersTools.approveSalesOrder(args?.sales_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(approveSalesOrderResult, null, 2)
                }
              ]
            };

          case 'books_bulk_export_sales_orders':
            const { export_type, filter_by, search_text, date_from, date_to, status, customer_id: salesOrder_customer_id } = args || {};
            const bulkExportResult = await this.booksSalesOrdersTools.bulkExportSalesOrders({
              salesorder_ids: [] as string[],
              format: export_type as 'pdf' | 'csv'
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkExportResult, null, 2)
                }
              ]
            };

          case 'books_bulk_print_sales_orders':
            const { sales_order_ids, orientation, template_id } = args || {};
            const bulkPrintResult = await this.booksSalesOrdersTools.bulkPrintSalesOrders({
              salesorder_ids: sales_order_ids as string[]
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkPrintResult, null, 2)
                }
              ]
            };

          // Books Purchase Orders Management Tools
          case 'books_get_purchase_orders':
            const getPurchaseOrdersParams = GetPurchaseOrdersParamsSchema.parse(args);
            const purchaseOrdersResult = await this.booksPurchaseOrdersTools.getPurchaseOrders(getPurchaseOrdersParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(purchaseOrdersResult, null, 2)
                }
              ]
            };

          case 'books_get_purchase_order':
            const getPurchaseOrderResult = await this.booksPurchaseOrdersTools.getPurchaseOrder(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getPurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_create_purchase_order':
            const createPurchaseOrderParams = PurchaseOrderParamsSchema.parse(args);
            const createPurchaseOrderResult = await this.booksPurchaseOrdersTools.createPurchaseOrder(createPurchaseOrderParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createPurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_update_purchase_order':
            const { purchase_order_id, ...updatePurchaseOrderData } = args || {};
            const updatePurchaseOrderParams = PurchaseOrderParamsSchema.partial().parse(updatePurchaseOrderData);
            const updatePurchaseOrderResult = await this.booksPurchaseOrdersTools.updatePurchaseOrder(purchase_order_id as string, updatePurchaseOrderParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updatePurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_delete_purchase_order':
            const deletePurchaseOrderResult = await this.booksPurchaseOrdersTools.deletePurchaseOrder(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deletePurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_mark_purchase_order_as_open':
            const markPurchaseOrderAsOpenResult = await this.booksPurchaseOrdersTools.markPurchaseOrderAsOpen(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markPurchaseOrderAsOpenResult, null, 2)
                }
              ]
            };

          case 'books_mark_purchase_order_as_billed':
            const markPurchaseOrderAsBilledResult = await this.booksPurchaseOrdersTools.markPurchaseOrderAsBilled(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markPurchaseOrderAsBilledResult, null, 2)
                }
              ]
            };

          case 'books_cancel_purchase_order':
            const cancelPurchaseOrderResult = await this.booksPurchaseOrdersTools.cancelPurchaseOrder(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(cancelPurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_email_purchase_order':
            const { purchase_order_id: emailPurchaseOrderId, to_mail_ids: purchaseOrder_to_mail_ids, cc_mail_ids: purchaseOrder_cc_mail_ids, subject: purchaseOrder_subject, body: purchaseOrder_body, send_attachment: purchaseOrder_send_attachment } = args || {};
            const emailPurchaseOrderResult = await this.booksPurchaseOrdersTools.emailPurchaseOrder(emailPurchaseOrderId as string, {
              to_mail_ids: purchaseOrder_to_mail_ids as string[],
              cc_mail_ids: purchaseOrder_cc_mail_ids as string[],
              subject: purchaseOrder_subject as string,
              body: purchaseOrder_body as string,
              send_attachment: purchaseOrder_send_attachment as boolean
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(emailPurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_submit_purchase_order_for_approval':
            const submitPurchaseOrderForApprovalResult = await this.booksPurchaseOrdersTools.submitPurchaseOrderForApproval(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(submitPurchaseOrderForApprovalResult, null, 2)
                }
              ]
            };

          case 'books_approve_purchase_order':
            const approvePurchaseOrderResult = await this.booksPurchaseOrdersTools.approvePurchaseOrder(args?.purchase_order_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(approvePurchaseOrderResult, null, 2)
                }
              ]
            };

          case 'books_bulk_export_purchase_orders':
            const { export_type: poExportType, filter_by: poFilterBy, search_text: poSearchText, date_from: poDateFrom, date_to: poDateTo, status: poStatus, vendor_id: poVendorId } = args || {};
            const bulkExportPurchaseOrdersResult = await this.booksPurchaseOrdersTools.bulkExportPurchaseOrders({
              export_type: poExportType as string,
              filter_by: poFilterBy as string,
              search_text: poSearchText as string,
              date_from: poDateFrom as string,
              date_to: poDateTo as string,
              status: poStatus as string,
              vendor_id: poVendorId as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkExportPurchaseOrdersResult, null, 2)
                }
              ]
            };

          case 'books_bulk_print_purchase_orders':
            const { purchaseorder_ids, orientation: poOrientation, template_id: poTemplateId } = args || {};
            const bulkPrintPurchaseOrdersResult = await this.booksPurchaseOrdersTools.bulkPrintPurchaseOrders({
              purchaseorder_ids: purchaseorder_ids as string[],
              orientation: poOrientation as string,
              template_id: poTemplateId as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkPrintPurchaseOrdersResult, null, 2)
                }
              ]
            };

          // Books Bills Management Tools
          case 'books_get_bills':
            const getBillsParams = GetBillsParamsSchema.parse(args);
            const billsResult = await this.booksBillsTools.getBills(getBillsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(billsResult, null, 2)
                }
              ]
            };

          case 'books_get_bill':
            const getBillResult = await this.booksBillsTools.getBill(args?.bill_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getBillResult, null, 2)
                }
              ]
            };

          case 'books_create_bill':
            const createBillParams = BillParamsSchema.parse(args);
            const createBillResult = await this.booksBillsTools.createBill(createBillParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createBillResult, null, 2)
                }
              ]
            };

          case 'books_update_bill':
            const { bill_id, ...updateBillData } = args || {};
            const updateBillParams = BillParamsSchema.partial().parse(updateBillData);
            const updateBillResult = await this.booksBillsTools.updateBill(bill_id as string, updateBillParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateBillResult, null, 2)
                }
              ]
            };

          case 'books_delete_bill':
            const deleteBillResult = await this.booksBillsTools.deleteBill(args?.bill_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deleteBillResult, null, 2)
                }
              ]
            };

          case 'books_mark_bill_as_open':
            const markBillAsOpenResult = await this.booksBillsTools.markBillAsOpen(args?.bill_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markBillAsOpenResult, null, 2)
                }
              ]
            };

          case 'books_void_bill':
            const voidBillResult = await this.booksBillsTools.voidBill(args?.bill_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(voidBillResult, null, 2)
                }
              ]
            };

          case 'books_mark_bill_as_paid':
            const markBillAsPaidResult = await this.booksBillsTools.markBillAsPaid(args?.bill_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(markBillAsPaidResult, null, 2)
                }
              ]
            };

          case 'books_record_bill_payment':
            const { bill_id: paymentBillId, amount, date, payment_mode, reference_number, description, from_account_id, exchange_rate } = args || {};
            const recordBillPaymentResult = await this.booksBillsTools.recordBillPayment(paymentBillId as string, {
              amount: amount as number,
              date: date as string,
              payment_mode: payment_mode as string,
              reference_number: reference_number as string,
              description: description as string,
              from_account_id: from_account_id as string,
              exchange_rate: exchange_rate as number
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(recordBillPaymentResult, null, 2)
                }
              ]
            };

          case 'books_get_bill_payments':
            const { bill_id: paymentsBillId, page: paymentsPage, per_page: paymentsPerPage } = args || {};
            const getBillPaymentsResult = await this.booksBillsTools.getBillPayments(paymentsBillId as string, {
              page: paymentsPage as number,
              per_page: paymentsPerPage as number
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getBillPaymentsResult, null, 2)
                }
              ]
            };

          case 'books_bulk_export_bills':
            const { export_type: billExportType, filter_by: billFilterBy, search_text: billSearchText, date_from: billDateFrom, date_to: billDateTo, status: billStatus, vendor_id: billVendorId } = args || {};
            const bulkExportBillsResult = await this.booksBillsTools.bulkExportBills({
              export_type: billExportType as string,
              filter_by: billFilterBy as string,
              search_text: billSearchText as string,
              date_from: billDateFrom as string,
              date_to: billDateTo as string,
              status: billStatus as string,
              vendor_id: billVendorId as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkExportBillsResult, null, 2)
                }
              ]
            };

          case 'books_bulk_print_bills':
            const { bill_ids, orientation: billOrientation, template_id: billTemplateId } = args || {};
            const bulkPrintBillsResult = await this.booksBillsTools.bulkPrintBills({
              bill_ids: bill_ids as string[],
              orientation: billOrientation as string,
              template_id: billTemplateId as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bulkPrintBillsResult, null, 2)
                }
              ]
            };

          // Books Customers Management Tools
          case 'books_get_customers':
            const getCustomersParams = GetCustomersParamsSchema.parse(args);
            const customersResult = await this.booksCustomersTools.getCustomers(getCustomersParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(customersResult, null, 2)
                }
              ]
            };

          case 'books_get_customer':
            const getCustomerResult = await this.booksCustomersTools.getCustomer(args?.customer_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getCustomerResult, null, 2)
                }
              ]
            };

          case 'books_create_customer':
            const createCustomerParams = CustomerParamsSchema.parse(args);
            const createCustomerResult = await this.booksCustomersTools.createCustomer(createCustomerParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createCustomerResult, null, 2)
                }
              ]
            };

          case 'books_update_customer':
            const { customer_id: updateCustomer_customer_id, ...updateCustomerData } = args || {};
            const updateCustomerParams = CustomerParamsSchema.partial().parse(updateCustomerData);
            const updateCustomerResult = await this.booksCustomersTools.updateCustomer(updateCustomer_customer_id as string, updateCustomerParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateCustomerResult, null, 2)
                }
              ]
            };

          case 'books_delete_customer':
            const deleteCustomerResult = await this.booksCustomersTools.deleteCustomer(args?.customer_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deleteCustomerResult, null, 2)
                }
              ]
            };

          // Books Items Management Tools
          case 'books_get_items':
            const getItemsParams = GetItemsParamsSchema.parse(args);
            const itemsResult = await this.booksItemsTools.getItems(getItemsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(itemsResult, null, 2)
                }
              ]
            };

          case 'books_get_item':
            const getItemResult = await this.booksItemsTools.getItem(args?.item_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getItemResult, null, 2)
                }
              ]
            };

          case 'books_create_item':
            const createItemParams = ItemParamsSchema.parse(args);
            const createItemResult = await this.booksItemsTools.createItem(createItemParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createItemResult, null, 2)
                }
              ]
            };

          case 'books_update_item':
            const { item_id, ...updateItemData } = args || {};
            const updateItemParams = ItemParamsSchema.partial().parse(updateItemData);
            const updateItemResult = await this.booksItemsTools.updateItem(item_id as string, updateItemParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateItemResult, null, 2)
                }
              ]
            };

          case 'books_delete_item':
            const deleteItemResult = await this.booksItemsTools.deleteItem(args?.item_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deleteItemResult, null, 2)
                }
              ]
            };

          // Books Estimates Management Tools
          case 'books_get_estimates':
            const getEstimatesParams = GetEstimatesParamsSchema.parse(args);
            const estimatesResult = await this.booksEstimatesTools.getEstimates(getEstimatesParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(estimatesResult, null, 2)
                }
              ]
            };

          case 'books_create_estimate':
            const createEstimateParams = EstimateParamsSchema.parse(args);
            const createEstimateResult = await this.booksEstimatesTools.createEstimate(createEstimateParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createEstimateResult, null, 2)
                }
              ]
            };

          case 'books_convert_estimate_to_invoice':
            const convertResult = await this.booksEstimatesTools.convertEstimateToInvoice(args?.estimate_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(convertResult, null, 2)
                }
              ]
            };

          // Books Payments Management Tools
          case 'books_get_payments':
            const getPaymentsParams = GetPaymentsParamsSchema.parse(args);
            const paymentsResult = await this.booksPaymentsTools.getPayments(getPaymentsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(paymentsResult, null, 2)
                }
              ]
            };

          case 'books_create_payment':
            const createPaymentParams = PaymentParamsSchema.parse(args);
            const createPaymentResult = await this.booksPaymentsTools.createPayment(createPaymentParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createPaymentResult, null, 2)
                }
              ]
            };

          // Books Invoices Management Tools
          case 'books_get_invoices':
            const getInvoicesParams = GetInvoicesParamsSchema.parse(args);
            const invoicesResult = await this.booksInvoicesTools.getInvoices(getInvoicesParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(invoicesResult, null, 2)
                }
              ]
            };

          case 'books_get_invoice':
            const getInvoiceResult = await this.booksInvoicesTools.getInvoice(args?.invoice_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getInvoiceResult, null, 2)
                }
              ]
            };

          case 'books_create_invoice':
            const createInvoiceParams = InvoiceParamsSchema.parse(args);
            const createInvoiceResult = await this.booksInvoicesTools.createInvoice(createInvoiceParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createInvoiceResult, null, 2)
                }
              ]
            };

          case 'books_update_invoice':
            const { invoice_id, ...updateInvoiceData } = args || {};
            const updateInvoiceParams = InvoiceParamsSchema.partial().parse(updateInvoiceData);
            const updateInvoiceResult = await this.booksInvoicesTools.updateInvoice(invoice_id as string, updateInvoiceParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateInvoiceResult, null, 2)
                }
              ]
            };

          case 'books_delete_invoice':
            const deleteInvoiceResult = await this.booksInvoicesTools.deleteInvoice(args?.invoice_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(deleteInvoiceResult, null, 2)
                }
              ]
            };

          case 'books_send_invoice_email':
            const { invoice_id: emailInvoiceId, to_mail_ids: invoice_to_mail_ids, subject: invoice_subject, body: invoice_body } = args || {};
            const sendInvoiceEmailResult = await this.booksInvoicesTools.sendInvoiceEmail(emailInvoiceId as string, {
              to_mail_ids: invoice_to_mail_ids as string[],
              subject: invoice_subject as string,
              body: invoice_body as string
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(sendInvoiceEmailResult, null, 2)
                }
              ]
            };

          case 'books_get_invoice_pdf':
            const getInvoicePdfResult = await this.booksInvoicesTools.getInvoicePDF(args?.invoice_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(getInvoicePdfResult, null, 2)
                }
              ]
            };

          // CRM Activities Tools
          case 'crm_get_tasks':
            const getTasksParams = GetTasksParamsSchema.parse(args);
            const tasksResult = await this.crmTasksTools.getTasks(getTasksParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasksResult, null, 2)
                }
              ]
            };

          case 'crm_create_task':
            const createTaskParams = TaskParamsSchema.parse(args);
            const createTaskResult = await this.crmTasksTools.createTask(createTaskParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createTaskResult, null, 2)
                }
              ]
            };

          case 'crm_get_events':
            const getEventsParams = GetEventsParamsSchema.parse(args);
            const eventsResult = await this.crmEventsTools.getEvents(getEventsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(eventsResult, null, 2)
                }
              ]
            };

          case 'crm_create_event':
            const createEventParams = EventParamsSchema.parse(args);
            const createEventResult = await this.crmEventsTools.createEvent(createEventParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createEventResult, null, 2)
                }
              ]
            };

          case 'crm_get_notes':
            const getNotesParams = GetNotesParamsSchema.parse(args);
            const notesResult = await this.crmNotesTools.getNotes(getNotesParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(notesResult, null, 2)
                }
              ]
            };

          case 'crm_create_note':
            const { module: noteModule, record_id: noteRecordId, ...noteData } = args || {};
            const createNoteParams = NoteParamsSchema.parse(noteData);
            const createNoteResult = await this.crmNotesTools.createNote(noteModule as string, noteRecordId as string, createNoteParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createNoteResult, null, 2)
                }
              ]
            };

          case 'crm_send_email':
            const sendEmailParams = EmailParamsSchema.parse(args);
            const sendEmailResult = await this.crmEmailTools.sendEmail(sendEmailParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(sendEmailResult, null, 2)
                }
              ]
            };

          case 'crm_get_attachments':
            const getAttachmentsParams = GetAttachmentsParamsSchema.parse(args);
            const attachmentsResult = await this.crmAttachmentsTools.getAttachments(getAttachmentsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(attachmentsResult, null, 2)
                }
              ]
            };
          case 'analyze_custom_module':
            const analyzeModuleParams = {
              module_name: args?.module_name as string,
              breakdown_field: args?.breakdown_field as string,
              numeric_field: args?.numeric_field as string,
              page: args?.page as number,
              per_page: args?.per_page as number,
              filter_field: args?.filter_field as string,
              filter_value: args?.filter_value as string,
              date_from: args?.date_from as string,
              date_to: args?.date_to as string
            };
            const moduleAnalysisResult = await this.genericModuleTools.analyzeCustomModule(analyzeModuleParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    module: args?.module_name,
                    breakdown_field: args?.breakdown_field,
                    analysis: moduleAnalysisResult
                  }, null, 2)
                }
              ]
            };
          case 'get_custom_module_records':
            const getModuleRecordsParams = {
              module_name: args?.module_name as string,
              filter_field: args?.filter_field as string,
              filter_value: args?.filter_value as string,
              page: args?.page as number,
              per_page: args?.per_page as number,
              fields: args?.fields as string[]
            };
            const moduleRecordsResult = await this.genericModuleTools.getCustomModuleRecords(getModuleRecordsParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    module: args?.module_name,
                    records: moduleRecordsResult,
                    count: moduleRecordsResult.length
                  }, null, 2)
                }
              ]
            };
          case 'analyze_module_field':
            const analyzeFieldParams = {
              module_name: args?.module_name as string,
              field_name: args?.field_name as string,
              analysis_type: args?.analysis_type as 'count' | 'sum' | 'avg' | 'min' | 'max',
              group_by_field: args?.group_by_field as string
            };
            const fieldAnalysisResult = await this.genericModuleTools.getFieldAnalysis(analyzeFieldParams);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    module: args?.module_name,
                    field: args?.field_name,
                    analysis_type: args?.analysis_type,
                    results: fieldAnalysisResult
                  }, null, 2)
                }
              ]
            };

          // CRM Metadata Tools
          case 'crm_get_all_modules':
            const allModulesResult = await this.metadataTools.getAllModules();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allModulesResult, null, 2)
                }
              ]
            };

          case 'crm_get_module_details':
            const moduleDetailsResult = await this.metadataTools.getModuleDetails(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(moduleDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_get_module_fields':
            const moduleFieldsResult = await this.metadataTools.getModuleFields(args as { 
              module_name: string; 
              page?: number; 
              per_page?: number; 
              field_type?: string; 
              search_term?: string; 
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(moduleFieldsResult, null, 2)
                }
              ]
            };

          case 'crm_get_picklist_fields':
            const picklistFieldsResult = await this.metadataTools.getPicklistFields(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(picklistFieldsResult, null, 2)
                }
              ]
            };

          case 'crm_search_fields':
            const searchFieldsResult = await this.metadataTools.searchFields(args as { module_name: string; search_term: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(searchFieldsResult, null, 2)
                }
              ]
            };

          case 'crm_get_field_details':
            const fieldDetailsResult = await this.metadataTools.getFieldDetails(args as { field_id: string; module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(fieldDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_get_layouts':
            const layoutsResult = await this.metadataTools.getLayouts(args as { module_name?: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(layoutsResult, null, 2)
                }
              ]
            };

          case 'crm_get_layout_details':
            const layoutDetailsResult = await this.metadataTools.getLayoutDetails(args as { layout_id: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(layoutDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_update_layout':
            const updateLayoutResult = await this.metadataTools.updateLayout(args as { layout_id: string; layout_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateLayoutResult, null, 2)
                }
              ]
            };

          case 'crm_get_all_profiles':
            const allProfilesResult = await this.metadataTools.getAllProfiles();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allProfilesResult, null, 2)
                }
              ]
            };

          case 'crm_create_profile':
            const createProfileResult = await this.metadataTools.createProfile(args as { profile_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createProfileResult, null, 2)
                }
              ]
            };

          case 'crm_update_profile':
            const updateProfileResult = await this.metadataTools.updateProfile(args as { profile_id: string; profile_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateProfileResult, null, 2)
                }
              ]
            };

          case 'crm_get_all_roles':
            const allRolesResult = await this.metadataTools.getAllRoles();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allRolesResult, null, 2)
                }
              ]
            };

          case 'crm_get_role_details':
            const roleDetailsResult = await this.metadataTools.getRoleDetails(args as { role_id: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(roleDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_create_role':
            const createRoleResult = await this.metadataTools.createRole(args as { role_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createRoleResult, null, 2)
                }
              ]
            };

          case 'crm_update_role':
            const updateRoleResult = await this.metadataTools.updateRole(args as { role_id: string; role_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updateRoleResult, null, 2)
                }
              ]
            };

          case 'crm_delete_role':
            const deleteRoleResult = await this.metadataTools.deleteRole(args as { role_id: string });
            return {
              content: [
                {
                  type: 'text',
                  text: 'Role deleted successfully'
                }
              ]
            };

          case 'crm_get_all_users':
            const allUsersResult = await this.metadataTools.getAllUsers(args as { type?: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allUsersResult, null, 2)
                }
              ]
            };

          case 'crm_get_user_details':
            const userDetailsResult = await this.metadataTools.getUserDetails(args as { user_id: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(userDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_create_user':
            const createUserResult = await this.metadataTools.createUser(args as { user_data: any });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(createUserResult, null, 2)
                }
              ]
            };

          case 'crm_get_organization_details':
            const organizationDetailsResult = await this.metadataTools.getOrganizationDetails();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(organizationDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_get_organization_features':
            const organizationFeaturesResult = await this.metadataTools.getOrganizationFeatures();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(organizationFeaturesResult, null, 2)
                }
              ]
            };

          case 'crm_get_custom_views':
            const customViewsResult = await this.metadataTools.getCustomViews(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(customViewsResult, null, 2)
                }
              ]
            };

          case 'crm_get_custom_view_details':
            const customViewDetailsResult = await this.metadataTools.getCustomViewDetails(args as { custom_view_id: string; module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(customViewDetailsResult, null, 2)
                }
              ]
            };

          case 'crm_get_related_lists':
            const relatedListsResult = await this.metadataTools.getRelatedLists(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(relatedListsResult, null, 2)
                }
              ]
            };

          case 'crm_get_all_territories':
            const allTerritoriesResult = await this.metadataTools.getAllTerritories();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allTerritoriesResult, null, 2)
                }
              ]
            };

          case 'crm_get_all_currencies':
            const allCurrenciesResult = await this.metadataTools.getAllCurrencies();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(allCurrenciesResult, null, 2)
                }
              ]
            };

          case 'crm_get_pipeline_metadata':
            const pipelineMetadataResult = await this.metadataTools.getPipelineMetadata();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(pipelineMetadataResult, null, 2)
                }
              ]
            };

          case 'crm_get_assignment_rules':
            const assignmentRulesResult = await this.metadataTools.getAssignmentRules();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(assignmentRulesResult, null, 2)
                }
              ]
            };

          case 'crm_get_blueprint_metadata':
            const blueprintMetadataResult = await this.metadataTools.getBlueprintMetadata();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(blueprintMetadataResult, null, 2)
                }
              ]
            };

          case 'crm_get_metadata_summary':
            const metadataSummaryResult = await this.metadataTools.getCRMMetadataSummary();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(metadataSummaryResult, null, 2)
                }
              ]
            };

          case 'crm_get_complete_module_configuration':
            const completeModuleConfigResult = await this.metadataTools.getCompleteModuleConfiguration(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(completeModuleConfigResult, null, 2)
                }
              ]
            };

          case 'crm_analyze_module_permissions':
            const modulePermissionsResult = await this.metadataTools.analyzeModulePermissions(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(modulePermissionsResult, null, 2)
                }
              ]
            };

          case 'crm_get_picklist_values':
            const picklistValuesResult = await this.metadataTools.getPicklistValues(args as { module_name: string; field_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(picklistValuesResult, null, 2)
                }
              ]
            };

          case 'crm_analyze_picklist_dependencies':
            const picklistDependenciesResult = await this.metadataTools.analyzePicklistDependencies(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(picklistDependenciesResult, null, 2)
                }
              ]
            };

          case 'crm_get_dependent_fields':
            const dependentFieldsResult = await this.metadataTools.getDependentFields(args as { module_name: string; field_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(dependentFieldsResult, null, 2)
                }
              ]
            };

          case 'crm_get_field_relationships':
            const fieldRelationshipsResult = await this.metadataTools.getFieldRelationships(args as { module_name: string });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(fieldRelationshipsResult, null, 2)
                }
              ]
            };

          case 'crm_get_global_fields':
            const globalFieldsResult = await this.metadataTools.getGlobalFields();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(globalFieldsResult, null, 2)
                }
              ]
            };

          // Configuration Management Tools
          case 'config_list_environments':
            const environmentsResult = await this.configTools.listEnvironments();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(environmentsResult, null, 2)
                }
              ]
            };

          case 'config_switch_environment':
            const switchEnvResult = await this.configTools.switchEnvironment(args?.environmentName as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(switchEnvResult, null, 2)
                }
              ]
            };

          case 'config_list_profiles':
            const profilesResult = await this.configTools.listProfiles();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(profilesResult, null, 2)
                }
              ]
            };

          case 'config_switch_profile':
            const switchProfileResult = await this.configTools.switchProfile(args?.profileName as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(switchProfileResult, null, 2)
                }
              ]
            };

          case 'config_add_profile':
            const addProfileResult = await this.configTools.addProfile(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(addProfileResult, null, 2)
                }
              ]
            };

          case 'config_remove_profile':
            const removeProfileResult = await this.configTools.removeProfile(args?.profileName as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(removeProfileResult, null, 2)
                }
              ]
            };

          case 'config_update_profile':
            const configUpdateProfileResult = await this.configTools.updateProfile(args?.profileName as string, args?.updates as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(configUpdateProfileResult, null, 2)
                }
              ]
            };

          case 'config_get_status':
            const statusResult = await this.configTools.getStatus();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(statusResult, null, 2)
                }
              ]
            };

          case 'config_export_to_env':
            const exportResult = await this.configTools.exportToEnv(args?.profileName as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(exportResult, null, 2)
                }
              ]
            };

          case 'config_add_environment':
            const addEnvResult = await this.configTools.addEnvironment(args?.name as string, args?.description as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(addEnvResult, null, 2)
                }
              ]
            };

          case 'config_remove_environment':
            const removeEnvResult = await this.configTools.removeEnvironment(args?.name as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(removeEnvResult, null, 2)
                }
              ]
            };

          case 'list_tools_by_category':
            const category = args?.category as string;
            const allTools = [
              // Data Synchronization
              { name: 'sync_accounts_to_customers', category: 'Data Synchronization', description: 'Sync CRM accounts to Books customers' },
              { name: 'sync_contacts_to_customers', category: 'Data Synchronization', description: 'Sync CRM contacts to Books customers' },
              { name: 'sync_customers_to_contacts', category: 'Data Synchronization', description: 'Sync Books customers to CRM contacts' },
              { name: 'create_invoice_from_deal', category: 'Data Synchronization', description: 'Create Books invoice from CRM deal' },
              
              // Data Discovery
              { name: 'search_records', category: 'Data Discovery', description: 'Search across CRM and Books records' },
              
              // Books - Customer Management
              { name: 'books_get_customers', category: 'Books - Customer Management', description: 'Get customer list from Books' },
              { name: 'books_get_customer', category: 'Books - Customer Management', description: 'Get specific customer details' },
              { name: 'books_create_customer', category: 'Books - Customer Management', description: 'Create new customer in Books' },
              { name: 'books_update_customer', category: 'Books - Customer Management', description: 'Update existing customer' },
              { name: 'books_delete_customer', category: 'Books - Customer Management', description: 'Delete customer from Books' },
              
              // Books - Inventory Management
              { name: 'books_get_items', category: 'Books - Inventory Management', description: 'Get all items from Books' },
              { name: 'books_get_item', category: 'Books - Inventory Management', description: 'Get specific item details' },
              { name: 'books_create_item', category: 'Books - Inventory Management', description: 'Create new item in Books' },
              { name: 'books_update_item', category: 'Books - Inventory Management', description: 'Update existing item' },
              { name: 'books_delete_item', category: 'Books - Inventory Management', description: 'Delete item from Books' },
              
              // Books - Estimate Management
              { name: 'books_get_estimates', category: 'Books - Estimate Management', description: 'Get all estimates from Books' },
              { name: 'books_create_estimate', category: 'Books - Estimate Management', description: 'Create new estimate in Books' },
              { name: 'books_convert_estimate_to_invoice', category: 'Books - Estimate Management', description: 'Convert estimate to invoice' },
              
              // Books - Payment Processing
              { name: 'books_get_payments', category: 'Books - Payment Processing', description: 'Get all payments from Books' },
              { name: 'books_create_payment', category: 'Books - Payment Processing', description: 'Create payment in Books' },
              
              // CRM - Activity Management
              { name: 'crm_get_tasks', category: 'CRM - Activity Management', description: 'Get all tasks from CRM' },
              { name: 'crm_create_task', category: 'CRM - Activity Management', description: 'Create new task in CRM' },
              { name: 'crm_get_notes', category: 'CRM - Activity Management', description: 'Get all notes from CRM' },
              { name: 'crm_create_note', category: 'CRM - Activity Management', description: 'Create new note in CRM' },
              { name: 'crm_send_email', category: 'CRM - Activity Management', description: 'Send email from CRM' },
              { name: 'crm_get_attachments', category: 'CRM - Activity Management', description: 'Get attachments from CRM' },
              
              // CRM - Calendar Management
              { name: 'crm_get_events', category: 'CRM - Calendar Management', description: 'Get all events from CRM' },
              { name: 'crm_create_event', category: 'CRM - Calendar Management', description: 'Create new event in CRM' },
              
              // CRM - Metadata & Analysis
              { name: 'analyze_custom_module', category: 'CRM - Metadata & Analysis', description: 'Analyze custom module data' },
              { name: 'get_custom_module_records', category: 'CRM - Metadata & Analysis', description: 'Get custom module records' },
              { name: 'analyze_module_field', category: 'CRM - Metadata & Analysis', description: 'Analyze module field data' },
              { name: 'crm_get_all_modules', category: 'CRM - Metadata & Analysis', description: 'Get all CRM modules' },
              { name: 'crm_get_module_details', category: 'CRM - Metadata & Analysis', description: 'Get module details' },
              { name: 'crm_get_module_fields', category: 'CRM - Metadata & Analysis', description: 'Get module fields' },
              { name: 'crm_get_field_details', category: 'CRM - Metadata & Analysis', description: 'Get field details' },
              { name: 'crm_get_layouts', category: 'CRM - Metadata & Analysis', description: 'Get CRM layouts' },
              { name: 'crm_get_layout_details', category: 'CRM - Metadata & Analysis', description: 'Get layout details' },
              { name: 'crm_update_layout', category: 'CRM - Metadata & Analysis', description: 'Update CRM layout' },
              { name: 'crm_get_all_profiles', category: 'CRM - Metadata & Analysis', description: 'Get all CRM profiles' },
              { name: 'crm_create_profile', category: 'CRM - Metadata & Analysis', description: 'Create new CRM profile' },
              { name: 'crm_update_profile', category: 'CRM - Metadata & Analysis', description: 'Update CRM profile' },
              { name: 'crm_get_all_roles', category: 'CRM - Metadata & Analysis', description: 'Get all CRM roles' },
              { name: 'crm_get_role_details', category: 'CRM - Metadata & Analysis', description: 'Get role details' },
              { name: 'crm_create_role', category: 'CRM - Metadata & Analysis', description: 'Create new CRM role' },
              { name: 'crm_update_role', category: 'CRM - Metadata & Analysis', description: 'Update CRM role' },
              { name: 'crm_delete_role', category: 'CRM - Metadata & Analysis', description: 'Delete CRM role' },
              { name: 'crm_get_all_users', category: 'CRM - Metadata & Analysis', description: 'Get all CRM users' },
              { name: 'crm_get_user_details', category: 'CRM - Metadata & Analysis', description: 'Get user details' },
              { name: 'crm_create_user', category: 'CRM - Metadata & Analysis', description: 'Create new CRM user' },
              { name: 'crm_get_organization_details', category: 'CRM - Metadata & Analysis', description: 'Get organization details' },
              { name: 'crm_get_organization_features', category: 'CRM - Metadata & Analysis', description: 'Get organization features' },
              { name: 'crm_get_custom_views', category: 'CRM - Metadata & Analysis', description: 'Get custom views' },
              { name: 'crm_get_custom_view_details', category: 'CRM - Metadata & Analysis', description: 'Get custom view details' },
              { name: 'crm_get_picklist_values', category: 'CRM - Metadata & Analysis', description: 'Get picklist values for a field' },
              { name: 'crm_analyze_picklist_dependencies', category: 'CRM - Metadata & Analysis', description: 'Analyze picklist dependencies in a module' },
              { name: 'crm_get_dependent_fields', category: 'CRM - Metadata & Analysis', description: 'Get fields that depend on a specific field' },
              { name: 'crm_get_field_relationships', category: 'CRM - Metadata & Analysis', description: 'Get all field relationships in a module' },
              { name: 'crm_get_global_fields', category: 'CRM - Metadata & Analysis', description: 'Get global fields across all modules' },
              
              // Configuration Management
              { name: 'config_get_profiles', category: 'Configuration Management', description: 'Get configuration profiles' },
              { name: 'config_get_profile', category: 'Configuration Management', description: 'Get specific profile' },
              { name: 'config_create_profile', category: 'Configuration Management', description: 'Create new profile' },
              { name: 'config_update_profile', category: 'Configuration Management', description: 'Update profile' },
              { name: 'config_get_status', category: 'Configuration Management', description: 'Get configuration status' },
              { name: 'config_export_to_env', category: 'Configuration Management', description: 'Export to environment' },
              { name: 'config_add_environment', category: 'Configuration Management', description: 'Add environment' },
              { name: 'config_remove_environment', category: 'Configuration Management', description: 'Remove environment' },
              
              // Tool Discovery
              { name: 'list_tools_by_category', category: 'Tool Discovery', description: 'List tools by category' },
              { name: 'list_available_categories', category: 'Tool Discovery', description: 'List available categories' }
            ];
            
            if (category) {
              const filteredTools = allTools.filter(tool => tool.category === category);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      category,
                      total_tools: filteredTools.length,
                      tools: filteredTools
                    }, null, 2)
                  }
                ]
              };
            } else {
              // Group tools by category
              const groupedTools = allTools.reduce((acc, tool) => {
                if (!acc[tool.category]) {
                  acc[tool.category] = [];
                }
                acc[tool.category].push(tool);
                return acc;
              }, {} as Record<string, any[]>);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      total_categories: Object.keys(groupedTools).length,
                      total_tools: allTools.length,
                      categories: groupedTools
                    }, null, 2)
                  }
                ]
              };
            }

          case 'list_available_categories':
            const categories = [
              'Data Synchronization',
              'Data Discovery',
              'Books - Customer Management',
              'Books - Inventory Management',
              'Books - Estimate Management',
              'Books - Payment Processing',
              'Books - Invoice Management',
              'Books - Credit Note Management',
              'Books - Purchase Order Management',
              'Books - Bill Management',
              'CRM - Activity Management',
              'CRM - Calendar Management',
              'CRM - Metadata & Analysis',
              'Configuration Management',
              'Tool Discovery'
            ];
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    total_categories: categories.length,
                    categories: categories.map(cat => ({
                      name: cat,
                      description: this.getCategoryDescription(cat)
                    }))
                  }, null, 2)
                }
              ]
            };

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        console.error(`Error calling tool ${name}:`, error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'zoho://crm/modules',
            name: 'CRM Modules',
            description: 'Available CRM modules and their configurations',
            mimeType: 'application/json'
          },
          {
            uri: 'zoho://books/organizations',
            name: 'Books Organizations',
            description: 'Available Books organizations',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'zoho://crm/modules':
            const modules = await this.crmClient.getModules();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(modules, null, 2)
                }
              ]
            };

          case 'zoho://books/organizations':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    message: 'Books organizations endpoint would return available organizations',
                    note: 'This requires additional API implementation'
                  }, null, 2)
                }
              ]
            };

          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }
      } catch (error: any) {
        console.error(`Error reading resource ${uri}:`, error);
        throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error.message}`);
      }
    });
  }

  async start(): Promise<void> {
    try {
      console.log(`Starting ${this.config.mcpServerName} v${this.config.mcpServerVersion}`);
      console.log(`Data Center: ${this.zohoConfig.dataCenter}`);
      console.log(`Environment: ${this.config.nodeEnv}`);
      
      // Start the server first, then test connections lazily
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.log('🚀 Zoho MCP Server is running and ready for requests');
      
      // Test connections in background (non-blocking)
      this.testConnections();
    } catch (error: any) {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }

  private async testConnections(): Promise<void> {
    try {
      // Test authentication
      await this.authManager.getValidAccessToken();
      console.log('✅ Zoho authentication successful');
      
      // Test CRM connection
      await this.crmClient.getModules();
      console.log('✅ CRM connection successful');
      
      // Test Books connection (if organization ID is provided)
      if (process.env.ZOHO_BOOKS_ORGANIZATION_ID) {
        await this.booksClient.getCustomers({ per_page: 1 });
        console.log('✅ Books connection successful');
      }
    } catch (error: any) {
      console.error('⚠️  Connection test failed:', error.message);
      console.error('⚠️  Some functionality may be limited');
    }
  }

  async stop(): Promise<void> {
    try {
      await this.server.close();
      console.log('✅ Server stopped gracefully');
    } catch (error: any) {
      console.error('❌ Error stopping server:', error.message);
    }
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'Data Synchronization': 'Tools for syncing data between CRM and Books modules',
      'Data Discovery': 'Tools for searching and discovering records across modules',
      'Books - Customer Management': 'Tools for managing customer records in Books',
      'Books - Inventory Management': 'Tools for managing products and services in Books',
      'Books - Estimate Management': 'Tools for creating and managing estimates in Books',
      'Books - Payment Processing': 'Tools for processing payments and managing payment records',
      'Books - Invoice Management': 'Tools for creating and managing invoices in Books',
      'Books - Credit Note Management': 'Tools for managing credit notes and refunds',
      'Books - Purchase Order Management': 'Tools for managing purchase orders and procurement',
      'Books - Bill Management': 'Tools for managing bills and vendor payments',
      'CRM - Activity Management': 'Tools for managing tasks, notes, and activities in CRM',
      'CRM - Calendar Management': 'Tools for managing events and calendar items in CRM',
      'CRM - Metadata & Analysis': 'Tools for analyzing CRM structure, fields, and metadata',
      'Configuration Management': 'Tools for managing multi-environment configurations',
      'Tool Discovery': 'Tools for discovering and exploring available functionality'
    };
    
    return descriptions[category] || 'No description available';
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
const server = new ZohoMCPServer();
server.start().catch(console.error);
