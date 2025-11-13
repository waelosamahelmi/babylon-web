import { createContext, useContext, useState, useEffect } from "react";
import { type RestaurantConfig, pizzeria_antonio_CONFIG } from "@/config/restaurant-config";
import { useRestaurantConfig } from "@/hooks/use-restaurant-config";

interface RestaurantContextType {
  config: RestaurantConfig;
  updateConfig: (updates: any) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { config: dbConfig, loading, error, updateConfig: updateDbConfig } = useRestaurantConfig();
  
  // Use database config if available, otherwise fallback to hardcoded config
  const config = dbConfig || pizzeria_antonio_CONFIG;

  // Show loading state only briefly to avoid "Loading website..." getting stuck
  if (loading && !config) {
    // Set a maximum loading time - if loading takes more than 5 seconds, show fallback config
    const timeoutId = setTimeout(() => {
      console.warn('Restaurant config loading timeout, using fallback');
    }, 5000);
    
    return (
      <RestaurantContext.Provider value={{ 
        config: pizzeria_antonio_CONFIG, 
        updateConfig: updateDbConfig, 
        loading: false, 
        error: null 
      }}>
        {children}
      </RestaurantContext.Provider>
    );
  }

  return (
    <RestaurantContext.Provider value={{ 
      config, 
      updateConfig: updateDbConfig, 
      loading, 
      error 
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}