<?php
// Upload image for AI generator
header('Content-Type: application/json');
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST method required']);
    exit;
}

if (!isset($_FILES['ai_image'])) {
    echo json_encode(['error' => 'No file in request', 'files' => array_keys($_FILES)]);
    exit;
}

if ($_FILES['ai_image']['error'] !== 0) {
    $errors = [
        1 => 'File exceeds upload_max_filesize',
        2 => 'File exceeds MAX_FILE_SIZE',
        3 => 'File partially uploaded',
        4 => 'No file uploaded',
        6 => 'Missing temp folder',
        7 => 'Failed to write to disk',
        8 => 'Upload stopped by extension'
    ];
    $errMsg = $errors[$_FILES['ai_image']['error']] ?? 'Unknown error';
    echo json_encode(['error' => 'Upload error: ' . $errMsg, 'code' => $_FILES['ai_image']['error']]);
    exit;
}

$upload_dir = __DIR__ . '/uploads/ai/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        echo json_encode(['error' => 'Failed to create upload directory']);
        exit;
    }
}

// Check if directory is writable
if (!is_writable($upload_dir)) {
    echo json_encode(['error' => 'Upload directory not writable']);
    exit;
}

$file = $_FILES['ai_image'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Validate extension
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
if (!in_array($ext, $allowed)) {
    echo json_encode(['error' => 'Invalid file type: ' . $ext]);
    exit;
}

$filename = 'ai_' . uniqid() . '_' . time() . '.' . $ext;
$filepath = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Build absolute URL
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $script_path = dirname($_SERVER['SCRIPT_NAME']);
    $url = $protocol . '://' . $host . $script_path . '/uploads/ai/' . $filename;
    
    echo json_encode(['success' => true, 'url' => $url, 'filename' => $filename]);
} else {
    echo json_encode(['error' => 'Failed to save file']);
}
