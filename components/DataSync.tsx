'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { useCartSync } from '@/hooks/useCartSync';

export const DataSync = () => {
  useWishlist();
  useCartSync();
  return null;
};
