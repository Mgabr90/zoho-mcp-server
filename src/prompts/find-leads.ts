/**
 * Find Leads Prompt Template
 * Guides users through lead search and management workflow
 */

export const findLeadsPrompt = {
  name: 'find-leads',
  description: 'Search and analyze leads in Zoho CRM with intelligent filtering',
  arguments: [
    {
      name: 'search_term',
      description: 'Name, email, company, or phone number to search for',
      required: false
    },
    {
      name: 'status',
      description: 'Lead status to filter by (New, Qualified, etc.)',
      required: false
    },
    {
      name: 'date_range',
      description: 'Date range for lead creation (e.g., "last 30 days")',
      required: false
    }
  ],
  
  async handler(args: any) {
    const template = `
# Find Leads Workflow

I'll help you search and analyze leads in your Zoho CRM. Here's what we can do:

## Search Options
${args.search_term ? `🔍 Search Term: "${args.search_term}"` : '📝 Provide name, email, company, or phone to search'}
${args.status ? `📊 Status Filter: ${args.status}` : '📊 Filter by status: New, Qualified, Unqualified, etc.'}
${args.date_range ? `📅 Date Range: ${args.date_range}` : '📅 Specify date range for lead creation'}

## Available Actions

### 1. Basic Search
- Use search_records tool with "Leads" module
- Search by email, name, company, or phone
- Apply status and date filters

### 2. Advanced Analysis
- Get lead disposition data
- Analyze conversion rates
- Review follow-up activities

### 3. Lead Management
- Update lead status
- Create follow-up tasks
- Convert to opportunities

### 4. Reporting
- Lead source analysis
- Performance metrics
- Pipeline insights

## Quick Start Commands
- Search by email: \`search_records(module="Leads", criteria="email:john@example.com")\`
- Get all new leads: \`search_records(module="Leads", criteria="Lead_Status:New")\`
- Recent leads: Filter by Created_Time for recent activity

Would you like to start with any specific search or analysis?
`;

    return {
      role: 'assistant',
      content: {
        type: 'text',
        text: template
      }
    };
  }
};