import { z } from 'zod';
import { ZohoCRMClient } from '../lib/clients/crm-client';
import { ZohoCRMTask, ZohoCRMEvent, ZohoCRMNote, ZohoCRMAttachment, createToolErrorResponse } from '../lib/types';

// Schema definitions for CRM Activities tools
export const TaskParamsSchema = z.object({
  Subject: z.string(),
  Status: z.string().optional(),
  Priority: z.string().optional(),
  Due_Date: z.string().optional(),
  What_Id: z.string().optional(),
  Who_Id: z.string().optional(),
  Description: z.string().optional(),
  Related_To: z.string().optional(),
  Remind_At: z.string().optional(),
  Recurring_Activity: z.string().optional()
});

export const GetTasksParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  due_date: z.string().optional()
});

export const EventParamsSchema = z.object({
  Subject: z.string(),
  Start_DateTime: z.string(),
  End_DateTime: z.string(),
  Description: z.string().optional(),
  Location: z.string().optional(),
  What_Id: z.string().optional(),
  Who_Id: z.string().optional(),
  Event_Title: z.string().optional(),
  All_day: z.boolean().optional(),
  Participants: z.array(z.string()).optional(),
  Remind_At: z.string().optional(),
  Recurring_Activity: z.string().optional()
});

export const GetEventsParamsSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

export const NoteParamsSchema = z.object({
  Note_Title: z.string(),
  Note_Content: z.string(),
  Parent_Id: z.string().optional()
});

export const GetNotesParamsSchema = z.object({
  module: z.string(),
  record_id: z.string(),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20)
});

export const EmailParamsSchema = z.object({
  module: z.string(),
  record_id: z.string(),
  to: z.array(z.string()),
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string(),
  content: z.string(),
  mail_format: z.string().optional(),
  template_id: z.string().optional()
});

export const GetAttachmentsParamsSchema = z.object({
  module: z.string(),
  record_id: z.string(),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(200).default(20)
});

export type TaskParams = z.infer<typeof TaskParamsSchema>;
export type GetTasksParams = z.infer<typeof GetTasksParamsSchema>;
export type EventParams = z.infer<typeof EventParamsSchema>;
export type GetEventsParams = z.infer<typeof GetEventsParamsSchema>;
export type NoteParams = z.infer<typeof NoteParamsSchema>;
export type GetNotesParams = z.infer<typeof GetNotesParamsSchema>;
export type EmailParams = z.infer<typeof EmailParamsSchema>;
export type GetAttachmentsParams = z.infer<typeof GetAttachmentsParamsSchema>;

/**
 * CRM Tasks Management Tools
 */
export class CRMTasksTools {
  constructor(private crmClient: ZohoCRMClient) {}

  async getTasks(params: GetTasksParams) {
    try {
      const result = await this.crmClient.getTasks(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return createToolErrorResponse(error, 'get tasks', { params });
    }
  }

  async getTask(taskId: string) {
    try {
      const result = await this.crmClient.getTask(taskId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return createToolErrorResponse(error, 'get task', { taskId });
    }
  }

  async createTask(params: TaskParams) {
    try {
      const result = await this.crmClient.createTask(params);
      return {
        success: true,
        data: result,
        message: `Task "${params.Subject}" created successfully`
      };
    } catch (error) {
      return createToolErrorResponse(error, 'create task', { params });
    }
  }

  async updateTask(taskId: string, params: Partial<TaskParams>) {
    try {
      const result = await this.crmClient.updateTask(taskId, params);
      return {
        success: true,
        data: result,
        message: `Task ${taskId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteTask(taskId: string) {
    try {
      await this.crmClient.deleteTask(taskId);
      return {
        success: true,
        message: `Task ${taskId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * CRM Events Management Tools
 */
export class CRMEventsTools {
  constructor(private crmClient: ZohoCRMClient) {}

  async getEvents(params: GetEventsParams) {
    try {
      const result = await this.crmClient.getEvents(params);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getEvent(eventId: string) {
    try {
      const result = await this.crmClient.getEvent(eventId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createEvent(params: EventParams) {
    try {
      const result = await this.crmClient.createEvent(params);
      return {
        success: true,
        data: result,
        message: `Event "${params.Subject}" created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateEvent(eventId: string, params: Partial<EventParams>) {
    try {
      const result = await this.crmClient.updateEvent(eventId, params);
      return {
        success: true,
        data: result,
        message: `Event ${eventId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteEvent(eventId: string) {
    try {
      await this.crmClient.deleteEvent(eventId);
      return {
        success: true,
        message: `Event ${eventId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * CRM Notes Management Tools
 */
export class CRMNotesTools {
  constructor(private crmClient: ZohoCRMClient) {}

  async getNotes(params: GetNotesParams) {
    try {
      const result = await this.crmClient.getNotes(params.module, params.record_id, {
        page: params.page,
        per_page: params.per_page
      });
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getNote(module: string, recordId: string, noteId: string) {
    try {
      const result = await this.crmClient.getNote(module, recordId, noteId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async createNote(module: string, recordId: string, params: NoteParams) {
    try {
      const result = await this.crmClient.createNote(module, recordId, params);
      return {
        success: true,
        data: result,
        message: `Note "${params.Note_Title}" created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateNote(module: string, recordId: string, noteId: string, params: Partial<NoteParams>) {
    try {
      const result = await this.crmClient.updateNote(module, recordId, noteId, params);
      return {
        success: true,
        data: result,
        message: `Note ${noteId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteNote(module: string, recordId: string, noteId: string) {
    try {
      await this.crmClient.deleteNote(module, recordId, noteId);
      return {
        success: true,
        message: `Note ${noteId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * CRM Attachments Management Tools
 */
export class CRMAttachmentsTools {
  constructor(private crmClient: ZohoCRMClient) {}

  async getAttachments(params: GetAttachmentsParams) {
    try {
      const result = await this.crmClient.getAttachments(params.module, params.record_id, {
        page: params.page,
        per_page: params.per_page
      });
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteAttachment(module: string, recordId: string, attachmentId: string) {
    try {
      await this.crmClient.deleteAttachment(module, recordId, attachmentId);
      return {
        success: true,
        message: `Attachment ${attachmentId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

/**
 * CRM Email Management Tools
 */
export class CRMEmailTools {
  constructor(private crmClient: ZohoCRMClient) {}

  async sendEmail(params: EmailParams) {
    try {
      await this.crmClient.sendEmail(params.module, params.record_id, {
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        content: params.content,
        mail_format: params.mail_format,
        template_id: params.template_id
      });
      return {
        success: true,
        message: `Email sent successfully to ${params.to.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getEmailHistory(module: string, recordId: string, options: {
    page?: number;
    per_page?: number;
  } = {}) {
    try {
      const result = await this.crmClient.getEmailHistory(module, recordId, options);
      return {
        success: true,
        data: result.data,
        pagination: result.info
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}