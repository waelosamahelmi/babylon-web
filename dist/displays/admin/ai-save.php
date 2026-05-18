<?php
// Save AI generated ads to slides
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST method required']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$vertical_html = $input['vertical_html'] ?? '';
$horizontal_html = $input['horizontal_html'] ?? '';
$title = $input['title'] ?? 'AI Mainos';

if (empty($vertical_html) || empty($horizontal_html)) {
    echo json_encode(['error' => 'Missing HTML content']);
    exit;
}

// Save HTML files
$upload_dir = __DIR__ . '/uploads/ai-ads/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$timestamp = time();
$vertical_filename = 'ai_ad_vertical_' . $timestamp . '.html';
$horizontal_filename = 'ai_ad_horizontal_' . $timestamp . '.html';

file_put_contents($upload_dir . $vertical_filename, $vertical_html);
file_put_contents($upload_dir . $horizontal_filename, $horizontal_html);

// Build URLs
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$script_path = dirname($_SERVER['SCRIPT_NAME']);
$base_url = $protocol . '://' . $host . $script_path;

$vertical_url = $base_url . '/uploads/ai-ads/' . $vertical_filename;
$horizontal_url = $base_url . '/uploads/ai-ads/' . $horizontal_filename;

// Load config and add slides
$config_file = __DIR__ . '/config.json';
$config = file_exists($config_file) ? json_decode(file_get_contents($config_file), true) : ['slides' => []];

if (!isset($config['slides'])) {
    $config['slides'] = [];
}

// Add vertical slide
$config['slides'][] = [
    'id' => uniqid('ai_v_'),
    'type' => 'ai',
    'title' => $title . ' (Pysty)',
    'description' => 'AI-generoitu mainos',
    'price' => '',
    'old_price' => '',
    'discount' => '',
    'image' => '', // AI ads use HTML, not image
    'html_url' => $vertical_url,
    'html_file' => 'uploads/ai-ads/' . $vertical_filename,
    'enabled' => true,
    'schedule_start' => '',
    'schedule_end' => '',
    'orientation' => 'vertical',
    'order' => count($config['slides'])
];

// Add horizontal slide
$config['slides'][] = [
    'id' => uniqid('ai_h_'),
    'type' => 'ai',
    'title' => $title . ' (Vaaka)',
    'description' => 'AI-generoitu mainos',
    'price' => '',
    'old_price' => '',
    'discount' => '',
    'image' => '',
    'html_url' => $horizontal_url,
    'html_file' => 'uploads/ai-ads/' . $horizontal_filename,
    'enabled' => true,
    'schedule_start' => '',
    'schedule_end' => '',
    'orientation' => 'horizontal',
    'order' => count($config['slides'])
];

file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'vertical_url' => $vertical_url,
    'horizontal_url' => $horizontal_url
]);
