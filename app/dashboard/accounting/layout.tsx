'use client';

// Accounting layout - no duplicate navigation, just sidebar
// This ensures all accounting pages (batches, invoices, etc.) show the sidebar navigation
export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

