import { BooksItemsTools } from '../../src/tools/books-tools';
import { ZohoBooksClient } from '../../src/clients/books-client';
import { ZohoBooksItem } from '../../src/types';

// Mock the Books client
jest.mock('../../src/clients/books-client');

describe('BooksItemsTools', () => {
  let booksItemsTools: BooksItemsTools;
  let mockBooksClient: jest.Mocked<ZohoBooksClient>;

  beforeEach(() => {
    mockBooksClient = new ZohoBooksClient(null as any, 'com', 'test-org') as jest.Mocked<ZohoBooksClient>;
    booksItemsTools = new BooksItemsTools(mockBooksClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getItems', () => {
    it('should return items successfully', async () => {
      const mockItems: ZohoBooksItem[] = [
        {
          item_id: '1',
          name: 'Test Item',
          description: 'Test Description',
          rate: 100,
          unit: 'hrs',
          sku: 'TEST-001',
          product_type: 'service',
          is_taxable: true,
          tax_id: 'tax-1',
          tax_name: 'VAT',
          tax_percentage: 20,
          purchase_account_id: 'acc-1',
          account_id: 'acc-2',
          inventory_account_id: 'acc-3',
          purchase_description: 'Purchase desc',
          purchase_rate: 80,
          item_type: 'inventory',
          status: 'active',
          source: 'user',
          is_combo_product: false,
          brand: 'Test Brand',
          manufacturer: 'Test Manufacturer',
          category_id: 'cat-1',
          category_name: 'Test Category',
          cf_cost_price: 50,
          available_stock: 100,
          actual_available_stock: 90,
          committed_stock: 10,
          actual_committed_stock: 10,
          stock_on_hand: 90,
          actual_stock_on_hand: 90,
          created_time: '2023-01-01T00:00:00Z',
          last_modified_time: '2023-01-01T00:00:00Z'
        }
      ];

      mockBooksClient.getItems.mockResolvedValue({
        data: mockItems,
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      });

      const result = await booksItemsTools.getItems({ page: 1, per_page: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItems);
      expect(result.pagination).toEqual({ page: 1, per_page: 20, count: 1, more_records: false });
      expect(mockBooksClient.getItems).toHaveBeenCalledWith({ page: 1, per_page: 20 });
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch items';
      mockBooksClient.getItems.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.getItems({ page: 1, per_page: 20 });

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('getItem', () => {
    it('should return a single item successfully', async () => {
      const mockItem: ZohoBooksItem = {
        item_id: '1',
        name: 'Test Item',
        description: 'Test Description',
        rate: 100,
        unit: 'hrs',
        sku: 'TEST-001',
        product_type: 'service',
        is_taxable: true,
        tax_id: 'tax-1',
        tax_name: 'VAT',
        tax_percentage: 20,
        purchase_account_id: 'acc-1',
        account_id: 'acc-2',
        inventory_account_id: 'acc-3',
        purchase_description: 'Purchase desc',
        purchase_rate: 80,
        item_type: 'inventory',
        status: 'active',
        source: 'user',
        is_combo_product: false,
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        category_id: 'cat-1',
        category_name: 'Test Category',
        cf_cost_price: 50,
        available_stock: 100,
        actual_available_stock: 90,
        committed_stock: 10,
        actual_committed_stock: 10,
        stock_on_hand: 90,
        actual_stock_on_hand: 90,
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      };

      mockBooksClient.getItem.mockResolvedValue(mockItem);

      const result = await booksItemsTools.getItem('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItem);
      expect(mockBooksClient.getItem).toHaveBeenCalledWith('1');
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Item not found';
      mockBooksClient.getItem.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.getItem('1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('createItem', () => {
    it('should create an item successfully', async () => {
      const itemData = {
        name: 'New Item',
        description: 'New Description',
        rate: 150,
        unit: 'pcs'
      };

      const mockCreatedItem: ZohoBooksItem = {
        item_id: '2',
        name: 'New Item',
        description: 'New Description',
        rate: 150,
        unit: 'pcs',
        sku: 'NEW-001',
        product_type: 'service',
        is_taxable: false,
        tax_id: '',
        tax_name: '',
        tax_percentage: 0,
        purchase_account_id: '',
        account_id: '',
        inventory_account_id: '',
        purchase_description: '',
        purchase_rate: 0,
        item_type: 'inventory',
        status: 'active',
        source: 'user',
        is_combo_product: false,
        brand: '',
        manufacturer: '',
        category_id: '',
        category_name: '',
        cf_cost_price: 0,
        available_stock: 0,
        actual_available_stock: 0,
        committed_stock: 0,
        actual_committed_stock: 0,
        stock_on_hand: 0,
        actual_stock_on_hand: 0,
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      };

      mockBooksClient.createItem.mockResolvedValue(mockCreatedItem);

      const result = await booksItemsTools.createItem(itemData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedItem);
      expect(result.message).toBe('Item "New Item" created successfully');
      expect(mockBooksClient.createItem).toHaveBeenCalledWith(itemData);
    });

    it('should handle creation errors gracefully', async () => {
      const itemData = {
        name: 'New Item',
        description: 'New Description',
        rate: 150,
        unit: 'pcs'
      };

      const errorMessage = 'Failed to create item';
      mockBooksClient.createItem.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.createItem(itemData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('updateItem', () => {
    it('should update an item successfully', async () => {
      const itemId = '1';
      const updateData = {
        name: 'Updated Item',
        rate: 200
      };

      const mockUpdatedItem: ZohoBooksItem = {
        item_id: '1',
        name: 'Updated Item',
        description: 'Test Description',
        rate: 200,
        unit: 'hrs',
        sku: 'TEST-001',
        product_type: 'service',
        is_taxable: true,
        tax_id: 'tax-1',
        tax_name: 'VAT',
        tax_percentage: 20,
        purchase_account_id: 'acc-1',
        account_id: 'acc-2',
        inventory_account_id: 'acc-3',
        purchase_description: 'Purchase desc',
        purchase_rate: 80,
        item_type: 'inventory',
        status: 'active',
        source: 'user',
        is_combo_product: false,
        brand: 'Test Brand',
        manufacturer: 'Test Manufacturer',
        category_id: 'cat-1',
        category_name: 'Test Category',
        cf_cost_price: 50,
        available_stock: 100,
        actual_available_stock: 90,
        committed_stock: 10,
        actual_committed_stock: 10,
        stock_on_hand: 90,
        actual_stock_on_hand: 90,
        created_time: '2023-01-01T00:00:00Z',
        last_modified_time: '2023-01-01T00:00:00Z'
      };

      mockBooksClient.updateItem.mockResolvedValue(mockUpdatedItem);

      const result = await booksItemsTools.updateItem(itemId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedItem);
      expect(result.message).toBe('Item 1 updated successfully');
      expect(mockBooksClient.updateItem).toHaveBeenCalledWith(itemId, updateData);
    });

    it('should handle update errors gracefully', async () => {
      const itemId = '1';
      const updateData = { name: 'Updated Item' };
      const errorMessage = 'Failed to update item';
      mockBooksClient.updateItem.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.updateItem(itemId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('deleteItem', () => {
    it('should delete an item successfully', async () => {
      const itemId = '1';
      mockBooksClient.deleteItem.mockResolvedValue(undefined);

      const result = await booksItemsTools.deleteItem(itemId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Item 1 deleted successfully');
      expect(mockBooksClient.deleteItem).toHaveBeenCalledWith(itemId);
    });

    it('should handle deletion errors gracefully', async () => {
      const itemId = '1';
      const errorMessage = 'Failed to delete item';
      mockBooksClient.deleteItem.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.deleteItem(itemId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('markItemActive', () => {
    it('should mark an item as active successfully', async () => {
      const itemId = '1';
      mockBooksClient.markItemActive.mockResolvedValue(undefined);

      const result = await booksItemsTools.markItemActive(itemId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Item 1 marked as active');
      expect(mockBooksClient.markItemActive).toHaveBeenCalledWith(itemId);
    });

    it('should handle errors gracefully', async () => {
      const itemId = '1';
      const errorMessage = 'Failed to mark item as active';
      mockBooksClient.markItemActive.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.markItemActive(itemId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('markItemInactive', () => {
    it('should mark an item as inactive successfully', async () => {
      const itemId = '1';
      mockBooksClient.markItemInactive.mockResolvedValue(undefined);

      const result = await booksItemsTools.markItemInactive(itemId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Item 1 marked as inactive');
      expect(mockBooksClient.markItemInactive).toHaveBeenCalledWith(itemId);
    });

    it('should handle errors gracefully', async () => {
      const itemId = '1';
      const errorMessage = 'Failed to mark item as inactive';
      mockBooksClient.markItemInactive.mockRejectedValue(new Error(errorMessage));

      const result = await booksItemsTools.markItemInactive(itemId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });
});