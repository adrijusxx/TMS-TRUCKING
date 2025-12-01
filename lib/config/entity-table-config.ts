import type {
  EntityTableConfig,
  ExtendedColumnDef,
  BulkEditField,
  CustomBulkAction,
  FilterDefinition,
} from '@/components/data-table/types';

/**
 * Entity table configuration registry
 */
class EntityTableConfigRegistry {
  private configs: Map<string, EntityTableConfig<any>> = new Map();

  /**
   * Register an entity table configuration
   */
  register<TData extends Record<string, any>>(config: EntityTableConfig<TData>): void {
    this.configs.set(config.entityType, config);
  }

  /**
   * Get entity table configuration
   */
  get<TData extends Record<string, any>>(entityType: string): EntityTableConfig<TData> | undefined {
    return this.configs.get(entityType) as EntityTableConfig<TData> | undefined;
  }

  /**
   * Check if entity configuration exists
   */
  has(entityType: string): boolean {
    return this.configs.has(entityType);
  }

  /**
   * Get all registered entity types
   */
  getAllEntityTypes(): string[] {
    return Array.from(this.configs.keys());
  }
}

// Global registry instance
const entityTableConfigRegistry = new EntityTableConfigRegistry();

/**
 * Helper function to create entity table configuration
 */
export function createEntityTableConfig<TData extends Record<string, any>>(
  config: EntityTableConfig<TData>
): EntityTableConfig<TData> {
  // Register the configuration
  entityTableConfigRegistry.register(config);

  return config;
}

/**
 * Get entity table configuration
 */
function getEntityTableConfig<TData extends Record<string, any>>(
  entityType: string
): EntityTableConfig<TData> | undefined {
  return entityTableConfigRegistry.get<TData>(entityType);
}

