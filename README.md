# Zoho CRM + Books MCP Server

A unified Model Context Protocol (MCP) server that provides seamless integration between Zoho CRM and Zoho Books, enabling AI assistants like Claude to interact with both systems through standardized tools and resources.

## Features

- **CRM Integration**: Full access to Zoho CRM modules, records, and operations
- **Books Integration**: Complete Zoho Books customer and invoice management
- **Data Synchronization**: Automated sync between CRM accounts and Books customers
- **Invoice Creation**: Generate Books invoices directly from CRM deals
- **Universal Search**: Search across both CRM and Books data
- **Multi-Configuration System**: Manage multiple OAuth configurations for different environments and projects
- **OAuth 2.0 Authentication**: Secure, token-based authentication
- **Rate Limiting**: Built-in rate limiting and error handling
- **TypeScript**: Full type safety and excellent developer experience

## Prerequisites

- Node.js 18.0.0 or higher
- Zoho CRM account with API access
- Zoho Books account with API access
- Zoho OAuth application credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zoho-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:

### Single Configuration (Legacy)
```env
# Zoho OAuth Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=http://localhost:3000/callback
ZOHO_REFRESH_TOKEN=your_refresh_token_here

# Zoho Data Center (com, eu, in, com.au, jp)
ZOHO_DATA_CENTER=com

# Zoho Books Organization ID (required for Books functionality)
ZOHO_BOOKS_ORGANIZATION_ID=your_organization_id_here

# Zoho API Scopes
ZOHO_SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoBooks.fullaccess.all
```

### Multi-Configuration System (Recommended)
```env
# Enable multi-configuration system
MULTI_CONFIG_ENABLED=true

# Current environment to use
MULTI_CONFIG_ENVIRONMENT=default

# Path to configuration file (optional)
MULTI_CONFIG_PATH=./zoho-config.json

# Legacy variables (for backward compatibility)
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=http://localhost:3000/callback
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_DATA_CENTER=com
ZOHO_BOOKS_ORGANIZATION_ID=your_organization_id_here
ZOHO_SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoBooks.fullaccess.all
```

For detailed multi-configuration setup, see [MULTI_CONFIG_GUIDE.md](./MULTI_CONFIG_GUIDE.md).

## Zoho OAuth Setup

1. Go to the [Zoho Developer Console](https://api-console.zoho.com)
2. Create a new "Server-based Applications" 
3. Set redirect URI to `http://localhost:3000/callback`
4. Note your Client ID and Client Secret
5. Generate a refresh token using the authorization flow

## Build and Run

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## MCP Integration

### Claude Desktop Configuration

Add the following to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "zoho-crm-books": {
      "command": "node",
      "args": ["C:\\zoho-mcp-server\\dist\\server.js"],
      "env": {
        "ZOHO_CLIENT_ID": "your_client_id",
        "ZOHO_CLIENT_SECRET": "your_client_secret",
        "ZOHO_REFRESH_TOKEN": "your_refresh_token",
        "ZOHO_DATA_CENTER": "com",
        "ZOHO_BOOKS_ORGANIZATION_ID": "your_org_id"
      }
    }
  }
}
```

### VS Code Configuration

Add to your VS Code MCP configuration:

```json
{
  "servers": {
    "zoho-crm-books": {
      "command": "node",
      "args": ["C:\\zoho-mcp-server\\dist\\server.js"]
    }
  }
}
```

## Available Tools

### CRM & Books Integration Tools

#### 1. sync_accounts_to_customers
Synchronizes CRM accounts to Books customers.

**Parameters:**
- `source_module`: "accounts" (fixed)
- `target_module`: "customers" (fixed)
- `filters` (optional):
  - `limit`: Number of records to process (1-200)
  - `page`: Page number to process

**Example:**
```json
{
  "source_module": "accounts",
  "target_module": "customers",
  "filters": {
    "limit": 50,
    "page": 1
  }
}
```

#### 1.1. sync_contacts_to_customers
Synchronizes CRM contacts to Books customers (bi-directional sync).

**Parameters:**
- `source_module`: "contacts" (fixed)
- `target_module`: "customers" (fixed)
- `filters` (optional):
  - `limit`: Number of records to process (1-200)
  - `page`: Page number to process

**Example:**
```json
{
  "source_module": "contacts",
  "target_module": "customers",
  "filters": {
    "limit": 50,
    "page": 1
  }
}
```

#### 1.2. sync_customers_to_contacts
Synchronizes Books customers to CRM contacts (bi-directional sync).

**Parameters:**
- `source_module`: "customers" (fixed)
- `target_module`: "contacts" (fixed)
- `filters` (optional):
  - `limit`: Number of records to process (1-200)
  - `page`: Page number to process

**Example:**
```json
{
  "source_module": "customers",
  "target_module": "contacts",
  "filters": {
    "limit": 50,
    "page": 1
  }
}
```

#### 2. create_invoice_from_deal
Creates a Books invoice from a CRM deal.

**Parameters:**
- `deal_id`: CRM deal ID (required)
- `customer_id`: Books customer ID (optional)
- `invoice_date`: Invoice date (optional, defaults to today)
- `due_date`: Due date (optional, defaults to 30 days from today)
- `include_line_items`: Include deal amount as line item (default: true)
- `send_email`: Send invoice email to customer (default: false)

**Example:**
```json
{
  "deal_id": "123456789",
  "customer_id": "987654321",
  "include_line_items": true,
  "send_email": true
}
```

#### 3. search_records
Search across CRM and Books records.

**Parameters:**
- `module`: Module to search ("accounts", "contacts", "deals", "leads", "customers", "invoices")
- `criteria`: Search criteria (required)
- `fields`: Fields to return (optional)
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)

**Example:**
```json
{
  "module": "accounts",
  "criteria": "tech company",
  "fields": ["Account_Name", "Email", "Phone"],
  "page": 1,
  "per_page": 10
}
```

### Books Items Management Tools

#### 4. books_get_items
Get all items from Books with optional filtering and pagination.

**Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)
- `search_text`: Search text (optional)
- `filter_by`: Filter criteria (optional)
- `sort_column`: Column to sort by (optional)
- `sort_order`: Sort order "A" or "D" (optional)

#### 5. books_get_item
Get a specific item from Books by ID.

**Parameters:**
- `item_id`: Item ID (required)

#### 6. books_create_item
Create a new item in Books.

**Parameters:**
- `name`: Item name (required)
- `description`: Item description (optional)
- `rate`: Item rate (optional)
- `unit`: Unit of measurement (optional)
- `sku`: Stock keeping unit (optional)
- `product_type`: Product type (optional)
- `is_taxable`: Whether item is taxable (optional)
- `tax_id`: Tax ID (optional)
- `item_type`: Item type (optional)

#### 7. books_update_item
Update an existing item in Books.

**Parameters:**
- `item_id`: Item ID (required)
- Plus any fields from `books_create_item` to update

#### 8. books_delete_item
Delete an item from Books.

**Parameters:**
- `item_id`: Item ID (required)

### Books Estimates Management Tools

#### 9. books_get_estimates
Get all estimates from Books with optional filtering and pagination.

**Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)
- `customer_id`: Filter by customer ID (optional)
- `status`: Filter by status (optional)
- `search_text`: Search text (optional)
- `filter_by`: Filter criteria (optional)
- `sort_column`: Column to sort by (optional)
- `sort_order`: Sort order "A" or "D" (optional)

#### 10. books_create_estimate
Create a new estimate in Books.

**Parameters:**
- `customer_id`: Customer ID (required)
- `line_items`: Array of line items (required)
  - `name`: Item name (required)
  - `quantity`: Quantity (required)
  - `rate`: Rate (required)
  - `description`: Description (optional)
  - `unit`: Unit (optional)
  - `item_id`: Item ID (optional)
  - `tax_id`: Tax ID (optional)
- `estimate_date`: Estimate date (optional)
- `expiry_date`: Expiry date (optional)
- `currency_code`: Currency code (optional)
- `discount`: Discount amount (optional)
- `notes`: Notes (optional)
- `terms`: Terms (optional)

#### 11. books_convert_estimate_to_invoice
Convert a Books estimate to an invoice.

**Parameters:**
- `estimate_id`: Estimate ID (required)

### Books Payments Management Tools

#### 12. books_get_payments
Get all payments from Books with optional filtering and pagination.

**Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)
- `customer_id`: Filter by customer ID (optional)
- `search_text`: Search text (optional)
- `filter_by`: Filter criteria (optional)
- `sort_column`: Column to sort by (optional)
- `sort_order`: Sort order "A" or "D" (optional)

#### 13. books_create_payment
Create a new payment in Books.

**Parameters:**
- `customer_id`: Customer ID (required)
- `payment_mode`: Payment mode (required)
- `amount`: Payment amount (required)
- `date`: Payment date (required)
- `invoices`: Array of invoices to apply payment to (required)
  - `invoice_id`: Invoice ID (required)
  - `invoice_number`: Invoice number (required)
  - `amount_applied`: Amount applied to invoice (required)
  - `tax_amount_withheld`: Tax amount withheld (optional)
- `reference_number`: Reference number (optional)
- `description`: Payment description (optional)
- `bank_charges`: Bank charges (optional)
- `currency_code`: Currency code (optional)
- `exchange_rate`: Exchange rate (optional)

### CRM Activities Management Tools

#### 14. crm_get_tasks
Get all tasks from CRM with optional filtering and pagination.

**Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)
- `sort_by`: Column to sort by (optional)
- `sort_order`: Sort order "asc" or "desc" (optional)
- `status`: Filter by status (optional)
- `due_date`: Filter by due date (optional)

#### 15. crm_create_task
Create a new task in CRM.

**Parameters:**
- `Subject`: Task subject (required)
- `Status`: Task status (optional)
- `Priority`: Task priority (optional)
- `Due_Date`: Due date (optional)
- `What_Id`: Related record ID (optional)
- `Who_Id`: Contact ID (optional)
- `Description`: Task description (optional)
- `Related_To`: Related to field (optional)
- `Remind_At`: Reminder time (optional)
- `Recurring_Activity`: Recurring activity settings (optional)

#### 16. crm_get_events
Get all events from CRM with optional filtering and pagination.

**Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)
- `sort_by`: Column to sort by (optional)
- `sort_order`: Sort order "asc" or "desc" (optional)
- `start_date`: Filter by start date (optional)
- `end_date`: Filter by end date (optional)

#### 17. crm_create_event
Create a new event in CRM.

**Parameters:**
- `Subject`: Event subject (required)
- `Start_DateTime`: Start date and time (required)
- `End_DateTime`: End date and time (required)
- `Description`: Event description (optional)
- `Location`: Event location (optional)
- `What_Id`: Related record ID (optional)
- `Who_Id`: Contact ID (optional)
- `Event_Title`: Event title (optional)
- `All_day`: All-day event flag (optional)
- `Participants`: Array of participant IDs (optional)
- `Remind_At`: Reminder time (optional)
- `Recurring_Activity`: Recurring activity settings (optional)

#### 18. crm_get_notes
Get notes for a specific CRM record.

**Parameters:**
- `module`: CRM module name (required)
- `record_id`: Record ID (required)
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)

#### 19. crm_create_note
Create a new note for a CRM record.

**Parameters:**
- `module`: CRM module name (required)
- `record_id`: Record ID (required)
- `Note_Title`: Note title (required)
- `Note_Content`: Note content (required)
- `Parent_Id`: Parent record ID (optional)

#### 20. crm_send_email
Send email for a CRM record.

**Parameters:**
- `module`: CRM module name (required)
- `record_id`: Record ID (required)
- `to`: Array of recipient email addresses (required)
- `subject`: Email subject (required)
- `content`: Email content (required)
- `cc`: Array of CC email addresses (optional)
- `bcc`: Array of BCC email addresses (optional)
- `mail_format`: Email format (optional)
- `template_id`: Email template ID (optional)

#### 21. crm_get_attachments
Get attachments for a CRM record.

**Parameters:**
- `module`: CRM module name (required)
- `record_id`: Record ID (required)
- `page`: Page number (default: 1)
- `per_page`: Results per page (default: 20, max: 200)

### Configuration Management Tools

#### 22. config_list_environments
List all available environments in the multi-configuration system.

**Parameters:** None

**Example:**
```json
{
  "name": "config_list_environments",
  "arguments": {}
}
```

#### 23. config_switch_environment
Switch to a different environment.

**Parameters:**
- `environmentName`: Name of the environment to switch to (required)

**Example:**
```json
{
  "name": "config_switch_environment",
  "arguments": {
    "environmentName": "production"
  }
}
```

#### 24. config_list_profiles
List all profiles in the current environment.

**Parameters:** None

**Example:**
```json
{
  "name": "config_list_profiles",
  "arguments": {}
}
```

#### 25. config_switch_profile
Switch to a different profile within the current environment.

**Parameters:**
- `profileName`: Name of the profile to switch to (required)

**Example:**
```json
{
  "name": "config_switch_profile",
  "arguments": {
    "profileName": "backup"
  }
}
```

#### 26. config_add_profile
Add a new profile to the current environment.

**Parameters:**
- `name`: Profile name (required)
- `description`: Profile description (optional)
- `clientId`: Zoho Client ID (required)
- `clientSecret`: Zoho Client Secret (required)
- `redirectUri`: Redirect URI (required)
- `refreshToken`: Refresh Token (required)
- `dataCenter`: Data Center (required)
- `scopes`: Array of API scopes (required)
- `organizationId`: Books Organization ID (optional)

**Example:**
```json
{
  "name": "config_add_profile",
  "arguments": {
    "name": "backup",
    "description": "Backup production account",
    "clientId": "1000.BACKUP_CLIENT_ID",
    "clientSecret": "BACKUP_CLIENT_SECRET",
    "redirectUri": "https://yourdomain.com/callback",
    "refreshToken": "1000.BACKUP_REFRESH_TOKEN",
    "dataCenter": "com",
    "scopes": [
      "ZohoCRM.modules.ALL",
      "ZohoCRM.settings.ALL",
      "ZohoBooks.fullaccess.all"
    ],
    "organizationId": "BACKUP_ORG_ID"
  }
}
```

#### 27. config_remove_profile
Remove a profile from the current environment.

**Parameters:**
- `profileName`: Name of the profile to remove (required)

**Example:**
```json
{
  "name": "config_remove_profile",
  "arguments": {
    "profileName": "old-profile"
  }
}
```

#### 28. config_update_profile
Update an existing profile.

**Parameters:**
- `profileName`: Name of the profile to update (required)
- `updates`: Object containing fields to update (required)

**Example:**
```json
{
  "name": "config_update_profile",
  "arguments": {
    "profileName": "primary",
    "updates": {
      "description": "Updated description",
      "refreshToken": "1000.NEW_REFRESH_TOKEN"
    }
  }
}
```

#### 29. config_get_status
Get current configuration status.

**Parameters:** None

**Example:**
```json
{
  "name": "config_get_status",
  "arguments": {}
}
```

#### 30. config_export_to_env
Export current configuration to .env format.

**Parameters:**
- `profileName`: Name of the profile to export (optional, defaults to active profile)

**Example:**
```json
{
  "name": "config_export_to_env",
  "arguments": {
    "profileName": "primary"
  }
}
```

#### 31. config_add_environment
Add a new environment.

**Parameters:**
- `name`: Environment name (required)
- `description`: Environment description (optional)

**Example:**
```json
{
  "name": "config_add_environment",
  "arguments": {
    "name": "staging",
    "description": "Staging environment for testing"
  }
}
```

#### 32. config_remove_environment
Remove an environment.

**Parameters:**
- `name`: Name of the environment to remove (required)

**Example:**
```json
{
  "name": "config_remove_environment",
  "arguments": {
    "name": "old-environment"
  }
}
```

## Available Resources

### 1. zoho://crm/modules
Returns all available CRM modules and their configurations.

### 2. zoho://books/organizations
Returns Books organization information.

## Usage Examples

### Claude Desktop Integration

Once configured, you can use the server with Claude Desktop:

```
@zoho-crm-books sync_accounts_to_customers with limit 10

@zoho-crm-books create_invoice_from_deal for deal ID 123456789

@zoho-crm-books search_records in accounts for "technology"
```

### Programming Interface

You can also use the server programmatically:

```typescript
import { ZohoMCPServer } from './src/server';

const server = new ZohoMCPServer();
await server.start();
```

## Error Handling

The server includes comprehensive error handling:

- **Authentication Errors**: Automatic token refresh on 401 errors
- **Rate Limiting**: Exponential backoff on 429 errors
- **Validation Errors**: Input validation with detailed error messages
- **Network Errors**: Retry logic with configurable timeouts

## Monitoring and Logging

The server includes built-in monitoring:

- Request/response logging
- Performance metrics
- Error tracking
- Health checks

## Security

- OAuth 2.0 token-based authentication
- Secure token storage and refresh
- Input validation and sanitization
- Rate limiting protection
- HTTPS enforcement

## Development

### Project Structure

```
src/
├── auth/               # OAuth authentication
├── clients/            # API clients (CRM, Books)
├── tools/              # MCP tools implementation
├── resources/          # MCP resources implementation
├── types/              # TypeScript type definitions
└── server.ts           # Main server implementation
```

### Testing

Run tests with:
```bash
npm test
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the Zoho API documentation
- Review the MCP specification

## Changelog

### v1.0.0
- Initial release
- CRM and Books integration
- OAuth 2.0 authentication
- Basic sync functionality
- MCP server implementation
