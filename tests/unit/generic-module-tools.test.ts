import { GenericModuleTools } from '../../src/tools/generic-module-tools';
import { ZohoCRMClient } from '../../src/lib/clients/crm-client';
import { ZohoCRMRecord, ZohoCRMModule } from '../../src/lib/types';

jest.mock('../../src/lib/clients/crm-client');

describe('GenericModuleTools', () => {
  let genericModuleTools: GenericModuleTools;
  let mockCRMClient: jest.Mocked<ZohoCRMClient>;

  const mockModule: ZohoCRMModule = {
    api_name: 'CustomModule1',
    module_name: 'Custom Module',
    plural_label: 'Custom Records',
    singular_label: 'Custom Record',
    supported_operations: ['read', 'create', 'update', 'delete']
  };

  const mockRecords: ZohoCRMRecord[] = [
    {
      id: '1',
      Name: 'Record 1',
      Status: 'Active',
      Amount: 1000,
      Created_Time: '2023-01-01T00:00:00+00:00',
      Modified_Time: '2023-01-01T00:00:00+00:00'
    },
    {
      id: '2',
      Name: 'Record 2',
      Status: 'Inactive',
      Amount: 2000,
      Created_Time: '2023-01-02T00:00:00+00:00',
      Modified_Time: '2023-01-02T00:00:00+00:00'
    },
    {
      id: '3',
      Name: 'Record 3',
      Status: 'Active',
      Amount: 1500,
      Created_Time: '2023-01-03T00:00:00+00:00',
      Modified_Time: '2023-01-03T00:00:00+00:00'
    }
  ];

  beforeEach(() => {
    mockCRMClient = new ZohoCRMClient(null as any, 'com') as jest.Mocked<ZohoCRMClient>;
    genericModuleTools = new GenericModuleTools(mockCRMClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCustomModule', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockRecords,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });
    });

    it('should analyze module with breakdown field only', async () => {
      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status'
      });

      expect(result).toEqual({
        total_count: 3,
        field_breakdown: {
          'Active': 2,
          'Inactive': 1
        },
        records: mockRecords
      });
      expect(mockCRMClient.getRecordsWithPagination).toHaveBeenCalledWith('CustomModule1', {
        page: 1,
        per_page: 200,
        fields: ['id', 'Status'],
        auto_paginate: true,
        max_records: 5000
      });
    });

    it('should analyze module with breakdown and numeric fields', async () => {
      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        numeric_field: 'Amount'
      });

      expect(result).toEqual({
        total_count: 3,
        field_breakdown: {
          'Active': 2,
          'Inactive': 1
        },
        numeric_breakdown: {
          'Active': 2500, // 1000 + 1500
          'Inactive': 2000
        },
        summary_stats: {
          total_sum: 4500,
          average: 1500,
          min: 1000,
          max: 2000
        },
        records: mockRecords
      });
      expect(mockCRMClient.getRecordsWithPagination).toHaveBeenCalledWith('CustomModule1', {
        page: 1,
        per_page: 200,
        fields: ['id', 'Status', 'Amount'],
        auto_paginate: true,
        max_records: 5000
      });
    });

    it('should analyze module with field filtering', async () => {
      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        filter_field: 'Status',
        filter_value: 'Active'
      });

      expect(result.total_count).toBe(3); // "Active" matches both "Active" and "Inactive" records
      expect(result.field_breakdown).toEqual({
        'Active': 2,
        'Inactive': 1
      });
    });

    it('should analyze module with date filtering', async () => {
      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        date_from: '2023-01-02',
        date_to: '2023-01-03'
      });

      expect(result.total_count).toBe(2); // Records 2 and 3
      expect(result.field_breakdown).toEqual({
        'Inactive': 1,
        'Active': 1
      });
    });

    it('should handle pagination parameters', async () => {
      await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        page: 2,
        per_page: 50
      });

      expect(mockCRMClient.getRecordsWithPagination).toHaveBeenCalledWith('CustomModule1', {
        page: 2,
        per_page: 50,
        fields: ['id', 'Status'],
        auto_paginate: true,
        max_records: 5000
      });
    });

    it('should handle module not found error', async () => {
      mockCRMClient.getModules.mockResolvedValue([]);

      await expect(genericModuleTools.analyzeCustomModule({
        module_name: 'NonExistentModule',
        breakdown_field: 'Status'
      })).rejects.toThrow('Module NonExistentModule not found or not accessible');
    });

    it('should handle API errors', async () => {
      mockCRMClient.getRecordsWithPagination.mockRejectedValue(new Error('API Error'));

      await expect(genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status'
      })).rejects.toThrow('API Error');
    });

    it('should handle unknown field values', async () => {
      const recordsWithNulls: ZohoCRMRecord[] = [
        { id: '1', Name: 'Record 1', Status: null },
        { id: '2', Name: 'Record 2', Status: undefined },
        { id: '3', Name: 'Record 3', Status: 'Active' }
      ];
      
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: recordsWithNulls,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status'
      });

      expect(result.field_breakdown).toEqual({
        'Unknown': 2,
        'Active': 1
      });
    });

    it('should handle object field values', async () => {
      const recordsWithObjects: ZohoCRMRecord[] = [
        { id: '1', Name: 'Record 1', Owner: { name: 'John Doe', id: 'user1' } },
        { id: '2', Name: 'Record 2', Owner: { name: 'Jane Smith', id: 'user2' } },
        { id: '3', Name: 'Record 3', Owner: { name: 'John Doe', id: 'user1' } }
      ];
      
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: recordsWithObjects,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Owner'
      });

      expect(result.field_breakdown).toEqual({
        'John Doe': 2,
        'Jane Smith': 1
      });
    });

    it('should handle numeric field with null values', async () => {
      const recordsWithNullAmounts: ZohoCRMRecord[] = [
        { id: '1', Status: 'Active', Amount: 1000 },
        { id: '2', Status: 'Active', Amount: null },
        { id: '3', Status: 'Inactive', Amount: 2000 }
      ];
      
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: recordsWithNullAmounts,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        numeric_field: 'Amount'
      });

      expect(result.numeric_breakdown).toEqual({
        'Active': 1000, // Only one valid amount
        'Inactive': 2000
      });
      expect(result.summary_stats).toEqual({
        total_sum: 3000,
        average: 1500,
        min: 1000,
        max: 2000
      });
    });

    it('should handle string numeric values', async () => {
      const recordsWithStringAmounts: ZohoCRMRecord[] = [
        { id: '1', Status: 'Active', Amount: '1000.50' },
        { id: '2', Status: 'Active', Amount: '2500' },
        { id: '3', Status: 'Inactive', Amount: 'invalid' }
      ];
      
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: recordsWithStringAmounts,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        numeric_field: 'Amount'
      });

      expect(result.numeric_breakdown).toEqual({
        'Active': 3500.5 // 1000.50 + 2500
        // 'Inactive' key not present when no valid numeric values
      });
    });
  });



  describe('error handling and edge cases', () => {
    it('should handle empty records result', async () => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: [],
        totalRecords: 0,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status'
      });

      expect(result).toEqual({
        total_count: 0,
        field_breakdown: {},
        records: []
      });
    });

    it('should handle case-insensitive filtering', async () => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockRecords,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        filter_field: 'Status',
        filter_value: 'ACTIVE' // Uppercase
      });

      expect(result.total_count).toBe(3); // "ACTIVE" matches both "Active" and "Inactive" records due to substring matching
    });

    it('should handle date filtering with invalid dates', async () => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
      mockCRMClient.getRecordsWithPagination.mockResolvedValue({
        data: mockRecords,
        totalRecords: 3,
        hasMore: false,
        currentPage: 1
      });

      const result = await genericModuleTools.analyzeCustomModule({
        module_name: 'CustomModule1',
        breakdown_field: 'Status',
        date_from: 'invalid-date'
      });

      // Should return all records if date filtering fails
      expect(result.total_count).toBe(3);
    });
  });
});