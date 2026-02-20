'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Common SVG props
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    gradientId?: string;
}

export const LoadManagementIcon = ({ className, gradientId = 'load-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
        </defs>
        <rect x="20" y="30" width="60" height="45" rx="4" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            d="M30 45 L50 60 L70 45"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M20 30 L50 15 L80 30" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const FleetIcon = ({ className, gradientId = 'fleet-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <motion.g animate={{ x: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity }}>
            <rect x="15" y="40" width="45" height="35" rx="4" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
            <path d="M60 50 L80 50 L85 60 L85 75 L60 75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="30" cy="75" r="8" fill="#0F172A" stroke={`url(#${gradientId})`} strokeWidth="4" />
            <circle cx="70" cy="75" r="8" fill="#0F172A" stroke={`url(#${gradientId})`} strokeWidth="4" />
            <path d="M65 50 L75 50 L78 58 L65 58 Z" fill={`url(#${gradientId})`} fillOpacity="0.4" />
        </motion.g>
    </svg>
);

export const DriverIcon = ({ className, gradientId = 'driver-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
        </defs>
        <circle cx="50" cy="35" r="15" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <motion.path
            initial={{ y: 5 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            d="M20 80 C20 65 30 55 50 55 C70 55 80 65 80 80"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
        />
        <rect x="40" y="65" width="20" height="15" rx="2" fill={`url(#${gradientId})`} fillOpacity="0.4" />
    </svg>
);

export const SettlementIcon = ({ className, gradientId = 'settlement-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#BE185D" />
            </linearGradient>
        </defs>
        <rect x="25" y="20" width="50" height="60" rx="4" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <motion.circle
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            cx="50" cy="40" r="12"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
        />
        <path d="M50 32 V48" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" />
        <path d="M46 36 C46 36 54 36 54 40 C54 44 46 44 46 48 C46 52 54 52 54 52" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="35" y1="65" x2="65" y2="65" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const GPSIcon = ({ className, gradientId = 'gps-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
        </defs>
        <path d="M20 50 C20 30 35 15 50 15 C65 15 80 30 80 50 C80 75 50 90 50 90 C50 90 20 75 20 50 Z" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinejoin="round" />
        <motion.circle
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            cx="50"
            cy="45"
            r="10"
            fill={`url(#${gradientId})`}
        />
        <circle cx="50" cy="45" r="4" fill="#0F172A" />
    </svg>
);

export const InvoiceIcon = ({ className, gradientId = 'invoice-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
        </defs>
        <rect x="25" y="15" width="50" height="70" rx="4" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <motion.g animate={{ x: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
            <line x1="40" y1="35" x2="70" y2="35" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
            <line x1="35" y1="50" x2="65" y2="50" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
            <line x1="35" y1="65" x2="55" y2="65" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        </motion.g>
        <circle cx="35" cy="35" r="3" fill={`url(#${gradientId})`} />
    </svg>
);

export const SafetyIcon = ({ className, gradientId = 'safety-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
        </defs>
        <path d="M50 15 L20 25 V45 C20 65 35 80 50 85 C65 80 80 65 80 45 V25 L50 15 Z" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinejoin="round" />
        <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 1 }}
            d="M40 50 L48 58 L62 42"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const MaintenanceIcon = ({ className, gradientId = 'maintenance-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
        </defs>
        <motion.g animate={{ rotate: 180 }} transition={{ duration: 4, ease: "linear", repeat: Infinity }} style={{ originX: "50%", originY: "50%" }}>
            <circle cx="50" cy="50" r="25" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" strokeDasharray="10 6" />
            <circle cx="50" cy="50" r="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" />
        </motion.g>
        <path d="M70 30 L85 15" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" />
        <path d="M30 70 L15 85" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" />
        <path d="M70 70 L85 85" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" />
        <path d="M30 30 L15 15" stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" />
    </svg>
);

export const IncidentIcon = ({ className, gradientId = 'incident-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
        </defs>
        <path d="M50 15 L85 80 H15 L50 15 Z" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinejoin="round" />
        <motion.line
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            x1="50" y1="40" x2="50" y2="60"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
        />
        <circle cx="50" cy="72" r="3" fill={`url(#${gradientId})`} />
    </svg>
);

export const AnalyticsIcon = ({ className, gradientId = 'analytics-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
        </defs>
        <polyline points="20,80 80,80" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <polyline points="20,80 20,20" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            d="M30 70 L45 45 L60 55 L80 25"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="45" cy="45" r="4" fill={`url(#${gradientId})`} />
        <circle cx="60" cy="55" r="4" fill={`url(#${gradientId})`} />
        <circle cx="80" cy="25" r="4" fill={`url(#${gradientId})`} />
    </svg>
);

export const DocumentIcon = ({ className, gradientId = 'doc-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
        </defs>
        <path d="M30 15 H60 L75 30 V85 H30 V15 Z" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinejoin="round" />
        <path d="M60 15 V30 H75" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinejoin="round" />
        <motion.line animate={{ x: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }} x1="40" y1="45" x2="65" y2="45" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <motion.line animate={{ x: [2, -2, 2] }} transition={{ duration: 2, repeat: Infinity }} x1="40" y1="55" x2="60" y2="55" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <motion.line animate={{ x: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }} x1="40" y1="65" x2="55" y2="65" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
    </svg>
);

export const CalendarIcon = ({ className, gradientId = 'calendar-gradient' }: IconProps) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
        </defs>
        <rect x="20" y="25" width="60" height="60" rx="6" fill={`url(#${gradientId})`} fillOpacity="0.2" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <line x1="20" y1="45" x2="80" y2="45" stroke={`url(#${gradientId})`} strokeWidth="4" />
        <line x1="35" y1="15" x2="35" y2="35" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <line x1="65" y1="15" x2="65" y2="35" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
        <motion.rect
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            x="30" y="55" width="10" height="10" rx="2"
            fill={`url(#${gradientId})`}
        />
        <rect x="45" y="55" width="10" height="10" rx="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
        <rect x="60" y="55" width="10" height="10" rx="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
        <rect x="30" y="70" width="10" height="10" rx="2" fill={`url(#${gradientId})`} fillOpacity="0.5" />
    </svg>
);
