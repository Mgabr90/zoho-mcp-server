/**
 * Sync Data Prompt Template
 * Guides users through data synchronization between Zoho apps
 */

export const syncDataPrompt = {
  name: 'sync-data',
  description: 'Synchronize data between Zoho CRM and Books applications',
  arguments: [
    {
      name: 'sync_direction',
      description: 'Direction: crm-to-books, books-to-crm, or bidirectional',
      required: false
    },
    {
      name: 'data_type',
      description: 'Type: customers, contacts, accounts, or all',
      required: false
    },
    {
      name: 'batch_size',
      description: 'Number of records to sync per batch (default: 50)',
      required: false
    }
  ],
  
  async handler(args: any) {
    const template = `
# Data Synchronization Workflow

I'll help you synchronize data between Zoho CRM and Books. Here's your sync plan:

## Sync Configuration
- **Direction**: ${args.sync_direction || 'Please specify: crm-to-books, books-to-crm, or bidirectional'}
- **Data Type**: ${args.data_type || 'Please specify: customers, contacts, accounts, or all'}
- **Batch Size**: ${args.batch_size || '50'} records per batch

## Available Sync Operations

### 1. CRM to Books Sync
- **Accounts → Customers**: Sync CRM accounts to Books customers
- **Contacts → Customers**: Sync CRM contacts to Books customers
- Maintains relationship mapping and avoids duplicates

### 2. Books to CRM Sync
- **Customers → Contacts**: Sync Books customers to CRM contacts
- Updates existing records or creates new ones
- Preserves data integrity

### 3. Deal to Invoice Sync
- **Deals → Invoices**: Convert CRM deals to Books invoices
- Include line items and pricing
- Automatic customer matching

## Sync Tools Available
- \`sync_accounts_to_customers\`: CRM accounts → Books customers
- \`sync_contacts_to_customers\`: CRM contacts → Books customers
- \`sync_customers_to_contacts\`: Books customers → CRM contacts
- \`create_invoice_from_deal\`: CRM deal → Books invoice

## Pre-Sync Checklist
✅ Verify authentication for both CRM and Books
✅ Check data quality and required fields
✅ Review mapping configuration
✅ Set appropriate batch size for your data volume

## Post-Sync Actions
📊 Review sync results and error logs
🔄 Handle any failed records
📈 Verify data consistency across systems

Ready to start? Choose your sync operation:
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