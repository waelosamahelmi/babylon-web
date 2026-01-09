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

// Filter slides by schedule and enabled status
$now = new DateTime();
$active_slides = [];

foreach ($config['slides'] as $slide) {
    // Skip disabled slides
    if (!$slide['enabled']) continue;
    
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
        // Get the base URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $path = dirname($_SERVER['REQUEST_URI']);
        $slide['image'] = $protocol . '://' . $host . $path . '/' . $slide['image'];
    }
    
    $active_slides[] = $slide;
}

// Return config with active slides
echo json_encode([
    'mode' => $config['mode'],
    'rotation_interval' => $config['rotation_interval'] * 1000, // Convert to ms
    'offer_duration' => $config['offer_duration'] * 1000, // Convert to ms
    'show_offers' => $config['show_offers'],
    'slides' => $active_slides,
    'timestamp' => time()
]);
