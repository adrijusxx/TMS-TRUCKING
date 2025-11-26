/**
 * Samsara icon component for map markers
 * Uses Samsara brand color (#00A0E3)
 */

import type { SVGProps } from 'react';

interface SamsaraIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'healthy' | 'faulty' | 'assigned';
}

const SAMSARA_BLUE = '#00A0E3';
const HEALTHY_COLOR = '#16a34a';
const FAULTY_COLOR = '#dc2626';
const ASSIGNED_COLOR = '#2563eb';

export function SamsaraIcon({ size = 24, variant = 'healthy', ...props }: SamsaraIconProps) {
  const color = 
    variant === 'faulty' ? FAULTY_COLOR :
    variant === 'assigned' ? ASSIGNED_COLOR :
    HEALTHY_COLOR;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Truck body */}
      <rect x="2" y="8" width="14" height="8" rx="1" fill={color} />
      {/* Truck cab */}
      <rect x="16" y="10" width="6" height="6" rx="0.5" fill={color} />
      {/* Wheels */}
      <circle cx="6" cy="18" r="2" fill="#1a1a1a" />
      <circle cx="14" cy="18" r="2" fill="#1a1a1a" />
      {/* Samsara "S" symbol (simplified) */}
      <path
        d="M8 12 C8 11, 9 10, 10 10 C11 10, 12 11, 12 12 C12 13, 11 14, 10 14 C9 14, 8 13, 8 12"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

