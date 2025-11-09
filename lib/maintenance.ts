'use client';

import { buildApiUrl } from '@/lib/api';

export const fetchMaintenanceMode = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl('/api/check-maintenance'), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    return payload?.maintenanceMode === true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to determine maintenance mode:', error);
    }
    return false;
  }
};

