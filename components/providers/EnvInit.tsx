'use client';

import { PublicEnv } from '@/lib/env-client';
import { useRef } from 'react';

export function EnvInit({ env }: { env: PublicEnv }) {
    // Use ref to ensure we only run this once
    const initialized = useRef(false);

    if (!initialized.current && typeof window !== 'undefined') {
        window.__ENV = env;
        initialized.current = true;
    }

    return null;
}
