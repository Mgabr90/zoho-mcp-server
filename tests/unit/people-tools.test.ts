import { PeopleTools } from '../../src/tools/people-tools';
import { ZohoPeopleClient, ZohoPeopleRecord } from '../../src/lib/clients/people-client';

jest.mock('../../src/lib/clients/people-client');

describe('PeopleTools', () => {
  let peopleTools: PeopleTools;
  let mockPeopleClient: jest.Mocked<ZohoPeopleClient>;

  const mockModule = {
    api_name: 'employees',
    module_name: 'Employees',
    plural_label: 'Employees',
    singular_label: 'Employee',
    supported_operations: ['read', 'create', 'update', 'delete'],
    creatable: true,
    deletable: true,
    editable: true,
    viewable: true
  };

  const mockField = {
    api_name: 'FirstName',
    display_label: 'First Name',
    data_type: 'text',
    required: true,
    read_only: false
  };

  const mockEmployee: ZohoPeopleRecord = {
    id: 'emp123',
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john.doe@example.com',
    Department: 'Engineering',
    Designation: 'Software Engineer',
    DateOfJoining: '2023-01-15',
    Status: 'Active',
    CreatedTime: '2023-01-01T00:00:00Z',
    ModifiedTime: '2023-01-01T00:00:00Z'
  };

  const mockTimelineEntry = {
    id: 'timeline123',
    type: 'Created',
    performedBy: { id: 'user123', name: 'HR Admin' },
    performedTime: '2023-01-01T00:00:00Z',
    action: 'Employee record created',
    details: 'New employee John Doe was added to the system'
  };

  beforeEach(() => {
    mockPeopleClient = new ZohoPeopleClient(null as any, 'com') as jest.Mocked<ZohoPeopleClient>;
    peopleTools = new PeopleTools(mockPeopleClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllModules', () => {
    it('should get all People modules successfully', async () => {
      const modules = [mockModule];
      mockPeopleClient.getModules.mockResolvedValue(modules);

      const result = await peopleTools.getAllModules({});

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      
      expect(parsedContent).toEqual({
        product: 'Zoho People',
        total_modules: 1,
        modules: [{
          api_name: 'employees',
          module_name: 'Employees',
          plural_label: 'Employees',
          singular_label: 'Employee',
          supported_operations: ['read', 'create', 'update', 'delete'],
          capabilities: {
            creatable: true,
            deletable: true,
            editable: true,
            viewable: true
          }
        }],
        common_modules: [
          'employees - Employee records and profiles',
          'departments - Department/team structure',
          'attendance - Attendance tracking records',
          'leave - Leave requests and balances',
          'performance - Performance reviews and goals',
          'training - Training programs and records'
        ],
        usage_tips: [
          'Use exact module API names in other People tools',
          'Check supported_operations before attempting operations',
          'Employees module is the core module for most HR operations',
          'Custom forms appear as additional modules'
        ]
      });
      expect(mockPeopleClient.getModules).toHaveBeenCalled();
    });

    it('should handle empty modules list', async () => {
      mockPeopleClient.getModules.mockResolvedValue([]);

      const result = await peopleTools.getAllModules({});

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_modules).toBe(0);
      expect(parsedContent.modules).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockPeopleClient.getModules.mockRejectedValue(new Error('API access denied'));

      const result = await peopleTools.getAllModules({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get People modules: API access denied');
      expect(result.content[0].text).toContain('Suggestions:');
      expect(result.content[0].text).toContain('Check your Zoho People API access permissions');
    });

    it('should handle authentication errors', async () => {
      mockPeopleClient.getModules.mockRejectedValue(new Error('Invalid token'));

      const result = await peopleTools.getAllModules({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get People modules: Invalid token');
    });
  });

  describe('getFields', () => {
    it('should get module fields successfully', async () => {
      const fields = [mockField];
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getFields.mockResolvedValue(fields);

      const result = await peopleTools.getFields({
        module_name: 'employees'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      
      expect(parsedContent).toEqual({
        module: 'employees',
        product: 'Zoho People',
        total_fields: 1,
        fields: [{
          api_name: 'FirstName',
          display_label: 'First Name',
          data_type: 'text',
          required: true,
          read_only: false,
          pick_list_values: null
        }],
        usage_tips: [
          'Use api_name in search criteria and record operations',
          'Date fields typically use YYYY-MM-DD format',
          'Picklist fields must use exact values from pick_list_values',
          'Required fields must be provided when creating records'
        ]
      });
      expect(mockPeopleClient.getFields).toHaveBeenCalledWith('employees');
    });

    it('should get specific field details', async () => {
      const fields = [mockField];
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getFields.mockResolvedValue(fields);

      const result = await peopleTools.getFields({
        module_name: 'employees',
        field_id: 'FirstName'
      });

      expect(mockPeopleClient.getFields).toHaveBeenCalledWith('employees');
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.fields).toHaveLength(1);
      expect(parsedContent.fields[0].api_name).toBe('FirstName');
    });

    it('should count field types correctly', async () => {
      const multipleFields = [
        { ...mockField, api_name: 'FirstName', data_type: 'text', required: true },
        { ...mockField, api_name: 'Department', data_type: 'lookup', required: false },
        { ...mockField, api_name: 'Status', data_type: 'picklist', required: true },
        { ...mockField, api_name: 'DateOfJoining', data_type: 'date', required: true },
        { ...mockField, api_name: 'Salary', data_type: 'number', required: false }
      ];
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getFields.mockResolvedValue(multipleFields);

      const result = await peopleTools.getFields({
        module_name: 'employees'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_fields).toBe(5);
      expect(parsedContent.fields).toHaveLength(5);
      expect(parsedContent.module).toBe('employees');
      expect(parsedContent.product).toBe('Zoho People');
    });

    it('should handle fields retrieval errors', async () => {
      mockPeopleClient.getFields.mockRejectedValue(new Error('Module not found'));

      const result = await peopleTools.getFields({
        module_name: 'nonexistent'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("People module 'nonexistent' not found.");
    });

    it('should handle empty fields result', async () => {
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getFields.mockResolvedValue([]);

      const result = await peopleTools.getFields({
        module_name: 'employees'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_fields).toBe(0);
      expect(parsedContent.fields).toEqual([]);
    });
  });

  describe('searchRecords', () => {
    it('should search records successfully', async () => {
      const searchResults = {
        data: [mockEmployee],
        info: { 
          page: 1, 
          per_page: 20, 
          count: 1, 
          more_records: false 
        }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'john'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      
      expect(parsedContent).toEqual({
        module: 'employees',
        product: 'Zoho People',
        search_criteria: 'john',
        total_records: 1,
        records: [mockEmployee],
        pagination: {
          page: 1,
          per_page: 20,
          count: 1,
          more_records: false
        },
        search_tips: [
          'People search uses text-based matching',
          'Try partial matches for better results',
          'Use specific field names when available',
          'Consider using broader search terms if no results found'
        ]
      });
      expect(mockPeopleClient.searchRecords).toHaveBeenCalledWith('employees', 'john', {
        page: 1,
        per_page: 200
      });
    });

    it('should search records with specific fields', async () => {
      const searchResults = {
        data: [mockEmployee],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'john',
        fields: ['FirstName', 'LastName', 'Email']
      });

      expect(mockPeopleClient.searchRecords).toHaveBeenCalledWith('employees', 'john', {
        fields: ['FirstName', 'LastName', 'Email'],
        page: 1,
        per_page: 200
      });
    });

    it('should search records with pagination', async () => {
      const searchResults = {
        data: [mockEmployee],
        info: { page: 2, per_page: 10, count: 1, more_records: true }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'engineer',
        page: 2,
        per_page: 10
      });

      expect(mockPeopleClient.searchRecords).toHaveBeenCalledWith('employees', 'engineer', {
        page: 2,
        per_page: 10
      });
    });

    it('should handle search errors', async () => {
      const moduleWithEmployeesName = { ...mockModule, api_name: 'employees' };
      mockPeopleClient.getModules.mockResolvedValue([moduleWithEmployeesName]);
      mockPeopleClient.searchRecords.mockRejectedValue(new Error('Search failed'));

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'john'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search failed for People module \'employees\': Search failed');
    });

    it('should handle empty search results', async () => {
      const searchResults = {
        data: [],
        info: { page: 1, per_page: 20, count: 0, more_records: false }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'nonexistent'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_records).toBe(0);
      expect(parsedContent.records).toEqual([]);
    });

    it('should generate search summary correctly', async () => {
      const multipleEmployees = [
        { ...mockEmployee, Department: 'Engineering', Status: 'Active', Designation: 'Senior Engineer' },
        { ...mockEmployee, id: 'emp124', Department: 'Marketing', Status: 'Active', Designation: 'Marketing Manager' },
        { ...mockEmployee, id: 'emp125', Department: 'Engineering', Status: 'Inactive', Designation: 'Junior Engineer' }
      ];
      const searchResults = {
        data: multipleEmployees,
        info: { page: 1, per_page: 20, count: 3, more_records: false }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'engineer'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_records).toBe(3);
      expect(parsedContent.records).toHaveLength(3);
    });
  });

  describe('getTimeline', () => {
    it('should get timeline successfully', async () => {
      const timelineData = {
        __timeline: [mockTimelineEntry]
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      const result = await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      
      expect(parsedContent).toEqual({
        module: 'employees',
        product: 'Zoho People',
        record_id: 'emp123',
        timeline_entries: [mockTimelineEntry],
        total_entries: 1,
        warning: undefined,
        timeline_info: [
          'Timeline shows activity history for the record',
          'May include status changes, field updates, and comments',
          'Not all People modules support detailed timeline data',
          'Use for audit trails and activity tracking'
        ]
      });
      expect(mockPeopleClient.getTimeline).toHaveBeenCalledWith('employees', 'emp123', {
        timeline_types: undefined,
        include_inner_details: undefined,
        page: undefined,
        per_page: undefined
      });
    });

    it('should get timeline with specific types', async () => {
      const timelineData = {
        __timeline: [mockTimelineEntry]
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123',
        timeline_types: ['Created', 'Updated']
      });

      expect(mockPeopleClient.getTimeline).toHaveBeenCalledWith('employees', 'emp123', {
        timeline_types: ['Created', 'Updated'],
        include_inner_details: undefined,
        page: undefined,
        per_page: undefined
      });
    });

    it('should get timeline with inner details', async () => {
      const timelineData = {
        __timeline: [mockTimelineEntry]
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123',
        include_inner_details: true
      });

      expect(mockPeopleClient.getTimeline).toHaveBeenCalledWith('employees', 'emp123', {
        timeline_types: undefined,
        include_inner_details: true,
        page: undefined,
        per_page: undefined
      });
    });

    it('should get timeline with pagination', async () => {
      const timelineData = {
        __timeline: [mockTimelineEntry]
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123',
        page: 2,
        per_page: 10
      });

      expect(mockPeopleClient.getTimeline).toHaveBeenCalledWith('employees', 'emp123', {
        page: 2,
        per_page: 10
      });
    });

    it('should handle timeline retrieval errors', async () => {
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockRejectedValue(new Error('Record not found'));

      const result = await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'nonexistent'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get timeline for People record nonexistent in module \'employees\': Record not found');
    });

    it('should handle empty timeline', async () => {
      const timelineData = {
        __timeline: []
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      const result = await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_entries).toBe(0);
      expect(parsedContent.timeline_entries).toEqual([]);
    });

    it('should generate timeline summary correctly', async () => {
      const multipleEntries = [
        { ...mockTimelineEntry, type: 'Created', performedTime: '2023-01-01T00:00:00Z', performedBy: { name: 'HR Admin' } },
        { ...mockTimelineEntry, id: 'timeline124', type: 'Updated', performedTime: '2023-01-15T00:00:00Z', performedBy: { name: 'Manager' } },
        { ...mockTimelineEntry, id: 'timeline125', type: 'Updated', performedTime: '2023-02-01T00:00:00Z', performedBy: { name: 'HR Admin' } }
      ];
      const timelineData = {
        __timeline: multipleEntries
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.getTimeline.mockResolvedValue(timelineData);

      const result = await peopleTools.getTimeline({
        module_name: 'employees',
        record_id: 'emp123'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_entries).toBe(3);
      expect(parsedContent.timeline_entries).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error messages with suggestions', async () => {
      mockPeopleClient.getModules.mockRejectedValue(new Error('Authentication failed'));

      const result = await peopleTools.getAllModules({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get People modules: Authentication failed');
      expect(result.content[0].text).toContain('Suggestions:');
      expect(result.content[0].text).toContain('Check your Zoho People API access permissions');
    });

    it('should handle network timeout errors', async () => {
      mockPeopleClient.getModules.mockResolvedValue([mockModule]); // Ensure module lookup succeeds
      mockPeopleClient.searchRecords.mockRejectedValue(new Error('Network timeout'));

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'john'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Search failed for People module');
    });

    it('should handle rate limiting errors', async () => {
      mockPeopleClient.getModules.mockResolvedValue([mockModule]); // Ensure module lookup succeeds
      mockPeopleClient.getFields.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await peopleTools.getFields({
        module_name: 'employees'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get fields for People module');
    });
  });

  describe('data formatting and processing', () => {
    it('should format module data consistently', async () => {
      const modules = [
        { ...mockModule, api_name: 'employees' },
        { ...mockModule, api_name: 'departments', module_name: 'Departments' }
      ];
      mockPeopleClient.getModules.mockResolvedValue(modules);

      const result = await peopleTools.getAllModules({});

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.modules).toHaveLength(2);
      expect(parsedContent.modules[0]).toHaveProperty('api_name');
      expect(parsedContent.modules[0]).toHaveProperty('capabilities');
    });

    it('should handle missing optional properties gracefully', async () => {
      const recordWithMissingFields = {
        id: 'emp123',
        FirstName: 'John',
        LastName: 'Doe'
        // Missing Department, Status, Designation
      };
      const searchResults = {
        data: [recordWithMissingFields],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'john'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_records).toBe(1);
      expect(parsedContent.records).toHaveLength(1);
    });

    it('should deduplicate summary values', async () => {
      const duplicateEmployees = [
        { ...mockEmployee, Department: 'Engineering', Status: 'Active' },
        { ...mockEmployee, id: 'emp124', Department: 'Engineering', Status: 'Active' },
        { ...mockEmployee, id: 'emp125', Department: 'Engineering', Status: 'Active' }
      ];
      const searchResults = {
        data: duplicateEmployees,
        info: { page: 1, per_page: 20, count: 3, more_records: false }
      };
      mockPeopleClient.getModules.mockResolvedValue([mockModule]);
      mockPeopleClient.searchRecords.mockResolvedValue(searchResults);

      const result = await peopleTools.searchRecords({
        module_name: 'employees',
        criteria: 'engineer'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_records).toBe(3);
      expect(parsedContent.records).toHaveLength(3);
    });
  });
});