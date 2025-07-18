import { ZohoCRMClient } from '../clients/crm-client';
import { 
  ZohoCRMModule, 
  ZohoCRMField, 
  ZohoCRMProfile, 
  ZohoCRMRole, 
  ZohoCRMUser, 
  ZohoCRMLayout, 
  ZohoCRMCustomView, 
  ZohoCRMRelatedList,
  createToolErrorResponse, 
  ZohoCRMOrganization, 
  ZohoCRMTerritory, 
  ZohoCRMCurrency, 
  ZohoCRMPipeline, 
  ZohoCRMAssignmentRule, 
  ZohoCRMBlueprint 
} from '../types';

export class ZohoCRMMetadataTools {
  constructor(private crmClient: ZohoCRMClient) {}

  /**
   * Get all CRM modules with their metadata
   */
  async getAllModules(): Promise<ZohoCRMModule[]> {
    try {
      return await this.crmClient.getModules();
    } catch (error: any) {
      throw new Error(`Failed to get all modules: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific module
   */
  async getModuleDetails(params: {
    module_name: string;
  }): Promise<ZohoCRMModule> {
    try {
      return await this.crmClient.getModuleMetadata(params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get module details for ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get all fields for a specific module with pagination and filtering
   */
  async getModuleFields(params: {
    module_name: string;
    page?: number;
    per_page?: number;
    field_type?: string;
    search_term?: string;
  }): Promise<{
    fields: ZohoCRMField[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  }> {
    try {
      const allFields = await this.crmClient.getFields(params.module_name);
      
      let filteredFields = allFields;
      
      // Filter by field type if specified
      if (params.field_type) {
        filteredFields = filteredFields.filter(field => {
          switch (params.field_type) {
            case 'picklist':
              return field.pick_list_values && field.pick_list_values.length > 0;
            case 'lookup':
              return field.lookup && field.lookup.module;
            case 'text':
              return field.data_type === 'text' || field.data_type === 'textarea';
            default:
              return true;
          }
        });
      }
      
      // Filter by search term if specified
      if (params.search_term) {
        const searchLower = params.search_term.toLowerCase();
        filteredFields = filteredFields.filter(field => 
          field.api_name.toLowerCase().includes(searchLower) ||
          field.display_label.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination
      const page = params.page || 1;
      const per_page = Math.min(params.per_page || 50, 200);
      const startIndex = (page - 1) * per_page;
      const endIndex = startIndex + per_page;
      
      const paginatedFields = filteredFields.slice(startIndex, endIndex);
      
      return {
        fields: paginatedFields,
        pagination: {
          page,
          per_page,
          total: filteredFields.length,
          has_more: endIndex < filteredFields.length
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get fields for module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific field
   */
  async getFieldDetails(params: {
    field_id: string;
    module_name: string;
  }): Promise<ZohoCRMField> {
    try {
      return await this.crmClient.getFieldMetadata(params.field_id, params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get field details for ${params.field_id} in module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get all layouts for modules
   */
  async getLayouts(params: {
    module_name?: string;
  } = {}): Promise<ZohoCRMLayout[]> {
    try {
      return await this.crmClient.getLayouts(params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get layouts: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific layout
   */
  async getLayoutDetails(params: {
    layout_id: string;
  }): Promise<ZohoCRMLayout> {
    try {
      return await this.crmClient.getLayout(params.layout_id);
    } catch (error: any) {
      throw new Error(`Failed to get layout details for ${params.layout_id}: ${error.message}`);
    }
  }

  /**
   * Update layout configuration
   */
  async updateLayout(params: {
    layout_id: string;
    layout_data: Partial<ZohoCRMLayout>;
  }): Promise<ZohoCRMLayout> {
    try {
      return await this.crmClient.updateLayout(params.layout_id, params.layout_data);
    } catch (error: any) {
      throw new Error(`Failed to update layout ${params.layout_id}: ${error.message}`);
    }
  }

  /**
   * Get all profiles in the organization
   */
  async getAllProfiles(): Promise<ZohoCRMProfile[]> {
    try {
      return await this.crmClient.getProfiles();
    } catch (error: any) {
      throw new Error(`Failed to get all profiles: ${error.message}`);
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(params: {
    profile_data: Partial<ZohoCRMProfile>;
  }): Promise<ZohoCRMProfile> {
    try {
      return await this.crmClient.createProfile(params.profile_data);
    } catch (error: any) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
  }

  /**
   * Update profile permissions
   */
  async updateProfile(params: {
    profile_id: string;
    profile_data: Partial<ZohoCRMProfile>;
  }): Promise<ZohoCRMProfile> {
    try {
      return await this.crmClient.updateProfile(params.profile_id, params.profile_data);
    } catch (error: any) {
      throw new Error(`Failed to update profile ${params.profile_id}: ${error.message}`);
    }
  }

  /**
   * Get all roles in the organization
   */
  async getAllRoles(): Promise<ZohoCRMRole[]> {
    try {
      return await this.crmClient.getRoles();
    } catch (error: any) {
      throw new Error(`Failed to get all roles: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific role
   */
  async getRoleDetails(params: {
    role_id: string;
  }): Promise<ZohoCRMRole> {
    try {
      return await this.crmClient.getRole(params.role_id);
    } catch (error: any) {
      throw new Error(`Failed to get role details for ${params.role_id}: ${error.message}`);
    }
  }

  /**
   * Create a new role
   */
  async createRole(params: {
    role_data: Partial<ZohoCRMRole>;
  }): Promise<ZohoCRMRole> {
    try {
      return await this.crmClient.createRole(params.role_data);
    } catch (error: any) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
  }

  /**
   * Update role details
   */
  async updateRole(params: {
    role_id: string;
    role_data: Partial<ZohoCRMRole>;
  }): Promise<ZohoCRMRole> {
    try {
      return await this.crmClient.updateRole(params.role_id, params.role_data);
    } catch (error: any) {
      throw new Error(`Failed to update role ${params.role_id}: ${error.message}`);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(params: {
    role_id: string;
  }): Promise<void> {
    try {
      await this.crmClient.deleteRole(params.role_id);
    } catch (error: any) {
      throw new Error(`Failed to delete role ${params.role_id}: ${error.message}`);
    }
  }

  /**
   * Get all users in the organization
   */
  async getAllUsers(params: {
    type?: string;
  } = {}): Promise<ZohoCRMUser[]> {
    try {
      return await this.crmClient.getUsers(params.type);
    } catch (error: any) {
      throw new Error(`Failed to get all users: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific user
   */
  async getUserDetails(params: {
    user_id: string;
  }): Promise<ZohoCRMUser> {
    try {
      return await this.crmClient.getUser(params.user_id);
    } catch (error: any) {
      throw new Error(`Failed to get user details for ${params.user_id}: ${error.message}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(params: {
    user_data: Partial<ZohoCRMUser>;
  }): Promise<ZohoCRMUser> {
    try {
      return await this.crmClient.createUser(params.user_data);
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Get organization details and settings
   */
  async getOrganizationDetails(): Promise<ZohoCRMOrganization> {
    try {
      return await this.crmClient.getOrganization();
    } catch (error: any) {
      throw new Error(`Failed to get organization details: ${error.message}`);
    }
  }

  /**
   * Get organization features and limits
   */
  async getOrganizationFeatures(): Promise<any> {
    try {
      return await this.crmClient.getFeatures();
    } catch (error: any) {
      throw new Error(`Failed to get organization features: ${error.message}`);
    }
  }

  /**
   * Get all custom views for a module
   */
  async getCustomViews(params: {
    module_name: string;
  }): Promise<ZohoCRMCustomView[]> {
    try {
      return await this.crmClient.getCustomViews(params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get custom views for module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get detailed metadata for a specific custom view
   */
  async getCustomViewDetails(params: {
    custom_view_id: string;
    module_name: string;
  }): Promise<ZohoCRMCustomView> {
    try {
      return await this.crmClient.getCustomView(params.custom_view_id, params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get custom view details for ${params.custom_view_id} in module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get all related lists for a module
   */
  async getRelatedLists(params: {
    module_name: string;
  }): Promise<ZohoCRMRelatedList[]> {
    try {
      return await this.crmClient.getRelatedLists(params.module_name);
    } catch (error: any) {
      throw new Error(`Failed to get related lists for module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get all territories
   */
  async getAllTerritories(): Promise<ZohoCRMTerritory[]> {
    try {
      return await this.crmClient.getTerritories();
    } catch (error: any) {
      throw new Error(`Failed to get all territories: ${error.message}`);
    }
  }

  /**
   * Get all currencies
   */
  async getAllCurrencies(): Promise<ZohoCRMCurrency[]> {
    try {
      return await this.crmClient.getCurrencies();
    } catch (error: any) {
      throw new Error(`Failed to get all currencies: ${error.message}`);
    }
  }

  /**
   * Get pipeline metadata
   */
  async getPipelineMetadata(): Promise<ZohoCRMPipeline[]> {
    try {
      return await this.crmClient.getPipeline();
    } catch (error: any) {
      throw new Error(`Failed to get pipeline metadata: ${error.message}`);
    }
  }

  /**
   * Get assignment rules
   */
  async getAssignmentRules(): Promise<ZohoCRMAssignmentRule[]> {
    try {
      return await this.crmClient.getAssignmentRules();
    } catch (error: any) {
      throw new Error(`Failed to get assignment rules: ${error.message}`);
    }
  }

  /**
   * Get blueprint metadata
   */
  async getBlueprintMetadata(): Promise<ZohoCRMBlueprint[]> {
    try {
      return await this.crmClient.getBlueprint();
    } catch (error: any) {
      throw new Error(`Failed to get blueprint metadata: ${error.message}`);
    }
  }

  /**
   * Get comprehensive metadata summary for the entire CRM
   */
  async getCRMMetadataSummary(): Promise<{
    modules: ZohoCRMModule[];
    profiles: ZohoCRMProfile[];
    roles: ZohoCRMRole[];
    users: ZohoCRMUser[];
    organization: ZohoCRMOrganization;
    territories: ZohoCRMTerritory[];
    currencies: ZohoCRMCurrency[];
    features: any;
  }> {
    try {
      const [modules, profiles, roles, users, organization, territories, currencies, features] = await Promise.all([
        this.crmClient.getModules(),
        this.crmClient.getProfiles(),
        this.crmClient.getRoles(),
        this.crmClient.getUsers(),
        this.crmClient.getOrganization(),
        this.crmClient.getTerritories(),
        this.crmClient.getCurrencies(),
        this.crmClient.getFeatures()
      ]);

      return {
        modules,
        profiles,
        roles,
        users,
        organization,
        territories,
        currencies,
        features
      };
    } catch (error: any) {
      throw new Error(`Failed to get CRM metadata summary: ${error.message}`);
    }
  }

  /**
   * Get complete module configuration including fields, layouts, custom views, and related lists
   */
  async getCompleteModuleConfiguration(params: {
    module_name: string;
  }): Promise<{
    module: ZohoCRMModule;
    fields: ZohoCRMField[];
    layouts: ZohoCRMLayout[];
    custom_views: ZohoCRMCustomView[];
    related_lists: ZohoCRMRelatedList[];
  }> {
    try {
      const [module, fields, layouts, custom_views, related_lists] = await Promise.all([
        this.crmClient.getModuleMetadata(params.module_name),
        this.crmClient.getFields(params.module_name),
        this.crmClient.getLayouts(params.module_name),
        this.crmClient.getCustomViews(params.module_name),
        this.crmClient.getRelatedLists(params.module_name)
      ]);

      return {
        module,
        fields,
        layouts,
        custom_views,
        related_lists
      };
    } catch (error: any) {
      throw new Error(`Failed to get complete module configuration for ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get picklist values for a specific field in a module
   */
  async getPicklistValues(params: {
    module_name: string;
    field_name: string;
  }): Promise<any> {
    try {
      return await this.crmClient.getPicklistValues(params.module_name, params.field_name);
    } catch (error: any) {
      throw new Error(`Failed to get picklist values for ${params.field_name} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get only picklist fields for a specific module
   */
  async getPicklistFields(params: {
    module_name: string;
  }): Promise<ZohoCRMField[]> {
    try {
      const allFields = await this.crmClient.getFields(params.module_name);
      return allFields.filter(field => 
        field.pick_list_values && field.pick_list_values.length > 0
      );
    } catch (error: any) {
      throw new Error(`Failed to get picklist fields for module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Search fields by name pattern
   */
  async searchFields(params: {
    module_name: string;
    search_term: string;
  }): Promise<ZohoCRMField[]> {
    try {
      const allFields = await this.crmClient.getFields(params.module_name);
      const searchLower = params.search_term.toLowerCase();
      return allFields.filter(field => 
        field.api_name.toLowerCase().includes(searchLower) ||
        field.display_label.toLowerCase().includes(searchLower)
      );
    } catch (error: any) {
      throw new Error(`Failed to search fields in module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Analyze module permissions and accessibility
   */
  async analyzeModulePermissions(params: {
    module_name: string;
  }): Promise<{
    module: ZohoCRMModule;
    profiles_with_access: ZohoCRMProfile[];
    fields_by_permission: {
      readable: ZohoCRMField[];
      writable: ZohoCRMField[];
      required: ZohoCRMField[];
    };
  }> {
    try {
      const [module, fields, profiles] = await Promise.all([
        this.crmClient.getModuleMetadata(params.module_name),
        this.crmClient.getFields(params.module_name),
        this.crmClient.getProfiles()
      ]);

      const profiles_with_access = profiles.filter(profile => 
        module.profiles?.some(moduleProfile => moduleProfile.id === profile.id)
      );

      const fields_by_permission = {
        readable: fields.filter(field => !field.read_only),
        writable: fields.filter(field => !field.read_only && !field.field_read_only),
        required: fields.filter(field => field.required)
      };

      return {
        module,
        profiles_with_access,
        fields_by_permission
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze module permissions for ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Analyze picklist dependencies and relationships in a module
   */
  async analyzePicklistDependencies(params: {
    module_name: string;
  }): Promise<{
    module: string;
    dependencies: Array<{
      source_field: string;
      dependent_field: string;
      dependency_type: 'lookup' | 'picklist' | 'formula' | 'reference';
      relationship_details: any;
    }>;
    picklist_chains: Array<{
      field_name: string;
      dependent_picklists: string[];
      dependency_path: string[];
    }>;
    summary: {
      total_fields: number;
      fields_with_dependencies: number;
      picklist_fields: number;
      lookup_fields: number;
    };
  }> {
    try {
      const fields = await this.crmClient.getFields(params.module_name);
      
      const dependencies: Array<{
        source_field: string;
        dependent_field: string;
        dependency_type: 'lookup' | 'picklist' | 'formula' | 'reference';
        relationship_details: any;
      }> = [];

      const picklist_chains: Array<{
        field_name: string;
        dependent_picklists: string[];
        dependency_path: string[];
      }> = [];

      // Analyze field relationships
      for (const field of fields) {
        // Check for lookup dependencies
        if (field.lookup) {
          dependencies.push({
            source_field: field.lookup.module || 'unknown',
            dependent_field: field.api_name,
            dependency_type: 'lookup',
            relationship_details: field.lookup
          });
        }

        // Check for picklist dependencies
        if (field.pick_list_values && field.pick_list_values.length > 0) {
          // Look for fields that might depend on this picklist
          for (const otherField of fields) {
            if (otherField.api_name !== field.api_name && otherField.lookup) {
              if (otherField.lookup.module === params.module_name) {
                dependencies.push({
                  source_field: field.api_name,
                  dependent_field: otherField.api_name,
                  dependency_type: 'picklist',
                  relationship_details: {
                    source_picklist_values: field.pick_list_values,
                    dependency_reason: 'Potential picklist dependency'
                  }
                });
              }
            }
          }
        }

        // Check for formula dependencies
        if (field.formula) {
          // Extract field references from formula
          const fieldReferences = this.extractFieldReferences(field.formula);
          for (const ref of fieldReferences) {
            const referencedField = fields.find(f => f.api_name === ref);
            if (referencedField) {
              dependencies.push({
                source_field: ref,
                dependent_field: field.api_name,
                dependency_type: 'formula',
                relationship_details: {
                  formula: field.formula,
                  referenced_field: ref
                }
              });
            }
          }
        }
      }

      // Build picklist chains
      for (const field of fields) {
        if (field.pick_list_values && field.pick_list_values.length > 0) {
          const dependent_picklists: string[] = [];
          const dependency_path: string[] = [field.api_name];

          // Find fields that depend on this picklist
          for (const dep of dependencies) {
            if (dep.source_field === field.api_name && dep.dependency_type === 'picklist') {
              dependent_picklists.push(dep.dependent_field);
              dependency_path.push(dep.dependent_field);
            }
          }

          if (dependent_picklists.length > 0) {
            picklist_chains.push({
              field_name: field.api_name,
              dependent_picklists,
              dependency_path
            });
          }
        }
      }

      const summary = {
        total_fields: fields.length,
        fields_with_dependencies: dependencies.length,
        picklist_fields: fields.filter(f => f.pick_list_values && f.pick_list_values.length > 0).length,
        lookup_fields: fields.filter(f => f.lookup).length
      };

      return {
        module: params.module_name,
        dependencies,
        picklist_chains,
        summary
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze picklist dependencies for ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get fields that depend on a specific field
   */
  async getDependentFields(params: {
    module_name: string;
    field_name: string;
  }): Promise<{
    field: string;
    dependents: Array<{
      field_name: string;
      dependency_type: string;
      relationship: any;
    }>;
    summary: {
      total_dependents: number;
      dependency_types: Record<string, number>;
    };
  }> {
    try {
      const fields = await this.crmClient.getFields(params.module_name);
      const targetField = fields.find(f => f.api_name === params.field_name || f.display_label === params.field_name);
      
      if (!targetField) {
        throw new Error(`Field ${params.field_name} not found in module ${params.module_name}`);
      }

      const dependents: Array<{
        field_name: string;
        dependency_type: string;
        relationship: any;
      }> = [];

      // Find fields that depend on the target field
      for (const field of fields) {
        if (field.api_name === params.field_name) continue;

        // Check for formula dependencies
        if (field.formula && this.fieldReferencedInFormula(field.formula, params.field_name)) {
          dependents.push({
            field_name: field.api_name,
            dependency_type: 'formula',
            relationship: {
              formula: field.formula,
              referenced_field: params.field_name
            }
          });
        }

        // Check for lookup dependencies
        if (field.lookup && field.lookup.module === params.module_name) {
          // This is a simplified check - in practice, you'd need more sophisticated logic
          dependents.push({
            field_name: field.api_name,
            dependency_type: 'lookup',
            relationship: {
              lookup_module: field.lookup.module,
              lookup_field: field.lookup.field
            }
          });
        }
      }

      const dependency_types = dependents.reduce((acc, dep) => {
        acc[dep.dependency_type] = (acc[dep.dependency_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        field: params.field_name,
        dependents,
        summary: {
          total_dependents: dependents.length,
          dependency_types
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get dependent fields for ${params.field_name} in ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get field relationships in a module
   */
  async getFieldRelationships(params: {
    module_name: string;
  }): Promise<{
    module: string;
    relationships: Array<{
      source_field: string;
      target_field: string;
      relationship_type: string;
      dependency_info: any;
    }>;
    summary: {
      total_relationships: number;
      relationship_types: Record<string, number>;
    };
  }> {
    try {
      const fields = await this.crmClient.getFields(params.module_name);
      const relationships: Array<{
        source_field: string;
        target_field: string;
        relationship_type: string;
        dependency_info: any;
      }> = [];

      // Analyze field relationships
      for (const field of fields) {
        // Lookup relationships
        if (field.lookup && field.lookup.id) {
          relationships.push({
            source_field: field.api_name,
            target_field: field.lookup.module?.api_name || 'Unknown',
            relationship_type: 'lookup',
            dependency_info: {
              lookup_id: field.lookup.id,
              display_label: field.lookup.display_label,
              module_id: field.lookup.module?.id
            }
          });
        }

        // Formula field dependencies
        if (field.formula && field.formula.expression) {
          const referencedFields = this.extractFieldReferences(field.formula);
          referencedFields.forEach(refField => {
            relationships.push({
              source_field: refField,
              target_field: field.api_name,
              relationship_type: 'formula_dependency',
              dependency_info: {
                formula_expression: field.formula.expression,
                data_type: field.data_type
              }
            });
          });
        }

        // Picklist dependencies (if any)
        if (field.pick_list_values && field.pick_list_values.length > 0) {
          // Check for dependent picklists (this would need additional logic)
          // For now, just note picklist fields
          relationships.push({
            source_field: field.api_name,
            target_field: 'picklist_values',
            relationship_type: 'picklist',
            dependency_info: {
              total_values: field.pick_list_values.length,
              is_global: !!field.global_picklist
            }
          });
        }
      }

      // Count relationship types
      const relationshipTypes: Record<string, number> = {};
      relationships.forEach(rel => {
        relationshipTypes[rel.relationship_type] = (relationshipTypes[rel.relationship_type] || 0) + 1;
      });

      return {
        module: params.module_name,
        relationships,
        summary: {
          total_relationships: relationships.length,
          relationship_types: relationshipTypes
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get field relationships for module ${params.module_name}: ${error.message}`);
    }
  }

  /**
   * Get global fields across all modules
   */
  async getGlobalFields(): Promise<{
    global_picklists: Array<{
      id: string;
      name: string;
      display_label: string;
      values: Array<{
        id: string;
        display_value: string;
        actual_value: string;
        sequence_number: number;
        colour_code?: string;
      }>;
      total_values: number;
    }>;
    global_lookups: Array<{
      id: string;
      name: string;
      display_label: string;
      source_module: string;
      target_module: string;
    }>;
    summary: {
      total_global_picklists: number;
      total_global_lookups: number;
    };
  }> {
    try {
      return await this.crmClient.getGlobalFields();
    } catch (error: any) {
      throw new Error(`Failed to get global fields: ${error.message}`);
    }
  }

  /**
   * Helper method to extract field references from formula
   */
  private extractFieldReferences(formula: any): string[] {
    if (typeof formula === 'string') {
      // Simple regex to find field references (this is a basic implementation)
      const fieldMatches = formula.match(/\b[A-Z][A-Za-z0-9_]*\b/g) || [];
      return fieldMatches.filter(match => match.length > 2); // Filter out common words
    }
    return [];
  }

  /**
   * Helper method to check if a field is referenced in a formula
   */
  private fieldReferencedInFormula(formula: any, fieldName: string): boolean {
    if (typeof formula === 'string') {
      return formula.includes(fieldName);
    }
    return false;
  }
}