import { ZohoSyncTools } from '../../src/tools/sync-tools';
import { ZohoCRMClient } from '../../src/lib/clients/crm-client';
import { ZohoBooksClient } from '../../src/lib/clients/books-client';
import { ZohoCRMRecord, ZohoBooksCustomer } from '../../src/lib/types';

// Mock the clients
jest.mock('../../src/lib/clients/crm-client');
jest.mock('../../src/lib/clients/books-client');

describe('ZohoSyncTools', () => {
  let syncTools: ZohoSyncTools;
  let mockCRMClient: jest.Mocked<ZohoCRMClient>;
  let mockBooksClient: jest.Mocked<ZohoBooksClient>;

  beforeEach(() => {
    mockCRMClient = new ZohoCRMClient(null as any, 'com') as jest.Mocked<ZohoCRMClient>;
    mockBooksClient = new ZohoBooksClient(null as any, 'com', 'test-org') as jest.Mocked<ZohoBooksClient>;
    syncTools = new ZohoSyncTools(mockCRMClient, mockBooksClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncContactsToCustomers', () => {
    it('should sync contacts to customers successfully', async () => {
      const mockContacts: ZohoCRMRecord[] = [
        {
          id: '1',
          First_Name: 'John',
          Last_Name: 'Doe',
          Email: 'john@example.com',
          Phone: '+1234567890',
          Mobile: '+1234567891',
          Mailing_Street: '123 Main St',
          Mailing_City: 'Anytown',
          Mailing_State: 'NY',
          Mailing_Zip: '12345',
          Mailing_Country: 'USA',
          Account_Name: { name: 'Test Company' }
        }
      ];

      const mockCustomer: ZohoBooksCustomer = {
        customer_id: '1',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        phone: '+1234567890',
        mobile: '+1234567891',
        company_name: 'Test Company',
        website: '',
        billing_address: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
          country: 'USA',
          phone: '+1234567890'
        },
        shipping_address: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'NY',
          zip: '12345',
          country: 'USA',
          phone: '+1234567890'
        },
        status: 'active',
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      };

      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockContacts,
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      });
      mockBooksClient.createCustomer.mockResolvedValue(mockCustomer);

      const result = await syncTools.syncContactsToCustomers({
        source_module: 'contacts',
        target_module: 'customers',
        filters: { limit: 200, page: 1 }
      });

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        id: '1',
        status: 'success',
        customer_id: '1'
      });
      expect(mockCRMClient.getRecordsWithPagination).toHaveBeenCalledWith('Contacts', {
        fields: ['id', 'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile', 'Mailing_Street', 'Mailing_City', 'Mailing_State', 'Mailing_Zip', 'Mailing_Country', 'Account_Name'],
        per_page: 200,
        page: 1,
        auto_paginate: true,
        max_records: 2000
      });
    });

    it('should handle individual contact sync failures', async () => {
      const mockContacts: ZohoCRMRecord[] = [
        {
          id: '1',
          First_Name: 'John',
          Last_Name: 'Doe',
          Email: 'john@example.com',
          Phone: '+1234567890'
        }
      ];

      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockContacts,
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      });
      mockBooksClient.createCustomer.mockRejectedValue(new Error('Customer creation failed'));

      const result = await syncTools.syncContactsToCustomers({
        source_module: 'contacts',
        target_module: 'customers',
        filters: { limit: 200, page: 1 }
      });

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        id: '1',
        status: 'failed',
        error: 'Customer creation failed'
      });
    });
  });

  describe('syncCustomersToContacts', () => {
    it('should sync customers to contacts successfully', async () => {
      const mockCustomers: ZohoBooksCustomer[] = [
        {
          customer_id: '1',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          phone: '+1234567890',
          mobile: '+1234567891',
          company_name: 'Test Company',
          website: '',
          billing_address: {
            address: '456 Oak Ave',
            city: 'Somewhere',
            state: 'CA',
            zip: '54321',
            country: 'USA',
            phone: '+1234567890'
          },
          shipping_address: {
            address: '456 Oak Ave',
            city: 'Somewhere',
            state: 'CA',
            zip: '54321',
            country: 'USA',
            phone: '+1234567890'
          },
          status: 'active',
          created_time: '2023-01-01T00:00:00Z',
          last_modified_time: '2023-01-01T00:00:00Z'
        }
      ];

      const mockContact: ZohoCRMRecord = {
        id: '1',
        First_Name: 'Jane',
        Last_Name: 'Smith',
        Email: 'jane@example.com',
        Phone: '+1234567890'
      };

      mockBooksClient.getCustomers.mockResolvedValue({
        data: mockCustomers,
        info: { page: 1, per_page: 200, count: 1, more_records: false }
      });
      mockCRMClient.createRecord.mockResolvedValue(mockContact);

      const result = await syncTools.syncCustomersToContacts({
        source_module: 'customers',
        target_module: 'contacts',
        filters: { limit: 200, page: 1 }
      });

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        id: '1',
        status: 'success',
        contact_id: '1'
      });
      expect(mockBooksClient.getCustomers).toHaveBeenCalledWith({
        per_page: 200,
        page: 1
      });
      expect(mockCRMClient.createRecord).toHaveBeenCalledWith('Contacts', {
        First_Name: 'Jane',
        Last_Name: 'Smith',
        Email: 'jane@example.com',
        Phone: '+1234567890',
        Mobile: '+1234567891',
        Mailing_Street: '456 Oak Ave',
        Mailing_City: 'Somewhere',
        Mailing_State: 'CA',
        Mailing_Zip: '54321',
        Mailing_Country: 'USA',
        Lead_Source: 'Books Import',
        Description: 'Imported from Books Customer ID: 1'
      });
    });

    it('should handle individual customer sync failures', async () => {
      const mockCustomers: ZohoBooksCustomer[] = [
        {
          customer_id: '1',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          phone: '+1234567890',
          mobile: '+1234567891',
          company_name: 'Test Company',
          website: '',
          billing_address: {
            address: '456 Oak Ave',
            city: 'Somewhere',
            state: 'CA',
            zip: '54321',
            country: 'USA',
            phone: '+1234567890'
          },
          shipping_address: {
            address: '456 Oak Ave',
            city: 'Somewhere',
            state: 'CA',
            zip: '54321',
            country: 'USA',
            phone: '+1234567890'
          },
          status: 'active',
          created_time: '2023-01-01T00:00:00Z',
          last_modified_time: '2023-01-01T00:00:00Z'
        }
      ];

      mockBooksClient.getCustomers.mockResolvedValue({
        data: mockCustomers,
        info: { page: 1, per_page: 200, count: 1, more_records: false }
      });
      mockCRMClient.createRecord.mockRejectedValue(new Error('Contact creation failed'));

      const result = await syncTools.syncCustomersToContacts({
        source_module: 'customers',
        target_module: 'contacts',
        filters: { limit: 200, page: 1 }
      });

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        id: '1',
        status: 'failed',
        error: 'Contact creation failed'
      });
    });
  });

  describe('searchRecords', () => {
    it('should search CRM records successfully', async () => {
      const mockCRMRecords: ZohoCRMRecord[] = [
        {
          id: '1',
          Account_Name: 'Test Account',
          Email: 'test@example.com',
          Phone: '+1234567890'
        }
      ];

      mockCRMClient.getModules.mockResolvedValue([
        { 
          api_name: 'Accounts', 
          module_name: 'Accounts', 
          plural_label: 'Accounts', 
          singular_label: 'Account',
          supported_operations: ['read', 'create', 'update', 'delete']
        }
      ]);
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockCRMRecords,
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      });

      const result = await syncTools.searchRecords({
        module: 'accounts',
        criteria: 'test',
        fields: ['Account_Name', 'Email', 'Phone'],
        page: 1,
        per_page: 20,
        sort_order: 'asc'
      });

      expect(result.crm_results).toEqual(mockCRMRecords);
      expect(result.total_results).toBe(1);
      expect(mockCRMClient.getRecordsWithPagination).toHaveBeenCalledWith('Accounts', {
        fields: ['Account_Name', 'Email', 'Phone'],
        page: 1,
        per_page: 20,
        auto_paginate: true,
        max_records: 5000
      });
    });

    it('should search Books customers successfully', async () => {
      const mockCustomers: ZohoBooksCustomer[] = [
        {
          customer_id: '1',
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          phone: '+1234567890',
          mobile: '',
          company_name: 'Test Company',
          website: '',
          billing_address: {
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            phone: ''
          },
          shipping_address: {
            address: '',
            city: '',
            state: '',
            zip: '',
            country: '',
            phone: ''
          },
          status: 'active',
          created_time: '2023-01-01T00:00:00Z',
          last_modified_time: '2023-01-01T00:00:00Z'
        }
      ];

      mockBooksClient.getCustomers.mockResolvedValue({
        data: mockCustomers,
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      });

      const result = await syncTools.searchRecords({
        module: 'customers',
        criteria: 'test',
        page: 1,
        per_page: 20,
        sort_order: 'asc'
      });

      expect(result.books_results).toEqual(mockCustomers);
      expect(result.total_results).toBe(1);
      expect(mockBooksClient.getCustomers).toHaveBeenCalledWith({
        page: 1,
        per_page: 20
      });
    });

    it('should handle search errors', async () => {
      mockCRMClient.getModules.mockResolvedValue([
        { 
          api_name: 'Accounts', 
          module_name: 'Accounts', 
          plural_label: 'Accounts', 
          singular_label: 'Account',
          supported_operations: ['read', 'create', 'update', 'delete']
        }
      ]);
      mockCRMClient.getRecordsWithPagination.mockRejectedValue(new Error('Search failed'));
      mockCRMClient.searchAllRecords.mockRejectedValue(new Error('Search failed'));

      await expect(syncTools.searchRecords({
        module: 'accounts',
        criteria: 'test',
        page: 1,
        per_page: 20,
        sort_order: 'asc'
      })).rejects.toThrow('Failed to search records: Failed to search in module accounts: Search failed');
    });
  });
});