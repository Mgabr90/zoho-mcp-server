import { CRMTasksTools } from '../../src/tools/crm-activities-tools';
import { ZohoCRMClient } from '../../src/lib/clients/crm-client';
import { ZohoCRMTask } from '../../src/lib/types';

// Create a simpler mock that satisfies the interface
const mockCRMClient = {
  getTasks: jest.fn(),
  getTask: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn()
} as unknown as jest.Mocked<ZohoCRMClient>;

describe('CRMTasksTools', () => {
  let crmTasksTools: CRMTasksTools;

  beforeEach(() => {
    jest.clearAllMocks();
    crmTasksTools = new CRMTasksTools(mockCRMClient);
  });

  describe('getTasks', () => {
    it('should return tasks successfully', async () => {
      const mockTasks: ZohoCRMTask[] = [
        {
          id: '1',
          Subject: 'Test Task',
          Status: 'Not Started',
          Priority: 'High',
          Due_Date: '2023-12-31',
          What_Id: 'contact-1',
          Who_Id: 'user-1',
          Description: 'Test task description',
          Closed_Time: '',
          Created_Time: '2023-01-01T00:00:00Z',
          Modified_Time: '2023-01-01T00:00:00Z',
          Owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com', full_name: 'John Doe' },
          Related_To: 'Deal',
          Remind_At: '2023-12-30T09:00:00Z',
          Recurring_Activity: 'None'
        }
      ];

      mockCRMClient.getTasks.mockResolvedValue({
        data: mockTasks,
        info: { page: 1, per_page: 20, count: 1, more_records: false }
      });

      const result = await crmTasksTools.getTasks({ page: 1, per_page: 20 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTasks);
        expect(result.pagination).toEqual({ page: 1, per_page: 20, count: 1, more_records: false });
      }
      expect(mockCRMClient.getTasks).toHaveBeenCalledWith({ page: 1, per_page: 20 });
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Failed to fetch tasks';
      mockCRMClient.getTasks.mockRejectedValue(new Error(errorMessage));

      const result = await crmTasksTools.getTasks({ page: 1, per_page: 20 });

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.error).toContain(errorMessage);
      }
    });
  });

  describe('getTask', () => {
    it('should return a single task successfully', async () => {
      const mockTask: ZohoCRMTask = {
        id: '1',
        Subject: 'Test Task',
        Status: 'Not Started',
        Priority: 'High',
        Due_Date: '2023-12-31',
        What_Id: 'contact-1',
        Who_Id: 'user-1',
        Description: 'Test task description',
        Closed_Time: '',
        Created_Time: '2023-01-01T00:00:00Z',
        Modified_Time: '2023-01-01T00:00:00Z',
        Owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com', full_name: 'John Doe' },
        Related_To: 'Deal',
        Remind_At: '2023-12-30T09:00:00Z',
        Recurring_Activity: 'None'
      };

      mockCRMClient.getTask.mockResolvedValue(mockTask);

      const result = await crmTasksTools.getTask('1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockTask);
      }
      expect(mockCRMClient.getTask).toHaveBeenCalledWith('1');
    });

    it('should handle errors gracefully', async () => {
      const errorMessage = 'Task not found';
      mockCRMClient.getTask.mockRejectedValue(new Error(errorMessage));

      const result = await crmTasksTools.getTask('1');

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.error).toContain(errorMessage);
      }
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        Subject: 'New Task',
        Status: 'Not Started',
        Priority: 'Medium',
        Due_Date: '2023-12-31',
        Description: 'New task description'
      };

      const mockCreatedTask: ZohoCRMTask = {
        id: '2',
        Subject: 'New Task',
        Status: 'Not Started',
        Priority: 'Medium',
        Due_Date: '2023-12-31',
        What_Id: '',
        Who_Id: '',
        Description: 'New task description',
        Closed_Time: '',
        Created_Time: '2023-01-01T00:00:00Z',
        Modified_Time: '2023-01-01T00:00:00Z',
        Owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com', full_name: 'John Doe' },
        Related_To: '',
        Remind_At: '',
        Recurring_Activity: 'None'
      };

      mockCRMClient.createTask.mockResolvedValue(mockCreatedTask);

      const result = await crmTasksTools.createTask(taskData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockCreatedTask);
        expect(result.message).toBe('Task "New Task" created successfully');
      }
      expect(mockCRMClient.createTask).toHaveBeenCalledWith(taskData);
    });

    it('should handle creation errors gracefully', async () => {
      const taskData = {
        Subject: 'New Task',
        Status: 'Not Started',
        Priority: 'Medium',
        Due_Date: '2023-12-31'
      };

      const errorMessage = 'Failed to create task';
      mockCRMClient.createTask.mockRejectedValue(new Error(errorMessage));

      const result = await crmTasksTools.createTask(taskData);

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.error).toContain(errorMessage);
      }
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const taskId = '1';
      const updateData = {
        Subject: 'Updated Task',
        Status: 'In Progress'
      };

      const mockUpdatedTask: ZohoCRMTask = {
        id: '1',
        Subject: 'Updated Task',
        Status: 'In Progress',
        Priority: 'High',
        Due_Date: '2023-12-31',
        What_Id: 'contact-1',
        Who_Id: 'user-1',
        Description: 'Test task description',
        Closed_Time: '',
        Created_Time: '2023-01-01T00:00:00Z',
        Modified_Time: '2023-01-01T00:00:00Z',
        Owner: { id: 'user-1', name: 'John Doe', email: 'john@example.com', full_name: 'John Doe' },
        Related_To: 'Deal',
        Remind_At: '2023-12-30T09:00:00Z',
        Recurring_Activity: 'None'
      };

      mockCRMClient.updateTask.mockResolvedValue(mockUpdatedTask);

      const result = await crmTasksTools.updateTask(taskId, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUpdatedTask);
        expect(result.message).toBe('Task 1 updated successfully');
      }
      expect(mockCRMClient.updateTask).toHaveBeenCalledWith(taskId, updateData);
    });

    it('should handle update errors gracefully', async () => {
      const taskId = '1';
      const updateData = { Subject: 'Updated Task' };
      const errorMessage = 'Failed to update task';
      mockCRMClient.updateTask.mockRejectedValue(new Error(errorMessage));

      const result = await crmTasksTools.updateTask(taskId, updateData);

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.error).toContain(errorMessage);
      }
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = '1';
      mockCRMClient.deleteTask.mockResolvedValue(undefined);

      const result = await crmTasksTools.deleteTask(taskId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.message).toBe('Task 1 deleted successfully');
      }
      expect(mockCRMClient.deleteTask).toHaveBeenCalledWith(taskId);
    });

    it('should handle deletion errors gracefully', async () => {
      const taskId = '1';
      const errorMessage = 'Failed to delete task';
      mockCRMClient.deleteTask.mockRejectedValue(new Error(errorMessage));

      const result = await crmTasksTools.deleteTask(taskId);

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.error).toContain(errorMessage);
      }
    });
  });
});