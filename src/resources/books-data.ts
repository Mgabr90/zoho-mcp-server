/**
 * Books Data Resource
 * Provides access to Books organization data and configurations
 */

import { ZohoBooksClient } from '../lib/clients/books-client.js';

export class BooksDataResource {
  constructor(private booksClient: ZohoBooksClient) {}

  async getOrganizations() {
    try {
      // Books organizations are typically configured via organization ID
      return {
        name: 'Books Organizations',
        description: 'Available Books organizations',
        data: { message: 'Organization configured via ZOHO_BOOKS_ORGANIZATION_ID' },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch Books organizations: ${error.message}`);
    }
  }

  async getItems() {
    try {
      const items = await this.booksClient.getItems({});
      return {
        name: 'Books Items',
        description: 'Available products and services in Books',
        data: items,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch Books items: ${error.message}`);
    }
  }

  async getCurrencies() {
    try {
      // Books currencies are typically configured, not fetched
      return {
        name: 'Books Currencies',
        description: 'Available currencies in Books',
        data: { message: 'Currencies configured in Books organization settings' },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch Books currencies: ${error.message}`);
    }
  }
}