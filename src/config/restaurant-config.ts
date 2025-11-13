/**
 * Restaurant Configuration
 * Centralized configuration for easy restaurant customization
 */

// Types for database restaurant settings
export interface DatabaseRestaurantSettings {
  id: number;
  is_open: boolean;
  is_busy?: boolean;
  opening_hours: string; // JSON string
  pickup_hours: string; // JSON string
  delivery_hours: string; // JSON string
  lunch_buffet_hours: string; // JSON string
  special_message: string | null;
  updated_at: string;
  default_printer_id: string | null;
  printer_auto_reconnect: boolean;
  printer_tab_sticky: boolean;
}

// Parsed hours format from database
export interface ParsedHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

// Day schedule interface
export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

// Full schedule interface
export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface RestaurantConfig {
  // Basic Information
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  
  // Contact Information
  phone: string;
  email: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  
  // Social Media
  facebook?: string;
  instagram?: string;
  website?: string;
  
  // Status
  isBusy?: boolean;
  
  // Business Hours (will be overridden by database)
  hours: {
    general: WeekSchedule;
    pickup: WeekSchedule;
    delivery: WeekSchedule;
  };
  
  // Services
  services: {
    hasLunchBuffet: boolean;
    lunchBuffetHours?: WeekSchedule;
    hasDelivery: boolean;
    hasPickup: boolean;
    hasDineIn: boolean;
  };
  
  // Delivery Configuration
  delivery: {
    zones: Array<{
      maxDistance: number;
      fee: number;
      minimumOrder?: number;
    }>;
    location: {
      lat: number;
      lng: number;
    };
  };
  
  // Theme & Branding
  theme: {
    // Legacy colors (kept for backward compatibility)
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    
    // Complete light mode theme (optional for backward compatibility)
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
    
    // Dark mode colors (optional for backward compatibility)
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
  
  // Logo Configuration
  logo: {
    icon: string; // Lucide icon name or emoji
    imageUrl?: string; // URL to logo image
    showText: boolean;
    backgroundColor: string;
  };
  
  // About Section
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
  
  // Hero Section
  hero: {
    backgroundImage: string;
    videoUrl?: string;
    features: Array<{
      title: string;
      titleEn: string;
      color: string;
    }>;
  };
}

// Utility functions for parsing database hours
export function parseDatabaseHours(hoursJson: string): ParsedHours {
  try {
    return JSON.parse(hoursJson);
  } catch (error) {
    console.error('Failed to parse hours JSON:', error);
    return {
      monday: "10:30-21:30",
      tuesday: "10:30-21:30",
      wednesday: "10:30-21:30",
      thursday: "10:30-21:30",
      friday: "10:30-22:00",
      saturday: "10:30-05:30",
      sunday: "10:30-21:30"
    };
  }
}

export function convertDatabaseHoursToWeekSchedule(hoursJson: string): WeekSchedule {
  const parsedHours = parseDatabaseHours(hoursJson);
  const schedule: WeekSchedule = {} as WeekSchedule;
  
  Object.entries(parsedHours).forEach(([day, timeRange]) => {
    if (timeRange === "closed" || !timeRange) {
      schedule[day as keyof WeekSchedule] = { open: "", close: "", closed: true };
    } else {
      const [open, close] = timeRange.split('-');
      schedule[day as keyof WeekSchedule] = { 
        open: open || "10:30", 
        close: close || "21:30", 
        closed: false 
      };
    }
  });
  
  return schedule;
}

export function mergeConfigWithDatabaseSettings(
  config: RestaurantConfig, 
  dbSettings?: DatabaseRestaurantSettings
): RestaurantConfig {
  if (!dbSettings) return config;

  const mergedConfig = { ...config };

  try {
    // Override hours with database data
    mergedConfig.hours = {
      general: convertDatabaseHoursToWeekSchedule(dbSettings.opening_hours),
      pickup: convertDatabaseHoursToWeekSchedule(dbSettings.pickup_hours),
      delivery: convertDatabaseHoursToWeekSchedule(dbSettings.delivery_hours),
    };

    // Override lunch buffet hours if available
    if (dbSettings.lunch_buffet_hours && mergedConfig.services.hasLunchBuffet) {
      mergedConfig.services.lunchBuffetHours = convertDatabaseHoursToWeekSchedule(dbSettings.lunch_buffet_hours);
    }

    // Set busy status
    mergedConfig.isBusy = dbSettings.is_busy || false;

    // Note: Special message handling will be done in components that can access the database settings directly
  } catch (error) {
    console.error('Failed to merge database settings:', error);
  }

  return mergedConfig;
}

// Default configuration for Pizzeria Antonio
export const pizzeria_antonio_CONFIG: RestaurantConfig = {
  name: "Pizzeria Antonio",
  nameEn: "Pizzeria Antonio",
  tagline: "Laadukkaita aterioita Lahden sydämessä",
  taglineEn: "Quality meals in the heart of Lahti",
  description: "Pizzeria Antoniossa tarjoamme laadukkaita aterioita ja kutsumme sinut maistamaan herkullisia ruokiamme.",
  descriptionEn: "At Pizzeria Antonio we offer quality meals and invite you to taste our delicious food.",
  
  phone: "+35835899089",
  email: "info@pizzeriaantonio.fi",
  address: {
    street: "Rauhankatu 19 c",
    postalCode: "15110",
    city: "Lahti",
    country: "Finland"
  },
  
  facebook: "https://www.facebook.com/profile.php?id=61577964717473",
  
  hours: {
    general: {
      monday: { open: "10:30", close: "21:30", closed: false },
      tuesday: { open: "10:30", close: "21:30", closed: false },
      wednesday: { open: "10:30", close: "21:30", closed: false },
      thursday: { open: "10:30", close: "21:30", closed: false },
      friday: { open: "10:30", close: "22:00", closed: false },
      saturday: { open: "10:30", close: "05:30", closed: false },
      sunday: { open: "10:30", close: "21:30", closed: false },
    },
    pickup: {
      monday: { open: "10:30", close: "21:30", closed: false },
      tuesday: { open: "10:30", close: "21:30", closed: false },
      wednesday: { open: "10:30", close: "21:30", closed: false },
      thursday: { open: "10:30", close: "21:30", closed: false },
      friday: { open: "10:30", close: "22:00", closed: false },
      saturday: { open: "10:30", close: "05:30", closed: false },
      sunday: { open: "10:30", close: "21:30", closed: false },
    },
    delivery: {
      monday: { open: "10:30", close: "21:30", closed: false },
      tuesday: { open: "10:30", close: "21:30", closed: false },
      wednesday: { open: "10:30", close: "21:30", closed: false },
      thursday: { open: "10:30", close: "21:30", closed: false },
      friday: { open: "10:30", close: "22:00", closed: false },
      saturday: { open: "10:30", close: "05:30", closed: false },
      sunday: { open: "10:30", close: "21:30", closed: false },
    },
  },
  
  services: {
    hasLunchBuffet: false,
    hasDelivery: true,
    hasPickup: true,
    hasDineIn: true,
  },
  
  delivery: {
    zones: [
      { maxDistance: 4, fee: 0.00 },
      { maxDistance: 5, fee: 4.00 },
      { maxDistance: 8, fee: 7.00 },
      { maxDistance: 10, fee: 10.00 }
    ],
    location: {
      lat: 60.9832,
      lng: 25.6608,
    },
  },
  
  theme: {
    primary: "#8B4513", // Saddle brown (dark brown)
    secondary: "#FF8C00", // Dark orange
    accent: "#F5E6D3", // Creamy/beige
    success: "#16a34a", // green-600
    warning: "#ea580c", // orange-600
    error: "#dc2626", // red-600
    background: "#ffffff",
    foreground: "#1f2937", // gray-800
    
    // Light mode colors - warm, cozy restaurant theme
    light: {
      background: "hsl(0, 0%, 100%)", // white
      foreground: "hsl(222.2, 84%, 4.9%)", // dark text
      card: "hsl(0, 0%, 100%)", // white cards
      cardForeground: "hsl(222.2, 84%, 4.9%)",
      popover: "hsl(0, 0%, 100%)",
      popoverForeground: "hsl(222.2, 84%, 4.9%)",
      primary: "#8B4513", // Saddle brown
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(210, 40%, 96%)", // light gray secondary
      secondaryForeground: "hsl(222.2, 84%, 4.9%)",
      muted: "hsl(210, 40%, 96%)", // light gray muted
      mutedForeground: "hsl(215.4, 16.3%, 46.9%)",
      accent: "#FF8C00", // Dark orange accent
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84.2%, 60.2%)",
      destructiveForeground: "hsl(0, 0%, 98%)",
      border: "hsl(214.3, 31.8%, 91.4%)", // light borders
      input: "hsl(214.3, 31.8%, 91.4%)", // light inputs
      ring: "#8B4513", // brown ring
    },
    
    // Dark mode colors - very dark brown theme
    dark: {
      background: "hsl(30, 10%, 8%)", // Very dark brown
      foreground: "hsl(0, 0%, 98%)", // Almost white
      card: "hsl(30, 8%, 12%)", // Dark brown card
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(30, 10%, 8%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "#8B4513", // Same brown primary
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(30, 5%, 18%)", // Dark brown secondary
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(30, 5%, 15%)", // Muted brown
      mutedForeground: "hsl(240, 5%, 64.9%)",
      accent: "hsl(30, 5%, 18%)", // Dark brown accent
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 62.8%, 30.6%)",
      destructiveForeground: "hsl(0, 0%, 98%)",
      border: "hsl(30, 5%, 18%)", // Dark brown borders
      input: "hsl(30, 5%, 18%)", // Dark brown inputs
      ring: "hsl(240, 4.9%, 83.9%)",
    },
  },
  
  logo: {
    icon: "Pizza",
    imageUrl: "https://foozu3.fi/pizzaadmin/web_admin_common/foodzone//logo/8minqduoo4o4c8kwgw.png",
    showText: true,
    backgroundColor: "#8B4513",
  },
  
  about: {
    story: "Pizzeria Antoniossa tarjoamme laadukkaita aterioita ja kutsumme sinut maistamaan herkullisia ruokiamme.",
    storyEn: "At Pizzeria Antonio we offer quality meals and invite you to taste our delicious food.",
    mission: "Tarjoamme Lahdessa parhaita pizzoja, kebabeja ja muita herkullisia ruokia ystävällisessä palvelussa.",
    missionEn: "We offer the best pizzas, kebabs and other delicious food in Lahti with friendly service.",
    specialties: [
      {
        title: "Premium Pizzat",
        titleEn: "Premium Pizzas",
        description: "Huippulaadukkaita pizzoja tuoreista aineksista",
        descriptionEn: "Premium quality pizzas made from fresh ingredients",
        icon: "Pizza"
      },
      {
        title: "Kebabit",
        titleEn: "Kebabs",
        description: "Meheviä ja maukkaita kebabeja eri vaihtoehdoilla",
        descriptionEn: "Juicy and tasty kebabs with different options",
        icon: "UtensilsCrossed"
      },
      {
        title: "Legendaariset Rullat",
        titleEn: "Legendary Wraps",
        description: "Kuuluisiksi tulleet rullat täynnä makua",
        descriptionEn: "Famous wraps full of flavor",
        icon: "ChefHat"
      },
      {
        title: "Gyros Annokset",
        titleEn: "Gyros Dishes",
        description: "Perinteisiä kreikkalaisia gyros-annoksia",
        descriptionEn: "Traditional Greek gyros dishes",
        icon: "Heart"
      }
    ],
    experience: "Laadukasta ruokaa Lahdessa",
    experienceEn: "Quality food in Lahti"
  },
  
  hero: {
    backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    videoUrl: "https://videos.pexels.com/video-files/3752507/3752507-hd_1920_1080_24fps.mp4",
    features: [
      { title: "Premium pizzat", titleEn: "Premium pizzas", color: "#FF8C00" },
      { title: "Nopea toimitus", titleEn: "Fast delivery", color: "#8B4513" },
      { title: "Laadukkaita aterioita", titleEn: "Quality meals", color: "#F5E6D3" }
    ]
  }
};

// Current active configuration - change this to switch restaurants
// NOTE: This is now a fallback - the actual config comes from the database
export const RESTAURANT_CONFIG = pizzeria_antonio_CONFIG;

// Helper functions
export const getFullAddress = (config: RestaurantConfig) => {
  return `${config.address.street}, ${config.address.postalCode} ${config.address.city}`;
};

export const getFormattedHours = (hours: WeekSchedule, language: string) => {
  const days = language === "fi" 
    ? ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai", "Sunnuntai"]
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  
  return dayKeys.map((key, index) => ({
    day: days[index],
    ...hours[key]
  }));
};
