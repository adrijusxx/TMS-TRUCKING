/**
 * Standardized navigation constants for all submenu components
 * Ensures consistent design, spacing, alignment, and text handling across all navigation sidebars
 */

// Sidebar dimensions
export const SIDEBAR_WIDTHS = {
  expanded: 'w-80', // 320px (increased from w-64/256px for better text fit - adds ~64px for 2-3 more characters)
  collapsed: 'w-12', // 48px
} as const;

// Padding standards
export const NAV_PADDING = {
  // Flat navigation items
  item: 'px-3 py-1.5',
  // Collapsible section triggers
  trigger: 'px-3 py-2',
  // Header section
  header: 'mb-3 pb-3',
} as const;

// Spacing standards
export const NAV_SPACING = {
  // Between icon and text
  iconText: 'gap-2',
  // Between navigation items
  items: 'space-y-2',
  // Between collapsible sections
  sections: 'space-y-2',
  // Between collapsible items
  collapsibleItems: 'space-y-0.5',
} as const;

// Icon sizes
export const NAV_ICON_SIZES = {
  // Section/header icons
  section: 'h-5 w-5',
  // Menu item icons
  item: 'h-4 w-4',
  // Chevron icons
  chevron: 'h-4 w-4',
} as const;

// Typography
export const NAV_TYPOGRAPHY = {
  // Section headers
  sectionHeader: 'text-base font-semibold',
  // Menu items
  item: 'text-sm font-medium',
  // Descriptions
  description: 'text-xs text-muted-foreground',
  // All text must truncate
  truncate: 'truncate',
} as const;

// Interactive states
export const NAV_STATES = {
  // Active state
  active: 'bg-primary text-primary-foreground',
  // Hover state
  hover: 'hover:bg-accent hover:text-accent-foreground',
  // Transition
  transition: 'transition-colors',
} as const;

// Border and separator
export const NAV_BORDERS = {
  header: 'border-b',
} as const;

// Rounded corners
export const NAV_ROUNDED = {
  item: 'rounded-md',
  trigger: 'rounded-lg',
} as const;

// Combined class strings for common use cases
// Note: itemBase is defined separately to avoid circular reference
const itemBaseClasses = `${NAV_PADDING.item} ${NAV_ROUNDED.item} ${NAV_TYPOGRAPHY.item} ${NAV_STATES.transition} ${NAV_TYPOGRAPHY.truncate}`;

export const NAV_CLASSES = {
  // Standard navigation item base classes
  itemBase: itemBaseClasses,
  // Standard navigation item with hover
  itemHover: `${itemBaseClasses} text-foreground/80 ${NAV_STATES.hover}`,
  // Standard navigation item active
  itemActive: `${NAV_PADDING.item} ${NAV_ROUNDED.item} ${NAV_TYPOGRAPHY.item} ${NAV_STATES.transition} ${NAV_STATES.active} ${NAV_TYPOGRAPHY.truncate}`,
  // Collapsible trigger base
  triggerBase: `${NAV_PADDING.trigger} ${NAV_ROUNDED.trigger} ${NAV_TYPOGRAPHY.item} ${NAV_STATES.transition} font-semibold`,
  // Header container
  headerContainer: `${NAV_PADDING.header} ${NAV_BORDERS.header}`,
} as const;

// Sidebar container classes - standardized backgrounds for all submenus
const SIDEBAR_CLASSES = {
  expanded: `${SIDEBAR_WIDTHS.expanded} border-r bg-secondary overflow-y-auto p-4 ${NAV_SPACING.sections}`,
  collapsed: `${SIDEBAR_WIDTHS.collapsed} border-r bg-secondary p-2 flex flex-col items-center`,
} as const;

// Standardized background classes - all sections must use these
export const NAV_BACKGROUNDS = {
  // Main sidebar background
  sidebar: 'bg-secondary',
  // Section/item hover background
  hover: 'hover:bg-accent',
  // Active item background (standardized - no color variations)
  active: 'bg-primary text-primary-foreground',
  // Collapsible section trigger hover
  triggerHover: 'hover:bg-accent/50',
  // Collapsible section trigger active
  triggerActive: 'bg-accent/50',
} as const;

// Toggle button classes - standardized for all submenu hide/show buttons
// All buttons must be identical: variant="ghost" size="icon" with these classes
export const NAV_TOGGLE_BUTTONS = {
  // Collapsed state button (to expand) - shows ChevronRight
  collapsed: 'h-8 w-8',
  // Expanded state button (to collapse) - shows ChevronLeft  
  expanded: 'h-6 w-6',
} as const;

