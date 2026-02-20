<?php
// AI Ad Generator with Streaming using OpenRouter
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Disable output buffering for streaming
if (ob_get_level()) ob_end_clean();

// OpenRouter API Configuration
$OPENROUTER_API_KEY = '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';
$MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

// Load config for theme colors
$config_file = __DIR__ . '/config.json';
$config = file_exists($config_file) ? json_decode(file_get_contents($config_file), true) : [];

$dark_colors = $config['dark_theme_colors'] ?? [
    'background_start' => '#1a0505',
    'background_mid' => '#2d0a0a',
    'background_end' => '#3d1010',
    'glow_primary' => '#dc2626',
    'glow_secondary' => '#ea580c',
    'glow_tertiary' => '#f59e0b',
    'text_primary' => '#ffffff',
    'text_secondary' => '#aaaaaa',
    'text_accent' => '#fbbf24',
    'accent_color' => '#dc2626'
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST method required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$image_urls = $input['image_urls'] ?? [];
$purpose = $input['purpose'] ?? '';
$content = $input['content'] ?? '';
$orientation = $input['orientation'] ?? 'vertical';

if (empty($image_urls) || empty($purpose)) {
    echo json_encode(['error' => 'Missing image_urls or purpose']);
    exit;
}

// Dimensions based on orientation
$width = $orientation === 'horizontal' ? 1920 : 1080;
$height = $orientation === 'horizontal' ? 1080 : 1920;

// Count images for layout decisions
$image_count = count($image_urls);

// Build the prompt
$system_prompt = "You are an elite HTML/CSS designer specializing in stunning digital signage for premium restaurants. 
You create eye-catching, modern advertisements that captivate viewers on TV screens.

BRAND GUIDELINES:
- Logo URL: https://ravintolababylon.fi/logo.png
- Primary accent color: {$dark_colors['accent_color']}
- Background gradient: from {$dark_colors['background_start']} via {$dark_colors['background_mid']} to {$dark_colors['background_end']}
- Primary text color: {$dark_colors['text_primary']}
- Secondary text color: {$dark_colors['text_secondary']}
- Accent text color: {$dark_colors['text_accent']}
- Font family: 'Segoe UI', Arial, Helvetica, sans-serif
- Style: Modern, bold, appetizing, premium restaurant feel

=== CREATIVE LAYOUT GUIDELINES ===

IMAGE LAYOUTS (choose based on content and number of images):

FOR SINGLE IMAGE:
- Full-bleed hero with text overlay and gradient fade
- Diagonal split with image on one side, content on other
- Circular/rounded frame with decorative border and shadow
- Image as background with glassmorphism content card overlay
- Polaroid-style frame with slight rotation and shadow

FOR 2 IMAGES:
- Side-by-side with creative angle/overlap
- Before/after style split
- One large hero + one smaller accent image
- Diagonal arrangement with overlapping edges
- Stacked with parallax-like offset

FOR 3+ IMAGES:
- Masonry/Pinterest-style grid layout
- AUTO-SLIDING CAROUSEL with CSS animations (cycle every 3-4 seconds)
- Collage with varied sizes and creative overlaps
- Featured hero + thumbnail strip
- Hexagonal or circular grid arrangement
- Floating images with different z-index and subtle animations

=== ANIMATION TECHNIQUES (use these!) ===
- @keyframes for smooth image slideshows/carousels
- Subtle floating/bobbing animations on images
- Pulse effects on prices and CTAs
- Shimmer/shine effects across text
- Gradient background animations
- Scale hover-like effects on loop
- Fade in/out transitions between images
- Ken Burns effect (slow zoom/pan) on images

=== MODERN DESIGN PATTERNS ===
- Glassmorphism: backdrop-filter: blur(10px); background: rgba(0,0,0,0.3);
- Neon glow effects: text-shadow with multiple colored layers
- Gradient text: background-clip: text; -webkit-background-clip: text;
- Soft shadows: box-shadow with large blur radius
- Rounded corners everywhere (border-radius: 20px+)
- Decorative shapes (circles, blobs) as accents
- Badge/ribbon effects for prices and offers
- Progress bars or countdown-style elements for urgency

=== TEXT STYLING ===
- Headlines: Bold, large (60-120px), with glow or shadow
- Prices: Extra bold, accent color, with decorative elements
- Descriptions: Clean, readable, with good line-height
- Use text hierarchy (size, weight, color variations)
- Add decorative underlines or highlights

TECHNICAL REQUIREMENTS:
1. Create a COMPLETE standalone HTML document with embedded CSS
2. Exact dimensions: {$width}px width x {$height}px height
3. Use ALL provided image URLs creatively in the design
4. Include the restaurant logo (https://ravintolababylon.fi/logo.png) - position elegantly
5. Make text large and readable from 3+ meters distance
6. Use CSS animations - the ad should feel ALIVE and dynamic
7. Professional, appetizing, and modern appearance
8. NO external dependencies - all CSS must be inline or in <style> tags
9. Images: use object-fit: cover for backgrounds, contain for product shots
10. If multiple images: CREATE AN AUTO-SLIDING CAROUSEL or creative grid

OUTPUT FORMAT:
Return ONLY the complete HTML code, nothing else. No explanations, no markdown code blocks, just raw HTML starting with <!DOCTYPE html>";

// Determine layout suggestion based on image count
$layout_suggestion = '';
if ($image_count == 1) {
    $layout_suggestion = "With 1 image: Use it as a stunning hero/background with creative text overlay, or in a stylish frame with decorative elements.";
} elseif ($image_count == 2) {
    $layout_suggestion = "With 2 images: Create an elegant split layout, overlapping arrangement, or feature one large and one accent image.";
} else {
    $layout_suggestion = "With {$image_count} images: CREATE AN ANIMATED SLIDESHOW/CAROUSEL that cycles through images automatically, OR create a creative collage/grid layout. The slideshow should be smooth and professional.";
}

$user_prompt = "Create a STUNNING, MODERN advertisement for: {$purpose}

Content/Text to include: {$content}

NUMBER OF IMAGES: {$image_count}
{$layout_suggestion}

Images to use (include ALL of these creatively in the design):
" . implode("\n", array_map(function($url, $i) { return ($i+1) . ". " . $url; }, $image_urls, array_keys($image_urls))) . "

Orientation: {$orientation} ({$width}x{$height} pixels)

IMPORTANT REQUIREMENTS:
- Make it visually IMPRESSIVE and MODERN
- Use creative layout techniques (not just boring centered content)
- Add smooth CSS animations to make it feel alive
- If multiple images: use slideshow/carousel with fade or slide transitions
- The food should look APPETIZING and be the star of the design
- Use the brand colors for accents and glows
- Position the logo elegantly (corner or integrated into design)

Create something that would make people stop and look!";

// Build messages
$messages = [
    [
        'role' => 'system',
        'content' => $system_prompt
    ],
    [
        'role' => 'user',
        'content' => $user_prompt
    ]
];

// Call OpenRouter API with streaming
$ch = curl_init('https://openrouter.ai/api/v1/chat/completions');

$payload = [
    'model' => $MODEL,
    'messages' => $messages,
    'max_tokens' => 8000,
    'temperature' => 0.7,
    'stream' => true
];

// Callback function to handle streaming data
$full_content = '';
$write_callback = function($ch, $data) use (&$full_content) {
    // Parse SSE data
    $lines = explode("\n", $data);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line === 'data: [DONE]') continue;
        
        if (strpos($line, 'data: ') === 0) {
            $json_str = substr($line, 6);
            $json = json_decode($json_str, true);
            
            if (isset($json['choices'][0]['delta']['content'])) {
                $chunk = $json['choices'][0]['delta']['content'];
                $full_content .= $chunk;
                echo $chunk;
                flush();
            }
        }
    }
    return strlen($data);
};

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $OPENROUTER_API_KEY,
        'HTTP-Referer: https://ravintolababylon.fi',
        'X-Title: Babylon TV Ad Generator'
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 180,
    CURLOPT_WRITEFUNCTION => $write_callback
]);

$result = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "\n\n<!-- ERROR: " . $error . " -->";
}
