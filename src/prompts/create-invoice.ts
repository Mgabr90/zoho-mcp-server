/**
 * Create Invoice Prompt Template
 * Guides users through invoice creation workflow
 */

export const createInvoicePrompt = {
  name: 'create-invoice',
  description: 'Create a new invoice in Zoho Books with guided workflow',
  arguments: [
    {
      name: 'customer_name',
      description: 'Name or email of the customer',
      required: false
    },
    {
      name: 'amount',
      description: 'Invoice amount (optional - will be calculated from line items)',
      required: false
    },
    {
      name: 'due_date',
      description: 'Invoice due date (YYYY-MM-DD format)',
      required: false
    }
  ],
  
  async handler(args: any) {
    const template = `
# Create Invoice Workflow

I'll help you create a new invoice in Zoho Books. Let's gather the necessary information:

## Step 1: Customer Information
${args.customer_name ? `Customer: ${args.customer_name}` : 'Please provide customer name or email to search for existing customers.'}

## Step 2: Invoice Details
- Date: ${new Date().toISOString().split('T')[0]}
- Due Date: ${args.due_date || 'Please specify due date (YYYY-MM-DD)'}
${args.amount ? `- Amount: $${args.amount}` : ''}

## Step 3: Line Items
Add products or services to this invoice:
- Use books_get_items to see available products/services
- Specify quantity and rate for each item

## Step 4: Review and Create
Once all information is provided, I'll:
1. Search/create customer record
2. Create invoice with line items
3. Send invoice email if requested

Would you like to proceed with any specific step?
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