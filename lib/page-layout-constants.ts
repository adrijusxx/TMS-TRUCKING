/**
 * Page Layout Constants
 * 
 * Standardized layout values for all pages in the TMS application.
 * Every page should follow the same structure for consistency.
 */

// Page spacing constants
export const PAGE_SPACING = {
  // Main container spacing between sections
  container: 'space-y-6',
  // Alternative spacing for tighter layouts
  containerTight: 'space-y-4',
} as const;

// Page header constants
export const PAGE_HEADER = {
  // Main page title
  title: 'text-3xl font-bold',
  // Page description/subtitle
  description: 'text-muted-foreground',
  // Header container (wraps title + description)
  container: '', // No extra classes needed, just a div
} as const;

// Page padding/margin constants
export const PAGE_PADDING = {
  // No padding should be added at page level
  // Layout handles all padding
  none: '',
} as const;

/**
 * Standard Page Structure Template
 * 
 * Every page in the application should follow this exact structure:
 * 
 * ```tsx
 * import { Breadcrumb } from '@/components/ui/breadcrumb';
 * 
 * export default function PageName() {
 *   return (
 *     <>
 *       <Breadcrumb items={[
 *         { label: 'Parent Section', href: '/dashboard/parent' },
 *         { label: 'Current Page' }
 *       ]} />
 *       <div className="space-y-6">
 *         <div>
 *           <h1 className="text-3xl font-bold">Page Title</h1>
 *           <p className="text-muted-foreground">Page description</p>
 *         </div>
 *         {/* Page Content *\/}
 *       </div>
 *     </>
 *   );
 * }
 * ```
 * 
 * Rules:
 * 1. Breadcrumb is ALWAYS the first element
 * 2. Main container ALWAYS uses "space-y-6"
 * 3. Header ALWAYS uses "text-3xl font-bold" for h1
 * 4. Description ALWAYS uses "text-muted-foreground"
 * 5. NO extra padding wrappers (no p-6, p-4, etc.)
 * 6. Headers are in the PAGE, not in components
 */

// Breadcrumb guidelines
export const BREADCRUMB_RULES = {
  /**
   * Breadcrumb Structure:
   * - Always show full path from Dashboard
   * - Last item (current page) should NOT have href
   * - Use consistent, clear labels
   * - Home icon always links to /dashboard
   * 
   * Examples:
   * - Department main: [{ label: 'Safety Department' }]
   * - Subpage: [{ label: 'Safety Department', href: '/dashboard/safety' }, { label: 'Documents' }]
   * - Nested: [{ label: 'Safety', href: '/dashboard/safety' }, { label: 'Compliance', href: '/dashboard/safety/compliance' }, { label: 'FMCSA' }]
   */
} as const;

// Component refactoring guidelines
export const COMPONENT_GUIDELINES = {
  /**
   * Components should NOT contain:
   * - Page headers (h1 with title)
   * - Breadcrumbs
   * - Page-level spacing wrappers
   * 
   * Components SHOULD contain:
   * - Only their specific functionality
   * - Internal content and logic
   * - Section headers (h2, h3) if needed for internal structure
   * 
   * If a component currently has a page header, it should be:
   * 1. Removed from the component
   * 2. Added to the page file
   * 3. Component updated to accept data as props if needed
   */
} as const;

export default {
  PAGE_SPACING,
  PAGE_HEADER,
  PAGE_PADDING,
  BREADCRUMB_RULES,
  COMPONENT_GUIDELINES,
};

