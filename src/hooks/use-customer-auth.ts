import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Customer {
  id: string;
  auth_id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  addresses: any[];
  default_address_index: number;
  marketing_emails: boolean;
  sms_notifications: boolean;
  is_verified: boolean;
  is_active: boolean;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface SignUpData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  marketing_emails?: boolean;
}

export function useCustomerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCustomerData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCustomerData(session.user.id);
      } else {
        setCustomer(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCustomerData = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error) throw error;

      setCustomer(data);

      // Update last login
      await supabase
        .from('customers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('auth_id', authId);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('No user returned from signup');

      // Create customer record
      const { error: customerError } = await supabase.from('customers').insert({
        auth_id: authData.user.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        marketing_emails: data.marketing_emails || false,
      });

      if (customerError) {
        // If customer creation fails, try to clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw customerError;
      }

      return authData;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Customer>) => {
    try {
      if (!customer) throw new Error('No customer logged in');

      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customer.id);

      if (error) throw error;

      // Reload customer data
      await loadCustomerData(customer.auth_id);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const addAddress = async (address: any) => {
    try {
      if (!customer) throw new Error('No customer logged in');

      const updatedAddresses = [...customer.addresses, address];

      await updateProfile({ addresses: updatedAddresses });
    } catch (error) {
      console.error('Add address error:', error);
      throw error;
    }
  };

  const updateAddress = async (index: number, address: any) => {
    try {
      if (!customer) throw new Error('No customer logged in');

      const updatedAddresses = [...customer.addresses];
      updatedAddresses[index] = address;

      await updateProfile({ addresses: updatedAddresses });
    } catch (error) {
      console.error('Update address error:', error);
      throw error;
    }
  };

  const deleteAddress = async (index: number) => {
    try {
      if (!customer) throw new Error('No customer logged in');

      const updatedAddresses = customer.addresses.filter((_, i) => i !== index);

      await updateProfile({
        addresses: updatedAddresses,
        default_address_index:
          customer.default_address_index >= updatedAddresses.length
            ? Math.max(0, updatedAddresses.length - 1)
            : customer.default_address_index,
      });
    } catch (error) {
      console.error('Delete address error:', error);
      throw error;
    }
  };

  const setDefaultAddress = async (index: number) => {
    try {
      await updateProfile({ default_address_index: index });
    } catch (error) {
      console.error('Set default address error:', error);
      throw error;
    }
  };

  return {
    user,
    customer,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
