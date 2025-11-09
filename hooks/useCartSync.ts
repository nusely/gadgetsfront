'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { cartService } from '@/services/cart.service';
import { setCartItems } from '@/store/cartSlice';
import { CartItem } from '@/types/product';

const serializeCartSnapshot = (items: CartItem[]) =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    selected_variants: item.selected_variants || {},
  }));

export const useCartSync = () => {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const isFetching = useRef(false);
  const lastSnapshot = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cart from backend when user signs in
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      lastSnapshot.current = null;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      return;
    }

    isFetching.current = true;
    (async () => {
      try {
        const serverItems = await cartService.fetchCart();
        dispatch(setCartItems(serverItems));
        lastSnapshot.current = JSON.stringify(serializeCartSnapshot(serverItems));
      } catch (error) {
        console.error('Error loading cart from backend:', error);
      } finally {
        isFetching.current = false;
      }
    })();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [dispatch, isAuthenticated, user?.id]);

  // Persist cart changes to backend
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    if (isFetching.current) {
      return;
    }

    const snapshot = JSON.stringify(serializeCartSnapshot(items));
    if (snapshot === lastSnapshot.current) {
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        await cartService.syncCart(items);
        lastSnapshot.current = snapshot;
      } catch (error) {
        console.error('Error syncing cart to backend:', error);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [items, isAuthenticated, user?.id]);
};
