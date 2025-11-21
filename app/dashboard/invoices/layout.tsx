'use client';

// Invoices layout - no duplicate navigation tabs (use sidebar instead)
// This prevents duplication with the AccountingNav sidebar
export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
