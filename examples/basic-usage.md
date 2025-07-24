# Basic Usage Examples

## Setting up the Zoho MCP Server

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your Zoho credentials in `.env`

3. Start the server:
```bash
npm run dev
```

## Example Tool Calls

### Getting CRM Records
```json
{
  "tool": "search_records",
  "arguments": {
    "module": "Leads",
    "criteria": "email:john@example.com"
  }
}
```

### Creating a Books Invoice
```json
{
  "tool": "books_create_invoice",
  "arguments": {
    "customer_id": "123456789",
    "line_items": [{
      "name": "Consulting Service",
      "quantity": 1,
      "rate": 100.00
    }]
  }
}
```

## Resource Access

### Getting Configuration Status
```
zoho://config/status
```

### Listing CRM Modules
```
zoho://crm/modules
```