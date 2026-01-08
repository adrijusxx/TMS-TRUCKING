import type { ColumnDef, RowSelectionState, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';

// Re-export for convenience
export type { ColumnFiltersState };
import type React from 'react';

/**
 * Base type for all table data rows
 */
type TableData = Record<string, any>;

/**
 * Column definition with additional metadata
 */
export interface ExtendedColumnDef<TData extends TableData> extends Omit<ColumnDef<TData>, 'id'> {
  /**
   * Unique identifier for the column (used for column preferences)
   * Required override of the optional id property from ColumnDef
   */
  id: string;
  /**
   * Accessor key for the column (from ColumnDef)
   */
  accessorKey?: string;
  /**
   * Whether column can be toggled (default: true)
   */
  enableHiding?: boolean;
  /**
   * Default visibility (default: true)
   */
  defaultVisible?: boolean;
  /**
   * Permission required to see this column
   */
  permission?: string;
  /**
   * Whether column is required (cannot be hidden)
   */
  required?: boolean;
  /**
   * Whether column filtering is enabled
   */
  enableColumnFilter?: boolean;
  /**
   * Filter key to use for column filtering (defaults to column id)
   */
  filterKey?: string;
  /**
   * Type of filter to display for inline filtering
   */
  filterType?: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean' | 'searchable-select';
  /**
   * Options for select/multiselect filters
   */
  filterOptions?: Array<{ value: string; label: string }>;
  /**
   * Entity type for searchable-select filters
   */
  entityType?: string;
  /**
   * Tooltip text to display on column header hover (explains what the column shows)
   */
  tooltip?: string;
  /**
   * Custom class name to apply to both header and cell
   */
  className?: string;
}

/**
 * Bulk edit field definition
 */
export interface BulkEditField {
  /**
   * Field key/name
   */
  key: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Field type
   */
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'multiselect';
  /**
   * Options for select/multiselect
   */
  options?: Array<{ value: string; label: string }>;
  /**
   * Default value
   */
  defaultValue?: any;
  /**
   * Validation function
   */
  validate?: (value: any) => string | null;
  /**
   * Permission required to edit this field
   */
  permission?: string;
  /**
   * Whether field is required
   */
  required?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Help text
   */
  helpText?: string;
}

/**
 * Custom bulk action definition
 */
export interface CustomBulkAction {
  /**
   * Action identifier
   */
  id: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Icon component or name
   */
  icon?: React.ReactNode;
  /**
   * Action variant (default, destructive, etc.)
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  /**
   * Permission required to perform this action
   */
  permission?: string;
  /**
   * Handler function
   */
  handler: (selectedIds: string[]) => Promise<void> | void;
  /**
   * Whether action requires confirmation
   */
  requiresConfirmation?: boolean;
  /**
   * Confirmation message
   */
  confirmationMessage?: string;
}

/**
 * Entity table configuration
 */
export interface EntityTableConfig<TData extends TableData = TableData> {
  /**
   * Entity type identifier (e.g., 'trucks', 'loads', 'invoices')
   */
  entityType: string;
  /**
   * Column definitions
   */
  columns: ExtendedColumnDef<TData>[];
  /**
   * Default visible columns (column IDs)
   */
  defaultVisibleColumns?: string[];
  /**
   * Required columns (cannot be hidden)
   */
  requiredColumns?: string[];
  /**
   * Bulk edit fields
   */
  bulkEditFields?: BulkEditField[];
  /**
   * Custom bulk actions
   */
  customBulkActions?: CustomBulkAction[];
  /**
   * Default sort
   */
  defaultSort?: SortingState;
  /**
   * Default page size
   */
  defaultPageSize?: number;
  /**
   * Enable row selection
   */
  enableRowSelection?: boolean;
  /**
   * Enable column visibility toggle
   */
  enableColumnVisibility?: boolean;
  /**
   * Enable import
   */
  enableImport?: boolean;
  /**
   * Enable export
   */
  enableExport?: boolean;
  /**
   * Enable bulk edit
   */
  enableBulkEdit?: boolean;
  /**
   * Enable bulk delete
   */
  enableBulkDelete?: boolean;
  /**
   * Custom filter definitions
   */
  filterDefinitions?: FilterDefinition[];
}

/**
 * Filter definition
 */
export interface FilterDefinition {
  /**
   * Filter key
   */
  key: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Filter type
   */
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean' | 'searchable-select';
  /**
   * Options for select/multiselect
   */
  options?: Array<{ value: string; label: string }>;
  /**
   * Default value
   */
  defaultValue?: any;
  /**
   * Permission required to use this filter
   */
  permission?: string;
  /**
   * Help text for boolean filters
   */
  helpText?: string;
  /**
   * Entity type for searchable-select (e.g., 'loads', 'drivers')
   */
  entityType?: string;
  /**
   * Filter key for searchable-select column-values API
   */
  filterKey?: string;
}

/**
 * DataTable props
 */
export interface DataTableProps<TData extends TableData = TableData> {
  /**
   * Column definitions
   */
  columns: ExtendedColumnDef<TData>[];
  /**
   * Data rows
   */
  data: TData[];
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Error state
   */
  error?: Error | null;
  /**
   * Row selection state
   */
  rowSelection?: RowSelectionState;
  /**
   * Row selection change handler
   */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /**
   * Sorting state
   */
  sorting?: SortingState;
  /**
   * Sorting change handler
   */
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Column filters state
   */
  columnFilters?: ColumnFiltersState;
  /**
   * Column filters change handler
   */
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  /**
   * Column visibility state
   */
  columnVisibility?: VisibilityState;
  /**
   * Column visibility change handler
   */
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  /**
   * Pagination state
   */
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalCount?: number;
    totalPages?: number;
  };
  /**
   * Pagination change handler
   */
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  /**
   * Enable row selection
   */
  enableRowSelection?: boolean;
  /**
   * Custom row actions
   */
  rowActions?: (row: TData) => React.ReactNode;
  /**
   * On row click handler
   */
  onRowClick?: (row: TData) => void;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Show loading skeleton
   */
  showLoadingSkeleton?: boolean;
  /**
   * Inline edit component for expandable row editing
   */
  inlineEditComponent?: React.ComponentType<{
    row: TData;
    onSave: () => void;
    onCancel: () => void;
  }>;
  /**
   * Callback when inline edit saves (to refresh data)
   */
  onInlineEditSave?: () => void;
  /**
   * Function to get custom className for a row
   */
  getRowClassName?: (row: TData) => string;
  /**
   * Entity type for column filtering
   */
  entityType?: string;
  /**
   * Callback for column filter changes
   */
  onColumnFilterChange?: (columnId: string, values: string[]) => void;
  /**
   * Handler for bulk delete action
   * Receives array of selected row IDs
   */
  onDeleteSelected?: (selectedIds: string[]) => void;
  /**
   * Handler for bulk export action
   * Receives array of selected row IDs
   */
  onExportSelected?: (selectedIds: string[]) => void;
  /**
   * Filter key for global search (optional)
   */
  filterKey?: string;
  /**
   * Import handler - opens import modal
   */
  onImport?: () => void;
  /**
   * Export handler - exports all filtered data
   */
  onExport?: () => void;
  /**
   * Enable inline filter row below headers
   */
  enableInlineFilters?: boolean;
  /**
   * Column order state (array of column IDs in display order)
   */
  columnOrder?: string[];
  /**
   * Column order change handler
   */
  onColumnOrderChange?: (order: string[]) => void;
  /**
   * Enable draggable column headers
   */
  enableColumnReorder?: boolean;
  /**
   * Whether to save column preferences (visibility/order) to server automatically.
   * Default: true
   */
  savePreferences?: boolean;
}

/**
 * Column preference structure
 */
export interface ColumnPreference {
  visible: boolean;
  width?: number;
  order?: number;
}

/**
 * User column preferences (stored in database)
 */
export interface UserColumnPreferences {
  [columnId: string]: ColumnPreference;
}

