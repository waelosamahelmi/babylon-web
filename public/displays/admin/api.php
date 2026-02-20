<?php
// API endpoint to serve display configuration
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: no-cache, must-revalidate');

$config_file = __DIR__ . '/config.json';

// Get orientation filter from query parameter
$orientation_filter = isset($_GET['orientation']) ? $_GET['orientation'] : 'both';

// Default config if none exists
$default_config = [
    'mode' => 'offers',
    'rotation_interval' => 10,
    'slides' => [],
    'show_offers' => true,
    'offer_duration' => 6,
    'theme' => 'dark',
    'theme_schedule' => [
        'enabled' => false,
        'light_start' => '08:00',
        'light_end' => '20:00'
    ]
];

$config = file_exists($config_file) ? json_decode(file_get_contents($config_file), true) : $default_config;

// Ensure slides is an array
if (!isset($config['slides']) || !is_array($config['slides'])) {
    $config['slides'] = [];
}

// Ensure theme settings exist
if (!isset($config['theme'])) {
    $config['theme'] = 'dark';
}
if (!isset($config['theme_schedule'])) {
    $config['theme_schedule'] = $default_config['theme_schedule'];
}

// Filter slides by schedule, enabled status, and orientation
$now = new DateTime();
$active_slides = [];

// Get the base URL for images
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$script_path = dirname($_SERVER['SCRIPT_NAME']); // e.g., /ads/admin

foreach ($config['slides'] as $slide) {
    // Skip disabled slides
    if (isset($slide['enabled']) && !$slide['enabled']) continue;
    
    // Filter by orientation
    $slide_orientation = $slide['orientation'] ?? 'both';
    if ($orientation_filter !== 'both' && $slide_orientation !== 'both' && $slide_orientation !== $orientation_filter) {
        continue;
    }
    
    // Check schedule
    if (!empty($slide['schedule_start'])) {
        $start = new DateTime($slide['schedule_start']);
        if ($now < $start) continue;
    }
    
    if (!empty($slide['schedule_end'])) {
        $end = new DateTime($slide['schedule_end']);
        if ($now > $end) continue;
    }
    
    // Convert relative image paths to absolute
    if (!empty($slide['image']) && strpos($slide['image'], 'http') !== 0) {
        $slide['image'] = $protocol . '://' . $host . $script_path . '/' . $slide['image'];
    }
    
    // Convert relative HTML file paths to absolute URLs for AI slides
    if (!empty($slide['html_file']) && strpos($slide['html_file'], 'http') !== 0) {
        $slide['html_url'] = $protocol . '://' . $host . $script_path . '/' . $slide['html_file'];
    }
    
    $active_slides[] = $slide;
}

// Return config with active slides
echo json_encode([
    'mode' => $config['mode'] ?? 'offers',
    'rotation_interval' => ($config['rotation_interval'] ?? 10) * 1000, // Convert to ms
    'offer_duration' => ($config['offer_duration'] ?? 6) * 1000, // Convert to ms
    'show_offers' => $config['show_offers'] ?? true,
    'slides' => $active_slides,
    'theme' => $config['theme'] ?? 'dark',
    'theme_schedule' => $config['theme_schedule'] ?? [
        'enabled' => false,
        'light_start' => '08:00',
        'light_end' => '20:00'
    ],
    'qr_code' => $config['qr_code'] ?? [
        'enabled' => true,
        'url' => 'https://ravintolababylon.fi/',
        'size' => 150
    ],
    'dark_theme_colors' => $config['dark_theme_colors'] ?? [
        'background_start' => '#1a0505',
        'background_mid' => '#2d0a0a',
        'background_end' => '#3d1010',
        'glow_primary' => '#dc2626',
        'glow_secondary' => '#ea580c',
        'glow_tertiary' => '#f59e0b',
        'text_primary' => '#ffffff',
        'text_secondary' => '#aaaaaa',
        'text_accent' => '#fbbf24',
        'accent_color' => '#dc2626',
        'footer_bg' => 'rgba(0,0,0,0.7)'
    ],
    'light_theme_colors' => $config['light_theme_colors'] ?? [
        'background_start' => '#f8f9fa',
        'background_mid' => '#ffffff',
        'background_end' => '#f0f2f5',
        'glow_primary' => '#fecaca',
        'glow_secondary' => '#fed7aa',
        'glow_tertiary' => '#fef3c7',
        'text_primary' => '#1f2937',
        'text_secondary' => '#6b7280',
        'text_accent' => '#b45309',
        'accent_color' => '#dc2626',
        'footer_bg' => 'rgba(255,255,255,0.9)'
    ],
    'timestamp' => time(),
    'debug' => [
        'total_slides' => count($config['slides']),
        'active_slides' => count($active_slides),
        'config_file_exists' => file_exists($config_file)
    ]
]);
