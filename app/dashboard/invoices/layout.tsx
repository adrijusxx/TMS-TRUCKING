'use client';

// Invoices layout - uses AccountingNav sidebar component
// This prevents duplication with the AccountingNav sidebar
export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
