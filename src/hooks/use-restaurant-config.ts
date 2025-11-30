import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RestaurantConfig } from '../config/restaurant-config';

// Database restaurant config interface
export interface DatabaseRestaurantConfig {
  id: string;
  name: string;
  name_en: string;
  tagline: string;
  tagline_en: string;
  description: string;
  description_en: string;
  phone: string;
  email: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  social_media: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  hours: {
    general: any;
    pickup: any;
    delivery: any;
  };
  services: {
    hasLunchBuffet: boolean;
    lunchBuffetHours?: any;
    hasDelivery: boolean;
    hasPickup: boolean;
    hasDineIn: boolean;
  };
  delivery_config: {
    zones: Array<{
      maxDistance: number;
      fee: number;
      minimumOrder?: number;
    }>;
    location: {
      lat: number;
      lng: number;
    };
    minimumOrderDelivery?: number;
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    fonts?: {
      heading: string;
      body: string;
    };
    light?: {
      background: string;
      foreground: string;
      card: string;
      cardForeground: string;
      popover: string;
      popoverForeground: string;
      primary: string;
      primaryForeground: string;
      secondary: string;
      secondaryForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      destructive: string;
      destructiveForeground: string;
      border: string;
      input: string;
      ring: string;
    };
    dark?: {
      background: string;
      foreground: string;
      card: string;
      cardForeground: string;
      popover: string;
      popoverForeground: string;
      primary: string;
      primaryForeground: string;
      secondary: string;
      secondaryForeground: string;
      muted: string;
      mutedForeground: string;
      accent: string;
      accentForeground: string;
      destructive: string;
      destructiveForeground: string;
      border: string;
      input: string;
      ring: string;
    };
  };
  page_layout_variants: {
    home: string;
    menu: string;
    about: string;
    header: string;
    footer: string;
    cart: string;
    checkout: string;
  };
  logo: {
    icon: string;
    imageUrl?: string;
    showText: boolean;
    backgroundColor: string;
  };
  about: {
    story: string;
    storyEn: string;
    mission: string;
    missionEn: string;
    specialties: Array<{
      title: string;
      titleEn: string;
      description: string;
      descriptionEn: string;
      icon: string;
    }>;
    experience: string;
    experienceEn: string;
  };
  hero: {
    backgroundImage: string;
    videoUrl?: string;
    features: Array<{
      title: string;
      titleEn: string;
      color: string;
    }>;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Convert database config to RestaurantConfig format
function convertDatabaseConfigToRestaurantConfig(dbConfig: DatabaseRestaurantConfig): RestaurantConfig {
  return {
    name: dbConfig.name,
    nameEn: dbConfig.name_en,
    tagline: dbConfig.tagline,
    taglineEn: dbConfig.tagline_en,
    description: dbConfig.description,
    descriptionEn: dbConfig.description_en,
    phone: dbConfig.phone,
    email: dbConfig.email,
    address: dbConfig.address,
    facebook: dbConfig.social_media.facebook,
    instagram: dbConfig.social_media.instagram,
    tiktok: dbConfig.social_media.tiktok,
    website: dbConfig.social_media.website,
    hours: dbConfig.hours,
    services: dbConfig.services,
    delivery: dbConfig.delivery_config,
    theme: dbConfig.theme,
    pageLayoutVariants: dbConfig.page_layout_variants,
    logo: dbConfig.logo,
    about: dbConfig.about,
    hero: dbConfig.hero,
  };
}

// Convert RestaurantConfig to database format
export function convertRestaurantConfigToDatabaseConfig(config: RestaurantConfig): Partial<DatabaseRestaurantConfig> {
  return {
    name: config.name,
    name_en: config.nameEn,
    tagline: config.tagline,
    tagline_en: config.taglineEn,
    description: config.description,
    description_en: config.descriptionEn,
    phone: config.phone,
    email: config.email,
    address: config.address,
    social_media: {
      facebook: config.facebook,
      instagram: config.instagram,
      tiktok: config.tiktok,
      website: config.website,
    },
    hours: config.hours,
    services: config.services,
    delivery_config: config.delivery,
    theme: config.theme,
    page_layout_variants: config.pageLayoutVariants,
    logo: config.logo,
    about: config.about,
    hero: config.hero,
  };
}

// Global state manager for restaurant config
class RestaurantConfigManager {
  private static instance: RestaurantConfigManager;
  private subscribers: Set<(config: RestaurantConfig | null) => void> = new Set();
  private subscription: any = null;
  private currentConfig: RestaurantConfig | null = null;
  private isInitialized = false;

  static getInstance(): RestaurantConfigManager {
    if (!RestaurantConfigManager.instance) {
      RestaurantConfigManager.instance = new RestaurantConfigManager();
    }
    return RestaurantConfigManager.instance;
  }

  subscribe(callback: (config: RestaurantConfig | null) => void) {
    this.subscribers.add(callback);
    
    // Initialize subscription if this is the first subscriber
    if (this.subscribers.size === 1 && !this.subscription) {
      this.initializeSubscription();
    }
    
    // Send current config immediately if available
    if (this.isInitialized) {
      callback(this.currentConfig);
    }

    return () => {
      this.subscribers.delete(callback);
      // Clean up subscription if no more subscribers
      if (this.subscribers.size === 0 && this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    };
  }

  private async initializeSubscription() {
    try {
      // Fetch initial data
      const { data, error } = await supabase
        .from('restaurant_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        this.currentConfig = convertDatabaseConfigToRestaurantConfig(data);
        console.log('✅ Loaded restaurant config from database:', this.currentConfig.name);
      } else {
        console.warn('⚠️ No active restaurant config found in database, using fallback');
        // Import fallback config
        const { ravintola_babylon_CONFIG } = await import('../config/restaurant-config');
        this.currentConfig = ravintola_babylon_CONFIG;
      }
      
      this.isInitialized = true;
      this.notifySubscribers();

      // Set up real-time subscription
      this.subscription = supabase
        .channel(`restaurant_config_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'restaurant_config',
            filter: 'is_active=eq.true'
          },
          (payload) => {
            console.log('🔄 Restaurant config changed:', payload);
            if (payload.new && typeof payload.new === 'object') {
              this.currentConfig = convertDatabaseConfigToRestaurantConfig(payload.new as DatabaseRestaurantConfig);
              this.notifySubscribers();
            } else if (payload.eventType === 'DELETE') {
              // If active config was deleted, try to load another one
              this.loadFallbackConfig();
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('❌ Error initializing restaurant config subscription:', error);
      // Load fallback config
      await this.loadFallbackConfig();
    }
  }

  private async loadFallbackConfig() {
    try {
      const { ravintola_babylon_CONFIG } = await import('../config/restaurant-config');
      this.currentConfig = ravintola_babylon_CONFIG;
      this.isInitialized = true;
      this.notifySubscribers();
    } catch (error) {
      console.error('❌ Failed to load fallback config:', error);
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.currentConfig));
  }

  // Update restaurant config in database
  async updateConfig(config: Partial<DatabaseRestaurantConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurant_config')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      console.log('✅ Restaurant config updated successfully');
    } catch (error) {
      console.error('❌ Failed to update restaurant config:', error);
      throw error;
    }
  }

  // Create new restaurant config
  async createConfig(config: Omit<DatabaseRestaurantConfig, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurant_config')
        .insert([{
          ...config,
          is_active: true // This will automatically deactivate other configs
        }]);

      if (error) {
        throw error;
      }

      console.log('✅ New restaurant config created successfully');
    } catch (error) {
      console.error('❌ Failed to create restaurant config:', error);
      throw error;
    }
  }
}

export function useRestaurantConfig() {
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const manager = RestaurantConfigManager.getInstance();
    
    const unsubscribe = manager.subscribe((newConfig) => {
      setConfig(newConfig);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const updateConfig = async (updates: Partial<DatabaseRestaurantConfig>) => {
    try {
      const manager = RestaurantConfigManager.getInstance();
      await manager.updateConfig(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
      throw err;
    }
  };

  const createConfig = async (newConfig: Omit<DatabaseRestaurantConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const manager = RestaurantConfigManager.getInstance();
      await manager.createConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create config');
      throw err;
    }
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    createConfig,
  };
}