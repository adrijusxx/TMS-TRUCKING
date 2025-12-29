'use client';

// Salary layout - uses AccountingNav sidebar component
// This ensures the salary page shows the accounting navigation sidebar
export default function SalaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

