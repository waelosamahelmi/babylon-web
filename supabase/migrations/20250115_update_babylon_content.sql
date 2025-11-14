-- Update Ravintola Babylon Content
-- This migration updates the restaurant_config table with authentic Babylon restaurant content

-- Update the active restaurant configuration with Babylon-specific content
UPDATE restaurant_config 
SET 
  -- Basic Info
  name = 'Ravintola Babylon',
  name_en = 'Restaurant Babylon',
  tagline = 'Autenttista Lähi-idän makuelämystä Suomessa',
  tagline_en = 'Authentic Middle Eastern Flavors in Finland',
  description = 'Ravintola Babylon tarjoaa aitoja lähi-idän makuja moderneissa puitteissa. Meiltä löydät laajan valikoiman turkkilaisia, persialaisia ja kurdisia herkkuja.',
  description_en = 'Restaurant Babylon offers authentic Middle Eastern flavors in a modern setting. We serve a wide selection of Turkish, Persian, and Kurdish delicacies.',
  
  -- About Section
  about = jsonb_build_object(
    'story', 'Ravintola Babylon perustettiin tuomaan autenttista lähi-idän ruokakulttuuria Suomeen. Käytämme perinteisiä reseptejä ja laadukkaita raaka-aineita luodaksemme aidon makuelämyksen jokaiselle asiakkaalle. Kokemuksemme keittiössä ulottuu sukupolvien taakse, ja olemme ylpeitä voidessamme jakaa kulttuurimme rikkaan ruokaperinnön kanssanne.',
    'storyEn', 'Restaurant Babylon was founded to bring authentic Middle Eastern food culture to Finland. We use traditional recipes and high-quality ingredients to create a genuine taste experience for every customer. Our culinary expertise spans generations, and we are proud to share our culture''s rich culinary heritage with you.',
    'mission', 'Tarjoamme aitoa lähi-idän ruokaa, joka valmistetaan rakkaudella ja kunnioituksella perinteitä kohtaan. Haluamme, että jokainen asiakas tuntee olonsa tervetulleeksi ja nauttii unohtumattomasta ruokakokemuksesta.',
    'missionEn', 'We provide authentic Middle Eastern food prepared with love and respect for traditions. We want every customer to feel welcome and enjoy an unforgettable dining experience.',
    'experience', 'Yli 15 vuotta kokemusta lähi-idän keittiön parissa',
    'experienceEn', 'Over 15 years of experience in Middle Eastern cuisine',
    'specialties', jsonb_build_array(
      jsonb_build_object(
        'title', 'Kebab',
        'titleEn', 'Kebab',
        'description', 'Perinteinen turkkilainen kebab, valmistettu päivittäin tuoreista raaka-aineista. Tarjoamme sekä lammas- että kana-kebabeja.',
        'descriptionEn', 'Traditional Turkish kebab, prepared daily from fresh ingredients. We offer both lamb and chicken kebabs.',
        'icon', 'ChefHat'
      ),
      jsonb_build_object(
        'title', 'Pizza',
        'titleEn', 'Pizza',
        'description', 'Uunituore pizza, jossa yhdistyy italialainen perinne ja lähi-idän maut. Laaja valikoima erikoispizzoja.',
        'descriptionEn', 'Fresh oven-baked pizza combining Italian tradition with Middle Eastern flavors. Wide selection of specialty pizzas.',
        'icon', 'Pizza'
      ),
      jsonb_build_object(
        'title', 'Lounasbuffet',
        'titleEn', 'Lunch Buffet',
        'description', 'Runsas ja monipuolinen lounasbuffet arkipäivisin klo 11-14. Vaihtuva valikoima lähi-idän herkkuja.',
        'descriptionEn', 'Rich and diverse lunch buffet on weekdays 11am-2pm. Rotating selection of Middle Eastern delicacies.',
        'icon', 'Utensils'
      ),
      jsonb_build_object(
        'title', 'Salaatit',
        'titleEn', 'Salads',
        'description', 'Raikkaita ja terveellisiä salaatteja, jotka valmistetaan päivittäin tuoreista kasviksista. Täydellinen valinta kevyemmälle aterialle.',
        'descriptionEn', 'Fresh and healthy salads prepared daily from fresh vegetables. Perfect choice for a lighter meal.',
        'icon', 'Leaf'
      ),
      jsonb_build_object(
        'title', 'Grilliruoat',
        'titleEn', 'Grilled Dishes',
        'description', 'Grillattuja lihaherkkuja perinteiseen tapaan. Marinoitu ja grillattu täydellisyyteen.',
        'descriptionEn', 'Grilled meat specialties in the traditional way. Marinated and grilled to perfection.',
        'icon', 'Flame'
      ),
      jsonb_build_object(
        'title', 'Kasvisruoat',
        'titleEn', 'Vegetarian Dishes',
        'description', 'Monipuolinen valikoima kasvisruokia lähi-idän makumaailmasta. Falafel, hummus ja paljon muuta.',
        'descriptionEn', 'Diverse selection of vegetarian dishes from Middle Eastern cuisine. Falafel, hummus and much more.',
        'icon', 'Carrot'
      )
    )
  ),
  
  -- Hero Section
  hero = jsonb_build_object(
    'backgroundImage', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000',
    'videoUrl', '',
    'features', jsonb_build_array(
      jsonb_build_object('title', 'Tuoreet raaka-aineet', 'titleEn', 'Fresh ingredients', 'color', '#059669'),
      jsonb_build_object('title', 'Perinteiset reseptit', 'titleEn', 'Traditional recipes', 'color', '#dc2626'),
      jsonb_build_object('title', 'Nopea toimitus', 'titleEn', 'Fast delivery', 'color', '#f59e0b'),
      jsonb_build_object('title', 'Lounaspöytä', 'titleEn', 'Lunch buffet', 'color', '#8b5cf6')
    )
  ),
  
  -- Theme Colors (Babylon themed - warm earth tones with gold accents)
  theme = jsonb_build_object(
    'primary', '#8B4513',        -- Saddle Brown
    'primaryForeground', '#FFFFFF',
    'secondary', '#DAA520',      -- Goldenrod
    'secondaryForeground', '#1F2937',
    'accent', '#CD853F',         -- Peru
    'accentForeground', '#FFFFFF',
    'background', '#FFF8DC',     -- Cornsilk
    'foreground', '#1F2937',
    'card', '#FFFFFF',
    'cardForeground', '#1F2937',
    'muted', '#F5F5DC',          -- Beige
    'mutedForeground', '#6B7280',
    'destructive', '#DC2626',
    'destructiveForeground', '#FFFFFF',
    'border', '#E5E7EB',
    'input', '#E5E7EB',
    'ring', '#8B4513',
    'dark', jsonb_build_object(
      'background', 'hsl(30, 10%, 8%)',
      'foreground', 'hsl(0, 0%, 98%)',
      'card', 'hsl(30, 8%, 12%)',
      'cardForeground', 'hsl(0, 0%, 98%)',
      'popover', 'hsl(30, 8%, 12%)',
      'popoverForeground', 'hsl(0, 0%, 98%)',
      'primary', 'hsl(25, 47%, 35%)',
      'primaryForeground', 'hsl(0, 0%, 98%)',
      'secondary', 'hsl(43, 74%, 49%)',
      'secondaryForeground', 'hsl(30, 10%, 8%)',
      'muted', 'hsl(30, 5%, 15%)',
      'mutedForeground', 'hsl(240, 5%, 64.9%)',
      'accent', 'hsl(28, 50%, 50%)',
      'accentForeground', 'hsl(0, 0%, 98%)',
      'destructive', 'hsl(0, 62.8%, 30.6%)',
      'destructiveForeground', 'hsl(0, 0%, 98%)',
      'border', 'hsl(30, 5%, 18%)',
      'input', 'hsl(30, 5%, 18%)',
      'ring', 'hsl(240, 4.9%, 83.9%)'
    )
  ),
  
  -- Logo Configuration
  logo = jsonb_build_object(
    'icon', 'Utensils',
    'imageUrl', '',
    'showText', true,
    'backgroundColor', '#8B4513'
  ),
  
  -- Contact Info (update if needed)
  phone = '+358 3 752 2220',
  email = 'info@babylon.fi',
  
  -- Social Media
  social_media = jsonb_build_object(
    'facebook', 'https://www.facebook.com/ravintolababylo',
    'instagram', 'https://www.instagram.com/ravintolababylo',
    'twitter', '',
    'website', 'https://babylon.fi'
  ),
  
  updated_at = NOW()
WHERE is_active = true;

-- If no active config exists, insert a new one
INSERT INTO restaurant_config (
  name, name_en, tagline, tagline_en, description, description_en,
  phone, email, address, social_media, hours, services, delivery_config,
  theme, logo, about, hero, is_active
)
SELECT 
  'Ravintola Babylon',
  'Restaurant Babylon',
  'Autenttista Lähi-idän makuelämystä Suomessa',
  'Authentic Middle Eastern Flavors in Finland',
  'Ravintola Babylon tarjoaa aitoja lähi-idän makuja moderneissa puitteissa. Meiltä löydät laajan valikoiman turkkilaisia, persialaisia ja kurdisia herkkuja.',
  'Restaurant Babylon offers authentic Middle Eastern flavors in a modern setting. We serve a wide selection of Turkish, Persian, and Kurdish delicacies.',
  '+358 3 752 2220',
  'info@babylon.fi',
  jsonb_build_object(
    'street', 'Vapaudenkatu 28',
    'postalCode', '15140',
    'city', 'Lahti',
    'country', 'Finland'
  ),
  jsonb_build_object(
    'facebook', 'https://www.facebook.com/ravintolababylo',
    'instagram', 'https://www.instagram.com/ravintolababylo',
    'twitter', '',
    'website', 'https://babylon.fi'
  ),
  jsonb_build_object(
    'general', jsonb_build_object(
      'monday', '10:30-21:00',
      'tuesday', '10:30-21:00',
      'wednesday', '10:30-21:00',
      'thursday', '10:30-21:00',
      'friday', '10:30-22:00',
      'saturday', '11:00-22:00',
      'sunday', '12:00-21:00'
    ),
    'pickup', jsonb_build_object(
      'monday', '10:30-21:00',
      'tuesday', '10:30-21:00',
      'wednesday', '10:30-21:00',
      'thursday', '10:30-21:00',
      'friday', '10:30-22:00',
      'saturday', '11:00-22:00',
      'sunday', '12:00-21:00'
    ),
    'delivery', jsonb_build_object(
      'monday', '11:00-20:30',
      'tuesday', '11:00-20:30',
      'wednesday', '11:00-20:30',
      'thursday', '11:00-20:30',
      'friday', '11:00-21:30',
      'saturday', '11:00-21:30',
      'sunday', '12:00-20:30'
    )
  ),
  jsonb_build_object(
    'hasLunchBuffet', true,
    'lunchBuffetDays', jsonb_build_array('monday', 'tuesday', 'wednesday', 'thursday', 'friday'),
    'lunchBuffetTime', '11:00-14:00',
    'lunchBuffetPrice', '12.90',
    'acceptsOnlineOrders', true,
    'acceptsCash', true,
    'acceptsCard', true,
    'acceptsMobilePay', true
  ),
  jsonb_build_object(
    'enabled', true,
    'minOrderAmount', 15.00,
    'zones', jsonb_build_array(
      jsonb_build_object('maxDistance', 4, 'fee', 0.00, 'description', 'Free delivery'),
      jsonb_build_object('maxDistance', 5, 'fee', 4.00, 'description', 'City center'),
      jsonb_build_object('maxDistance', 8, 'fee', 7.00, 'description', 'Extended area'),
      jsonb_build_object('maxDistance', 10, 'fee', 10.00, 'description', 'Outer area')
    )
  ),
  jsonb_build_object(
    'primary', '#8B4513',
    'primaryForeground', '#FFFFFF',
    'secondary', '#DAA520',
    'secondaryForeground', '#1F2937',
    'accent', '#CD853F',
    'accentForeground', '#FFFFFF',
    'background', '#FFF8DC',
    'foreground', '#1F2937',
    'card', '#FFFFFF',
    'cardForeground', '#1F2937',
    'muted', '#F5F5DC',
    'mutedForeground', '#6B7280',
    'destructive', '#DC2626',
    'destructiveForeground', '#FFFFFF',
    'border', '#E5E7EB',
    'input', '#E5E7EB',
    'ring', '#8B4513',
    'dark', jsonb_build_object(
      'background', 'hsl(30, 10%, 8%)',
      'foreground', 'hsl(0, 0%, 98%)',
      'card', 'hsl(30, 8%, 12%)',
      'cardForeground', 'hsl(0, 0%, 98%)',
      'popover', 'hsl(30, 8%, 12%)',
      'popoverForeground', 'hsl(0, 0%, 98%)',
      'primary', 'hsl(25, 47%, 35%)',
      'primaryForeground', 'hsl(0, 0%, 98%)',
      'secondary', 'hsl(43, 74%, 49%)',
      'secondaryForeground', 'hsl(30, 10%, 8%)',
      'muted', 'hsl(30, 5%, 15%)',
      'mutedForeground', 'hsl(240, 5%, 64.9%)',
      'accent', 'hsl(28, 50%, 50%)',
      'accentForeground', 'hsl(0, 0%, 98%)',
      'destructive', 'hsl(0, 62.8%, 30.6%)',
      'destructiveForeground', 'hsl(0, 0%, 98%)',
      'border', 'hsl(30, 5%, 18%)',
      'input', 'hsl(30, 5%, 18%)',
      'ring', 'hsl(240, 4.9%, 83.9%)'
    )
  ),
  jsonb_build_object(
    'icon', 'Utensils',
    'imageUrl', '',
    'showText', true,
    'backgroundColor', '#8B4513'
  ),
  jsonb_build_object(
    'story', 'Ravintola Babylon perustettiin tuomaan autenttista lähi-idän ruokakulttuuria Suomeen. Käytämme perinteisiä reseptejä ja laadukkaita raaka-aineita luodaksemme aidon makuelämyksen jokaiselle asiakkaalle. Kokemuksemme keittiössä ulottuu sukupolvien taakse, ja olemme ylpeitä voidessamme jakaa kulttuurimme rikkaan ruokaperinnön kanssanne.',
    'storyEn', 'Restaurant Babylon was founded to bring authentic Middle Eastern food culture to Finland. We use traditional recipes and high-quality ingredients to create a genuine taste experience for every customer. Our culinary expertise spans generations, and we are proud to share our culture''s rich culinary heritage with you.',
    'mission', 'Tarjoamme aitoa lähi-idän ruokaa, joka valmistetaan rakkaudella ja kunnioituksella perinteitä kohtaan. Haluamme, että jokainen asiakas tuntee olonsa tervetulleeksi ja nauttii unohtumattomasta ruokakokemuksesta.',
    'missionEn', 'We provide authentic Middle Eastern food prepared with love and respect for traditions. We want every customer to feel welcome and enjoy an unforgettable dining experience.',
    'experience', 'Yli 15 vuotta kokemusta lähi-idän keittiön parissa',
    'experienceEn', 'Over 15 years of experience in Middle Eastern cuisine',
    'specialties', jsonb_build_array(
      jsonb_build_object('title', 'Kebab', 'titleEn', 'Kebab', 'description', 'Perinteinen turkkilainen kebab, valmistettu päivittäin tuoreista raaka-aineista. Tarjoamme sekä lammas- että kana-kebabeja.', 'descriptionEn', 'Traditional Turkish kebab, prepared daily from fresh ingredients. We offer both lamb and chicken kebabs.', 'icon', 'ChefHat'),
      jsonb_build_object('title', 'Pizza', 'titleEn', 'Pizza', 'description', 'Uunituore pizza, jossa yhdistyy italialainen perinne ja lähi-idän maut. Laaja valikoima erikoispizzoja.', 'descriptionEn', 'Fresh oven-baked pizza combining Italian tradition with Middle Eastern flavors. Wide selection of specialty pizzas.', 'icon', 'Pizza'),
      jsonb_build_object('title', 'Lounasbuffet', 'titleEn', 'Lunch Buffet', 'description', 'Runsas ja monipuolinen lounasbuffet arkipäivisin klo 11-14. Vaihtuva valikoima lähi-idän herkkuja.', 'descriptionEn', 'Rich and diverse lunch buffet on weekdays 11am-2pm. Rotating selection of Middle Eastern delicacies.', 'icon', 'Utensils'),
      jsonb_build_object('title', 'Salaatit', 'titleEn', 'Salads', 'description', 'Raikkaita ja terveellisiä salaatteja, jotka valmistetaan päivittäin tuoreista kasviksista. Täydellinen valinta kevyemmälle aterialle.', 'descriptionEn', 'Fresh and healthy salads prepared daily from fresh vegetables. Perfect choice for a lighter meal.', 'icon', 'Leaf'),
      jsonb_build_object('title', 'Grilliruoat', 'titleEn', 'Grilled Dishes', 'description', 'Grillattuja lihaherkkuja perinteiseen tapaan. Marinoitu ja grillattu täydellisyyteen.', 'descriptionEn', 'Grilled meat specialties in the traditional way. Marinated and grilled to perfection.', 'icon', 'Flame'),
      jsonb_build_object('title', 'Kasvisruoat', 'titleEn', 'Vegetarian Dishes', 'description', 'Monipuolinen valikoima kasvisruokia lähi-idän makumaailmasta. Falafel, hummus ja paljon muuta.', 'descriptionEn', 'Diverse selection of vegetarian dishes from Middle Eastern cuisine. Falafel, hummus and much more.', 'icon', 'Carrot')
    )
  ),
  jsonb_build_object(
    'backgroundImage', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000',
    'videoUrl', '',
    'features', jsonb_build_array(
      jsonb_build_object('title', 'Tuoreet raaka-aineet', 'titleEn', 'Fresh ingredients', 'color', '#059669'),
      jsonb_build_object('title', 'Perinteiset reseptit', 'titleEn', 'Traditional recipes', 'color', '#dc2626'),
      jsonb_build_object('title', 'Nopea toimitus', 'titleEn', 'Fast delivery', 'color', '#f59e0b'),
      jsonb_build_object('title', 'Lounaspöytä', 'titleEn', 'Lunch buffet', 'color', '#8b5cf6')
    )
  ),
  true
WHERE NOT EXISTS (SELECT 1 FROM restaurant_config WHERE is_active = true);

-- Migration complete
COMMENT ON TABLE restaurant_config IS 'Updated with authentic Ravintola Babylon content - Middle Eastern restaurant theme';
