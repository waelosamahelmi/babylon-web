<?php
// AI Ad Editor with Streaming using OpenRouter
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

$current_html = $input['current_html'] ?? '';
$instructions = $input['instructions'] ?? '';
$selected_element = $input['selected_element'] ?? null;
$orientation = $input['orientation'] ?? 'vertical';
$image_urls = $input['image_urls'] ?? [];

if (empty($current_html) || empty($instructions)) {
    echo json_encode(['error' => 'Missing current_html or instructions']);
    exit;
}

// Dimensions based on orientation
$width = $orientation === 'horizontal' ? 1920 : 1080;
$height = $orientation === 'horizontal' ? 1080 : 1920;

// Build the element context if an element was selected
$element_context = '';
if ($selected_element) {
    $element_context = "\n\nSPECIFIC ELEMENT SELECTED BY USER:
- Element type: {$selected_element['tag']}
- Element classes: {$selected_element['classes']}
- Element ID: {$selected_element['id']}
- Element text content: {$selected_element['text']}
- Element HTML snippet: {$selected_element['outerHTML']}

The user's edit instructions are specifically about THIS element. Focus your changes on this element while maintaining the rest of the design.";
}

// Build the prompt
$system_prompt = "You are an elite HTML/CSS editor specializing in modifying digital signage advertisements. 
You will receive an existing HTML advertisement and instructions on how to modify it.

BRAND GUIDELINES (maintain these):
- Logo URL: https://ravintolababylon.fi/logo.png
- Primary accent color: {$dark_colors['accent_color']}
- Background gradient: from {$dark_colors['background_start']} via {$dark_colors['background_mid']} to {$dark_colors['background_end']}
- Primary text color: {$dark_colors['text_primary']}
- Secondary text color: {$dark_colors['text_secondary']}
- Accent text color: {$dark_colors['text_accent']}
- Font family: 'Segoe UI', Arial, Helvetica, sans-serif

MODERN DESIGN TECHNIQUES YOU CAN USE:
- Glassmorphism: backdrop-filter: blur(); with semi-transparent backgrounds
- Neon glow effects: layered text-shadow/box-shadow
- CSS animations: @keyframes for movement, transitions, slideshows
- Creative layouts: diagonal splits, overlapping elements, floating items
- Image carousels/slideshows with CSS animations
- Gradient text with background-clip
- Badge/ribbon effects for prices
- Decorative shapes and accents

REQUIREMENTS:
1. Maintain the exact dimensions: {$width}px width x {$height}px height
2. Apply ONLY the requested changes - preserve everything else
3. Keep the same images that are already in the design
4. Return a COMPLETE standalone HTML document
5. NO external dependencies - all CSS must be inline or in <style> tags
6. Maintain or enhance the professional quality
7. If asked to improve/enhance: add modern effects and animations

OUTPUT FORMAT:
Return ONLY the modified complete HTML code, nothing else. No explanations, no markdown code blocks, just raw HTML starting with <!DOCTYPE html>";

$user_prompt = "Here is the CURRENT HTML advertisement:

```html
{$current_html}
```

EDIT INSTRUCTIONS: {$instructions}{$element_context}

Apply these changes while preserving the overall design, layout, and existing images. Return the complete modified HTML.";

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
    'temperature' => 0.5,
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
        'X-Title: Babylon TV Ad Editor'
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
