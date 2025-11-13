# Database-Driven Restaurant Configuration

This guide explains how the restaurant website now uses a database-driven configuration system instead of hardcoded values, making it extremely easy to switch between different restaurants.

## Overview

The restaurant configuration has been moved from hardcoded files to a Supabase database table called `restaurant_config`. This allows you to:

✅ **Switch restaurants instantly** by updating database records  
✅ **Manage multiple restaurant configurations** in one system  
✅ **Update restaurant information** without code changes  
✅ **Real-time configuration updates** via WebSocket subscriptions  
✅ **Maintain type safety** with TypeScript interfaces  

## Database Schema

### `restaurant_config` Table

```sql
CREATE TABLE restaurant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                    -- Restaurant name (Finnish)
  name_en text NOT NULL,                 -- Restaurant name (English)
  tagline text NOT NULL,                 -- Tagline (Finnish)
  tagline_en text NOT NULL,              -- Tagline (English)
  description text NOT NULL,             -- Description (Finnish)
  description_en text NOT NULL,          -- Description (English)
  phone text NOT NULL,                   -- Phone number
  email text NOT NULL,                   -- Email address
  address jsonb NOT NULL,                -- Address object
  social_media jsonb DEFAULT '{}',       -- Social media links
  hours jsonb NOT NULL,                  -- Business hours
  services jsonb NOT NULL,               -- Available services
  delivery_config jsonb NOT NULL,        -- Delivery zones and settings
  theme jsonb NOT NULL,                  -- Theme colors and branding
  logo jsonb NOT NULL,                   -- Logo configuration
  about jsonb NOT NULL,                  -- About section content
  hero jsonb NOT NULL,                   -- Hero section configuration
  is_active boolean DEFAULT false,       -- Only one config can be active
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## How It Works

### 1. Configuration Loading

The system automatically loads the active restaurant configuration from the database:

```typescript
// In useRestaurantConfig hook
const { config, loading, error } = useRestaurantConfig();
```

### 2. Real-Time Updates

Configuration changes are automatically reflected across the entire website via WebSocket subscriptions:

```typescript
// Real-time subscription in RestaurantConfigManager
this.subscription = supabase
  .channel(`restaurant_config_${Date.now()}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'restaurant_config',
    filter: 'is_active=eq.true'
  }, (payload) => {
    // Update config automatically
    this.currentConfig = convertDatabaseConfigToRestaurantConfig(payload.new);
    this.notifySubscribers();
  })
  .subscribe();
```

### 3. Fallback System

If the database is unavailable, the system falls back to the hardcoded configuration:

```typescript
// Fallback to hardcoded config if database fails
const config = dbConfig || pizzeria_antonio_CONFIG;
```

## Switching to a New Restaurant

### Method 1: Database Update (Recommended)

1. **Insert new restaurant configuration:**

```sql
INSERT INTO restaurant_config (
  name, name_en, tagline, tagline_en, description, description_en,
  phone, email, address, social_media, hours, services, 
  delivery_config, theme, logo, about, hero, is_active
) VALUES (
  'New Restaurant Name',
  'New Restaurant Name',
  'Your tagline in Finnish',
  'Your tagline in English',
  'Your description in Finnish',
  'Your description in English',
  '+358 XX XXXXXXX',
  'info@newrestaurant.fi',
  '{"street": "New Street 123", "postalCode": "00100", "city": "Helsinki", "country": "Finland"}',
  '{"facebook": "https://facebook.com/newrestaurant"}',
  '{"general": {"monday": {"open": "11:00", "close": "22:00", "closed": false}, ...}}',
  '{"hasLunchBuffet": true, "hasDelivery": true, "hasPickup": true, "hasDineIn": true}',
  '{"zones": [{"maxDistance": 5, "fee": 3.00}], "location": {"lat": 60.1699, "lng": 24.9384}}',
  '{"primary": "#059669", "secondary": "#dc2626", "accent": "#f59e0b", ...}',
  '{"icon": "UtensilsCrossed", "showText": true, "backgroundColor": "#059669"}',
  '{"story": "Your story...", "storyEn": "Your story in English...", ...}',
  '{"backgroundImage": "https://your-image.jpg", "features": [...]}',
  true  -- This automatically deactivates other configs
);
```

2. **The website updates automatically!** No code changes needed.

### Method 2: Admin Interface (Future Enhancement)

A restaurant admin interface can be built to manage configurations through a web UI.

## Configuration Structure

### Address Object
```json
{
  "street": "Restaurant Street 123",
  "postalCode": "00100",
  "city": "Helsinki", 
  "country": "Finland"
}
```

### Social Media Object
```json
{
  "facebook": "https://facebook.com/restaurant",
  "instagram": "https://instagram.com/restaurant",
  "website": "https://restaurant.com"
}
```

### Hours Object
```json
{
  "general": {
    "monday": {"open": "11:00", "close": "22:00", "closed": false},
    "tuesday": {"open": "11:00", "close": "22:00", "closed": false},
    // ... other days
  },
  "pickup": { /* same structure */ },
  "delivery": { /* same structure */ }
}
```

### Services Object
```json
{
  "hasLunchBuffet": true,
  "hasDelivery": true,
  "hasPickup": true,
  "hasDineIn": true,
  "lunchBuffetHours": { /* hours structure */ }
}
```

### Delivery Config Object
```json
{
  "zones": [
    {"maxDistance": 5, "fee": 2.50, "minimumOrder": 15.00},
    {"maxDistance": 15, "fee": 4.50, "minimumOrder": 25.00}
  ],
  "location": {
    "lat": 60.1699,
    "lng": 24.9384
  }
}
```

### Theme Object
```json
{
  "primary": "#059669",
  "secondary": "#dc2626", 
  "accent": "#f59e0b",
  "success": "#10b981",
  "warning": "#f59e0b",
  "error": "#ef4444",
  "background": "#ffffff",
  "foreground": "#1f2937",
  "dark": { /* dark theme colors */ }
}
```

### Logo Object
```json
{
  "icon": "Pizza",
  "imageUrl": "https://example.com/logo.png",
  "showText": true,
  "backgroundColor": "#059669"
}
```

### About Object
```json
{
  "story": "Restaurant story in Finnish",
  "storyEn": "Restaurant story in English",
  "mission": "Mission in Finnish", 
  "missionEn": "Mission in English",
  "specialties": [
    {
      "title": "Specialty 1",
      "titleEn": "Specialty 1",
      "description": "Description in Finnish",
      "descriptionEn": "Description in English", 
      "icon": "Pizza"
    }
  ],
  "experience": "Experience text",
  "experienceEn": "Experience text in English"
}
```

### Hero Object
```json
{
  "backgroundImage": "https://example.com/hero-bg.jpg",
  "videoUrl": "https://example.com/hero-video.mp4",
  "features": [
    {"title": "Feature 1", "titleEn": "Feature 1", "color": "#dc2626"},
    {"title": "Feature 2", "titleEn": "Feature 2", "color": "#059669"}
  ]
}
```

## Benefits

### 🚀 **Instant Restaurant Switching**
- Change restaurant by updating one database record
- No code deployment required
- Zero downtime switching

### 🔄 **Real-Time Updates**
- Configuration changes reflect immediately
- WebSocket subscriptions ensure all users see updates
- No page refresh required

### 🛡️ **Type Safety**
- Full TypeScript support maintained
- Database schema validation
- Runtime type checking

### 📱 **Multi-Restaurant Support**
- Store multiple restaurant configurations
- Easy A/B testing of different setups
- Backup and restore configurations

### 🎨 **Dynamic Theming**
- Colors and branding update automatically
- CSS custom properties updated in real-time
- Consistent design across all components

## Files Modified

### New Files
- `supabase/migrations/create_restaurant_config_table.sql` - Database schema
- `src/hooks/use-restaurant-config.ts` - Database config hook
- `README-DATABASE-RESTAURANT-CONFIG.md` - This documentation

### Updated Files
- `src/lib/restaurant-context.tsx` - Now uses database config
- `src/hooks/use-restaurant-settings.ts` - Integrated with new config system
- `src/lib/business-hours.ts` - Updated to require config parameter
- `src/lib/map-utils.ts` - Updated to use dynamic restaurant location
- `src/components/delivery-map.tsx` - Uses dynamic config
- `src/components/structured-address-input.tsx` - Uses dynamic config
- `src/components/contact-section.tsx` - Uses dynamic config
- `src/components/service-highlights.tsx` - Uses dynamic config
- `src/components/testimonials-section.tsx` - Uses dynamic config
- `src/components/universal-header.tsx` - Uses dynamic config
- `src/pages/menu.tsx` - Uses dynamic config
- `src/pages/home.tsx` - Uses dynamic config

## Migration Guide

### For Existing Restaurants

1. **Run the migration** to create the `restaurant_config` table
2. **The default Pizzeria Antonio config** is automatically inserted
3. **No code changes needed** - the website continues working

### For New Restaurants

1. **Insert your restaurant configuration** into the `restaurant_config` table
2. **Set `is_active = true`** for your configuration
3. **The website automatically switches** to your restaurant

### Example: Adding a New Restaurant

```sql
-- Add a new Italian restaurant
INSERT INTO restaurant_config (
  name, name_en,
  tagline, tagline_en,
  description, description_en,
  phone, email,
  address,
  theme,
  logo,
  -- ... other fields
  is_active
) VALUES (
  'Ristorante Bella Vista', 'Ristorante Bella Vista',
  'Autenttista italialaista ruokaa', 'Authentic Italian cuisine',
  'Tervetuloa nauttimaan aidosta italialaisesta ruoasta', 'Welcome to enjoy authentic Italian food',
  '+358 9 1234567', 'info@bellavista.fi',
  '{"street": "Bulevardi 15", "postalCode": "00120", "city": "Helsinki", "country": "Finland"}',
  '{"primary": "#006633", "secondary": "#CC0000", "accent": "#FFFFFF", ...}',
  '{"icon": "UtensilsCrossed", "showText": true, "backgroundColor": "#006633"}',
  true  -- Activates this config and deactivates others
);
```

## Security

- **Row Level Security (RLS)** enabled on `restaurant_config` table
- **Public read access** to active configuration only
- **Admin-only write access** for configuration management
- **Automatic single active config** enforcement via database triggers

## Performance

- **Efficient queries** with indexes on `is_active` column
- **Real-time subscriptions** only for active configuration
- **Caching** via React Query for optimal performance
- **Fallback system** ensures reliability

## Future Enhancements

1. **Admin UI** for restaurant configuration management
2. **Configuration versioning** and rollback capabilities
3. **Multi-language support** for additional languages
4. **Configuration templates** for common restaurant types
5. **Import/export** functionality for easy migration

---

**The restaurant website is now fully database-driven and ready for easy restaurant switching!** 🎉