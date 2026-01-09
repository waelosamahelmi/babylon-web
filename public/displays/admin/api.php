<?php
// API endpoint to serve display configuration
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: no-cache, must-revalidate');

$config_file = __DIR__ . '/config.json';

// Default config if none exists
$default_config = [
    'mode' => 'offers',
    'rotation_interval' => 10,
    'slides' => [],
    'show_offers' => true,
    'offer_duration' => 6
];

$config = file_exists($config_file) ? json_decode(file_get_contents($config_file), true) : $default_config;

// Ensure slides is an array
if (!isset($config['slides']) || !is_array($config['slides'])) {
    $config['slides'] = [];
}

// Filter slides by schedule and enabled status
$now = new DateTime();
$active_slides = [];

// Get the base URL for images
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$script_path = dirname($_SERVER['SCRIPT_NAME']); // e.g., /ads/admin

foreach ($config['slides'] as $slide) {
    // Skip disabled slides
    if (isset($slide['enabled']) && !$slide['enabled']) continue;
    
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
    
    $active_slides[] = $slide;
}

// Return config with active slides
echo json_encode([
    'mode' => $config['mode'] ?? 'offers',
    'rotation_interval' => ($config['rotation_interval'] ?? 10) * 1000, // Convert to ms
    'offer_duration' => ($config['offer_duration'] ?? 6) * 1000, // Convert to ms
    'show_offers' => $config['show_offers'] ?? true,
    'slides' => $active_slides,
    'timestamp' => time(),
    'debug' => [
        'total_slides' => count($config['slides']),
        'active_slides' => count($active_slides),
        'config_file_exists' => file_exists($config_file)
    ]
]);
