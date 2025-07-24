import { ZohoCRMClient } from '../lib/clients/crm-client';
import { ZohoBooksClient } from '../lib/clients/books-client';
import { 
  SyncParams,
  CreateInvoiceParams,
  SearchParams,
  ZohoCRMRecord,
  ZohoBooksCustomer,
  ZohoBooksInvoice
} from '../lib/types';

export class ZohoSyncTools {
  constructor(
    private crmClient: ZohoCRMClient,
    private booksClient: ZohoBooksClient
  ) {}

  /**
   * Sync CRM contacts to Books customers
   */
  async syncContactsToCustomers(params: SyncParams): Promise<{
    success: number;
    failed: number;
    results: Array<{ id: string; status: string; error?: string }>;
  }> {
    const results = [];
    let success = 0;
    let failed = 0;

    try {
      // Get CRM contacts with automatic pagination
      const crmResponse = await this.crmClient.getRecordsWithPagination('Contacts', {
        fields: ['id', 'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile', 'Mailing_Street', 'Mailing_City', 'Mailing_State', 'Mailing_Zip', 'Mailing_Country', 'Account_Name'],
        per_page: params.filters?.limit || 200,
        page: params.filters?.page || 1,
        auto_paginate: true,
        max_records: 2000 // Limit to prevent excessive sync operations
      });

      // Process each contact
      for (const contact of crmResponse.data) {
        try {
          const customerData: Partial<ZohoBooksCustomer> = {
            customer_name: `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim(),
            customer_email: contact.Email,
            phone: contact.Phone,
            mobile: contact.Mobile,
            company_name: contact.Account_Name?.name || '',
            billing_address: {
              address: contact.Mailing_Street || '',
              city: contact.Mailing_City || '',
              state: contact.Mailing_State || '',
              zip: contact.Mailing_Zip || '',
              country: contact.Mailing_Country || '',
              phone: contact.Phone || ''
            },
            shipping_address: {
              address: contact.Mailing_Street || '',
              city: contact.Mailing_City || '',
              state: contact.Mailing_State || '',
              zip: contact.Mailing_Zip || '',
              country: contact.Mailing_Country || '',
              phone: contact.Phone || ''
            }
          };

          const customer = await this.booksClient.createCustomer(customerData);
          results.push({
            id: contact.id,
            status: 'success',
            customer_id: customer.customer_id
          });
          success++;
        } catch (error: any) {
          results.push({
            id: contact.id,
            status: 'failed',
            error: error.message
          });
          failed++;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to sync contacts to customers: ${error.message}`);
    }

    return { success, failed, results };
  }

  /**
   * Sync Books customers to CRM contacts
   */
  async syncCustomersToContacts(params: SyncParams): Promise<{
    success: number;
    failed: number;
    results: Array<{ id: string; status: string; error?: string }>;
  }> {
    const results = [];
    let success = 0;
    let failed = 0;

    try {
      // Get Books customers
      const booksResponse = await this.booksClient.getCustomers({
        per_page: params.filters?.limit || 200,
        page: params.filters?.page || 1
      });

      // Process each customer
      for (const customer of booksResponse.data) {
        try {
          // Split customer name into first and last name
          const nameParts = customer.customer_name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const contactData: Partial<ZohoCRMRecord> = {
            First_Name: firstName,
            Last_Name: lastName,
            Email: customer.customer_email,
            Phone: customer.phone,
            Mobile: customer.mobile,
            Mailing_Street: customer.billing_address?.address || '',
            Mailing_City: customer.billing_address?.city || '',
            Mailing_State: customer.billing_address?.state || '',
            Mailing_Zip: customer.billing_address?.zip || '',
            Mailing_Country: customer.billing_address?.country || '',
            Lead_Source: 'Books Import',
            Description: `Imported from Books Customer ID: ${customer.customer_id}`
          };

          const contact = await this.crmClient.createRecord('Contacts', contactData);
          results.push({
            id: customer.customer_id,
            status: 'success',
            contact_id: contact.id
          });
          success++;
        } catch (error: any) {
          results.push({
            id: customer.customer_id,
            status: 'failed',
            error: error.message
          });
          failed++;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to sync customers to contacts: ${error.message}`);
    }

    return { success, failed, results };
  }

  /**
   * Sync CRM accounts to Books customers
   */
  async syncAccountsToCustomers(params: SyncParams): Promise<{
    success: number;
    failed: number;
    results: Array<{ id: string; status: string; error?: string }>;
  }> {
    const results = [];
    let success = 0;
    let failed = 0;

    try {
      // Get CRM accounts with automatic pagination
      const crmResponse = await this.crmClient.getRecordsWithPagination('Accounts', {
        fields: ['id', 'Account_Name', 'Email', 'Phone', 'Website', 'Billing_Street', 'Billing_City', 'Billing_State', 'Billing_Code', 'Billing_Country'],
        per_page: params.filters?.limit || 200,
        page: params.filters?.page || 1,
        auto_paginate: true,
        max_records: 2000 // Limit to prevent excessive sync operations
      });

      // Process each account
      for (const account of crmResponse.data) {
        try {
          const customerData: Partial<ZohoBooksCustomer> = {
            customer_name: account.Account_Name,
            customer_email: account.Email,
            phone: account.Phone,
            website: account.Website,
            billing_address: {
              address: account.Billing_Street || '',
              city: account.Billing_City || '',
              state: account.Billing_State || '',
              zip: account.Billing_Code || '',
              country: account.Billing_Country || '',
              phone: account.Phone || ''
            }
          };

          const customer = await this.booksClient.createCustomer(customerData);
          results.push({
            id: account.id,
            status: 'success',
            customer_id: customer.customer_id
          });
          success++;
        } catch (error: any) {
          results.push({
            id: account.id,
            status: 'failed',
            error: error.message
          });
          failed++;
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to sync accounts to customers: ${error.message}`);
    }

    return { success, failed, results };
  }

  /**
   * Create Books invoice from CRM deal
   */
  async createInvoiceFromDeal(params: CreateInvoiceParams): Promise<ZohoBooksInvoice> {
    try {
      // Get deal details from CRM
      const deal = await this.crmClient.getRecord('Deals', params.deal_id);
      
      if (!deal) {
        throw new Error(`Deal with ID ${params.deal_id} not found`);
      }

      // Get related account/contact info
      const accountId = deal.Account_Name?.id;
      let customer: ZohoBooksCustomer | null = null;
      
      if (params.customer_id) {
        customer = await this.booksClient.getCustomer(params.customer_id);
      } else if (accountId) {
        // Try to find existing customer by account name
        const account = await this.crmClient.getRecord('Accounts', accountId);
        const customers = await this.booksClient.getCustomers();
        customer = customers.data.find(c => c.customer_name === account.Account_Name) || null;
      }

      if (!customer) {
        throw new Error('No customer found for this deal');
      }

      // Create invoice data
      const invoiceData: Partial<ZohoBooksInvoice> = {
        customer_id: customer.customer_id,
        invoice_date: params.invoice_date || new Date().toISOString().split('T')[0],
        due_date: params.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: params.include_line_items ? [] : undefined
      };

      // Add line items if requested
      if (params.include_line_items) {
        invoiceData.line_items = [{
          line_item_id: '', // Placeholder, will be set by Zoho Books API
          item_id: '', // Placeholder, should be set to a valid item if available
          name: deal.Deal_Name || 'Deal',
          description: deal.Description || '',
          quantity: 1,
          unit: 'unit',
          rate: parseFloat(deal.Amount) || 0,
          amount: parseFloat(deal.Amount) || 0,
          tax_id: '', // Placeholder, set to a valid tax_id if available
          tax_percentage: 0
        }];
      }

      const invoice = await this.booksClient.createInvoice(invoiceData);

      // Send email if requested
      if (params.send_email && customer.customer_email) {
        await this.booksClient.sendInvoiceEmail(invoice.invoice_id, {
          to_mail_ids: [customer.customer_email],
          subject: `Invoice ${invoice.invoice_number}`,
          body: `Please find attached invoice ${invoice.invoice_number} for ${deal.Deal_Name}.`
        });
      }

      return invoice;
    } catch (error: any) {
      throw new Error(`Failed to create invoice from deal: ${error.message}`);
    }
  }

  /**
   * Search across CRM and Books
   */
  async searchRecords(params: SearchParams): Promise<{
    crm_results?: any[];
    books_results?: any[];
    total_results: number;
  }> {
    const results: any = { total_results: 0 };

    try {
      // Books modules
      if (['customers', 'invoices'].includes(params.module)) {
        if (params.module === 'customers') {
          const booksResponse = await this.booksClient.getCustomers({
            page: params.page,
            per_page: params.per_page
          });
          
          // Filter results based on criteria (simple text search)
          const filteredResults = booksResponse.data.filter(customer => 
            customer.customer_name.toLowerCase().includes(params.criteria.toLowerCase()) ||
            (customer.customer_email && customer.customer_email.toLowerCase().includes(params.criteria.toLowerCase()))
          );
          
          results.books_results = filteredResults;
          results.total_results += filteredResults.length;
        } else if (params.module === 'invoices') {
          const booksResponse = await this.booksClient.getInvoices({
            page: params.page,
            per_page: params.per_page
          });
          
          // Filter results based on criteria
          const filteredResults = booksResponse.data.filter(invoice => 
            invoice.invoice_number.toLowerCase().includes(params.criteria.toLowerCase()) ||
            invoice.customer_name.toLowerCase().includes(params.criteria.toLowerCase())
          );
          
          results.books_results = filteredResults;
          results.total_results += filteredResults.length;
        }
      } else {
        // Try to search in CRM modules (including custom modules)
        // First get the module API name mapping
        const moduleApiName = await this.getModuleApiName(params.module);
        
        if (moduleApiName) {
          try {
            const crmResponse = await this.crmClient.getRecordsWithPagination(moduleApiName, {
              fields: params.fields,
              page: params.page,
              per_page: params.per_page,
              auto_paginate: true,
              max_records: 5000 // Limit to prevent excessive search results
            });
            
            // Filter results based on criteria if needed
            let filteredResults = crmResponse.data;
            if (params.criteria && params.criteria !== '*') {
              filteredResults = crmResponse.data.filter(record => {
                const recordStr = JSON.stringify(record).toLowerCase();
                return recordStr.includes(params.criteria.toLowerCase());
              });
            }
            
            results.crm_results = filteredResults;
            results.total_results += filteredResults.length;
          } catch (error: any) {
            // If direct search fails, try searchRecords
            try {
              const crmResponse = await this.crmClient.searchAllRecords(moduleApiName, params.criteria, {
                fields: params.fields,
                page: params.page,
                per_page: params.per_page,
                auto_paginate: true,
                max_records: 5000 // Limit to prevent excessive search results
              });
              
              results.crm_results = crmResponse.data;
              results.total_results += crmResponse.data.length;
            } catch (searchError: any) {
              throw new Error(`Failed to search in module ${params.module}: ${searchError.message}`);
            }
          }
        } else {
          throw new Error(`Module ${params.module} not found or not accessible`);
        }
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to search records: ${error.message}`);
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
}
