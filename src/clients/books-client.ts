import axios, { AxiosInstance } from 'axios';
import { ZohoAuthManager } from '../auth/oauth-manager';
import { 
  ZohoApiResponse, 
  ZohoBooksCustomer, 
  ZohoBooksInvoice,
  ZohoBooksItem,
  ZohoBooksEstimate,
  ZohoBooksPayment,
  ZohoBooksCreditNote,
  ZohoBooksSalesOrder,
  ZohoBooksPurchaseOrder,
  ZohoBooksBill,
  ZohoBooksVendor,
  ZohoAPIError,
  RateLimitError 
} from '../types';

export class ZohoBooksClient {
  private axiosInstance: AxiosInstance;
  private authManager: ZohoAuthManager;
  private dataCenter: string;
  private organizationId: string;

  constructor(
    authManager: ZohoAuthManager, 
    dataCenter: string, 
    organizationId: string
  ) {
    this.authManager = authManager;
    this.dataCenter = dataCenter;
    this.organizationId = organizationId;
    
    this.axiosInstance = axios.create({
      baseURL: `https://www.zohoapis.${dataCenter}/books/v3`,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token and organization
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.authManager.getValidAccessToken();
        config.headers.Authorization = `Zoho-oauthtoken ${token}`;
        
        // Add organization_id to all requests
        if (config.params) {
          config.params.organization_id = this.organizationId;
        } else {
          config.params = { organization_id: this.organizationId };
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refreshing
          await this.authManager.refreshAccessToken();
          return this.axiosInstance.request(error.config);
        }
        
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          throw new RateLimitError('Rate limit exceeded', retryAfter);
        }
        
        // Enhance error message for organization ID issues
        if (error.response?.data?.message?.includes('CompanyID/CompanyName')) {
          throw new ZohoAPIError(
            `Organization ID validation failed: ${error.response.data.message}. Please verify your organization ID in the profile configuration.`,
            error.response.status || 400,
            error.response.data
          );
        }
        
        throw new ZohoAPIError(
          error.response?.data?.message || error.message,
          error.response?.status || 500,
          error.response?.data
        );
      }
    );
  }

  /**
   * Get all customers
   */
  async getCustomers(options: {
    page?: number;
    per_page?: number;
    sort_column?: string;
    sort_order?: 'A' | 'D';
  } = {}): Promise<ZohoApiResponse<ZohoBooksCustomer[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      
      const response = await this.axiosInstance.get(`/contacts?${params}`);
      return {
        data: response.data.contacts || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get customers');
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomer(customerId: string): Promise<ZohoBooksCustomer> {
    try {
      const response = await this.axiosInstance.get(`/contacts/${customerId}`);
      return response.data.contact;
    } catch (error) {
      throw this.handleError(error, `Failed to get customer ${customerId}`);
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: Partial<ZohoBooksCustomer>): Promise<ZohoBooksCustomer> {
    try {
      const response = await this.axiosInstance.post('/contacts', customerData);
      return response.data.contact;
    } catch (error) {
      throw this.handleError(error, 'Failed to create customer');
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(
    customerId: string, 
    customerData: Partial<ZohoBooksCustomer>
  ): Promise<ZohoBooksCustomer> {
    try {
      const response = await this.axiosInstance.put(`/contacts/${customerId}`, customerData);
      return response.data.contact;
    } catch (error) {
      throw this.handleError(error, `Failed to update customer ${customerId}`);
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/contacts/${customerId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete customer ${customerId}`);
    }
  }

  /**
   * Get all invoices
   */
  async getInvoices(options: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
  } = {}): Promise<ZohoApiResponse<ZohoBooksInvoice[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.customer_id) params.append('customer_id', options.customer_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      
      const response = await this.axiosInstance.get(`/invoices?${params}`);
      return {
        data: response.data.invoices || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get invoices');
    }
  }

  /**
   * Get a specific invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.axiosInstance.get(`/invoices/${invoiceId}`);
      return response.data.invoice;
    } catch (error) {
      throw this.handleError(error, `Failed to get invoice ${invoiceId}`);
    }
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: Partial<ZohoBooksInvoice>): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.axiosInstance.post('/invoices', invoiceData);
      return response.data.invoice;
    } catch (error) {
      throw this.handleError(error, 'Failed to create invoice');
    }
  }

  /**
   * Update an existing invoice
   */
  async updateInvoice(
    invoiceId: string, 
    invoiceData: Partial<ZohoBooksInvoice>
  ): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.axiosInstance.put(`/invoices/${invoiceId}`, invoiceData);
      return response.data.invoice;
    } catch (error) {
      throw this.handleError(error, `Failed to update invoice ${invoiceId}`);
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/invoices/${invoiceId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete invoice ${invoiceId}`);
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/invoices/${invoiceId}/email`, emailData);
    } catch (error) {
      throw this.handleError(error, `Failed to send invoice email for ${invoiceId}`);
    }
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      const response = await this.axiosInstance.get(`/invoices/${invoiceId}`, {
        headers: { 'Accept': 'application/pdf' },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw this.handleError(error, `Failed to get PDF for invoice ${invoiceId}`);
    }
  }

  // ========== ITEMS MANAGEMENT ==========

  /**
   * Get all items
   */
  async getItems(options: {
    page?: number;
    per_page?: number;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksItem[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/items?${params}`);
      return {
        data: response.data.items || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get items');
    }
  }

  /**
   * Get a specific item by ID
   */
  async getItem(itemId: string): Promise<ZohoBooksItem> {
    try {
      const response = await this.axiosInstance.get(`/items/${itemId}`);
      return response.data.item;
    } catch (error) {
      throw this.handleError(error, `Failed to get item ${itemId}`);
    }
  }

  /**
   * Create a new item
   */
  async createItem(itemData: Partial<ZohoBooksItem>): Promise<ZohoBooksItem> {
    try {
      const response = await this.axiosInstance.post('/items', itemData);
      return response.data.item;
    } catch (error) {
      throw this.handleError(error, 'Failed to create item');
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, itemData: Partial<ZohoBooksItem>): Promise<ZohoBooksItem> {
    try {
      const response = await this.axiosInstance.put(`/items/${itemId}`, itemData);
      return response.data.item;
    } catch (error) {
      throw this.handleError(error, `Failed to update item ${itemId}`);
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/items/${itemId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete item ${itemId}`);
    }
  }

  /**
   * Mark item as active
   */
  async markItemActive(itemId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/items/${itemId}/active`);
    } catch (error) {
      throw this.handleError(error, `Failed to mark item ${itemId} as active`);
    }
  }

  /**
   * Mark item as inactive
   */
  async markItemInactive(itemId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/items/${itemId}/inactive`);
    } catch (error) {
      throw this.handleError(error, `Failed to mark item ${itemId} as inactive`);
    }
  }

  // ========== ESTIMATES MANAGEMENT ==========

  /**
   * Get all estimates
   */
  async getEstimates(options: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksEstimate[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.customer_id) params.append('customer_id', options.customer_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/estimates?${params}`);
      return {
        data: response.data.estimates || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get estimates');
    }
  }

  /**
   * Get a specific estimate by ID
   */
  async getEstimate(estimateId: string): Promise<ZohoBooksEstimate> {
    try {
      const response = await this.axiosInstance.get(`/estimates/${estimateId}`);
      return response.data.estimate;
    } catch (error) {
      throw this.handleError(error, `Failed to get estimate ${estimateId}`);
    }
  }

  /**
   * Create a new estimate
   */
  async createEstimate(estimateData: Partial<ZohoBooksEstimate>): Promise<ZohoBooksEstimate> {
    try {
      const response = await this.axiosInstance.post('/estimates', estimateData);
      return response.data.estimate;
    } catch (error) {
      throw this.handleError(error, 'Failed to create estimate');
    }
  }

  /**
   * Update an existing estimate
   */
  async updateEstimate(estimateId: string, estimateData: Partial<ZohoBooksEstimate>): Promise<ZohoBooksEstimate> {
    try {
      const response = await this.axiosInstance.put(`/estimates/${estimateId}`, estimateData);
      return response.data.estimate;
    } catch (error) {
      throw this.handleError(error, `Failed to update estimate ${estimateId}`);
    }
  }

  /**
   * Delete an estimate
   */
  async deleteEstimate(estimateId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/estimates/${estimateId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete estimate ${estimateId}`);
    }
  }

  /**
   * Convert estimate to invoice
   */
  async convertEstimateToInvoice(estimateId: string): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.axiosInstance.post(`/estimates/${estimateId}/convertinvoice`);
      return response.data.invoice;
    } catch (error) {
      throw this.handleError(error, `Failed to convert estimate ${estimateId} to invoice`);
    }
  }

  /**
   * Send estimate email
   */
  async sendEstimateEmail(estimateId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/estimates/${estimateId}/email`, emailData);
    } catch (error) {
      throw this.handleError(error, `Failed to send estimate email for ${estimateId}`);
    }
  }

  /**
   * Mark estimate as accepted
   */
  async markEstimateAccepted(estimateId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/estimates/${estimateId}/status/accepted`);
    } catch (error) {
      throw this.handleError(error, `Failed to mark estimate ${estimateId} as accepted`);
    }
  }

  /**
   * Mark estimate as declined
   */
  async markEstimateDeclined(estimateId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/estimates/${estimateId}/status/declined`);
    } catch (error) {
      throw this.handleError(error, `Failed to mark estimate ${estimateId} as declined`);
    }
  }

  // ========== PAYMENTS MANAGEMENT ==========

  /**
   * Get all payments
   */
  async getPayments(options: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksPayment[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.customer_id) params.append('customer_id', options.customer_id);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/customerpayments?${params}`);
      return {
        data: response.data.customerpayments || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get payments');
    }
  }

  /**
   * Get a specific payment by ID
   */
  async getPayment(paymentId: string): Promise<ZohoBooksPayment> {
    try {
      const response = await this.axiosInstance.get(`/customerpayments/${paymentId}`);
      return response.data.customerpayment;
    } catch (error) {
      throw this.handleError(error, `Failed to get payment ${paymentId}`);
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(paymentData: Partial<ZohoBooksPayment>): Promise<ZohoBooksPayment> {
    try {
      const response = await this.axiosInstance.post('/customerpayments', paymentData);
      return response.data.customerpayment;
    } catch (error) {
      throw this.handleError(error, 'Failed to create payment');
    }
  }

  /**
   * Update an existing payment
   */
  async updatePayment(paymentId: string, paymentData: Partial<ZohoBooksPayment>): Promise<ZohoBooksPayment> {
    try {
      const response = await this.axiosInstance.put(`/customerpayments/${paymentId}`, paymentData);
      return response.data.customerpayment;
    } catch (error) {
      throw this.handleError(error, `Failed to update payment ${paymentId}`);
    }
  }

  /**
   * Delete a payment
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/customerpayments/${paymentId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete payment ${paymentId}`);
    }
  }

  // ========== CREDIT NOTES MANAGEMENT ==========

  /**
   * Get all credit notes
   */
  async getCreditNotes(options: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksCreditNote[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.customer_id) params.append('customer_id', options.customer_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/creditnotes?${params}`);
      return {
        data: response.data.creditnotes || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get credit notes');
    }
  }

  /**
   * Get a specific credit note by ID
   */
  async getCreditNote(creditNoteId: string): Promise<ZohoBooksCreditNote> {
    try {
      const response = await this.axiosInstance.get(`/creditnotes/${creditNoteId}`);
      return response.data.creditnote;
    } catch (error) {
      throw this.handleError(error, `Failed to get credit note ${creditNoteId}`);
    }
  }

  /**
   * Create a new credit note
   */
  async createCreditNote(creditNoteData: Partial<ZohoBooksCreditNote>): Promise<ZohoBooksCreditNote> {
    try {
      const response = await this.axiosInstance.post('/creditnotes', creditNoteData);
      return response.data.creditnote;
    } catch (error) {
      throw this.handleError(error, 'Failed to create credit note');
    }
  }

  /**
   * Update an existing credit note
   */
  async updateCreditNote(creditNoteId: string, creditNoteData: Partial<ZohoBooksCreditNote>): Promise<ZohoBooksCreditNote> {
    try {
      const response = await this.axiosInstance.put(`/creditnotes/${creditNoteId}`, creditNoteData);
      return response.data.creditnote;
    } catch (error) {
      throw this.handleError(error, `Failed to update credit note ${creditNoteId}`);
    }
  }

  /**
   * Delete a credit note
   */
  async deleteCreditNote(creditNoteId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/creditnotes/${creditNoteId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete credit note ${creditNoteId}`);
    }
  }

  /**
   * Void a credit note
   */
  async voidCreditNote(creditNoteId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/creditnotes/${creditNoteId}/status/void`);
    } catch (error) {
      throw this.handleError(error, `Failed to void credit note ${creditNoteId}`);
    }
  }

  /**
   * Send credit note email
   */
  async sendCreditNoteEmail(creditNoteId: string, emailData: {
    to_mail_ids: string[];
    subject?: string;
    body?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/creditnotes/${creditNoteId}/email`, emailData);
    } catch (error) {
      throw this.handleError(error, `Failed to send credit note email for ${creditNoteId}`);
    }
  }

  /**
   * Apply credit note to invoice
   */
  async applyCreditNoteToInvoice(creditNoteId: string, invoiceData: {
    invoice_id: string;
    amount_applied: number;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/creditnotes/${creditNoteId}/invoices`, invoiceData);
    } catch (error) {
      throw this.handleError(error, `Failed to apply credit note ${creditNoteId} to invoice`);
    }
  }

  /**
   * Refund credit note
   */
  async refundCreditNote(creditNoteId: string, refundData: {
    amount: number;
    description?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/creditnotes/${creditNoteId}/refunds`, refundData);
    } catch (error) {
      throw this.handleError(error, `Failed to refund credit note ${creditNoteId}`);
    }
  }

  // ========== SALES ORDERS MANAGEMENT ==========

  /**
   * Get all sales orders
   */
  async getSalesOrders(options: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksSalesOrder[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.customer_id) params.append('customer_id', options.customer_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/salesorders?${params}`);
      return {
        data: response.data.salesorders || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get sales orders');
    }
  }

  /**
   * Get a specific sales order by ID
   */
  async getSalesOrder(salesOrderId: string): Promise<ZohoBooksSalesOrder> {
    try {
      const response = await this.axiosInstance.get(`/salesorders/${salesOrderId}`);
      return response.data.salesorder;
    } catch (error) {
      throw this.handleError(error, `Failed to get sales order ${salesOrderId}`);
    }
  }

  /**
   * Create a new sales order
   */
  async createSalesOrder(salesOrderData: Partial<ZohoBooksSalesOrder>): Promise<ZohoBooksSalesOrder> {
    try {
      const response = await this.axiosInstance.post('/salesorders', salesOrderData);
      return response.data.salesorder;
    } catch (error) {
      throw this.handleError(error, 'Failed to create sales order');
    }
  }

  /**
   * Update an existing sales order
   */
  async updateSalesOrder(salesOrderId: string, salesOrderData: Partial<ZohoBooksSalesOrder>): Promise<ZohoBooksSalesOrder> {
    try {
      const response = await this.axiosInstance.put(`/salesorders/${salesOrderId}`, salesOrderData);
      return response.data.salesorder;
    } catch (error) {
      throw this.handleError(error, `Failed to update sales order ${salesOrderId}`);
    }
  }

  /**
   * Delete a sales order
   */
  async deleteSalesOrder(salesOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/salesorders/${salesOrderId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete sales order ${salesOrderId}`);
    }
  }

  /**
   * Convert sales order to invoice
   */
  async convertSalesOrderToInvoice(salesOrderId: string): Promise<ZohoBooksInvoice> {
    try {
      const response = await this.axiosInstance.post(`/salesorders/${salesOrderId}/convertinvoice`);
      return response.data.invoice;
    } catch (error) {
      throw this.handleError(error, `Failed to convert sales order ${salesOrderId} to invoice`);
    }
  }

  /**
   * Mark sales order as confirmed
   */
  async confirmSalesOrder(salesOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/salesorders/${salesOrderId}/status/confirmed`);
    } catch (error) {
      throw this.handleError(error, `Failed to confirm sales order ${salesOrderId}`);
    }
  }

  /**
   * Mark sales order as void
   */
  async voidSalesOrder(salesOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/salesorders/${salesOrderId}/status/void`);
    } catch (error) {
      throw this.handleError(error, `Failed to void sales order ${salesOrderId}`);
    }
  }

  // ========== PURCHASE ORDERS MANAGEMENT ==========

  /**
   * Get all purchase orders
   */
  async getPurchaseOrders(options: {
    page?: number;
    per_page?: number;
    vendor_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksPurchaseOrder[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.vendor_id) params.append('vendor_id', options.vendor_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/purchaseorders?${params}`);
      return {
        data: response.data.purchaseorders || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get purchase orders');
    }
  }

  /**
   * Get a specific purchase order by ID
   */
  async getPurchaseOrder(purchaseOrderId: string): Promise<ZohoBooksPurchaseOrder> {
    try {
      const response = await this.axiosInstance.get(`/purchaseorders/${purchaseOrderId}`);
      return response.data.purchaseorder;
    } catch (error) {
      throw this.handleError(error, `Failed to get purchase order ${purchaseOrderId}`);
    }
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(purchaseOrderData: Partial<ZohoBooksPurchaseOrder>): Promise<ZohoBooksPurchaseOrder> {
    try {
      const response = await this.axiosInstance.post('/purchaseorders', purchaseOrderData);
      return response.data.purchaseorder;
    } catch (error) {
      throw this.handleError(error, 'Failed to create purchase order');
    }
  }

  /**
   * Update an existing purchase order
   */
  async updatePurchaseOrder(purchaseOrderId: string, purchaseOrderData: Partial<ZohoBooksPurchaseOrder>): Promise<ZohoBooksPurchaseOrder> {
    try {
      const response = await this.axiosInstance.put(`/purchaseorders/${purchaseOrderId}`, purchaseOrderData);
      return response.data.purchaseorder;
    } catch (error) {
      throw this.handleError(error, `Failed to update purchase order ${purchaseOrderId}`);
    }
  }

  /**
   * Delete a purchase order
   */
  async deletePurchaseOrder(purchaseOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/purchaseorders/${purchaseOrderId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete purchase order ${purchaseOrderId}`);
    }
  }

  /**
   * Issue a purchase order
   */
  async issuePurchaseOrder(purchaseOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/purchaseorders/${purchaseOrderId}/status/issued`);
    } catch (error) {
      throw this.handleError(error, `Failed to issue purchase order ${purchaseOrderId}`);
    }
  }

  /**
   * Cancel a purchase order
   */
  async cancelPurchaseOrder(purchaseOrderId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/purchaseorders/${purchaseOrderId}/status/cancelled`);
    } catch (error) {
      throw this.handleError(error, `Failed to cancel purchase order ${purchaseOrderId}`);
    }
  }

  /**
   * Convert purchase order to bill
   */
  async convertPurchaseOrderToBill(purchaseOrderId: string): Promise<ZohoBooksBill> {
    try {
      const response = await this.axiosInstance.post(`/purchaseorders/${purchaseOrderId}/convertbill`);
      return response.data.bill;
    } catch (error) {
      throw this.handleError(error, `Failed to convert purchase order ${purchaseOrderId} to bill`);
    }
  }

  // ========== BILLS MANAGEMENT ==========

  /**
   * Get all bills
   */
  async getBills(options: {
    page?: number;
    per_page?: number;
    vendor_id?: string;
    status?: string;
    sort_column?: string;
    sort_order?: 'A' | 'D';
    search_text?: string;
    filter_by?: string;
  } = {}): Promise<ZohoApiResponse<ZohoBooksBill[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.vendor_id) params.append('vendor_id', options.vendor_id);
      if (options.status) params.append('status', options.status);
      if (options.sort_column) params.append('sort_column', options.sort_column);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.search_text) params.append('search_text', options.search_text);
      if (options.filter_by) params.append('filter_by', options.filter_by);
      
      const response = await this.axiosInstance.get(`/bills?${params}`);
      return {
        data: response.data.bills || [],
        info: response.data.page_context
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get bills');
    }
  }

  /**
   * Get a specific bill by ID
   */
  async getBill(billId: string): Promise<ZohoBooksBill> {
    try {
      const response = await this.axiosInstance.get(`/bills/${billId}`);
      return response.data.bill;
    } catch (error) {
      throw this.handleError(error, `Failed to get bill ${billId}`);
    }
  }

  /**
   * Create a new bill
   */
  async createBill(billData: Partial<ZohoBooksBill>): Promise<ZohoBooksBill> {
    try {
      const response = await this.axiosInstance.post('/bills', billData);
      return response.data.bill;
    } catch (error) {
      throw this.handleError(error, 'Failed to create bill');
    }
  }

  /**
   * Update an existing bill
   */
  async updateBill(billId: string, billData: Partial<ZohoBooksBill>): Promise<ZohoBooksBill> {
    try {
      const response = await this.axiosInstance.put(`/bills/${billId}`, billData);
      return response.data.bill;
    } catch (error) {
      throw this.handleError(error, `Failed to update bill ${billId}`);
    }
  }

  /**
   * Delete a bill
   */
  async deleteBill(billId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/bills/${billId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete bill ${billId}`);
    }
  }

  /**
   * Mark bill as open
   */
  async markBillAsOpen(billId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/bills/${billId}/status/open`);
    } catch (error) {
      throw this.handleError(error, `Failed to mark bill ${billId} as open`);
    }
  }

  /**
   * Mark bill as void
   */
  async voidBill(billId: string): Promise<void> {
    try {
      await this.axiosInstance.post(`/bills/${billId}/status/void`);
    } catch (error) {
      throw this.handleError(error, `Failed to void bill ${billId}`);
    }
  }

  /**
   * Record payment for a bill
   */
  async recordBillPayment(billId: string, paymentData: {
    amount: number;
    date: string;
    payment_mode: string;
    description?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/bills/${billId}/payments`, paymentData);
    } catch (error) {
      throw this.handleError(error, `Failed to record payment for bill ${billId}`);
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, message: string): ZohoAPIError {
    if (error instanceof ZohoAPIError || error instanceof RateLimitError) {
      return error;
    }
    
    return new ZohoAPIError(
      `${message}: ${error.message}`,
      error.response?.status || 500,
      error.response?.data
    );
  }
}
