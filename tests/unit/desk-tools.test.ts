import { DeskTools } from '../../src/tools/desk-tools';
import { ZohoDeskClient, ZohoDeskDepartment, ZohoDeskRecord, ZohoDeskField } from '../../src/lib/clients/desk-client';

jest.mock('../../src/lib/clients/desk-client');

describe('DeskTools', () => {
  let deskTools: DeskTools;
  let mockDeskClient: jest.Mocked<ZohoDeskClient>;

  const mockDepartment: ZohoDeskDepartment = {
    id: 'dept123',
    name: 'Technical Support',
    description: 'Technical support department',
    isEnabled: true,
    hasLogo: false,
    logoUrl: undefined,
    createdTime: '2023-01-01T00:00:00Z',
    modifiedTime: '2023-01-01T00:00:00Z'
  };

  const mockTicket: ZohoDeskRecord = {
    id: 'ticket123',
    ticketNumber: 'T-001',
    subject: 'Test ticket',
    status: 'Open',
    priority: 'High',
    assigneeId: 'agent123',
    contactId: 'contact123',
    departmentId: 'dept123',
    createdTime: '2023-01-01T00:00:00Z',
    modifiedTime: '2023-01-01T00:00:00Z'
  };

  const mockField: ZohoDeskField = {
    id: 'field123',
    apiName: 'subject',
    displayLabel: 'Subject',
    dataType: 'text',
    isRequired: true,
    isVisible: true,
    isCustomField: false,
    maxLength: 255
  };

  const mockTimelineEntry = {
    id: 'timeline123',
    type: 'Created',
    actor: { id: 'user123', name: 'Admin User', type: 'user' },
    content: { action: 'Ticket created', details: 'Ticket was created by customer' },
    createdTime: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    mockDeskClient = new ZohoDeskClient(null as any, 'com') as jest.Mocked<ZohoDeskClient>;
    mockDeskClient.getAllEntities = jest.fn();
    deskTools = new DeskTools(mockDeskClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDepartments', () => {
    it('should get all departments successfully', async () => {
      const departments = [mockDepartment];
      mockDeskClient.getDepartments.mockResolvedValue(departments);

      const result = await deskTools.getAllDepartments({});

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.product).toBe('Zoho Desk');
      expect(parsedContent.total_departments).toBe(1);
      expect(parsedContent.departments).toHaveLength(1);
      expect(parsedContent.departments[0]).toEqual({
        id: 'dept123',
        name: 'Technical Support',
        description: 'Technical support department',
        is_enabled: true,
        has_logo: false,
        logo_url: undefined,
        created_time: '2023-01-01T00:00:00Z',
        modified_time: '2023-01-01T00:00:00Z'
      });
      expect(mockDeskClient.getDepartments).toHaveBeenCalled();
    });

    it('should handle empty departments list', async () => {
      mockDeskClient.getDepartments.mockResolvedValue([]);

      const result = await deskTools.getAllDepartments({});

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_departments).toBe(0);
      expect(parsedContent.departments).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockDeskClient.getDepartments.mockRejectedValue(new Error('API Error'));

      const result = await deskTools.getAllDepartments({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get Desk departments');
    });

    it('should filter active departments correctly', async () => {
      const departments = [
        { ...mockDepartment, id: 'dept1', isEnabled: true },
        { ...mockDepartment, id: 'dept2', isEnabled: false },
        { ...mockDepartment, id: 'dept3', isEnabled: true }
      ];
      mockDeskClient.getDepartments.mockResolvedValue(departments);

      const result = await deskTools.getAllDepartments({});

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_departments).toBe(3);
      expect(parsedContent.departments).toHaveLength(3);
      expect(parsedContent.departments.filter((d: any) => d.is_enabled)).toHaveLength(2);
    });
  });

  describe('getEntityFields', () => {
    it('should get entity fields successfully', async () => {
      const fields = [mockField];
      mockDeskClient.getEntityFields.mockResolvedValue(fields);

      const result = await deskTools.getEntityFields({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.product).toBe('Zoho Desk');
      expect(parsedContent.department_id).toBe('dept123');
      expect(parsedContent.entity_type).toBe('tickets');
      expect(parsedContent.total_fields).toBe(1);
      expect(parsedContent.all_fields).toHaveLength(1);
      expect(parsedContent.all_fields[0]).toEqual({
        id: 'field123',
        api_name: 'subject',
        display_label: 'Subject',
        data_type: 'text',
        is_required: true,
        is_visible: true,
        is_custom_field: false,
        default_value: undefined,
        max_length: 255,
        precision: undefined,
        picklist_values: undefined,
        lookup_details: undefined
      });
      expect(mockDeskClient.getEntityFields).toHaveBeenCalledWith('dept123', 'tickets');
    });

    it('should handle field retrieval errors', async () => {
      mockDeskClient.getEntityFields.mockRejectedValue(new Error('Invalid department or entity type'));

      const result = await deskTools.getEntityFields({
        department_id: 'invalid',
        entity_type: 'tickets'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get entity fields');
    });

    it('should count required and optional fields correctly', async () => {
      const fields = [
        { ...mockField, apiName: 'subject', isRequired: true },
        { ...mockField, apiName: 'description', isRequired: false },
        { ...mockField, apiName: 'priority', isRequired: true }
      ];
      mockDeskClient.getEntityFields.mockResolvedValue(fields);

      const result = await deskTools.getEntityFields({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_fields).toBe(3);
      expect(parsedContent.fields_by_type.required_fields).toHaveLength(2);
      expect(parsedContent.all_fields.filter((f: any) => !f.is_required)).toHaveLength(1);
    });
  });

  describe('searchEntities', () => {
    it('should search entities with basic parameters', async () => {
      const searchResults = {
        data: [mockTicket],
        info: { 
          page: 1,
          per_page: 20, 
          count: 1, 
          more_records: false 
        }
      };
      mockDeskClient.searchEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets',
        search_str: 'test ticket'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.product).toBe('Zoho Desk');
      expect(parsedContent.department_id).toBe('dept123');
      expect(parsedContent.entity_type).toBe('tickets');
      expect(parsedContent.search_params.search_str).toBe('test ticket');
      expect(parsedContent.results.total_records).toBe(1);
      expect(parsedContent.results.returned_records).toBe(1);
      expect(parsedContent.results.records).toHaveLength(1);
      expect(mockDeskClient.searchEntities).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        expect.objectContaining({ searchStr: 'test ticket' })
      );
    });

    it('should search entities by email', async () => {
      const searchResults = {
        data: [mockTicket],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockDeskClient.searchEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'contacts',
        email: 'test@example.com'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.search_params.email).toBe('test@example.com');
      expect(mockDeskClient.searchEntities).toHaveBeenCalledWith(
        'dept123',
        'contacts',
        expect.objectContaining({ email: 'test@example.com' })
      );
    });

    it('should search entities by phone', async () => {
      const searchResults = {
        data: [mockTicket],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockDeskClient.searchEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'contacts',
        phone: '+1234567890'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.search_params.phone).toBe('+1234567890');
      expect(mockDeskClient.searchEntities).toHaveBeenCalledWith(
        'dept123',
        'contacts',
        expect.objectContaining({ phone: '+1234567890' })
      );
    });

    it('should search entities with auto-pagination', async () => {
      const searchResults = {
        data: [mockTicket],
        totalRecords: 1,
        hasMore: false,
        currentPage: 1
      };
      mockDeskClient.getAllEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets',
        auto_paginate: true,
        max_records: 100
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.search_params.auto_paginate).toBe(true);
      expect(mockDeskClient.getAllEntities).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        expect.objectContaining({ 
          auto_paginate: true,
          max_records: 100
        })
      );
    });

    it('should search entities with specific fields', async () => {
      const searchResults = {
        data: [mockTicket],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockDeskClient.searchEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets',
        fields: ['subject', 'status', 'priority']
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.results.records).toHaveLength(1);
      expect(mockDeskClient.searchEntities).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        expect.objectContaining({ 
          fields: ['subject', 'status', 'priority']
        })
      );
    });

    it('should handle search errors', async () => {
      mockDeskClient.searchEntities.mockRejectedValue(new Error('Search failed'));

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to search entities');
    });

    it('should validate department and entity type', async () => {
      mockDeskClient.searchEntities.mockRejectedValue(new Error('Invalid department ID'));

      const result = await deskTools.searchEntities({
        department_id: 'invalid',
        entity_type: 'tickets'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to search entities');
    });
  });

  describe('getEntityTimeline', () => {
    it('should get entity timeline successfully', async () => {
      const timelineData = {
        data: [mockTimelineEntry],
        info: { 
          page: 1, 
          per_page: 20, 
          count: 1, 
          more_records: false 
        }
      };
      mockDeskClient.getEntityTimeline.mockResolvedValue(timelineData);

      const result = await deskTools.getEntityTimeline({
        department_id: 'dept123',
        entity_type: 'tickets',
        record_id: 'ticket123'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.product).toBe('Zoho Desk');
      expect(parsedContent.department_id).toBe('dept123');
      expect(parsedContent.entity_type).toBe('tickets');
      expect(parsedContent.record_id).toBe('ticket123');
      expect(parsedContent.timeline_entries).toHaveLength(1);
      expect(mockDeskClient.getEntityTimeline).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        'ticket123',
        expect.objectContaining({ from: 0, limit: 20 })
      );
    });

    it('should get timeline with specific includes', async () => {
      const timelineData = {
        data: [mockTimelineEntry],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockDeskClient.getEntityTimeline.mockResolvedValue(timelineData);

      const result = await deskTools.getEntityTimeline({
        department_id: 'dept123',
        entity_type: 'tickets',
        record_id: 'ticket123',
        include: ['attachments', 'comments']
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.timeline_entries).toHaveLength(1);
      expect(mockDeskClient.getEntityTimeline).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        'ticket123',
        expect.objectContaining({ 
          include: ['attachments', 'comments']
        })
      );
    });

    it('should get timeline with pagination', async () => {
      const timelineData = {
        data: [mockTimelineEntry],
        info: { page: 3, per_page: 10, count: 1, more_records: true }
      };
      mockDeskClient.getEntityTimeline.mockResolvedValue(timelineData);

      const result = await deskTools.getEntityTimeline({
        department_id: 'dept123',
        entity_type: 'tickets',
        record_id: 'ticket123',
        from: 20,
        limit: 10
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.timeline_entries).toHaveLength(1);
      expect(mockDeskClient.getEntityTimeline).toHaveBeenCalledWith(
        'dept123',
        'tickets',
        'ticket123',
        expect.objectContaining({ 
          from: 20,
          limit: 10
        })
      );
    });

    it('should handle timeline retrieval errors', async () => {
      mockDeskClient.getEntityTimeline.mockRejectedValue(new Error('Record not found'));

      const result = await deskTools.getEntityTimeline({
        department_id: 'dept123',
        entity_type: 'tickets',
        record_id: 'nonexistent'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get entity timeline');
    });

    it('should handle empty timeline', async () => {
      const timelineData = {
        data: [],
        info: { page: 1, per_page: 20, count: 0, more_records: false }
      };
      mockDeskClient.getEntityTimeline.mockResolvedValue(timelineData);

      const result = await deskTools.getEntityTimeline({
        department_id: 'dept123',
        entity_type: 'tickets',
        record_id: 'ticket123'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.timeline_entries).toEqual([]);
      expect(parsedContent.timeline_summary.total_activities).toBe(0);
    });

    it('should validate required parameters', async () => {
      // This would be caught by Zod validation, but testing the error handling
      const result = await deskTools.getEntityTimeline({
        department_id: '',
        entity_type: 'tickets',
        record_id: 'ticket123'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid parameters');
    });
  });

  describe('error handling', () => {
    it('should provide helpful error messages with suggestions', async () => {
      mockDeskClient.getDepartments.mockRejectedValue(new Error('Authentication failed'));

      const result = await deskTools.getAllDepartments({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get Desk departments');
      expect(result.content[0].text).toContain('Suggestions:');
    });

    it('should handle network timeout errors', async () => {
      mockDeskClient.searchEntities.mockRejectedValue(new Error('Network timeout'));

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to search entities');
    });

    it('should handle rate limiting errors', async () => {
      mockDeskClient.getEntityFields.mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await deskTools.getEntityFields({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get entity fields');
    });
  });

  describe('data formatting', () => {
    it('should format department data consistently', async () => {
      const departments = [
        { ...mockDepartment, supportedEntityTypes: ['tickets', 'contacts'] }
      ];
      mockDeskClient.getDepartments.mockResolvedValue(departments);

      const result = await deskTools.getAllDepartments({});

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.departments[0]).toHaveProperty('id');
      expect(parsedContent.departments[0]).toHaveProperty('name');
      expect(parsedContent.departments[0]).toHaveProperty('is_enabled');
      expect(parsedContent.supported_entities).toBeDefined();
    });

    it('should format field data with proper counts', async () => {
      const fields = [
        { ...mockField, isRequired: true },
        { ...mockField, apiName: 'optional_field', isRequired: false }
      ];
      mockDeskClient.getEntityFields.mockResolvedValue(fields);

      const result = await deskTools.getEntityFields({
        department_id: 'dept123',
        entity_type: 'tickets'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.total_fields).toBe(2);
      expect(parsedContent.fields_by_type.required_fields).toHaveLength(1);
      expect(parsedContent.all_fields.filter((f: any) => !f.is_required)).toHaveLength(1);
    });

    it('should format search results with metadata', async () => {
      const searchResults = {
        data: [mockTicket],
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      };
      mockDeskClient.searchEntities.mockResolvedValue(searchResults);

      const result = await deskTools.searchEntities({
        department_id: 'dept123',
        entity_type: 'tickets',
        search_str: 'test'
      });

      expect(result.content[0].type).toBe('text');
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toHaveProperty('results');
      expect(parsedContent).toHaveProperty('department_id');
      expect(parsedContent).toHaveProperty('entity_type');
      expect(parsedContent).toHaveProperty('search_params');
      expect(parsedContent.results).toHaveProperty('records');
    });
  });
});