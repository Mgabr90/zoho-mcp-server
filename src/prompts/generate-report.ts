/**
 * Generate Report Prompt Template
 * Guides users through report generation across Zoho applications
 */

export const generateReportPrompt = {
  name: 'generate-report',
  description: 'Generate comprehensive reports from Zoho CRM and Books data',
  arguments: [
    {
      name: 'report_type',
      description: 'Type: sales, leads, invoices, customers, or custom',
      required: false
    },
    {
      name: 'date_range',
      description: 'Date range: last 30 days, this month, this quarter, etc.',
      required: false
    },
    {
      name: 'format',
      description: 'Output format: summary, detailed, or csv',
      required: false
    }
  ],
  
  async handler(args: any) {
    const template = `
# Generate Report Workflow

I'll help you create comprehensive reports from your Zoho data. Let's configure your report:

## Report Configuration
- **Type**: ${args.report_type || 'Please specify: sales, leads, invoices, customers, or custom'}
- **Date Range**: ${args.date_range || 'Please specify: last 30 days, this month, this quarter, etc.'}
- **Format**: ${args.format || 'Please specify: summary, detailed, or csv'}

## Available Report Types

### 📊 Sales Reports
- Deal pipeline analysis
- Revenue by stage
- Sales team performance
- Conversion rates
- Monthly/quarterly trends

### 🎯 Lead Reports
- Lead source analysis
- Conversion funnel
- Disposition breakdown
- Activity tracking
- Quality scoring

### 💰 Financial Reports
- Invoice status summary
- Payment tracking
- Outstanding amounts
- Customer payment history
- Revenue recognition

### 👥 Customer Reports
- Customer acquisition
- Account health scores
- Engagement metrics
- Geographic distribution
- Segmentation analysis

## Advanced Analytics

### 🔍 Custom Analysis
- Cross-module insights
- Trend analysis
- Predictive metrics
- Performance benchmarks

### 📈 Business Intelligence
- KPI dashboards
- Executive summaries
- Operational metrics
- Growth indicators

## Report Generation Process
1. **Data Collection**: Gather data from CRM and/or Books
2. **Processing**: Apply filters, calculations, and analysis
3. **Formatting**: Present in requested format
4. **Export**: Provide downloadable results if needed

## Quick Report Commands
- Sales pipeline: Analyze deals by stage and probability
- Lead analysis: Review lead sources and conversion rates
- Invoice summary: Outstanding invoices and payment status
- Customer insights: Account activity and health metrics

Which report would you like to generate?
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