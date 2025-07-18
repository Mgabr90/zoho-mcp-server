import { z } from 'zod';

// Zoho Common Types
export interface ZohoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface ZohoApiResponse<T = any> {
  data: T;
  info?: {
    page: number;
    per_page: number;
    count: number;
    more_records: boolean;
    next_page_token?: string;
    previous_page_token?: string;
    page_token_expiry?: string;
  };
  message?: string;
  status?: string;
}

// Zoho CRM Types
export interface ZohoCRMRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoCRMModule {
  api_name: string;
  module_name: string;
  plural_label: string;
  singular_label: string;
  supported_operations: string[];
  creatable?: boolean;
  deletable?: boolean;
  editable?: boolean;
  viewable?: boolean;
  global_search_supported?: boolean;
  convertable?: boolean;
  generated_type?: string;
  visibility?: number;
  profiles?: ZohoCRMProfile[];
  sequence_number?: number;
}

export interface ZohoCRMField {
  api_name: string;
  display_label: string;
  data_type: string;
  required: boolean;
  read_only: boolean;
  field_read_only: boolean;
  id?: string;
  custom_field?: boolean;
  decimal_place?: number;
  mass_update?: boolean;
  color_code_enabled?: boolean;
  pick_list_values?: ZohoCRMPickListValue[];
  formula?: any;
  lookup?: any;
  global_picklist?: {
    id: string;
    name: string;
    display_label: string;
  };
  section_id?: string;
  sequence_number?: number;
}

export interface ZohoCRMPickListValue {
  id: string;
  display_value: string;
  actual_value: string;
  type: string;
  color_code?: string;
  sequence_number?: number;
}

export interface ZohoCRMProfile {
  id: string;
  name: string;
  category?: boolean;
  description?: string;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
  permissions?: ZohoCRMPermission[];
}

export interface ZohoCRMPermission {
  id: string;
  name: string;
  display_label: string;
  module: string;
  enabled: boolean;
}

export interface ZohoCRMRole {
  id: string;
  name: string;
  display_label: string;
  description?: string;
  admin_user?: boolean;
  share_with_peers?: boolean;
  forecast_manager?: ZohoCRMUser;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
  reporting_to?: ZohoCRMRole;
}

export interface ZohoCRMLayout {
  id: string;
  name: string;
  display_label: string;
  api_name: string;
  module: string;
  visible: boolean;
  sections?: ZohoCRMLayoutSection[];
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMLayoutSection {
  id: string;
  name: string;
  display_label: string;
  api_name: string;
  column_count: number;
  sequence_number: number;
  fields?: ZohoCRMField[];
}

export interface ZohoCRMCustomView {
  id: string;
  name: string;
  display_value: string;
  system_name: string;
  system_defined: boolean;
  default: boolean;
  shared_type: string;
  category: string;
  criteria?: any;
  fields?: string[];
  sort_by?: string;
  sort_order?: string;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMRelatedList {
  id: string;
  sequence_number: number;
  display_label: string;
  api_name: string;
  module: string;
  name: string;
  action: string;
  href: string;
  type: string;
  connectedmodule?: string;
  linkingmodule?: string;
}

export interface ZohoCRMOrganization {
  id: string;
  company_name: string;
  alias: string;
  primary_email: string;
  website: string;
  mobile: string;
  phone: string;
  fax: string;
  employee_count: string;
  time_zone: string;
  iso_code: string;
  currency_locale: string;
  currency_symbol: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  mc_status: boolean;
  gapps_enabled: boolean;
  domain_name: string;
  translation_enabled: boolean;
  privacy_settings: boolean;
  hipaa_compliance_enabled: boolean;
  locking_system: string;
  logo: string;
  icon: string;
  privacy_policy: string;
  terms_of_service: string;
  created_time: string;
  modified_time: string;
  created_by: ZohoCRMUser;
  modified_by: ZohoCRMUser;
}

export interface ZohoCRMTerritory {
  id: string;
  name: string;
  description?: string;
  manager?: ZohoCRMUser;
  account_rule?: any;
  deal_rule?: any;
  lead_rule?: any;
  contact_rule?: any;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMCurrency {
  id: string;
  iso_code: string;
  symbol: string;
  name: string;
  exchange_rate: number;
  is_active: boolean;
  is_base: boolean;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMPipeline {
  id: string;
  display_value: string;
  default: boolean;
  maps?: ZohoCRMPipelineMap[];
  child_available?: boolean;
  parent?: ZohoCRMPipeline;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMPipelineMap {
  id: string;
  display_value: string;
  forecast_category: string;
  forecast_type: string;
  actual_value: string;
  type: string;
  stage_sequence: number;
  probability: number;
}

export interface ZohoCRMAssignmentRule {
  id: string;
  name: string;
  description?: string;
  module: string;
  default_assignee?: ZohoCRMUser;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMBlueprint {
  id: string;
  name: string;
  module: string;
  process_id: string;
  created_time?: string;
  modified_time?: string;
  created_by?: ZohoCRMUser;
  modified_by?: ZohoCRMUser;
}

export interface ZohoCRMTask {
  id: string;
  Subject: string;
  Status: string;
  Priority: string;
  Due_Date: string;
  What_Id: string;
  Who_Id: string;
  Description: string;
  Closed_Time: string;
  Created_Time: string;
  Modified_Time: string;
  Owner: ZohoCRMUser;
  Related_To: string;
  Remind_At: string;
  Recurring_Activity: string;
}

export interface ZohoCRMEvent {
  id: string;
  Subject: string;
  Start_DateTime: string;
  End_DateTime: string;
  Description: string;
  Location: string;
  What_Id: string;
  Who_Id: string;
  Event_Title: string;
  All_day: boolean;
  Owner: ZohoCRMUser;
  Created_Time: string;
  Modified_Time: string;
  Participants: string[];
  Remind_At: string;
  Recurring_Activity: string;
}

export interface ZohoCRMNote {
  id: string;
  Note_Title: string;
  Note_Content: string;
  Parent_Id: string;
  Owner: ZohoCRMUser;
  Created_Time: string;
  Modified_Time: string;
  Attachments: ZohoCRMAttachment[];
  Size: number;
  Editable: boolean;
}

export interface ZohoCRMAttachment {
  id: string;
  File_Name: string;
  Size: number;
  Parent_Id: string;
  Created_Time: string;
  Modified_Time: string;
  Owner: ZohoCRMUser;
  Link_Url: string;
}

export interface ZohoCRMUser {
  id: string;
  name: string;
  email: string;
  full_name: string;
}

export interface ZohoCRMEmail {
  id: string;
  from: ZohoCRMEmailAddress;
  to: ZohoCRMEmailAddress[];
  cc: ZohoCRMEmailAddress[];
  bcc: ZohoCRMEmailAddress[];
  subject: string;
  content: string;
  mail_format: string;
  date_time: string;
  attachment: boolean;
  thread_id: string;
  message_id: string;
  status: string;
}

export interface ZohoCRMEmailAddress {
  user_name: string;
  email: string;
}

// Zoho Books Types
export interface ZohoBooksCustomer {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  company_name: string;
  phone: string;
  mobile: string;
  website: string;
  billing_address: ZohoBooksAddress;
  shipping_address: ZohoBooksAddress;
  status: string;
  created_time: string;
  last_modified_time: string;
}

export interface ZohoBooksAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface ZohoBooksInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  invoice_date: string;
  due_date: string;
  sub_total: number;
  tax_total: number;
  total: number;
  balance: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

export interface ZohoBooksLineItem {
  line_item_id?: string;
  item_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount?: number;
  tax_id?: string;
  tax_percentage?: number;
}

export interface ZohoBooksItem {
  item_id: string;
  name: string;
  description: string;
  rate: number;
  unit: string;
  sku: string;
  product_type: string;
  is_taxable: boolean;
  tax_id: string;
  tax_name: string;
  tax_percentage: number;
  purchase_account_id: string;
  account_id: string;
  inventory_account_id: string;
  purchase_description: string;
  purchase_rate: number;
  item_type: string;
  status: string;
  source: string;
  is_combo_product: boolean;
  brand: string;
  manufacturer: string;
  category_id: string;
  category_name: string;
  cf_cost_price: number;
  available_stock: number;
  actual_available_stock: number;
  committed_stock: number;
  actual_committed_stock: number;
  stock_on_hand: number;
  actual_stock_on_hand: number;
  created_time: string;
  last_modified_time: string;
}

export interface ZohoBooksEstimate {
  estimate_id: string;
  estimate_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  estimate_date: string;
  expiry_date: string;
  sub_total: number;
  tax_total: number;
  total: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

export interface ZohoBooksPayment {
  payment_id: string;
  payment_number: string;
  customer_id: string;
  customer_name: string;
  payment_mode: string;
  amount: number;
  bank_charges: number;
  date: string;
  reference_number: string;
  description: string;
  invoices: ZohoBooksPaymentInvoice[];
  currency_code: string;
  exchange_rate: number;
  status: string;
  created_time: string;
  last_modified_time: string;
}

export interface ZohoBooksPaymentInvoice {
  invoice_id: string;
  invoice_number: string;
  amount_applied: number;
  tax_amount_withheld?: number;
}

// Credit Notes Types
export interface ZohoBooksCreditNote {
  creditnote_id: string;
  creditnote_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  reference_number: string;
  date: string;
  invoice_id?: string;
  invoice_number?: string;
  reason?: string;
  sub_total: number;
  tax_total: number;
  total: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

// Sales Orders Types
export interface ZohoBooksSalesOrder {
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  status: string;
  reference_number: string;
  date: string;
  shipment_date: string;
  delivery_date: string;
  sub_total: number;
  tax_total: number;
  total: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

// Purchase Orders Types
export interface ZohoBooksPurchaseOrder {
  purchaseorder_id: string;
  purchaseorder_number: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  reference_number: string;
  date: string;
  expected_delivery_date: string;
  delivery_date: string;
  sub_total: number;
  tax_total: number;
  total: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

// Bills Types
export interface ZohoBooksBill {
  bill_id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  reference_number: string;
  date: string;
  due_date: string;
  purchaseorder_id?: string;
  purchaseorder_number?: string;
  sub_total: number;
  tax_total: number;
  total: number;
  balance: number;
  currency_code: string;
  line_items: ZohoBooksLineItem[];
  created_time: string;
  last_modified_time: string;
}

// Vendors Types
export interface ZohoBooksVendor {
  vendor_id: string;
  vendor_name: string;
  email: string;
  phone: string;
  website: string;
  billing_address: ZohoBooksAddress;
  status: string;
  created_time: string;
  last_modified_time: string;
}

// MCP Tool Parameters
export const SyncParamsSchema = z.object({
  source_module: z.enum(['accounts', 'contacts', 'deals', 'leads', 'customers']),
  target_module: z.enum(['customers', 'contacts', 'invoices', 'estimates']),
  filters: z.object({
    date_range: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional(),
    limit: z.number().min(1).max(200).optional(),
    page: z.number().min(1).optional()
  }).optional()
});

export const CreateInvoiceParamsSchema = z.object({
  deal_id: z.string(),
  customer_id: z.string().optional(),
  invoice_date: z.string().datetime().optional(),
  due_date: z.string().datetime().optional(),
  include_line_items: z.boolean().default(true),
  send_email: z.boolean().default(false)
});

export const SearchParamsSchema = z.object({
  module: z.string(), // Allow any module name, not just predefined ones
  criteria: z.string(),
  fields: z.array(z.string()).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20)
});

export type SyncParams = z.infer<typeof SyncParamsSchema>;
export type CreateInvoiceParams = z.infer<typeof CreateInvoiceParamsSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Rate Limiting Types
export interface RateLimitConfig {
  requests: number;
  window: number;
  identifier: string;
}

export interface RateLimitStatus {
  remaining: number;
  reset: number;
  limit: number;
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Error Types
export class ZohoAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ZohoAPIError';
  }
}

export class RateLimitError extends ZohoAPIError {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ZohoAPIError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Enhanced response formatting utility
export function createToolSuccessResponse(data: any, operation: string, suggestions?: string[]): {
  success: true;
  data: any;
  operation: string;
  suggestions?: string[];
} {
  return {
    success: true,
    data,
    operation,
    suggestions
  };
}

// Enhanced error handling utility
export function createToolErrorResponse(error: unknown, operation: string, context?: Record<string, any>): {
  success: false;
  error: string;
  next_steps?: string[];
} {
  if (error instanceof AuthenticationError) {
    return {
      success: false,
      error: `Authentication failed for ${operation}. Please check your Zoho credentials and tokens.`,
      next_steps: [
        'Verify ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET are set',
        'Check if access tokens need to be refreshed',
        'Ensure proper API permissions are granted'
      ]
    };
  }
  
  if (error instanceof RateLimitError) {
    return {
      success: false,
      error: `Rate limit exceeded for ${operation}. Please wait before retrying.`,
      next_steps: [
        'Wait for the rate limit to reset',
        'Reduce the frequency of API calls',
        'Use pagination to process smaller batches'
      ]
    };
  }
  
  if (error instanceof ZohoAPIError) {
    const message = error.message;
    const statusCode = error.statusCode;
    
    // Handle specific API errors with guidance
    if (statusCode === 404) {
      return {
        success: false,
        error: `Resource not found for ${operation}: ${message}`,
        next_steps: [
          'Check if the ID exists and is valid',
          'Verify you have access to this resource',
          'Use list/search tools to find valid IDs'
        ]
      };
    }
    
    if (statusCode === 400) {
      return {
        success: false,
        error: `Invalid request for ${operation}: ${message}`,
        next_steps: [
          'Check required fields are provided',
          'Verify field formats and values',
          'Review parameter documentation'
        ]
      };
    }
    
    if (statusCode === 403) {
      return {
        success: false,
        error: `Access denied for ${operation}: ${message}`,
        next_steps: [
          'Check API permissions for your Zoho user',
          'Verify organization access rights',
          'Contact administrator for access'
        ]
      };
    }
    
    return {
      success: false,
      error: `API error for ${operation}: ${message} (Status: ${statusCode})`,
      next_steps: [
        'Check the API documentation for this operation',
        'Verify all parameters are correct',
        'Try again with valid data'
      ]
    };
  }
  
  // Handle validation errors
  if (error instanceof Error && error.message.includes('validation')) {
    return {
      success: false,
      error: `Validation error for ${operation}: ${error.message}`,
      next_steps: [
        'Check required fields are provided',
        'Verify field formats match requirements',
        'Review the tool documentation for examples'
      ]
    };
  }
  
  // Generic error handling
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  return {
    success: false,
    error: `Failed to ${operation}: ${errorMessage}`,
    next_steps: [
      'Check your internet connection',
      'Verify Zoho service is available',
      'Try the operation again'
    ]
  };
}

// Pagination Configuration Types
export interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
  enableAutoPagination: boolean;
  rateLimitDelay: number;
  maxRetries: number;
  usePageTokens: boolean;
  maxRecordsPerBatch: number;
}

export interface PaginationOptions {
  page?: number;
  per_page?: number;
  page_token?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  fields?: string[];
  auto_paginate?: boolean;
  max_records?: number;
}

export interface PaginationResult<T = any> {
  data: T[];
  totalRecords: number;
  hasMore: boolean;
  nextPageToken?: string;
  currentPage: number;
  totalPages?: number;
}

// Configuration Types
export interface ServerConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  rateLimitRequests: number;
  rateLimitWindow: number;
  cacheTtl: number;
  mcpServerName: string;
  mcpServerVersion: string;
  pagination: PaginationConfig;
  // Multi-configuration settings
  multiConfig: {
    enabled: boolean;
    currentEnvironment: string;
    configPath?: string;
    autoSwitch?: boolean;
  };
}

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  dataCenter: string;
  scopes: string[];
  organizationId?: string; // Added for Books support
}

// New types for multi-configuration support
export interface ZohoConfigProfile {
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  dataCenter: string;
  scopes: string[];
  organizationId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MultiConfigEnvironment {
  name: string;
  description?: string;
  activeProfile: string;
  profiles: Record<string, ZohoConfigProfile>;
  defaultProfile?: string;
}

export interface ConfigurationManager {
  currentEnvironment: string;
  environments: Record<string, MultiConfigEnvironment>;
  getActiveConfig(): ZohoConfig;
  switchEnvironment(environmentName: string): void;
  switchProfile(profileName: string): void;
  addProfile(profile: ZohoConfigProfile): void;
  removeProfile(profileName: string): void;
  updateProfile(profileName: string, profile: Partial<ZohoConfigProfile>): void;
  listProfiles(): ZohoConfigProfile[];
  listEnvironments(): string[];
}
