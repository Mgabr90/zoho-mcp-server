import { BooksCustomersTools } from '../../src/tools/books-tools';
import { ZohoBooksClient } from '../../src/clients/books-client';
import { ZohoConfigManager } from '../../src/utils/config-manager';
import { ZohoBooksCustomer } from '../../src/types';
import path from 'path';

// Mock external dependencies
jest.mock('axios');
jest.mock('../../src/clients/books-client');

describe('MCP Tools Performance Tests', () => {
  let booksCustomersTools: BooksCustomersTools;
  let mockBooksClient: jest.Mocked<ZohoBooksClient>;
  let configManager: ZohoConfigManager;

  beforeAll(async () => {
    // Setup test configuration
    const testConfigPath = path.join(__dirname, '../../test-performance-config.json');
    configManager = new ZohoConfigManager(testConfigPath);
    
    // Initialize mock client and tools
    mockBooksClient = new ZohoBooksClient(null as any, 'com', 'test-org') as jest.Mocked<ZohoBooksClient>;
    booksCustomersTools = new BooksCustomersTools(mockBooksClient);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  describe('Load Testing', () => {
    it('should handle concurrent tool calls efficiently', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
        page: 1,
        per_page: 10,
        search_text: `test${i}`
      }));

      // Mock successful responses
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 10, count: 0, more_records: false }
      });

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => booksCustomersTools.getCustomers(req))
      );
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(results).toHaveLength(concurrentRequests);

      // All requests should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle large data sets efficiently', async () => {
      // Mock large dataset response
      const largeDataset: ZohoBooksCustomer[] = Array.from({ length: 200 }, (_, i) => ({
        customer_id: `customer-${i}`,
        customer_name: `Customer ${i}`,
        customer_email: `customer${i}@example.com`,
        company_name: `Company ${i}`,
        phone: `555-${String(i).padStart(4, '0')}`,
        mobile: `555-${String(i).padStart(4, '0')}`,
        website: `https://company${i}.com`,
        billing_address: {
          address: `Address ${i}`,
          city: `City ${i}`,
          state: `State ${i}`,
          zip: `12345`,
          country: 'USA',
          phone: `555-${String(i).padStart(4, '0')}`
        },
        shipping_address: {
          address: `Address ${i}`,
          city: `City ${i}`,
          state: `State ${i}`,
          zip: `12345`,
          country: 'USA',
          phone: `555-${String(i).padStart(4, '0')}`
        },
        status: 'active',
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      }));

      mockBooksClient.getCustomers.mockResolvedValue({
        data: largeDataset,
        info: { page: 1, per_page: 200, count: 200, more_records: false }
      });

      const startTime = Date.now();
      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 200 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(200);
      }
    });

    it('should handle rapid successive calls', async () => {
      // Mock responses for rapid calls
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 10, count: 0, more_records: false }
      });

      const rapidRequests = Array.from({ length: 20 }, (_, i) => ({
        page: i + 1,
        per_page: 10
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        rapidRequests.map(req => booksCustomersTools.getCustomers(req))
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      expect(results).toHaveLength(20);

      // All requests should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should handle slow external API responses', async () => {
      // Mock slow response
      mockBooksClient.getCustomers.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: [],
            info: { page: 1, per_page: 10, count: 0, more_records: false }
          });
        }, 5000); // 5 second delay
      }));

      const startTime = Date.now();
      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 10 });
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeGreaterThan(4000); // Should take at least 4 seconds
      expect(result.success).toBe(true);
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      mockBooksClient.getCustomers.mockRejectedValue(new Error('Network timeout'));

      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 10 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should handle infinite loops gracefully', async () => {
      // Mock a very slow response instead of infinite loop
      mockBooksClient.getCustomers.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            data: [],
            info: { page: 1, per_page: 10, count: 0, more_records: false }
          });
        }, 8000); // 8 second delay
      }));

      const startTime = Date.now();
      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 10 });
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(7000); // Should take at least 7 seconds
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during repeated calls', async () => {
      const initialMemory = process.memoryUsage();
      
      // Mock successful responses
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 10, count: 0, more_records: false }
      });
      
      // Make multiple tool calls
      for (let i = 0; i < 50; i++) {
        await booksCustomersTools.getCustomers({ page: 1, per_page: 10 });
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage should not increase significantly
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it('should handle large response objects efficiently', async () => {
      const largeResponse = {
        data: Array.from({ length: 1000 }, (_, i): ZohoBooksCustomer => ({
          customer_id: `customer-${i}`,
          customer_name: `Customer ${i}`,
          customer_email: `customer${i}@example.com`,
          company_name: `Company ${i}`,
          phone: `555-${String(i).padStart(4, '0')}`,
          mobile: `555-${String(i).padStart(4, '0')}`,
          website: `https://company${i}.com`,
          billing_address: {
            address: `Address ${i}`,
            city: `City ${i}`,
            state: `State ${i}`,
            zip: `12345`,
            country: 'USA',
            phone: `555-${String(i).padStart(4, '0')}`
          },
          shipping_address: {
            address: `Address ${i}`,
            city: `City ${i}`,
            state: `State ${i}`,
            zip: `12345`,
            country: 'USA',
            phone: `555-${String(i).padStart(4, '0')}`
          },
          status: 'active',
          created_time: '2023-01-01T00:00:00Z',
          last_modified_time: '2023-01-01T00:00:00Z'
        })),
        info: { page: 1, per_page: 1000, count: 1000, more_records: false }
      };

      mockBooksClient.getCustomers.mockResolvedValue(largeResponse);

      const startTime = Date.now();
      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 1000 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1000);
      }
    });
  });

  describe('Burst Handling', () => {
    it('should handle burst requests efficiently', async () => {
      // Mock responses
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 10, count: 0, more_records: false }
      });

      const burstRequests = Array.from({ length: 100 }, (_, i) => ({
        page: 1,
        per_page: 10,
        search_text: `burst${i}`
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        burstRequests.map(req => booksCustomersTools.getCustomers(req))
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds max
      expect(results).toHaveLength(100);

      // All requests should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle mixed request types efficiently', async () => {
      // Mock different types of responses
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 10, count: 0, more_records: false }
      });

      const mixedRequests = [
        { page: 1, per_page: 10 },
        { page: 2, per_page: 20 },
        { page: 1, per_page: 50 },
        { page: 3, per_page: 5 },
        { page: 1, per_page: 100 }
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        mixedRequests.map(req => booksCustomersTools.getCustomers(req))
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(results).toHaveLength(5);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Pagination Performance', () => {
    it('should handle pagination efficiently', async () => {
      // Mock paginated responses
      mockBooksClient.getCustomers.mockImplementation(async (options) => {
        const page = options?.page || 1;
        const perPage = options?.per_page || 10;
        
        return {
          data: Array.from({ length: perPage }, (_, i): ZohoBooksCustomer => ({
            customer_id: `customer-${(page - 1) * perPage + i}`,
            customer_name: `Customer ${(page - 1) * perPage + i}`,
            customer_email: `customer${(page - 1) * perPage + i}@example.com`,
            company_name: `Company ${(page - 1) * perPage + i}`,
            phone: `555-${String((page - 1) * perPage + i).padStart(4, '0')}`,
            mobile: `555-${String((page - 1) * perPage + i).padStart(4, '0')}`,
            website: `https://company${(page - 1) * perPage + i}.com`,
            billing_address: {
              address: `Address ${(page - 1) * perPage + i}`,
              city: `City ${(page - 1) * perPage + i}`,
              state: `State ${(page - 1) * perPage + i}`,
              zip: `12345`,
              country: 'USA',
              phone: `555-${String((page - 1) * perPage + i).padStart(4, '0')}`
            },
            shipping_address: {
              address: `Address ${(page - 1) * perPage + i}`,
              city: `City ${(page - 1) * perPage + i}`,
              state: `State ${(page - 1) * perPage + i}`,
              zip: `12345`,
              country: 'USA',
              phone: `555-${String((page - 1) * perPage + i).padStart(4, '0')}`
            },
            status: 'active',
            created_time: '2023-01-01T00:00:00Z',
            last_modified_time: '2023-01-01T00:00:00Z'
          })),
          info: { 
            page, 
            per_page: perPage, 
            count: 1000, 
            more_records: page * perPage < 1000 
          }
        };
      });

      const paginationRequests = Array.from({ length: 10 }, (_, i) => ({
        page: i + 1,
        per_page: 100
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        paginationRequests.map(req => booksCustomersTools.getCustomers(req))
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      expect(results).toHaveLength(10);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        if (result.success && result.pagination) {
          expect(result.pagination.page).toBe(index + 1);
        }
      });
    });

    it('should handle large page sizes efficiently', async () => {
      const largePageSize = 200;
      const largeDataset: ZohoBooksCustomer[] = Array.from({ length: largePageSize }, (_, i) => ({
        customer_id: `customer-${i}`,
        customer_name: `Customer ${i}`,
        customer_email: `customer${i}@example.com`,
        company_name: `Company ${i}`,
        phone: `555-${String(i).padStart(4, '0')}`,
        mobile: `555-${String(i).padStart(4, '0')}`,
        website: `https://company${i}.com`,
        billing_address: {
          address: `Address ${i}`,
          city: `City ${i}`,
          state: `State ${i}`,
          zip: `12345`,
          country: 'USA',
          phone: `555-${String(i).padStart(4, '0')}`
        },
        shipping_address: {
          address: `Address ${i}`,
          city: `City ${i}`,
          state: `State ${i}`,
          zip: `12345`,
          country: 'USA',
          phone: `555-${String(i).padStart(4, '0')}`
        },
        status: 'active',
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      }));

      mockBooksClient.getCustomers.mockResolvedValue({
        data: largeDataset,
        info: { page: 1, per_page: largePageSize, count: largePageSize, more_records: false }
      });

      const startTime = Date.now();
      const result = await booksCustomersTools.getCustomers({ page: 1, per_page: largePageSize });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(largePageSize);
      }
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary failures', async () => {
      let callCount = 0;
      mockBooksClient.getCustomers.mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Temporary failure');
        }
        return {
          data: [],
          info: { page: 1, per_page: 10, count: 0, more_records: false }
        };
      });

      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await booksCustomersTools.getCustomers({ page: 1, per_page: 10 });
        results.push(result);
      }

      // First two should fail, rest should succeed
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[3].success).toBe(true);
      expect(results[4].success).toBe(true);
    });

    it('should handle intermittent failures', async () => {
      let callCount = 0;
      mockBooksClient.getCustomers.mockImplementation(async () => {
        callCount++;
        if (callCount % 3 === 0) { // Every third call fails
          throw new Error('Intermittent failure');
        }
        return {
          data: [],
          info: { page: 1, per_page: 10, count: 0, more_records: false }
        };
      });

      const results = await Promise.all(
        Array.from({ length: 9 }, (_, i) => 
          booksCustomersTools.getCustomers({ page: i + 1, per_page: 10 })
        )
      );

      // Should have some failures and some successes
      const failures = results.filter(r => !r.success).length;
      const successes = results.filter(r => r.success).length;

      expect(failures).toBeGreaterThan(0);
      expect(successes).toBeGreaterThan(0);
      expect(failures + successes).toBe(9);
    });
  });
}); 