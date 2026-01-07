import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, MenuItem } from '@shared/schema';

// Helper to convert snake_case to camelCase
const snakeToCamel = (str: string): string => 
  str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Convert object keys from snake_case to camelCase
const convertToCamelCase = <T>(obj: Record<string, any>): T => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
};

/**
 * Hook for fetching menu items with real-time updates
 * Subscribes to Supabase realtime changes on menu_items table
 */
export function useRealtimeMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      // Convert snake_case to camelCase
      const converted = (data || []).map(item => convertToCamelCase<MenuItem>(item));
      setMenuItems(converted);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(err.message || 'Failed to fetch menu items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchMenuItems();

    // Set up real-time subscription for menu_items
    const channel = supabase
      .channel('menu-items-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'menu_items',
        },
        (payload) => {
          console.log('🔔 Menu items update received:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newItem = convertToCamelCase<MenuItem>(payload.new);
            setMenuItems(prev => [...prev, newItem].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = convertToCamelCase<MenuItem>(payload.new);
            setMenuItems(prev => 
              prev.map(item => item.id === updatedItem.id ? updatedItem : item)
            );
          } else if (payload.eventType === 'DELETE') {
            setMenuItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Menu items subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from menu items updates');
      supabase.removeChannel(channel);
    };
  }, [fetchMenuItems]);

  return {
    menuItems,
    isLoading,
    error,
    refetch: fetchMenuItems,
  };
}

/**
 * Hook for fetching categories with real-time updates
 * Subscribes to Supabase realtime changes on categories table
 */
export function useRealtimeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      // Convert snake_case to camelCase
      const converted = (data || []).map(cat => convertToCamelCase<Category>(cat));
      setCategories(converted);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchCategories();

    // Set up real-time subscription for categories
    const channel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          console.log('🔔 Categories update received:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newCat = convertToCamelCase<Category>(payload.new);
            setCategories(prev => [...prev, newCat].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
          } else if (payload.eventType === 'UPDATE') {
            const updatedCat = convertToCamelCase<Category>(payload.new);
            setCategories(prev => 
              prev.map(cat => cat.id === updatedCat.id ? updatedCat : cat)
            );
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(cat => cat.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Categories subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from categories updates');
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}

/**
 * Combined hook for menu display pages
 * Returns both menu items and categories with real-time updates
 */
export function useRealtimeMenu() {
  const { menuItems, isLoading: itemsLoading, error: itemsError } = useRealtimeMenuItems();
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useRealtimeCategories();

  return {
    menuItems,
    categories,
    isLoading: itemsLoading || categoriesLoading,
    error: itemsError || categoriesError,
  };
}
