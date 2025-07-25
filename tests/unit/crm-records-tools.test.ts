import { CRMRecordsTools } from '../../src/tools/crm-records-tools';
import { ZohoCRMClient } from '../../src/lib/clients/crm-client';
import { ZohoCRMRecord, ZohoCRMModule, ZohoCRMField } from '../../src/lib/types';

jest.mock('../../src/lib/clients/crm-client');

describe('CRMRecordsTools', () => {
  let crmRecordsTools: CRMRecordsTools;
  let mockCRMClient: jest.Mocked<ZohoCRMClient>;

  const mockRecord: ZohoCRMRecord = {
    id: '123456789',
    First_Name: 'John',
    Last_Name: 'Doe',
    Email: 'john.doe@example.com',
    Phone: '+1234567890',
    Account_Name: { name: 'Test Company' },
    Created_Time: '2023-01-01T00:00:00+00:00',
    Modified_Time: '2023-01-01T00:00:00+00:00'
  };

  const mockModule: ZohoCRMModule = {
    api_name: 'Leads',
    module_name: 'Leads',
    plural_label: 'Leads',
    singular_label: 'Lead',
    supported_operations: ['read', 'create', 'update', 'delete']
  };

  const mockField: ZohoCRMField = {
    api_name: 'First_Name',
    display_label: 'First Name',
    data_type: 'text',
    required: true,
    read_only: false,
    field_read_only: false,
    custom_field: false,
    id: '123456789'
  };

  beforeEach(() => {
    mockCRMClient = new ZohoCRMClient(null as any, 'com') as jest.Mocked<ZohoCRMClient>;
    crmRecordsTools = new CRMRecordsTools(mockCRMClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFields', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should get fields for a valid module', async () => {
      mockCRMClient.getFields.mockResolvedValue([mockField]);

      const result = await crmRecordsTools.getFields({
        module_name: 'Leads'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.module).toBe('Leads');
      expect(parsedContent.fields).toHaveLength(1);
      expect(parsedContent.fields[0].api_name).toBe('First_Name');
      expect(mockCRMClient.getFields).toHaveBeenCalledWith('Leads');
    });

    it('should get specific field by ID', async () => {
      mockCRMClient.getFields.mockResolvedValue([mockField]);

      const result = await crmRecordsTools.getFields({
        module_name: 'Leads',
        field_id: 'First_Name'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.fields).toHaveLength(1);
      expect(mockCRMClient.getFields).toHaveBeenCalledWith('Leads');
    });

    it('should handle module not found error', async () => {
      mockCRMClient.getModules.mockResolvedValue([]);

      const result = await crmRecordsTools.getFields({
        module_name: 'NonExistent'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Module 'NonExistent' not found");
    });

    it('should handle API errors', async () => {
      mockCRMClient.getFields.mockRejectedValue(new Error('API Error'));

      const result = await crmRecordsTools.getFields({
        module_name: 'Leads'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get fields for module');
    });
  });

  describe('validateCriteria', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
      mockCRMClient.getFields.mockResolvedValue([mockField]);
    });

    it('should validate correct criteria format', async () => {
      const result = await crmRecordsTools.validateCriteria({
        module_name: 'Leads',
        criteria: '((First_Name:equals:John))'
      });

      expect(result.content[0].type).toBe("text");
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.format_valid).toBe(true);
      expect(parsedContent.fields_validation).toBeDefined();
    });

    it('should reject invalid criteria format', async () => {
      const result = await crmRecordsTools.validateCriteria({
        module_name: 'Leads',
        criteria: 'First_Name equals John'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid criteria format');
      expect(result.content[0].text).toContain('Correct format: ((field_API_name:operator:value))');
    });

    it('should handle field validation with operators', async () => {
      const result = await crmRecordsTools.validateCriteria({
        module_name: 'Leads',
        criteria: '((First_Name:equals:John))'
      });

      expect(result.content[0].type).toBe("text");
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.fields_validation[0].field_name).toBe('First_Name');
      expect(parsedContent.fields_validation[0].exists).toBe(true);
    });

    it('should validate compound criteria', async () => {
      const result = await crmRecordsTools.validateCriteria({
        module_name: 'Leads',
        criteria: '((First_Name:equals:John) and (Last_Name:equals:Doe))'
      });

      expect(result.content[0].type).toBe("text");
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.format_valid).toBe(true);
      expect(parsedContent.fields_validation).toHaveLength(2);
    });
  });

  describe('getRecords', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should get records with basic parameters', async () => {
      const mockResponse = {
        data: [mockRecord],
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      };
      mockCRMClient.getRecords.mockResolvedValue(mockResponse);

      const result = await crmRecordsTools.getRecords({
        module_name: 'Leads',
        fields: ['First_Name', 'Last_Name', 'Email'],
        page: 1,
        per_page: 20
      });

      expect(result).toEqual(mockResponse);
      expect(mockCRMClient.getRecords).toHaveBeenCalledWith('Leads', {
        fields: ['First_Name', 'Last_Name', 'Email'],
        page: 1,
        per_page: 20
      });
    });

    it('should handle module not found error', async () => {
      mockCRMClient.getModules.mockResolvedValue([]);

      await expect(crmRecordsTools.getRecords({
        module_name: 'NonExistent'
      })).rejects.toThrow('Failed to get records from NonExistent: Module NonExistent not found or not accessible');
    });

    it('should handle API errors', async () => {
      mockCRMClient.getRecords.mockRejectedValue(new Error('API Error'));

      await expect(crmRecordsTools.getRecords({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get records from Leads: API Error');
    });
  });

  describe('createRecord', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should create record successfully', async () => {
      const recordData = {
        First_Name: 'Jane',
        Last_Name: 'Smith',
        Email: 'jane.smith@example.com'
      };
      mockCRMClient.createRecord.mockResolvedValue({ ...mockRecord, ...recordData });

      const result = await crmRecordsTools.createRecord({
        module_name: 'Leads',
        data: recordData
      });

      expect(result).toEqual({ ...mockRecord, ...recordData });
      expect(mockCRMClient.createRecord).toHaveBeenCalledWith('Leads', recordData);
    });

    it('should create record with workflow trigger', async () => {
      const recordData = {
        First_Name: 'Jane',
        Last_Name: 'Smith',
        Email: 'jane.smith@example.com'
      };
      mockCRMClient.createRecord.mockResolvedValue({ ...mockRecord, ...recordData });

      await crmRecordsTools.createRecord({
        module_name: 'Leads',
        data: recordData,
        trigger_workflow: true
      });

      expect(mockCRMClient.createRecord).toHaveBeenCalledWith('Leads', recordData);
    });

    it('should handle module not found error', async () => {
      mockCRMClient.getModules.mockResolvedValue([]);

      await expect(crmRecordsTools.createRecord({
        module_name: 'NonExistent',
        data: {}
      })).rejects.toThrow('Failed to create record in NonExistent: Module NonExistent not found or not accessible');
    });

    it('should handle creation errors', async () => {
      mockCRMClient.createRecord.mockRejectedValue(new Error('Validation failed'));

      await expect(crmRecordsTools.createRecord({
        module_name: 'Leads',
        data: { First_Name: 'Jane' }
      })).rejects.toThrow('Failed to create record in Leads: Validation failed');
    });
  });

  describe('updateRecord', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should update record successfully', async () => {
      const updateData = { Email: 'updated@example.com' };
      const updatedRecord = { ...mockRecord, ...updateData };
      mockCRMClient.updateRecord.mockResolvedValue(updatedRecord);

      const result = await crmRecordsTools.updateRecord({
        module_name: 'Leads',
        record_id: '123456789',
        data: updateData
      });

      expect(result).toEqual(updatedRecord);
      expect(mockCRMClient.updateRecord).toHaveBeenCalledWith('Leads', '123456789', updateData);
    });

    it('should update record with workflow trigger', async () => {
      const updateData = { Email: 'updated@example.com' };
      mockCRMClient.updateRecord.mockResolvedValue({ ...mockRecord, ...updateData });

      await crmRecordsTools.updateRecord({
        module_name: 'Leads',
        record_id: '123456789',
        data: updateData,
        trigger_workflow: true
      });

      expect(mockCRMClient.updateRecord).toHaveBeenCalledWith('Leads', '123456789', updateData);
    });

    it('should handle update errors', async () => {
      mockCRMClient.updateRecord.mockRejectedValue(new Error('Record not found'));

      await expect(crmRecordsTools.updateRecord({
        module_name: 'Leads',
        record_id: '123456789',
        data: { Email: 'updated@example.com' }
      })).rejects.toThrow('Failed to update record 123456789 in Leads: Record not found');
    });
  });

  describe('deleteRecords', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should delete records successfully', async () => {
      mockCRMClient.deleteRecord.mockResolvedValue(undefined);

      const result = await crmRecordsTools.deleteRecords({
        module_name: 'Leads',
        record_ids: ['123456789']
      });

      expect(result).toBeUndefined();
      expect(mockCRMClient.deleteRecord).toHaveBeenCalledWith('Leads', '123456789');
    });

    it('should delete records with workflow trigger', async () => {
      mockCRMClient.deleteRecord.mockResolvedValue(undefined);

      await crmRecordsTools.deleteRecords({
        module_name: 'Leads',
        record_ids: ['123456789'],
        trigger_workflow: true
      });

      expect(mockCRMClient.deleteRecord).toHaveBeenCalledWith('Leads', '123456789');
    });

    it('should handle deletion errors', async () => {
      mockCRMClient.deleteRecord.mockRejectedValue(new Error('Permission denied'));

      await expect(crmRecordsTools.deleteRecords({
        module_name: 'Leads',
        record_ids: ['123456789']
      })).rejects.toThrow('Failed to delete records from Leads: Permission denied');
    });
  });

  describe('searchRecords', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should search records with criteria', async () => {
      const searchResults = {
        data: [mockRecord],
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      };
      mockCRMClient.searchRecords.mockResolvedValue(searchResults);

      const result = await crmRecordsTools.searchRecords({
        module_name: 'Leads',
        criteria: '((First_Name:equals:John))',
        fields: ['First_Name', 'Last_Name', 'Email']
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.module).toBe('Leads');
      expect(parsedContent.total_records).toBe(1);
      expect(parsedContent.records).toHaveLength(1);
      expect(mockCRMClient.searchRecords).toHaveBeenCalledWith('Leads', '((First_Name:equals:John))', {
        fields: ['First_Name', 'Last_Name', 'Email'],
        page: 1,
        per_page: 200
      });
    });

    it('should search records by email', async () => {
      const searchResults = {
        data: [mockRecord],
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      };
      mockCRMClient.searchRecords.mockResolvedValue(searchResults);

      const result = await crmRecordsTools.searchRecords({
        module_name: 'Leads',
        criteria: '((Email:equals:john@example.com))',
        email: 'john@example.com'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.module).toBe('Leads');
      expect(parsedContent.total_records).toBe(1);
      expect(mockCRMClient.searchRecords).toHaveBeenCalledWith('Leads', '((Email:equals:john@example.com))', {
        fields: undefined,
        page: 1,
        per_page: 200
      });
    });

    it('should handle search errors', async () => {
      mockCRMClient.searchRecords.mockRejectedValue(new Error('Invalid search criteria'));

      const result = await crmRecordsTools.searchRecords({
        module_name: 'Leads',
        criteria: '((First_Name:equals:John))'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search failed for module \'Leads\': Invalid search criteria');
    });
  });

  describe('createRecordsBulk', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should bulk create records successfully', async () => {
      const recordsData = [
        { First_Name: 'John', Last_Name: 'Doe', Email: 'john@example.com' },
        { First_Name: 'Jane', Last_Name: 'Smith', Email: 'jane@example.com' }
      ];
      const bulkResponse = {
        data: [
          { code: 'SUCCESS', details: { id: '123456789' } },
          { code: 'SUCCESS', details: { id: '123456790' } }
        ]
      };
      mockCRMClient.createRecordsBulk.mockResolvedValue(bulkResponse);

      const result = await crmRecordsTools.createRecordsBulk({
        module_name: 'Leads',
        data: recordsData
      });

      expect(result).toEqual(bulkResponse);
      expect(mockCRMClient.createRecordsBulk).toHaveBeenCalledWith('Leads', recordsData, { trigger_workflow: undefined });
    });

    it('should handle bulk create errors', async () => {
      mockCRMClient.createRecordsBulk.mockRejectedValue(new Error('Bulk operation failed'));

      await expect(crmRecordsTools.createRecordsBulk({
        module_name: 'Leads',
        data: [{ First_Name: 'John' }]
      })).rejects.toThrow('Failed to create records in Leads: Bulk operation failed');
    });
  });

  describe('getTimeline', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should get timeline for a record', async () => {
      const timelineData = {
        data: [
          {
            id: 'timeline-1',
            type: 'Created',
            performed_by: { name: 'Admin User' },
            performed_time: '2023-01-01T00:00:00+00:00',
            action: 'Created'
          }
        ],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockCRMClient.getTimeline.mockResolvedValue(timelineData);

      const result = await crmRecordsTools.getTimeline({
        module_name: 'Leads',
        record_id: '123456789'
      });

      expect(result).toEqual(timelineData);
      expect(mockCRMClient.getTimeline).toHaveBeenCalledWith('Leads', '123456789', {
        timeline_types: undefined,
        include_inner_details: undefined,
        page: undefined,
        per_page: undefined
      });
    });

    it('should get timeline with specific types', async () => {
      const timelineData = {
        data: [],
        info: { page: 1, per_page: 20, count: 0, more_records: false }
      };
      mockCRMClient.getTimeline.mockResolvedValue(timelineData);

      await crmRecordsTools.getTimeline({
        module_name: 'Leads',
        record_id: '123456789',
        timeline_types: ['Created', 'Updated'],
        include_inner_details: true
      });

      expect(mockCRMClient.getTimeline).toHaveBeenCalledWith('Leads', '123456789', {
        timeline_types: ['Created', 'Updated'],
        include_inner_details: true,
        page: undefined,
        per_page: undefined
      });
    });

    it('should handle timeline errors', async () => {
      mockCRMClient.getTimeline.mockRejectedValue(new Error('Record not found'));

      await expect(crmRecordsTools.getTimeline({
        module_name: 'Leads',
        record_id: '123456789'
      })).rejects.toThrow('Failed to get timeline for record 123456789 in Leads: Record not found');
    });
  });

  describe('getRecordCount', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should get record count for module', async () => {
      mockCRMClient.getRecordCount.mockResolvedValue({ count: 150 });

      const result = await crmRecordsTools.getRecordCount({
        module_name: 'Leads'
      });

      expect(result).toEqual({ count: 150 });
      expect(mockCRMClient.getRecordCount).toHaveBeenCalledWith('Leads', {});
    });

    it('should get record count with criteria', async () => {
      mockCRMClient.getRecordCount.mockResolvedValue({ count: 25 });

      const result = await crmRecordsTools.getRecordCount({
        module_name: 'Leads',
        criteria: '((Lead_Status:equals:Qualified))'
      });

      expect(result).toEqual({ count: 25 });
      expect(mockCRMClient.getRecordCount).toHaveBeenCalledWith('Leads', {
        criteria: '((Lead_Status:equals:Qualified))'
      });
    });

    it('should handle count errors', async () => {
      mockCRMClient.getRecordCount.mockRejectedValue(new Error('Count failed'));

      await expect(crmRecordsTools.getRecordCount({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get record count from Leads: Count failed');
    });
  });

  describe('cloneRecord', () => {
    beforeEach(() => {
      mockCRMClient.getModules.mockResolvedValue([mockModule]);
    });

    it('should clone record successfully', async () => {
      const clonedRecord = { ...mockRecord, id: '987654321' };
      mockCRMClient.cloneRecord.mockResolvedValue(clonedRecord);

      const result = await crmRecordsTools.cloneRecord({
        module_name: 'Leads',
        record_id: '123456789'
      });

      expect(result).toEqual(clonedRecord);
      expect(mockCRMClient.cloneRecord).toHaveBeenCalledWith('Leads', '123456789', { trigger_workflow: undefined });
    });

    it('should handle clone errors', async () => {
      mockCRMClient.cloneRecord.mockRejectedValue(new Error('Clone failed'));

      await expect(crmRecordsTools.cloneRecord({
        module_name: 'Leads',
        record_id: '123456789'
      })).rejects.toThrow('Failed to clone record 123456789 in Leads: Clone failed');
    });
  });
});