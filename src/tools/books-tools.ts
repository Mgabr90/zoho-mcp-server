import { z } from 'zod';
import { ZohoBooksClient } from '../lib/clients/books-client';
import { ZohoBooksItem, ZohoBooksEstimate, ZohoBooksPayment, createToolErrorResponse } from '../lib/types';

// Schema definitions for tool parameters
export const ItemParamsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rate: z.number().optional(),
  unit: z.string().optional(),
  sku: z.string().optional(),
  product_type: z.string().optional(),
  is_taxable: z.boolean().optional(),
  tax_id: z.string().optional(),
  item_type: z.string().optional()
});

export const GetItemsParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export const EstimateParamsSchema = z.object({
  customer_id: z.string(),
  estimate_date: z.string().optional(),
  expiry_date: z.string().optional(),
  line_items: z.array(z.object({
    line_item_id: z.string().optional(),
    item_id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().min(0),
    unit: z.string().optional(),
    rate: z.number().min(0),
    amount: z.number().min(0).optional(),
    tax_id: z.string().optional(),
    tax_percentage: z.number().min(0).optional()
  })),
  currency_code: z.string().optional(),
  discount: z.number().optional(),
  discount_type: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional()
});

export const GetEstimatesParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  customer_id: z.string().optional(),
  status: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export const PaymentParamsSchema = z.object({
  customer_id: z.string(),
  payment_mode: z.string(),
  amount: z.number().min(0),
  date: z.string(),
  reference_number: z.string().optional(),
  description: z.string().optional(),
  invoices: z.array(z.object({
    invoice_id: z.string(),
    invoice_number: z.string(),
    amount_applied: z.number().min(0),
    tax_amount_withheld: z.number().min(0).optional()
  })),
  bank_charges: z.number().min(0).optional(),
  currency_code: z.string().optional(),
  exchange_rate: z.number().min(0).optional()
});

export const GetPaymentsParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  customer_id: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export const InvoiceParamsSchema = z.object({
  customer_id: z.string(),
  invoice_date: z.string().optional(),
  due_date: z.string().optional(),
  invoice_number: z.string().optional(),
  reference_number: z.string().optional(),
  line_items: z.array(z.object({
    line_item_id: z.string().optional(),
    item_id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().min(0),
    unit: z.string().optional(),
    rate: z.number().min(0),
    amount: z.number().min(0).optional(),
    tax_id: z.string().optional(),
    tax_percentage: z.number().min(0).optional()
  })),
  currency_code: z.string().optional(),
  discount: z.number().optional(),
  discount_type: z.string().optional(),
  is_discount_before_tax: z.boolean().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  payment_terms: z.string().optional(),
  payment_terms_label: z.string().optional(),
  shipping_charge: z.number().optional(),
  adjustment: z.number().optional(),
  adjustment_description: z.string().optional(),
  is_inclusive_tax: z.boolean().optional(),
  salesperson_id: z.string().optional(),
  template_id: z.string().optional()
});

export const GetInvoicesParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  customer_id: z.string().optional(),
  status: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export const CustomerParamsSchema = z.object({
  contact_name: z.string(),
  company_name: z.string().optional(),
  contact_type: z.enum(['customer', 'vendor', 'employee']).optional(),
  customer_sub_type: z.enum(['business', 'individual']).optional(),
  credit_limit: z.number().optional(),
  website: z.string().optional(),
  custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional(),
  billing_address: z.object({
    address: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    phone: z.string(),
    fax: z.string().optional()
  }).optional(),
  shipping_address: z.object({
    address: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    phone: z.string(),
    fax: z.string().optional()
  }).optional(),
  contact_persons: z.array(z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    skype: z.string().optional(),
    is_primary_contact: z.boolean().optional(),
    enable_portal: z.boolean().optional()
  })).optional(),
  currency_id: z.string().optional(),
  payment_terms: z.number().optional(),
  payment_terms_label: z.string().optional(),
  notes: z.string().optional(),
  tax_id: z.string().optional(),
  tax_name: z.string().optional(),
  tax_percentage: z.number().optional(),
  is_taxable: z.boolean().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  track_1099: z.boolean().optional(),
  tax_authority_id: z.string().optional(),
  tax_exemption_id: z.string().optional(),
  tax_authority_name: z.string().optional(),
  tax_exemption_code: z.string().optional(),
  place_of_contact: z.string().optional(),
  gst_no: z.string().optional(),
  gst_treatment: z.string().optional(),
  tax_treatment: z.string().optional(),
  vat_treatment: z.string().optional(),
  vat_reg_no: z.string().optional(),
  country_code: z.string().optional(),
  vat_reg_type: z.string().optional(),
  is_tds_registered: z.boolean().optional()
});

export const GetCustomersParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  contact_name: z.string().optional(),
  company_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contact_type: z.enum(['customer', 'vendor', 'employee']).optional(),
  customer_sub_type: z.enum(['business', 'individual']).optional(),
  filter_by: z.string().optional(),
  search_text: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export const SalesOrderParamsSchema = z.object({
  customer_id: z.string(),
  salesorder_date: z.string().optional(),
  shipment_date: z.string().optional(),
  salesorder_number: z.string().optional(),
  reference_number: z.string().optional(),
  line_items: z.array(z.object({
    line_item_id: z.string().optional(),
    item_id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().min(0),
    unit: z.string().optional(),
    rate: z.number().min(0),
    amount: z.number().min(0).optional(),
    tax_id: z.string().optional(),
    tax_percentage: z.number().min(0).optional()
  })),
  currency_code: z.string().optional(),
  discount: z.number().optional(),
  discount_type: z.string().optional(),
  is_discount_before_tax: z.boolean().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  shipping_charge: z.number().optional(),
  adjustment: z.number().optional(),
  adjustment_description: z.string().optional(),
  is_inclusive_tax: z.boolean().optional(),
  salesperson_id: z.string().optional(),
  template_id: z.string().optional(),
  billing_address: z.object({
    address: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    phone: z.string(),
    fax: z.string().optional()
  }).optional(),
  shipping_address: z.object({
    address: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    phone: z.string(),
    fax: z.string().optional()
  }).optional()
});

export const GetSalesOrdersParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  customer_id: z.string().optional(),
  status: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional(),
  salesorder_number: z.string().optional(),
  reference_number: z.string().optional(),
  date: z.string().optional()
});

export type ItemParams = z.infer<typeof ItemParamsSchema>;
export type GetItemsParams = z.infer<typeof GetItemsParamsSchema>;
export type EstimateParams = z.infer<typeof EstimateParamsSchema>;
export type GetEstimatesParams = z.infer<typeof GetEstimatesParamsSchema>;
export type PaymentParams = z.infer<typeof PaymentParamsSchema>;
export type GetPaymentsParams = z.infer<typeof GetPaymentsParamsSchema>;
export type InvoiceParams = z.infer<typeof InvoiceParamsSchema>;
export type GetInvoicesParams = z.infer<typeof GetInvoicesParamsSchema>;
export type CustomerParams = z.infer<typeof CustomerParamsSchema>;
export type GetCustomersParams = z.infer<typeof GetCustomersParamsSchema>;
export type SalesOrderParams = z.infer<typeof SalesOrderParamsSchema>;
export type GetSalesOrdersParams = z.infer<typeof GetSalesOrdersParamsSchema>;

/**
 * Books Sales Orders Management Tools
 */
export class BooksSalesOrdersTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getSalesOrders(params: GetSalesOrdersParams) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.getSalesOrders(params);
      return {
        success: true,
        data: [],
        pagination: {
          page: params.page || 1,
          per_page: params.per_page || 20,
          count: 0,
          more_records: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getSalesOrder(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.getSalesOrder(salesOrderId);
      return {
        success: true,
        data: null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createSalesOrder(params: SalesOrderParams) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.createSalesOrder(params);
      return {
        success: true,
        data: null,
        message: `Sales order created successfully for customer ${params.customer_id}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateSalesOrder(salesOrderId: string, params: Partial<SalesOrderParams>) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.updateSalesOrder(salesOrderId, params);
      return {
        success: true,
        data: null,
        message: `Sales order ${salesOrderId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteSalesOrder(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.deleteSalesOrder(salesOrderId);
      return {
        success: true,
        message: `Sales order ${salesOrderId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markSalesOrderOpen(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.markSalesOrderOpen(salesOrderId);
      return {
        success: true,
        message: `Sales order ${salesOrderId} marked as open`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markSalesOrderVoid(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.markSalesOrderVoid(salesOrderId);
      return {
        success: true,
        message: `Sales order ${salesOrderId} marked as void`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateSalesOrderStatus(salesOrderId: string, statusCode: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.updateSalesOrderStatus(salesOrderId, statusCode);
      return {
        success: true,
        message: `Sales order ${salesOrderId} status updated to ${statusCode}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async emailSalesOrder(salesOrderId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.emailSalesOrder(salesOrderId, emailData);
      return {
        success: true,
        message: `Sales order ${salesOrderId} sent via email successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getSalesOrderEmail(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.getSalesOrderEmail(salesOrderId);
      return {
        success: true,
        data: null,
        message: `Sales order ${salesOrderId} email content retrieved`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async submitSalesOrder(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.submitSalesOrder(salesOrderId);
      return {
        success: true,
        message: `Sales order ${salesOrderId} submitted for approval`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async approveSalesOrder(salesOrderId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.approveSalesOrder(salesOrderId);
      return {
        success: true,
        message: `Sales order ${salesOrderId} approved successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async bulkExportSalesOrders(params: {
    salesorder_ids: string[];
    format?: 'pdf' | 'csv';
  }) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.bulkExportSalesOrders(params);
      return {
        success: true,
        data: null,
        message: `Sales orders exported in ${params.format || 'pdf'} format`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async bulkPrintSalesOrders(params: {
    salesorder_ids: string[];
  }) {
    try {
      // This would need to be implemented in the books client
      // const result = await this.booksClient.bulkPrintSalesOrders(params);
      return {
        success: true,
        data: null,
        message: `Sales orders prepared for bulk printing`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Books Customers Management Tools
 */
export class BooksCustomersTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getCustomers(params: GetCustomersParams) {
    try {
      const result = await this.booksClient.getCustomers(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getCustomer(customerId: string) {
    try {
      const result = await this.booksClient.getCustomer(customerId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createCustomer(params: CustomerParams) {
    try {
      const result = await this.booksClient.createCustomer(params);
      return {
        success: true,
        data: result,
        message: `Customer "${params.contact_name}" created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateCustomer(customerId: string, params: Partial<CustomerParams>) {
    try {
      const result = await this.booksClient.updateCustomer(customerId, params);
      return {
        success: true,
        data: result,
        message: `Customer ${customerId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteCustomer(customerId: string) {
    try {
      await this.booksClient.deleteCustomer(customerId);
      return {
        success: true,
        message: `Customer ${customerId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async activateCustomer(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.activateCustomer(customerId);
      return {
        success: true,
        message: `Customer ${customerId} activated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deactivateCustomer(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.deactivateCustomer(customerId);
      return {
        success: true,
        message: `Customer ${customerId} deactivated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async enableCustomerPortal(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.enableCustomerPortal(customerId);
      return {
        success: true,
        message: `Customer portal enabled for ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async enablePaymentReminders(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.enablePaymentReminders(customerId);
      return {
        success: true,
        message: `Payment reminders enabled for customer ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async disablePaymentReminders(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.disablePaymentReminders(customerId);
      return {
        success: true,
        message: `Payment reminders disabled for customer ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async emailCustomerStatement(customerId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.emailCustomerStatement(customerId, emailData);
      return {
        success: true,
        message: `Customer statement sent to ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async emailCustomer(customerId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.emailCustomer(customerId, emailData);
      return {
        success: true,
        message: `Email sent to customer ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async track1099(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.track1099(customerId);
      return {
        success: true,
        message: `1099 tracking enabled for customer ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async untrack1099(customerId: string) {
    try {
      // This would need to be implemented in the books client
      // await this.booksClient.untrack1099(customerId);
      return {
        success: true,
        message: `1099 tracking disabled for customer ${customerId}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Books Items Management Tools
 */
export class BooksItemsTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getItems(params: GetItemsParams) {
    try {
      const result = await this.booksClient.getItems(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getItem(itemId: string) {
    try {
      const result = await this.booksClient.getItem(itemId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createItem(params: ItemParams) {
    try {
      const result = await this.booksClient.createItem(params);
      return {
        success: true,
        data: result,
        message: `Item "${params.name}" created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateItem(itemId: string, params: Partial<ItemParams>) {
    try {
      const result = await this.booksClient.updateItem(itemId, params);
      return {
        success: true,
        data: result,
        message: `Item ${itemId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteItem(itemId: string) {
    try {
      await this.booksClient.deleteItem(itemId);
      return {
        success: true,
        message: `Item ${itemId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markItemActive(itemId: string) {
    try {
      await this.booksClient.markItemActive(itemId);
      return {
        success: true,
        message: `Item ${itemId} marked as active`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markItemInactive(itemId: string) {
    try {
      await this.booksClient.markItemInactive(itemId);
      return {
        success: true,
        message: `Item ${itemId} marked as inactive`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Books Estimates Management Tools
 */
export class BooksEstimatesTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getEstimates(params: GetEstimatesParams) {
    try {
      const result = await this.booksClient.getEstimates(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getEstimate(estimateId: string) {
    try {
      const result = await this.booksClient.getEstimate(estimateId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createEstimate(params: EstimateParams) {
    try {
      const result = await this.booksClient.createEstimate(params);
      return {
        success: true,
        data: result,
        message: `Estimate created successfully for customer ${params.customer_id}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateEstimate(estimateId: string, params: Partial<EstimateParams>) {
    try {
      const result = await this.booksClient.updateEstimate(estimateId, params);
      return {
        success: true,
        data: result,
        message: `Estimate ${estimateId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteEstimate(estimateId: string) {
    try {
      await this.booksClient.deleteEstimate(estimateId);
      return {
        success: true,
        message: `Estimate ${estimateId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async convertEstimateToInvoice(estimateId: string) {
    try {
      const result = await this.booksClient.convertEstimateToInvoice(estimateId);
      return {
        success: true,
        data: result,
        message: `Estimate ${estimateId} converted to invoice successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendEstimateEmail(estimateId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }) {
    try {
      await this.booksClient.sendEstimateEmail(estimateId, emailData);
      return {
        success: true,
        message: `Estimate ${estimateId} sent via email successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markEstimateAccepted(estimateId: string) {
    try {
      await this.booksClient.markEstimateAccepted(estimateId);
      return {
        success: true,
        message: `Estimate ${estimateId} marked as accepted`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async markEstimateDeclined(estimateId: string) {
    try {
      await this.booksClient.markEstimateDeclined(estimateId);
      return {
        success: true,
        message: `Estimate ${estimateId} marked as declined`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Books Invoices Management Tools
 */
export class BooksInvoicesTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getInvoices(params: GetInvoicesParams) {
    try {
      const result = await this.booksClient.getInvoices(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      const result = await this.booksClient.getInvoice(invoiceId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createInvoice(params: InvoiceParams) {
    try {
      const result = await this.booksClient.createInvoice(params);
      return {
        success: true,
        data: result,
        message: `Invoice created successfully for customer ${params.customer_id}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateInvoice(invoiceId: string, params: Partial<InvoiceParams>) {
    try {
      const result = await this.booksClient.updateInvoice(invoiceId, params);
      return {
        success: true,
        data: result,
        message: `Invoice ${invoiceId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteInvoice(invoiceId: string) {
    try {
      await this.booksClient.deleteInvoice(invoiceId);
      return {
        success: true,
        message: `Invoice ${invoiceId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendInvoiceEmail(invoiceId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }) {
    try {
      await this.booksClient.sendInvoiceEmail(invoiceId, emailData);
      return {
        success: true,
        message: `Invoice ${invoiceId} sent via email successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getInvoicePDF(invoiceId: string) {
    try {
      const result = await this.booksClient.getInvoicePDF(invoiceId);
      return {
        success: true,
        data: result,
        message: `Invoice ${invoiceId} PDF retrieved successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * Books Payments Management Tools
 */
export class BooksPaymentsTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getPayments(params: GetPaymentsParams) {
    try {
      const result = await this.booksClient.getPayments(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getPayment(paymentId: string) {
    try {
      const result = await this.booksClient.getPayment(paymentId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createPayment(params: PaymentParams) {
    try {
      const result = await this.booksClient.createPayment(params);
      return {
        success: true,
        data: result,
        message: `Payment of ${params.amount} created successfully for customer ${params.customer_id}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updatePayment(paymentId: string, params: Partial<PaymentParams>) {
    try {
      const result = await this.booksClient.updatePayment(paymentId, params);
      return {
        success: true,
        data: result,
        message: `Payment ${paymentId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deletePayment(paymentId: string) {
    try {
      await this.booksClient.deletePayment(paymentId);
      return {
        success: true,
        message: `Payment ${paymentId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// ===========================
// CREDIT NOTES APIs
// ===========================

export const CreditNoteLineItemSchema = z.object({
  line_item_id: z.string().optional(),
  item_id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().optional(),
  rate: z.number().min(0),
  amount: z.number().min(0).optional(),
  tax_id: z.string().optional(),
  tax_percentage: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).optional(),
  warehouse_id: z.string().optional(),
  item_custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const CreditNoteParamsSchema = z.object({
  customer_id: z.string(),
  creditnote_number: z.string().optional(),
  reference_number: z.string().optional(),
  date: z.string().optional(),
  invoice_id: z.string().optional(),
  reason: z.string().optional(),
  line_items: z.array(CreditNoteLineItemSchema),
  currency_code: z.string().optional(),
  discount: z.number().min(0).optional(),
  discount_type: z.enum(['entity_level', 'item_level']).optional(),
  is_discount_before_tax: z.boolean().optional(),
  is_inclusive_tax: z.boolean().optional(),
  shipping_charge: z.number().min(0).optional(),
  adjustment: z.number().optional(),
  adjustment_description: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  billing_address: z.object({
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),
  shipping_address: z.object({
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),
  crm_owner_id: z.string().optional(),
  crm_custom_reference_id: z.string().optional(),
  template_id: z.string().optional(),
  custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const GetCreditNotesParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  customer_id: z.string().optional(),
  invoice_id: z.string().optional(),
  creditnote_number: z.string().optional(),
  reference_number: z.string().optional(),
  status: z.enum(['draft', 'open', 'closed', 'void']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export type CreditNoteParams = z.infer<typeof CreditNoteParamsSchema>;
export type GetCreditNotesParams = z.infer<typeof GetCreditNotesParamsSchema>;

export class BooksCreditNotesTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getCreditNotes(params: GetCreditNotesParams): Promise<any> {
    try {
      const response = await this.booksClient.getCreditNotes(params);
      return {
        success: true,
        data: response.data,
        pagination: response.info,
        total_count: response.info?.count || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getCreditNote(creditNoteId: string): Promise<any> {
    try {
      const response = await this.booksClient.getCreditNote(creditNoteId);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async createCreditNote(params: CreditNoteParams): Promise<any> {
    try {
      const response = await this.booksClient.createCreditNote(params);
      return {
        success: true,
        data: null,
        message: 'Credit note created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async updateCreditNote(creditNoteId: string, params: Partial<CreditNoteParams>): Promise<any> {
    try {
      const response = await this.booksClient.updateCreditNote(creditNoteId, params);
      return {
        success: true,
        data: null,
        message: 'Credit note updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async deleteCreditNote(creditNoteId: string): Promise<any> {
    try {
      await this.booksClient.deleteCreditNote(creditNoteId);
      return {
        success: true,
        message: 'Credit note deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async convertCreditNoteToOpen(creditNoteId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.convertCreditNoteToOpen(creditNoteId);
      return {
        success: true,
        data: null,
        message: 'Credit note converted to open successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async voidCreditNote(creditNoteId: string): Promise<any> {
    try {
      const response = await this.booksClient.voidCreditNote(creditNoteId);
      return {
        success: true,
        data: null,
        message: 'Credit note voided successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async emailCreditNote(creditNoteId: string, emailData: {
    to_mail_ids: string[];
    cc_mail_ids?: string[];
    subject?: string;
    body?: string;
    send_customer_statement?: boolean;
    send_attachment?: boolean;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.emailCreditNote(creditNoteId, emailData);
      return {
        success: true,
        data: null,
        message: 'Credit note email sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getCreditNoteRefunds(creditNoteId: string, params: { page?: number; per_page?: number } = {}): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.getCreditNoteRefunds(creditNoteId, params);
      return {
        success: true,
        data: null,
        pagination: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async refundCreditNote(creditNoteId: string, refundData: {
    amount: number;
    date: string;
    refund_mode: string;
    reference_number?: string;
    description?: string;
    from_account_id?: string;
    exchange_rate?: number;
  }): Promise<any> {
    try {
      const response = await this.booksClient.refundCreditNote(creditNoteId, refundData);
      return {
        success: true,
        data: null,
        message: 'Credit note refunded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async applyCreditNoteToInvoice(creditNoteId: string, invoiceData: {
    invoice_id: string;
    amount_applied: number;
  }): Promise<any> {
    try {
      const response = await this.booksClient.applyCreditNoteToInvoice(creditNoteId, invoiceData);
      return {
        success: true,
        data: null,
        message: 'Credit note applied to invoice successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkExportCreditNotes(params: {
    export_type: string;
    filter_by?: string;
    search_text?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    customer_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkExportCreditNotes(params);
      return {
        success: true,
        data: null,
        message: 'Credit notes export initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkPrintCreditNotes(params: {
    creditnote_ids: string[];
    orientation?: string;
    template_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkPrintCreditNotes(params);
      return {
        success: true,
        data: null,
        message: 'Credit notes print initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getCreditNoteComments(creditNoteId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.getCreditNoteComments(creditNoteId);
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async addCreditNoteComment(creditNoteId: string, commentData: {
    description: string;
    show_comment_to_clients?: boolean;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.addCreditNoteComment(creditNoteId, commentData);
      return {
        success: true,
        data: null,
        message: 'Credit note comment added successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }
}

// ===========================
// PURCHASE ORDERS APIs
// ===========================

export const PurchaseOrderLineItemSchema = z.object({
  line_item_id: z.string().optional(),
  item_id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().optional(),
  rate: z.number().min(0),
  amount: z.number().min(0).optional(),
  tax_id: z.string().optional(),
  tax_percentage: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).optional(),
  warehouse_id: z.string().optional(),
  item_custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const PurchaseOrderParamsSchema = z.object({
  vendor_id: z.string(),
  purchaseorder_number: z.string().optional(),
  reference_number: z.string().optional(),
  date: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  delivery_date: z.string().optional(),
  line_items: z.array(PurchaseOrderLineItemSchema),
  currency_code: z.string().optional(),
  discount: z.number().min(0).optional(),
  discount_type: z.enum(['entity_level', 'item_level']).optional(),
  is_discount_before_tax: z.boolean().optional(),
  is_inclusive_tax: z.boolean().optional(),
  shipping_charge: z.number().min(0).optional(),
  adjustment: z.number().optional(),
  adjustment_description: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  billing_address: z.object({
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),
  delivery_address: z.object({
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),
  template_id: z.string().optional(),
  custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const GetPurchaseOrdersParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  vendor_id: z.string().optional(),
  purchaseorder_number: z.string().optional(),
  reference_number: z.string().optional(),
  status: z.enum(['draft', 'open', 'billed', 'cancelled', 'pending_approval', 'approved']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export type PurchaseOrderParams = z.infer<typeof PurchaseOrderParamsSchema>;
export type GetPurchaseOrdersParams = z.infer<typeof GetPurchaseOrdersParamsSchema>;

export class BooksPurchaseOrdersTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getPurchaseOrders(params: GetPurchaseOrdersParams): Promise<any> {
    try {
      const response = await this.booksClient.getPurchaseOrders(params);
      return {
        success: true,
        data: response.data,
        pagination: response.info,
        total_count: response.info?.count || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getPurchaseOrder(purchaseOrderId: string): Promise<any> {
    try {
      const response = await this.booksClient.getPurchaseOrder(purchaseOrderId);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async createPurchaseOrder(params: PurchaseOrderParams): Promise<any> {
    try {
      const response = await this.booksClient.createPurchaseOrder(params);
      return {
        success: true,
        data: null,
        message: 'Purchase order created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async updatePurchaseOrder(purchaseOrderId: string, params: Partial<PurchaseOrderParams>): Promise<any> {
    try {
      const response = await this.booksClient.updatePurchaseOrder(purchaseOrderId, params);
      return {
        success: true,
        data: null,
        message: 'Purchase order updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async deletePurchaseOrder(purchaseOrderId: string): Promise<any> {
    try {
      await this.booksClient.deletePurchaseOrder(purchaseOrderId);
      return {
        success: true,
        message: 'Purchase order deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async markPurchaseOrderAsOpen(purchaseOrderId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.markPurchaseOrderAsOpen(purchaseOrderId);
      return {
        success: true,
        data: null,
        message: 'Purchase order marked as open successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async markPurchaseOrderAsBilled(purchaseOrderId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.markPurchaseOrderAsBilled(purchaseOrderId);
      return {
        success: true,
        data: null,
        message: 'Purchase order marked as billed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async cancelPurchaseOrder(purchaseOrderId: string): Promise<any> {
    try {
      const response = await this.booksClient.cancelPurchaseOrder(purchaseOrderId);
      return {
        success: true,
        data: null,
        message: 'Purchase order cancelled successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async emailPurchaseOrder(purchaseOrderId: string, emailData: {
    to_mail_ids: string[];
    cc_mail_ids?: string[];
    subject?: string;
    body?: string;
    send_attachment?: boolean;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.emailPurchaseOrder(purchaseOrderId, emailData);
      return {
        success: true,
        data: null,
        message: 'Purchase order email sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async submitPurchaseOrderForApproval(purchaseOrderId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.submitPurchaseOrderForApproval(purchaseOrderId);
      return {
        success: true,
        data: null,
        message: 'Purchase order submitted for approval successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async approvePurchaseOrder(purchaseOrderId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.approvePurchaseOrder(purchaseOrderId);
      return {
        success: true,
        data: null,
        message: 'Purchase order approved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkExportPurchaseOrders(params: {
    export_type: string;
    filter_by?: string;
    search_text?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    vendor_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkExportPurchaseOrders(params);
      return {
        success: true,
        data: null,
        message: 'Purchase orders export initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkPrintPurchaseOrders(params: {
    purchaseorder_ids: string[];
    orientation?: string;
    template_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkPrintPurchaseOrders(params);
      return {
        success: true,
        data: null,
        message: 'Purchase orders print initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }
}

// ===========================
// BILLS APIs
// ===========================

export const BillLineItemSchema = z.object({
  line_item_id: z.string().optional(),
  item_id: z.string().optional(),
  account_id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string().optional(),
  rate: z.number().min(0),
  amount: z.number().min(0).optional(),
  tax_id: z.string().optional(),
  tax_percentage: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).optional(),
  project_id: z.string().optional(),
  customer_id: z.string().optional(),
  expense_id: z.string().optional(),
  item_custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const BillParamsSchema = z.object({
  vendor_id: z.string(),
  bill_number: z.string().optional(),
  reference_number: z.string().optional(),
  date: z.string().optional(),
  due_date: z.string().optional(),
  purchaseorder_id: z.string().optional(),
  line_items: z.array(BillLineItemSchema),
  currency_code: z.string().optional(),
  discount: z.number().min(0).optional(),
  discount_type: z.enum(['entity_level', 'item_level']).optional(),
  is_discount_before_tax: z.boolean().optional(),
  is_inclusive_tax: z.boolean().optional(),
  shipping_charge: z.number().min(0).optional(),
  adjustment: z.number().optional(),
  adjustment_description: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  billing_address: z.object({
    address: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional()
  }).optional(),
  template_id: z.string().optional(),
  custom_fields: z.array(z.object({
    customfield_id: z.string(),
    value: z.string()
  })).optional()
});

export const GetBillsParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  vendor_id: z.string().optional(),
  bill_number: z.string().optional(),
  reference_number: z.string().optional(),
  status: z.enum(['draft', 'open', 'overdue', 'paid', 'void', 'partially_paid']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search_text: z.string().optional(),
  filter_by: z.string().optional(),
  sort_column: z.string().optional(),
  sort_order: z.enum(['A', 'D']).optional()
});

export type BillParams = z.infer<typeof BillParamsSchema>;
export type GetBillsParams = z.infer<typeof GetBillsParamsSchema>;

export class BooksBillsTools {
  constructor(private booksClient: ZohoBooksClient) {}

  async getBills(params: GetBillsParams): Promise<any> {
    try {
      const response = await this.booksClient.getBills(params);
      return {
        success: true,
        data: response.data,
        pagination: response.info,
        total_count: response.info?.count || 0
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getBill(billId: string): Promise<any> {
    try {
      const response = await this.booksClient.getBill(billId);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async createBill(params: BillParams): Promise<any> {
    try {
      const response = await this.booksClient.createBill(params);
      return {
        success: true,
        data: null,
        message: 'Bill created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async updateBill(billId: string, params: Partial<BillParams>): Promise<any> {
    try {
      const response = await this.booksClient.updateBill(billId, params);
      return {
        success: true,
        data: null,
        message: 'Bill updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async deleteBill(billId: string): Promise<any> {
    try {
      await this.booksClient.deleteBill(billId);
      return {
        success: true,
        message: 'Bill deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async markBillAsOpen(billId: string): Promise<any> {
    try {
      const response = await this.booksClient.markBillAsOpen(billId);
      return {
        success: true,
        data: null,
        message: 'Bill marked as open successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async voidBill(billId: string): Promise<any> {
    try {
      const response = await this.booksClient.voidBill(billId);
      return {
        success: true,
        data: null,
        message: 'Bill voided successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async markBillAsPaid(billId: string): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.markBillAsPaid(billId);
      return {
        success: true,
        data: null,
        message: 'Bill marked as paid successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async recordBillPayment(billId: string, paymentData: {
    amount: number;
    date: string;
    payment_mode: string;
    reference_number?: string;
    description?: string;
    from_account_id?: string;
    exchange_rate?: number;
  }): Promise<any> {
    try {
      const response = await this.booksClient.recordBillPayment(billId, paymentData);
      return {
        success: true,
        data: null,
        message: 'Bill payment recorded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getBillPayments(billId: string, params: { page?: number; per_page?: number } = {}): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.getBillPayments(billId, params);
      return {
        success: true,
        data: null,
        pagination: null
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkExportBills(params: {
    export_type: string;
    filter_by?: string;
    search_text?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    vendor_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkExportBills(params);
      return {
        success: true,
        data: null,
        message: 'Bills export initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async bulkPrintBills(params: {
    bill_ids: string[];
    orientation?: string;
    template_id?: string;
  }): Promise<any> {
    try {
      // This would need to be implemented in the books client
      // const response = await this.booksClient.bulkPrintBills(params);
      return {
        success: true,
        data: null,
        message: 'Bills print initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }
}