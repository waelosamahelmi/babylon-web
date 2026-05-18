<?php
session_start();

// Simple password protection - change this!
$ADMIN_PASSWORD = 'babylon2024';

// Handle login
if (isset($_POST['password'])) {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['logged_in'] = true;
    } else {
        $login_error = 'Väärä salasana';
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

// Check if logged in
if (!isset($_SESSION['logged_in'])) {
    ?>
    <!DOCTYPE html>
    <html lang="fi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Babylon TV Display - Kirjaudu</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .login-box {
                background: #fff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                width: 100%;
                max-width: 400px;
            }
            .login-box h1 { color: #dc2626; margin-bottom: 30px; text-align: center; }
            .login-box input[type="password"] {
                width: 100%;
                padding: 15px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                margin-bottom: 20px;
            }
            .login-box input[type="password"]:focus { border-color: #dc2626; outline: none; }
            .login-box button {
                width: 100%;
                padding: 15px;
                background: #dc2626;
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .login-box button:hover { background: #b91c1c; }
            .error { color: #dc2626; text-align: center; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h1>🍕 Babylon TV</h1>
            <?php if (isset($login_error)): ?>
                <p class="error"><?php echo $login_error; ?></p>
            <?php endif; ?>
            <form method="POST">
                <input type="password" name="password" placeholder="Salasana" required>
                <button type="submit">Kirjaudu</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Load config
$config_file = __DIR__ . '/config.json';
$config = file_exists($config_file) ? json_decode(file_get_contents($config_file), true) : [
    'mode' => 'offers', // offers, images, mixed
    'rotation_interval' => 10,
    'slides' => [],
    'show_offers' => true,
    'offer_duration' => 6,
    'theme' => 'dark',
    'theme_schedule' => [
        'enabled' => false,
        'light_start' => '08:00',
        'light_end' => '20:00'
    ],
    'qr_code' => [
        'enabled' => true,
        'url' => 'https://ravintolababylon.fi/',
        'size' => 150
    ],
    'dark_theme_colors' => [
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
    'light_theme_colors' => [
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
    ]
];

// Ensure all settings exist for older configs
if (!isset($config['theme_schedule'])) {
    $config['theme_schedule'] = [
        'enabled' => false,
        'light_start' => '08:00',
        'light_end' => '20:00'
    ];
}
if (!isset($config['theme'])) {
    $config['theme'] = 'dark';
}
if (!isset($config['qr_code'])) {
    $config['qr_code'] = [
        'enabled' => true,
        'url' => 'https://ravintolababylon.fi/',
        'size' => 150
    ];
}
if (!isset($config['dark_theme_colors'])) {
    $config['dark_theme_colors'] = [
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
    ];
}
if (!isset($config['light_theme_colors'])) {
    $config['light_theme_colors'] = [
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
    ];
}

// Get slide data for API (must be before HTML output)
if (isset($_GET['get_slide'])) {
    header('Content-Type: application/json');
    $slide_id = $_GET['get_slide'];
    foreach ($config['slides'] as $slide) {
        if ($slide['id'] === $slide_id) {
            echo json_encode($slide);
            exit;
        }
    }
    echo json_encode(['error' => 'Slide not found']);
    exit;
}

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Update settings
    if (isset($_POST['action']) && $_POST['action'] === 'update_settings') {
        $config['mode'] = $_POST['mode'];
        $config['rotation_interval'] = (int)$_POST['rotation_interval'];
        $config['show_offers'] = isset($_POST['show_offers']);
        $config['offer_duration'] = (int)$_POST['offer_duration'];
        $config['theme'] = $_POST['theme'] ?? 'dark';
        $config['theme_schedule'] = [
            'enabled' => isset($_POST['theme_schedule_enabled']),
            'light_start' => $_POST['light_start'] ?? '08:00',
            'light_end' => $_POST['light_end'] ?? '20:00'
        ];
        $config['qr_code'] = [
            'enabled' => isset($_POST['qr_enabled']),
            'url' => $_POST['qr_url'] ?? 'https://ravintolababylon.fi/',
            'size' => (int)($_POST['qr_size'] ?? 150)
        ];
        $config['dark_theme_colors'] = [
            'background_start' => $_POST['dark_bg_start'] ?? '#1a0505',
            'background_mid' => $_POST['dark_bg_mid'] ?? '#2d0a0a',
            'background_end' => $_POST['dark_bg_end'] ?? '#3d1010',
            'glow_primary' => $_POST['dark_glow_primary'] ?? '#dc2626',
            'glow_secondary' => $_POST['dark_glow_secondary'] ?? '#ea580c',
            'glow_tertiary' => $_POST['dark_glow_tertiary'] ?? '#f59e0b',
            'text_primary' => $_POST['dark_text_primary'] ?? '#ffffff',
            'text_secondary' => $_POST['dark_text_secondary'] ?? '#aaaaaa',
            'text_accent' => $_POST['dark_text_accent'] ?? '#fbbf24',
            'accent_color' => $_POST['dark_accent'] ?? '#dc2626',
            'footer_bg' => $_POST['dark_footer_bg'] ?? 'rgba(0,0,0,0.7)'
        ];
        $config['light_theme_colors'] = [
            'background_start' => $_POST['light_bg_start'] ?? '#f8f9fa',
            'background_mid' => $_POST['light_bg_mid'] ?? '#ffffff',
            'background_end' => $_POST['light_bg_end'] ?? '#f0f2f5',
            'glow_primary' => $_POST['light_glow_primary'] ?? '#fecaca',
            'glow_secondary' => $_POST['light_glow_secondary'] ?? '#fed7aa',
            'glow_tertiary' => $_POST['light_glow_tertiary'] ?? '#fef3c7',
            'text_primary' => $_POST['light_text_primary'] ?? '#1f2937',
            'text_secondary' => $_POST['light_text_secondary'] ?? '#6b7280',
            'text_accent' => $_POST['light_text_accent'] ?? '#b45309',
            'accent_color' => $_POST['light_accent'] ?? '#dc2626',
            'footer_bg' => $_POST['light_footer_bg'] ?? 'rgba(255,255,255,0.9)'
        ];
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        $success_message = 'Asetukset tallennettu!';
    }
    
    // Add new slide
    if (isset($_POST['action']) && $_POST['action'] === 'add_slide') {
        $slide = [
            'id' => uniqid(),
            'type' => $_POST['slide_type'],
            'title' => $_POST['slide_title'] ?? '',
            'description' => $_POST['slide_description'] ?? '',
            'price' => $_POST['slide_price'] ?? '',
            'old_price' => $_POST['slide_old_price'] ?? '',
            'discount' => $_POST['slide_discount'] ?? '',
            'image' => '',
            'enabled' => true,
            'schedule_start' => $_POST['schedule_start'] ?? '',
            'schedule_end' => $_POST['schedule_end'] ?? '',
            'orientation' => $_POST['slide_orientation'] ?? 'both',
            'order' => count($config['slides'])
        ];
        
        // Handle image upload
        if (isset($_FILES['slide_image']) && $_FILES['slide_image']['error'] === 0) {
            $upload_dir = __DIR__ . '/uploads/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
            
            $ext = pathinfo($_FILES['slide_image']['name'], PATHINFO_EXTENSION);
            $filename = 'slide_' . $slide['id'] . '.' . $ext;
            
            if (move_uploaded_file($_FILES['slide_image']['tmp_name'], $upload_dir . $filename)) {
                $slide['image'] = 'uploads/' . $filename;
            }
        } elseif (!empty($_POST['slide_image_url'])) {
            $slide['image'] = $_POST['slide_image_url'];
        }
        
        $config['slides'][] = $slide;
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        $success_message = 'Slide lisätty!';
    }
    
    // Delete slide
    if (isset($_POST['action']) && $_POST['action'] === 'delete_slide') {
        $slide_id = $_POST['slide_id'];
        foreach ($config['slides'] as $key => $slide) {
            if ($slide['id'] === $slide_id) {
                // Delete image file if exists
                if (!empty($slide['image']) && strpos($slide['image'], 'uploads/') === 0) {
                    @unlink(__DIR__ . '/' . $slide['image']);
                }
                unset($config['slides'][$key]);
                break;
            }
        }
        $config['slides'] = array_values($config['slides']);
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        $success_message = 'Slide poistettu!';
    }
    
    // Toggle slide
    if (isset($_POST['action']) && $_POST['action'] === 'toggle_slide') {
        $slide_id = $_POST['slide_id'];
        for ($i = 0; $i < count($config['slides']); $i++) {
            if ($config['slides'][$i]['id'] === $slide_id) {
                $config['slides'][$i]['enabled'] = !$config['slides'][$i]['enabled'];
                break;
            }
        }
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
    }
    
    // Edit slide
    if (isset($_POST['action']) && $_POST['action'] === 'edit_slide') {
        $slide_id = $_POST['slide_id'];
        for ($i = 0; $i < count($config['slides']); $i++) {
            if ($config['slides'][$i]['id'] === $slide_id) {
                $config['slides'][$i]['type'] = $_POST['edit_slide_type'] ?? $config['slides'][$i]['type'];
                $config['slides'][$i]['title'] = $_POST['edit_slide_title'] ?? '';
                $config['slides'][$i]['description'] = $_POST['edit_slide_description'] ?? '';
                $config['slides'][$i]['price'] = $_POST['edit_slide_price'] ?? '';
                $config['slides'][$i]['old_price'] = $_POST['edit_slide_old_price'] ?? '';
                $config['slides'][$i]['discount'] = $_POST['edit_slide_discount'] ?? '';
                $config['slides'][$i]['schedule_start'] = $_POST['edit_schedule_start'] ?? '';
                $config['slides'][$i]['schedule_end'] = $_POST['edit_schedule_end'] ?? '';
                $config['slides'][$i]['orientation'] = $_POST['edit_slide_orientation'] ?? 'both';
                
                // Handle new image upload
                if (isset($_FILES['edit_slide_image']) && $_FILES['edit_slide_image']['error'] === 0) {
                    $upload_dir = __DIR__ . '/uploads/';
                    if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
                    
                    // Delete old image if exists
                    if (!empty($config['slides'][$i]['image']) && strpos($config['slides'][$i]['image'], 'uploads/') === 0) {
                        @unlink(__DIR__ . '/' . $config['slides'][$i]['image']);
                    }
                    
                    $ext = pathinfo($_FILES['edit_slide_image']['name'], PATHINFO_EXTENSION);
                    $filename = 'slide_' . $config['slides'][$i]['id'] . '_' . time() . '.' . $ext;
                    
                    if (move_uploaded_file($_FILES['edit_slide_image']['tmp_name'], $upload_dir . $filename)) {
                        $config['slides'][$i]['image'] = 'uploads/' . $filename;
                    }
                } elseif (!empty($_POST['edit_slide_image_url'])) {
                    $config['slides'][$i]['image'] = $_POST['edit_slide_image_url'];
                }
                
                break;
            }
        }
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        $success_message = 'Slide päivitetty!';
    }
    
    // Reorder slides
    if (isset($_POST['action']) && $_POST['action'] === 'reorder') {
        $new_order = json_decode($_POST['order'], true);
        $reordered = [];
        foreach ($new_order as $id) {
            foreach ($config['slides'] as $slide) {
                if ($slide['id'] === $id) {
                    $reordered[] = $slide;
                    break;
                }
            }
        }
        $config['slides'] = $reordered;
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Babylon TV Display - Hallinta</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #fff;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 { font-size: 24px; }
        .header a { color: #fff; text-decoration: none; opacity: 0.8; }
        .header a:hover { opacity: 1; }
        .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
        .card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .card-header {
            background: #f8f8f8;
            padding: 20px;
            border-bottom: 1px solid #eee;
            font-weight: 600;
            font-size: 18px;
        }
        .card-body { padding: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e5e5;
            border-radius: 8px;
            font-size: 14px;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            border-color: #dc2626;
            outline: none;
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-primary { background: #dc2626; color: #fff; }
        .btn-primary:hover { background: #b91c1c; }
        .btn-secondary { background: #6b7280; color: #fff; }
        .btn-secondary:hover { background: #4b5563; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-danger:hover { background: #dc2626; }
        .btn-sm { padding: 8px 16px; font-size: 12px; }
        .alert {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-success { background: #d1fae5; color: #065f46; }
        .slide-list { list-style: none; }
        .slide-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #fff;
            cursor: grab;
        }
        .slide-item:active { cursor: grabbing; }
        .slide-item.disabled { opacity: 0.5; }
        .slide-item img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
        }
        .slide-item .info { flex: 1; }
        .slide-item .info h4 { margin-bottom: 5px; }
        .slide-item .info p { font-size: 13px; color: #666; }
        .slide-item .actions { display: flex; gap: 10px; }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-offer { background: #fef3c7; color: #92400e; }
        .badge-image { background: #dbeafe; color: #1e40af; }
        .badge-promo { background: #fce7f3; color: #9d174d; }
        .preview-link {
            display: inline-block;
            margin-top: 20px;
            padding: 15px 25px;
            background: #1f2937;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
        }
        .preview-link:hover { background: #111827; }
        .preview-link.light { background: #f3f4f6; color: #1f2937; border: 2px solid #d1d5db; }
        .preview-link.light:hover { background: #e5e7eb; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; }
        .checkbox-group input { width: auto; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab {
            padding: 10px 20px;
            background: #e5e5e5;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
        }
        .tab.active { background: #dc2626; color: #fff; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .drag-handle { cursor: grab; color: #999; font-size: 20px; }
        .theme-selector { display: flex; gap: 15px; margin-bottom: 20px; }
        .theme-option {
            flex: 1;
            padding: 20px;
            border: 3px solid #e5e5e5;
            border-radius: 12px;
            cursor: pointer;
            text-align: center;
            transition: all 0.3s;
        }
        .theme-option:hover { border-color: #dc2626; }
        .theme-option.selected { border-color: #dc2626; background: #fef2f2; }
        .theme-option.dark-theme { background: linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%); color: #fff; }
        .theme-option.dark-theme.selected { border-color: #dc2626; }
        .theme-option.light-theme { background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); color: #1f2937; border-color: #d1d5db; }
        .theme-option.light-theme.selected { border-color: #dc2626; background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%); }
        .schedule-panel { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 15px;
            border: 1px solid #e5e5e5;
        }
        .schedule-panel.disabled { opacity: 0.5; pointer-events: none; }
        .time-inputs { display: flex; gap: 20px; margin-top: 15px; }
        .time-input { flex: 1; }
        .time-input label { display: block; margin-bottom: 5px; font-size: 13px; color: #666; }
        .time-input input { width: 100%; padding: 10px; border: 2px solid #e5e5e5; border-radius: 6px; }
        
        /* Edit Modal Styles */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.active { display: flex; }
        .modal {
            background: #fff;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 10;
        }
        .modal-header h2 { font-size: 18px; margin: 0; }
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .modal-close:hover { color: #000; }
        .modal-body { padding: 20px; }
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .current-image {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f8f8;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .current-image img {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖥️ Babylon TV Display - Hallinta</h1>
        <a href="?logout=1">Kirjaudu ulos</a>
    </div>
    
    <div class="container">
        <?php if (isset($success_message)): ?>
            <div class="alert alert-success"><?php echo $success_message; ?></div>
        <?php endif; ?>
        
        <div class="grid">
            <!-- Settings Panel -->
            <div class="card">
                <div class="card-header">⚙️ Asetukset</div>
                <div class="card-body">
                    <form method="POST">
                        <input type="hidden" name="action" value="update_settings">
                        
                        <div class="form-group">
                            <label>Näyttötila</label>
                            <select name="mode">
                                <option value="offers" <?php echo $config['mode'] === 'offers' ? 'selected' : ''; ?>>Vain tarjoukset (Supabase)</option>
                                <option value="images" <?php echo $config['mode'] === 'images' ? 'selected' : ''; ?>>Vain omat kuvat</option>
                                <option value="mixed" <?php echo $config['mode'] === 'mixed' ? 'selected' : ''; ?>>Sekoitettu (tarjoukset + kuvat)</option>
                            </select>
                        </div>
                        
                        <!-- Theme Settings -->
                        <div class="form-group">
                            <label>🎨 Teema</label>
                            <input type="hidden" name="theme" id="theme-input" value="<?php echo $config['theme'] ?? 'dark'; ?>">
                            <div class="theme-selector">
                                <div class="theme-option dark-theme <?php echo ($config['theme'] ?? 'dark') === 'dark' ? 'selected' : ''; ?>" onclick="selectTheme('dark')">
                                    <div style="font-size: 24px; margin-bottom: 8px;">🌙</div>
                                    <div style="font-weight: 600;">Tumma</div>
                                    <div style="font-size: 12px; opacity: 0.7;">Perinteinen tumma teema</div>
                                </div>
                                <div class="theme-option light-theme <?php echo ($config['theme'] ?? 'dark') === 'light' ? 'selected' : ''; ?>" onclick="selectTheme('light')">
                                    <div style="font-size: 24px; margin-bottom: 8px;">☀️</div>
                                    <div style="font-weight: 600;">Vaalea</div>
                                    <div style="font-size: 12px; opacity: 0.7;">Vaalea ja raikas teema</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Theme Schedule -->
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" name="theme_schedule_enabled" id="theme_schedule_enabled" <?php echo ($config['theme_schedule']['enabled'] ?? false) ? 'checked' : ''; ?> onchange="toggleSchedulePanel()">
                                <label for="theme_schedule_enabled" style="margin-bottom: 0;">⏰ Ajasta teeman vaihto automaattisesti</label>
                            </div>
                            <div class="schedule-panel <?php echo ($config['theme_schedule']['enabled'] ?? false) ? '' : 'disabled'; ?>" id="schedule-panel">
                                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">
                                    Aseta aika, jolloin vaalea teema on käytössä. Muuna aikana käytetään tummaa teemaa.
                                </p>
                                <div class="time-inputs">
                                    <div class="time-input">
                                        <label>☀️ Vaalea alkaa</label>
                                        <input type="time" name="light_start" value="<?php echo $config['theme_schedule']['light_start'] ?? '08:00'; ?>">
                                    </div>
                                    <div class="time-input">
                                        <label>🌙 Tumma alkaa</label>
                                        <input type="time" name="light_end" value="<?php echo $config['theme_schedule']['light_end'] ?? '20:00'; ?>">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Kuvien vaihtoväli (sekuntia)</label>
                                <input type="number" name="rotation_interval" value="<?php echo $config['rotation_interval']; ?>" min="3" max="60">
                            </div>
                            <div class="form-group">
                                <label>Tarjousten vaihtoväli (sekuntia)</label>
                                <input type="number" name="offer_duration" value="<?php echo $config['offer_duration']; ?>" min="3" max="60">
                            </div>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <input type="checkbox" name="show_offers" id="show_offers" <?php echo $config['show_offers'] ? 'checked' : ''; ?>>
                            <label for="show_offers" style="margin-bottom: 0;">Näytä myös Supabase-tarjoukset (Mixed-tilassa)</label>
                        </div>
                        
                        <!-- QR Code Settings -->
                        <div class="form-group" style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e5e5;">
                            <label style="font-size: 16px; margin-bottom: 15px;">📱 QR-koodi asetukset</label>
                            <div class="checkbox-group" style="margin-bottom: 15px;">
                                <input type="checkbox" name="qr_enabled" id="qr_enabled" <?php echo ($config['qr_code']['enabled'] ?? true) ? 'checked' : ''; ?>>
                                <label for="qr_enabled" style="margin-bottom: 0;">Näytä QR-koodi hinnan alla</label>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="font-size: 13px;">QR-koodin URL</label>
                                    <input type="url" name="qr_url" value="<?php echo htmlspecialchars($config['qr_code']['url'] ?? 'https://ravintolababylon.fi/'); ?>" placeholder="https://ravintolababylon.fi/">
                                </div>
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="font-size: 13px;">QR-koodin koko (px)</label>
                                    <input type="number" name="qr_size" value="<?php echo $config['qr_code']['size'] ?? 150; ?>" min="80" max="300">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Color Customization Accordion -->
                        <div class="form-group" style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e5e5;">
                            <label style="font-size: 16px; margin-bottom: 15px; cursor: pointer;" onclick="toggleColorPanel()">
                                🎨 Värien muokkaus <span id="color-panel-toggle" style="font-size: 12px;">▼ Avaa</span>
                            </label>
                            <div id="color-customization-panel" style="display: none;">
                                
                                <!-- Dark Theme Colors -->
                                <div style="background: #1a1a2e; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                                    <h4 style="color: #fff; margin-bottom: 15px; font-size: 14px;">🌙 Tumman teeman värit</h4>
                                    
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (alku)</label>
                                            <input type="color" name="dark_bg_start" value="<?php echo $config['dark_theme_colors']['background_start'] ?? '#1a0505'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (keski)</label>
                                            <input type="color" name="dark_bg_mid" value="<?php echo $config['dark_theme_colors']['background_mid'] ?? '#2d0a0a'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (loppu)</label>
                                            <input type="color" name="dark_bg_end" value="<?php echo $config['dark_theme_colors']['background_end'] ?? '#3d1010'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 1</label>
                                            <input type="color" name="dark_glow_primary" value="<?php echo $config['dark_theme_colors']['glow_primary'] ?? '#dc2626'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 2</label>
                                            <input type="color" name="dark_glow_secondary" value="<?php echo $config['dark_theme_colors']['glow_secondary'] ?? '#ea580c'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 3</label>
                                            <input type="color" name="dark_glow_tertiary" value="<?php echo $config['dark_theme_colors']['glow_tertiary'] ?? '#f59e0b'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (pää)</label>
                                            <input type="color" name="dark_text_primary" value="<?php echo $config['dark_theme_colors']['text_primary'] ?? '#ffffff'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (toissijainen)</label>
                                            <input type="color" name="dark_text_secondary" value="<?php echo $config['dark_theme_colors']['text_secondary'] ?? '#aaaaaa'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (korostus)</label>
                                            <input type="color" name="dark_text_accent" value="<?php echo $config['dark_theme_colors']['text_accent'] ?? '#fbbf24'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Korostusväri</label>
                                            <input type="color" name="dark_accent" value="<?php echo $config['dark_theme_colors']['accent_color'] ?? '#dc2626'; ?>" style="width: 100%; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                                        </div>
                                    </div>
                                    <div style="margin-top: 15px;">
                                        <label style="color: #aaa; font-size: 11px; display: block; margin-bottom: 5px;">Alatunnisteen tausta (rgba)</label>
                                        <input type="text" name="dark_footer_bg" value="<?php echo htmlspecialchars($config['dark_theme_colors']['footer_bg'] ?? 'rgba(0,0,0,0.7)'); ?>" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #444; background: #333; color: #fff;">
                                    </div>
                                </div>
                                
                                <!-- Light Theme Colors -->
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #e5e5e5;">
                                    <h4 style="color: #333; margin-bottom: 15px; font-size: 14px;">☀️ Vaalean teeman värit</h4>
                                    
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (alku)</label>
                                            <input type="color" name="light_bg_start" value="<?php echo $config['light_theme_colors']['background_start'] ?? '#f8f9fa'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (keski)</label>
                                            <input type="color" name="light_bg_mid" value="<?php echo $config['light_theme_colors']['background_mid'] ?? '#ffffff'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Taustaväri (loppu)</label>
                                            <input type="color" name="light_bg_end" value="<?php echo $config['light_theme_colors']['background_end'] ?? '#f0f2f5'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 1</label>
                                            <input type="color" name="light_glow_primary" value="<?php echo $config['light_theme_colors']['glow_primary'] ?? '#fecaca'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 2</label>
                                            <input type="color" name="light_glow_secondary" value="<?php echo $config['light_theme_colors']['glow_secondary'] ?? '#fed7aa'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Hehku 3</label>
                                            <input type="color" name="light_glow_tertiary" value="<?php echo $config['light_theme_colors']['glow_tertiary'] ?? '#fef3c7'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (pää)</label>
                                            <input type="color" name="light_text_primary" value="<?php echo $config['light_theme_colors']['text_primary'] ?? '#1f2937'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (toissijainen)</label>
                                            <input type="color" name="light_text_secondary" value="<?php echo $config['light_theme_colors']['text_secondary'] ?? '#6b7280'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Teksti (korostus)</label>
                                            <input type="color" name="light_text_accent" value="<?php echo $config['light_theme_colors']['text_accent'] ?? '#b45309'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                        <div class="color-input-group">
                                            <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Korostusväri</label>
                                            <input type="color" name="light_accent" value="<?php echo $config['light_theme_colors']['accent_color'] ?? '#dc2626'; ?>" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                                        </div>
                                    </div>
                                    <div style="margin-top: 15px;">
                                        <label style="color: #666; font-size: 11px; display: block; margin-bottom: 5px;">Alatunnisteen tausta (rgba)</label>
                                        <input type="text" name="light_footer_bg" value="<?php echo htmlspecialchars($config['light_theme_colors']['footer_bg'] ?? 'rgba(255,255,255,0.9)'); ?>" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Tallenna asetukset</button>
                    </form>
                    
                    <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
                        <a href="../babylon-ad.html" target="_blank" class="preview-link">📱 Pystynäyttö</a>
                        <a href="../babylon-ad-horizontal.html" target="_blank" class="preview-link">🖥️ Vaakanäyttö</a>
                        <a href="../babylon-ad.html?theme=light" target="_blank" class="preview-link light">☀️ Pysty (vaalea)</a>
                        <a href="../babylon-ad-horizontal.html?theme=light" target="_blank" class="preview-link light">☀️ Vaaka (vaalea)</a>
                    </div>
                </div>
            </div>
            
            <!-- Add Slide Panel -->
            <div class="card">
                <div class="card-header">➕ Lisää uusi slide</div>
                <div class="card-body">
                    <div class="tabs">
                        <button class="tab active" onclick="showTab('image')">🖼️ Kuva</button>
                        <button class="tab" onclick="showTab('offer')">🏷️ Tarjous</button>
                        <button class="tab" onclick="showTab('promo')">📢 Mainos</button>
                        <button class="tab" onclick="showTab('ai')" style="background: linear-gradient(135deg, #8b5cf6, #ec4899);">🤖 AI</button>
                    </div>
                    
                    <form method="POST" enctype="multipart/form-data" id="add-slide-form">
                        <input type="hidden" name="action" value="add_slide">
                        <input type="hidden" name="slide_type" id="slide_type" value="image">
                        
                        <!-- Image Tab -->
                        <div class="tab-content active" id="tab-image">
                            <div class="form-group">
                                <label>Kuva (lataa tiedosto)</label>
                                <input type="file" name="slide_image" accept="image/*">
                            </div>
                            <div class="form-group">
                                <label>TAI kuvan URL</label>
                                <input type="url" name="slide_image_url" placeholder="https://...">
                            </div>
                        </div>
                        
                        <!-- Offer Tab -->
                        <div class="tab-content" id="tab-offer">
                            <div class="form-group">
                                <label>Tarjouksen nimi</label>
                                <input type="text" name="slide_title" placeholder="Esim. Pepperoni Pizza">
                            </div>
                            <div class="form-group">
                                <label>Kuvaus</label>
                                <textarea name="slide_description" rows="2" placeholder="Esim. Juusto, pepperoni, tomaattikastike"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Vanha hinta (€)</label>
                                    <input type="text" name="slide_old_price" placeholder="15.90">
                                </div>
                                <div class="form-group">
                                    <label>Uusi hinta (€)</label>
                                    <input type="text" name="slide_price" placeholder="12.90">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Alennus-% (valinnainen)</label>
                                <input type="text" name="slide_discount" placeholder="20">
                            </div>
                        </div>
                        
                        <!-- Promo Tab -->
                        <div class="tab-content" id="tab-promo">
                            <div class="form-group">
                                <label>Mainoksen otsikko</label>
                                <input type="text" name="slide_title" placeholder="Esim. Lounas arkisin!">
                            </div>
                            <div class="form-group">
                                <label>Kuvaus</label>
                                <textarea name="slide_description" rows="3" placeholder="Esim. Mausta lounaskokemuksesi päivittäin vaihtuvilla annoksilla"></textarea>
                            </div>
                        </div>
                        
                        <!-- AI Tab (outside main form) -->
                        <div class="tab-content" id="tab-ai" style="display: none;">
                            <!-- AI content is handled separately -->
                        </div>
                        
                        <!-- Orientation selection (hidden for AI tab) -->
                        <div class="form-group" style="margin-top: 20px;" id="orientation-section">
                            <label>📺 Näyttösuunta</label>
                            <select name="slide_orientation">
                                <option value="both">Molemmat (pysty + vaaka)</option>
                                <option value="vertical">Vain pysty (Portrait)</option>
                                <option value="horizontal">Vain vaaka (Landscape)</option>
                            </select>
                        </div>
                        
                        <!-- Schedule (all types, hidden for AI tab) -->
                        <div class="form-row" style="margin-top: 15px;" id="schedule-section">
                            <div class="form-group">
                                <label>Näytä alkaen (valinnainen)</label>
                                <input type="datetime-local" name="schedule_start">
                            </div>
                            <div class="form-group">
                                <label>Näytä asti (valinnainen)</label>
                                <input type="datetime-local" name="schedule_end">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" id="add-slide-btn">Lisää slide</button>
                    </form>
                    
                    <!-- AI Generator Section (separate from main form) -->
                    <div id="ai-generator-section" style="display: none;">
                        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 25px; border-radius: 12px; margin-top: 20px;">
                            <h3 style="color: #fff; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 28px;">🤖</span> AI Mainos-generaattori
                            </h3>
                            
                            <div class="form-group">
                                <label style="color: #e5e5e5;">📸 Lataa kuvia (voit valita useita)</label>
                                <input type="file" id="ai-images" accept="image/*" multiple style="background: #fff; padding: 10px; border-radius: 8px; width: 100%;">
                                <div id="ai-image-previews" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;"></div>
                            </div>
                            
                            <div class="form-group">
                                <label style="color: #e5e5e5;">🎯 Mainoksen tarkoitus</label>
                                <input type="text" id="ai-purpose" placeholder="Esim. Uusi pepperoni pizza tarjous, Lounas kampanja, Juhlapäivä erikoinen..." style="padding: 12px; border-radius: 8px; border: none;">
                            </div>
                            
                            <div class="form-group">
                                <label style="color: #e5e5e5;">📝 Mainoksen sisältö/teksti</label>
                                <textarea id="ai-content" rows="3" placeholder="Esim. PEPPERONI PIZZA vain 12,90€! Tilaa nyt ravintolababylon.fi - Voimassa 31.1. asti" style="padding: 12px; border-radius: 8px; border: none;"></textarea>
                            </div>
                            
                            <button type="button" onclick="generateAiAd()" class="btn" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; padding: 15px 30px; font-size: 16px; width: 100%;">
                                ✨ Luo mainos AI:lla
                            </button>
                            
                            <p style="color: #888; font-size: 12px; margin-top: 15px; text-align: center;">
                                AI luo sekä pysty- (1080x1920) että vaakaversion (1920x1080) mainoksesta
                            </p>
                        </div>
                        
                        <!-- AI Preview Section -->
                        <div id="ai-preview-section" style="display: none; margin-top: 25px;">
                            <h4 style="margin-bottom: 15px;">👁️ Esikatselu <span style="font-size: 12px; color: #888; font-weight: normal;">(klikkaa elementtiä valitaksesi sen)</span></h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <!-- Vertical Preview -->
                                <div>
                                    <h5 style="margin-bottom: 10px;">📱 Pysty (1080x1920)</h5>
                                    <div id="ai-preview-vertical-container" style="width: 216px; height: 384px; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; background: #000; position: relative; cursor: crosshair;">
                                        <iframe id="ai-preview-vertical" style="width: 1080px; height: 1920px; border: none; transform: scale(0.2); transform-origin: top left; position: absolute; top: 0; left: 0;"></iframe>
                                    </div>
                                </div>
                                
                                <!-- Horizontal Preview -->
                                <div>
                                    <h5 style="margin-bottom: 10px;">🖥️ Vaaka (1920x1080)</h5>
                                    <div id="ai-preview-horizontal-container" style="width: 384px; height: 216px; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; background: #000; position: relative; cursor: crosshair;">
                                        <iframe id="ai-preview-horizontal" style="width: 1920px; height: 1080px; border: none; transform: scale(0.2); transform-origin: top left; position: absolute; top: 0; left: 0;"></iframe>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Selected Element Info -->
                            <div id="ai-selected-element" style="display: none; margin-top: 15px; padding: 12px; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <span style="font-size: 18px;">🎯</span>
                                    <strong>Valittu elementti:</strong>
                                    <span id="ai-selected-element-type" style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;"></span>
                                    <button onclick="clearElementSelection()" style="margin-left: auto; background: none; border: none; cursor: pointer; font-size: 16px;">❌</button>
                                </div>
                                <div id="ai-selected-element-content" style="font-family: monospace; font-size: 12px; background: #fff; padding: 8px; border-radius: 4px; max-height: 60px; overflow: auto;"></div>
                            </div>
                            
                            <!-- Edit Instructions -->
                            <div style="margin-top: 20px; background: #fefce8; border: 1px solid #facc15; border-radius: 8px; padding: 15px;">
                                <h5 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 20px;">✏️</span> Muokkausohjeet
                                </h5>
                                <textarea id="ai-edit-instructions" rows="3" placeholder="Esim: Tee otsikko isommaksi, vaihda taustaväri punaiseksi, siirrä kuva keskelle, lisää varjo tekstiin..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical;"></textarea>
                                <p style="font-size: 11px; color: #666; margin-top: 8px;">💡 Vinkki: Klikkaa elementtiä esikatsselussa ja kirjoita mitä haluat muuttaa. Voit myös antaa yleisiä ohjeita.</p>
                            </div>
                            
                            <div style="margin-top: 20px; display: flex; gap: 15px; flex-wrap: wrap;">
                                <button type="button" onclick="regenerateAiAd()" class="btn btn-secondary" style="flex: 1; min-width: 140px;">
                                    🔄 Generoi uudelleen
                                </button>
                                <button type="button" onclick="editAiAd()" class="btn" style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;">
                                    ✨ Muokkaa AI:lla
                                </button>
                                <button type="button" onclick="approveAiAd()" class="btn btn-primary" style="flex: 1; min-width: 140px; background: linear-gradient(135deg, #10b981, #059669);">
                                    ✅ Hyväksy ja lisää jonoon
                                </button>
                            </div>
                        </div>
                        
                        <!-- Loading indicator with live response -->
                        <div id="ai-loading" style="display: none; padding: 30px;">
                            <div style="text-align: center;">
                                <!-- Animated Spinner -->
                                <div class="ai-spinner" style="margin: 0 auto 20px;">
                                    <svg width="80" height="80" viewBox="0 0 50 50" style="animation: rotate 1.5s linear infinite;">
                                        <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e5e5" stroke-width="4"></circle>
                                        <circle cx="25" cy="25" r="20" fill="none" stroke="url(#gradient)" stroke-width="4" stroke-linecap="round" stroke-dasharray="80, 200" style="animation: dash 1.5s ease-in-out infinite;">
                                        </circle>
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stop-color="#8b5cf6"/>
                                                <stop offset="100%" stop-color="#ec4899"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                
                                <!-- Status text -->
                                <p id="ai-status-text" style="color: #666; font-size: 16px; margin-bottom: 5px;">🤖 AI luo mainosta...</p>
                                <p id="ai-status-detail" style="color: #888; font-size: 13px;">Tämä voi kestää 30-60 sekuntia</p>
                                
                                <!-- Progress steps -->
                                <div id="ai-progress-steps" style="margin-top: 20px; display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                                    <div class="progress-step" id="step-upload">
                                        <div class="step-icon">📤</div>
                                        <div class="step-label">Lataus</div>
                                    </div>
                                    <div class="progress-step" id="step-vertical">
                                        <div class="step-icon">📱</div>
                                        <div class="step-label">Pysty</div>
                                    </div>
                                    <div class="progress-step" id="step-horizontal">
                                        <div class="step-icon">🖥️</div>
                                        <div class="step-label">Vaaka</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Expandable Live Response Viewer -->
                            <div style="margin-top: 25px;">
                                <button type="button" onclick="toggleLiveResponse()" id="live-response-toggle" style="background: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0 auto; font-size: 14px; color: #666;">
                                    <span id="live-toggle-icon">▶</span> Näytä AI:n vastaus livenä
                                </button>
                                <div id="live-response-container" style="display: none; margin-top: 15px; background: #1a1a2e; border-radius: 12px; overflow: hidden;">
                                    <div style="background: #16213e; padding: 10px 15px; display: flex; align-items: center; gap: 10px;">
                                        <span style="color: #10b981;">●</span>
                                        <span style="color: #888; font-size: 13px;">AI Response Stream</span>
                                        <span id="live-response-orientation" style="margin-left: auto; background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;"></span>
                                    </div>
                                    <pre id="live-response-content" style="color: #10b981; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; padding: 15px; margin: 0; max-height: 300px; overflow: auto; white-space: pre-wrap; word-break: break-all;"></pre>
                                </div>
                            </div>
                        </div>
                        
                        <style>
                            @keyframes rotate {
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes dash {
                                0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
                                50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35; }
                                100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124; }
                            }
                            .progress-step {
                                text-align: center;
                                opacity: 0.4;
                                transition: all 0.3s ease;
                            }
                            .progress-step.active {
                                opacity: 1;
                            }
                            .progress-step.done {
                                opacity: 1;
                            }
                            .progress-step .step-icon {
                                font-size: 28px;
                                margin-bottom: 5px;
                            }
                            .progress-step.active .step-icon {
                                animation: pulse 1s infinite;
                            }
                            .progress-step.done .step-icon::after {
                                content: ' ✓';
                                color: #10b981;
                            }
                            .progress-step .step-label {
                                font-size: 12px;
                                color: #666;
                            }
                            #live-response-content {
                                scrollbar-width: thin;
                                scrollbar-color: #8b5cf6 #1a1a2e;
                            }
                            #live-response-content::-webkit-scrollbar {
                                width: 8px;
                            }
                            #live-response-content::-webkit-scrollbar-track {
                                background: #1a1a2e;
                            }
                            #live-response-content::-webkit-scrollbar-thumb {
                                background: #8b5cf6;
                                border-radius: 4px;
                            }
                        </style>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Slides List -->
        <div class="card" style="margin-top: 30px;">
            <div class="card-header">📋 Omat slidet (<?php echo count($config['slides']); ?> kpl)</div>
            <div class="card-body">
                <?php if (empty($config['slides'])): ?>
                    <p style="color: #666; text-align: center; padding: 40px;">Ei slideja. Lisää ensimmäinen slide yllä olevalla lomakkeella.</p>
                <?php else: ?>
                    <ul class="slide-list" id="slide-list">
                        <?php foreach ($config['slides'] as $slide): ?>
                            <li class="slide-item <?php echo !$slide['enabled'] ? 'disabled' : ''; ?>" data-id="<?php echo $slide['id']; ?>">
                                <span class="drag-handle">⋮⋮</span>
                                <?php if (!empty($slide['image'])): ?>
                                    <img src="<?php echo htmlspecialchars($slide['image']); ?>" alt="">
                                <?php elseif ($slide['type'] === 'ai'): ?>
                                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🤖</div>
                                <?php else: ?>
                                    <div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">📝</div>
                                <?php endif; ?>
                                <div class="info">
                                    <h4>
                                        <?php echo htmlspecialchars($slide['title'] ?: 'Kuva'); ?>
                                        <?php if ($slide['type'] === 'offer'): ?>
                                            <span class="badge badge-offer">Tarjous</span>
                                        <?php elseif ($slide['type'] === 'promo'): ?>
                                            <span class="badge badge-promo">Mainos</span>
                                        <?php elseif ($slide['type'] === 'ai'): ?>
                                            <span class="badge" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff;">AI</span>
                                        <?php else: ?>
                                            <span class="badge badge-image">Kuva</span>
                                        <?php endif; ?>
                                    </h4>
                                    <p>
                                        <?php if (!empty($slide['price'])): ?>
                                            <?php echo !empty($slide['old_price']) ? '<s>'.$slide['old_price'].'€</s> → ' : ''; ?>
                                            <?php echo $slide['price']; ?>€
                                            <?php echo !empty($slide['discount']) ? ' (-'.$slide['discount'].'%)' : ''; ?>
                                        <?php elseif (!empty($slide['description'])): ?>
                                            <?php echo htmlspecialchars(substr($slide['description'], 0, 50)); ?>...
                                        <?php endif; ?>
                                        <?php 
                                        $orientationLabels = ['both' => '📺 Molemmat', 'vertical' => '📱 Pysty', 'horizontal' => '🖥️ Vaaka'];
                                        $orientation = $slide['orientation'] ?? 'both';
                                        ?>
                                        <br><?php echo $orientationLabels[$orientation] ?? $orientationLabels['both']; ?>
                                        <?php if (!empty($slide['schedule_start']) || !empty($slide['schedule_end'])): ?>
                                            | 📅 <?php echo $slide['schedule_start'] ?? ''; ?> - <?php echo $slide['schedule_end'] ?? ''; ?>
                                        <?php endif; ?>
                                    </p>
                                </div>
                                <div class="actions">
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="openEditModal('<?php echo $slide['id']; ?>')">✏️ Muokkaa</button>
                                    <form method="POST" style="display: inline;">
                                        <input type="hidden" name="action" value="toggle_slide">
                                        <input type="hidden" name="slide_id" value="<?php echo $slide['id']; ?>">
                                        <button type="submit" class="btn btn-sm <?php echo $slide['enabled'] ? 'btn-secondary' : 'btn-primary'; ?>">
                                            <?php echo $slide['enabled'] ? '⏸️ Pois' : '▶️ Päälle'; ?>
                                        </button>
                                    </form>
                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Haluatko varmasti poistaa tämän sliden?');">
                                        <input type="hidden" name="action" value="delete_slide">
                                        <input type="hidden" name="slide_id" value="<?php echo $slide['id']; ?>">
                                        <button type="submit" class="btn btn-sm btn-danger">🗑️</button>
                                    </form>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <!-- Edit Modal -->
    <div class="modal-overlay" id="edit-modal">
        <div class="modal">
            <div class="modal-header">
                <h2>✏️ Muokkaa slidea</h2>
                <button type="button" class="modal-close" onclick="closeEditModal()">&times;</button>
            </div>
            <form method="POST" enctype="multipart/form-data" id="edit-form">
                <input type="hidden" name="action" value="edit_slide">
                <input type="hidden" name="slide_id" id="edit_slide_id">
                
                <div class="modal-body">
                    <div class="form-group">
                        <label>Tyyppi</label>
                        <select name="edit_slide_type" id="edit_slide_type" onchange="toggleEditFields()">
                            <option value="image">🖼️ Kuva</option>
                            <option value="offer">🏷️ Tarjous</option>
                            <option value="promo">📢 Mainos</option>
                        </select>
                    </div>
                    
                    <!-- Current Image -->
                    <div class="current-image" id="current-image-container" style="display: none;">
                        <img id="current-image-preview" src="" alt="Current image">
                        <div>
                            <strong>Nykyinen kuva</strong><br>
                            <small style="color: #666;">Lataa uusi kuva korvataksesi</small>
                        </div>
                    </div>
                    
                    <!-- Image fields -->
                    <div id="edit-image-fields">
                        <div class="form-group">
                            <label>Kuva (lataa uusi tiedosto)</label>
                            <input type="file" name="edit_slide_image" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>TAI kuvan URL</label>
                            <input type="url" name="edit_slide_image_url" id="edit_slide_image_url" placeholder="https://...">
                        </div>
                    </div>
                    
                    <!-- Title & Description (for offer/promo) -->
                    <div id="edit-text-fields">
                        <div class="form-group">
                            <label>Otsikko</label>
                            <input type="text" name="edit_slide_title" id="edit_slide_title" placeholder="Esim. Pepperoni Pizza">
                        </div>
                        <div class="form-group">
                            <label>Kuvaus</label>
                            <textarea name="edit_slide_description" id="edit_slide_description" rows="2" placeholder="Kuvaus..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Price fields (for offer) -->
                    <div id="edit-price-fields" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vanha hinta (€)</label>
                                <input type="text" name="edit_slide_old_price" id="edit_slide_old_price" placeholder="15.90">
                            </div>
                            <div class="form-group">
                                <label>Uusi hinta (€)</label>
                                <input type="text" name="edit_slide_price" id="edit_slide_price" placeholder="12.90">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Alennus-% (valinnainen)</label>
                            <input type="text" name="edit_slide_discount" id="edit_slide_discount" placeholder="20">
                        </div>
                    </div>
                    
                    <!-- Orientation -->
                    <div class="form-group" style="margin-top: 20px;">
                        <label>📺 Näyttösuunta</label>
                        <select name="edit_slide_orientation" id="edit_slide_orientation">
                            <option value="both">Molemmat (pysty + vaaka)</option>
                            <option value="vertical">Vain pysty (Portrait)</option>
                            <option value="horizontal">Vain vaaka (Landscape)</option>
                        </select>
                    </div>
                    
                    <!-- Schedule -->
                    <div class="form-row" style="margin-top: 15px;">
                        <div class="form-group">
                            <label>Näytä alkaen (valinnainen)</label>
                            <input type="datetime-local" name="edit_schedule_start" id="edit_schedule_start">
                        </div>
                        <div class="form-group">
                            <label>Näytä asti (valinnainen)</label>
                            <input type="datetime-local" name="edit_schedule_end" id="edit_schedule_end">
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Peruuta</button>
                    <button type="submit" class="btn btn-primary">Tallenna muutokset</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        // Store AI generated HTML
        let aiGeneratedVertical = '';
        let aiGeneratedHorizontal = '';
        let aiUploadedImages = [];
        let aiSelectedElement = null;
        let aiUploadedImageUrls = [];
        
        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');
            document.getElementById('slide_type').value = tab;
            
            // Show/hide AI section and regular form sections
            const aiSection = document.getElementById('ai-generator-section');
            const mainForm = document.getElementById('add-slide-form');
            const orientationSection = document.getElementById('orientation-section');
            const scheduleSection = document.getElementById('schedule-section');
            const addSlideBtn = document.getElementById('add-slide-btn');
            
            if (tab === 'ai') {
                aiSection.style.display = 'block';
                orientationSection.style.display = 'none';
                scheduleSection.style.display = 'none';
                addSlideBtn.style.display = 'none';
            } else {
                aiSection.style.display = 'none';
                orientationSection.style.display = 'block';
                scheduleSection.style.display = 'flex';
                addSlideBtn.style.display = 'block';
            }
        }
        
        // AI Image Upload Preview
        document.getElementById('ai-images').addEventListener('change', function(e) {
            const previews = document.getElementById('ai-image-previews');
            previews.innerHTML = '';
            aiUploadedImages = [];
            
            Array.from(e.target.files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    aiUploadedImages.push(ev.target.result);
                    
                    const div = document.createElement('div');
                    div.style.cssText = 'position: relative; width: 100px; height: 100px;';
                    div.innerHTML = '<img src="' + ev.target.result + '" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">' +
                        '<span style="position: absolute; top: 5px; right: 5px; background: #10b981; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">' + (index + 1) + '</span>';
                    previews.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
        
        async function uploadImageForAI(file) {
            const formData = new FormData();
            formData.append('ai_image', file);
            
            try {
                const response = await fetch('ai-upload.php', {
                    method: 'POST',
                    body: formData
                });
                
                const text = await response.text();
                console.log('Upload response:', text);
                
                const data = JSON.parse(text);
                if (data.error) {
                    console.error('Upload error:', data.error);
                    return null;
                }
                return data.url;
            } catch (e) {
                console.error('Upload exception:', e);
                return null;
            }
        }
        
        // Live response toggle
        function toggleLiveResponse() {
            const container = document.getElementById('live-response-container');
            const icon = document.getElementById('live-toggle-icon');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                icon.textContent = '▼';
            } else {
                container.style.display = 'none';
                icon.textContent = '▶';
            }
        }
        
        // Update progress step
        function setProgressStep(step, status) {
            const el = document.getElementById('step-' + step);
            if (!el) return;
            el.classList.remove('active', 'done');
            if (status === 'active') el.classList.add('active');
            if (status === 'done') el.classList.add('done');
        }
        
        // Reset progress
        function resetProgress() {
            ['upload', 'vertical', 'horizontal'].forEach(s => {
                const el = document.getElementById('step-' + s);
                if (el) el.classList.remove('active', 'done');
            });
            document.getElementById('live-response-content').textContent = '';
            document.getElementById('ai-status-text').textContent = '🤖 AI luo mainosta...';
            document.getElementById('ai-status-detail').textContent = 'Tämä voi kestää 30-60 sekuntia';
        }
        
        // Update live response
        function updateLiveResponse(text, orientation) {
            const content = document.getElementById('live-response-content');
            const orientationLabel = document.getElementById('live-response-orientation');
            orientationLabel.textContent = orientation === 'vertical' ? '📱 Pysty' : '🖥️ Vaaka';
            content.textContent = text;
            content.scrollTop = content.scrollHeight;
        }
        
        // Read streaming response from server
        async function readStreamingResponse(response, orientation) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let htmlContent = '';
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;
                    
                    // Update live display with raw response
                    updateLiveResponse(fullText.slice(-2000), orientation);
                    
                    // Try to extract HTML from the accumulated text
                    // Look for complete HTML between markers or just the raw HTML
                    const htmlMatch = fullText.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
                    if (htmlMatch) {
                        htmlContent = htmlMatch[0];
                    }
                }
                
                // If we found HTML, return it
                if (htmlContent) {
                    return htmlContent;
                }
                
                // Otherwise try to parse as JSON response
                try {
                    const data = JSON.parse(fullText);
                    if (data.error) throw new Error(data.error);
                    return data.html || fullText;
                } catch (e) {
                    // Clean up response if it's raw HTML
                    let cleaned = fullText.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();
                    if (cleaned.includes('<html') || cleaned.includes('<!DOCTYPE')) {
                        return cleaned;
                    }
                    throw new Error('Virheellinen vastaus AI:lta');
                }
            } catch (error) {
                console.error('Stream error:', error);
                throw error;
            }
        }
        
        async function generateAiAd() {
            const purpose = document.getElementById('ai-purpose').value.trim();
            const content = document.getElementById('ai-content').value.trim();
            const files = document.getElementById('ai-images').files;
            
            if (files.length === 0) {
                alert('Lataa vähintään yksi kuva');
                return;
            }
            
            if (!purpose) {
                alert('Syötä mainoksen tarkoitus');
                return;
            }
            
            // Show loading and reset progress
            document.getElementById('ai-loading').style.display = 'block';
            document.getElementById('ai-preview-section').style.display = 'none';
            resetProgress();
            
            try {
                // Step 1: Upload images
                setProgressStep('upload', 'active');
                document.getElementById('ai-status-text').textContent = '📤 Ladataan kuvia...';
                document.getElementById('ai-status-detail').textContent = `0/${files.length} kuvaa ladattu`;
                
                const imageUrls = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    console.log('Uploading file:', file.name);
                    const url = await uploadImageForAI(file);
                    if (url) imageUrls.push(url);
                    document.getElementById('ai-status-detail').textContent = `${i+1}/${files.length} kuvaa ladattu`;
                }
                
                if (imageUrls.length === 0) {
                    throw new Error('Kuvien lataus epäonnistui');
                }
                
                setProgressStep('upload', 'done');
                
                // Store URLs for editing later
                aiUploadedImageUrls = imageUrls;
                
                // Step 2: Generate vertical version
                setProgressStep('vertical', 'active');
                document.getElementById('ai-status-text').textContent = '📱 Luodaan pystyversiota...';
                document.getElementById('ai-status-detail').textContent = 'AI kirjoittaa HTML/CSS koodia...';
                updateLiveResponse('Odotetaan vastausta...', 'vertical');
                
                const verticalResponse = await fetch('ai-generate-stream.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_urls: imageUrls,
                        purpose: purpose,
                        content: content,
                        orientation: 'vertical'
                    })
                });
                
                // Read streaming response for vertical
                aiGeneratedVertical = await readStreamingResponse(verticalResponse, 'vertical');
                setProgressStep('vertical', 'done');
                
                // Step 3: Generate horizontal version
                setProgressStep('horizontal', 'active');
                document.getElementById('ai-status-text').textContent = '🖥️ Luodaan vaakaversiota...';
                document.getElementById('ai-status-detail').textContent = 'AI kirjoittaa HTML/CSS koodia...';
                updateLiveResponse('Odotetaan vastausta...', 'horizontal');
                
                const horizontalResponse = await fetch('ai-generate-stream.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_urls: imageUrls,
                        purpose: purpose,
                        content: content,
                        orientation: 'horizontal'
                    })
                });
                
                // Read streaming response for horizontal
                aiGeneratedHorizontal = await readStreamingResponse(horizontalResponse, 'horizontal');
                setProgressStep('horizontal', 'done');
                
                document.getElementById('ai-status-text').textContent = '✅ Valmis!';
                document.getElementById('ai-status-detail').textContent = 'Mainokset luotu onnistuneesti';
                
                // Short delay to show completion, then show previews
                await new Promise(r => setTimeout(r, 500));
                
                // Show previews
                showAiPreviews();
                
            } catch (error) {
                alert('Virhe: ' + error.message);
            } finally {
                document.getElementById('ai-loading').style.display = 'none';
            }
        }
        
        function showAiPreviews() {
            const verticalFrame = document.getElementById('ai-preview-vertical');
            const horizontalFrame = document.getElementById('ai-preview-horizontal');
            
            // Write to iframes
            verticalFrame.contentDocument.open();
            verticalFrame.contentDocument.write(aiGeneratedVertical);
            verticalFrame.contentDocument.close();
            
            horizontalFrame.contentDocument.open();
            horizontalFrame.contentDocument.write(aiGeneratedHorizontal);
            horizontalFrame.contentDocument.close();
            
            document.getElementById('ai-preview-section').style.display = 'block';
            
            // Enable element selection after a brief delay for iframe to render
            setTimeout(() => {
                enableElementSelection(verticalFrame, 'vertical');
                enableElementSelection(horizontalFrame, 'horizontal');
            }, 500);
        }
        
        function enableElementSelection(iframe, orientation) {
            try {
                const doc = iframe.contentDocument;
                if (!doc) return;
                
                // Add hover and click styles
                const style = doc.createElement('style');
                style.textContent = `
                    .ai-element-hover { outline: 3px dashed #0ea5e9 !important; cursor: pointer !important; }
                    .ai-element-selected { outline: 3px solid #f59e0b !important; background-color: rgba(245, 158, 11, 0.1) !important; }
                `;
                doc.head.appendChild(style);
                
                // Add event listeners to all elements
                doc.body.querySelectorAll('*').forEach(el => {
                    el.addEventListener('mouseenter', function(e) {
                        e.stopPropagation();
                        this.classList.add('ai-element-hover');
                    });
                    el.addEventListener('mouseleave', function(e) {
                        this.classList.remove('ai-element-hover');
                    });
                    el.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        selectElement(this, orientation);
                    });
                });
            } catch (err) {
                console.log('Could not enable element selection:', err);
            }
        }
        
        function selectElement(el, orientation) {
            // Clear previous selection
            clearElementSelectionVisual();
            
            // Highlight selected element
            el.classList.add('ai-element-selected');
            
            // Get element info
            const tagName = el.tagName.toLowerCase();
            const classes = el.className.replace('ai-element-hover', '').replace('ai-element-selected', '').trim();
            const id = el.id;
            let textContent = el.innerText?.substring(0, 100) || '';
            if (textContent.length >= 100) textContent += '...';
            
            aiSelectedElement = {
                tag: tagName,
                classes: classes,
                id: id,
                text: textContent,
                orientation: orientation,
                outerHTML: el.outerHTML.substring(0, 500)
            };
            
            // Show element info
            const typeLabel = getElementTypeLabel(tagName);
            document.getElementById('ai-selected-element-type').textContent = typeLabel;
            document.getElementById('ai-selected-element-content').textContent = textContent || el.outerHTML.substring(0, 200);
            document.getElementById('ai-selected-element').style.display = 'block';
            
            // Pre-fill edit instructions with element context
            const editInput = document.getElementById('ai-edit-instructions');
            if (!editInput.value.trim()) {
                editInput.placeholder = `Esim: Muuta tämä ${typeLabel} isommaksi, vaihda väri, siirrä oikealle...`;
            }
        }
        
        function getElementTypeLabel(tag) {
            const labels = {
                'h1': 'Otsikko (H1)', 'h2': 'Otsikko (H2)', 'h3': 'Otsikko (H3)',
                'p': 'Teksti', 'span': 'Teksti', 'div': 'Lohko',
                'img': 'Kuva', 'button': 'Nappi', 'a': 'Linkki',
                'ul': 'Lista', 'li': 'Listan kohta'
            };
            return labels[tag] || tag.toUpperCase();
        }
        
        function clearElementSelection() {
            clearElementSelectionVisual();
            aiSelectedElement = null;
            document.getElementById('ai-selected-element').style.display = 'none';
        }
        
        function clearElementSelectionVisual() {
            // Clear from both iframes
            ['ai-preview-vertical', 'ai-preview-horizontal'].forEach(id => {
                try {
                    const doc = document.getElementById(id).contentDocument;
                    if (doc) {
                        doc.querySelectorAll('.ai-element-selected').forEach(el => {
                            el.classList.remove('ai-element-selected');
                        });
                    }
                } catch (e) {}
            });
        }
        
        async function editAiAd() {
            const instructions = document.getElementById('ai-edit-instructions').value.trim();
            
            if (!instructions) {
                alert('Kirjoita muokkausohjeet');
                return;
            }
            
            if (!aiGeneratedVertical || !aiGeneratedHorizontal) {
                alert('Generoi mainos ensin');
                return;
            }
            
            // Show loading with edit-specific messages
            document.getElementById('ai-loading').style.display = 'block';
            document.getElementById('ai-preview-section').style.display = 'none';
            resetProgress();
            document.getElementById('ai-status-text').textContent = '✏️ Muokataan mainosta...';
            document.getElementById('ai-status-detail').textContent = 'AI käsittelee muokkausohjeitasi';
            setProgressStep('upload', 'done'); // Skip upload step for edits
            
            try {
                // Edit vertical version
                setProgressStep('vertical', 'active');
                document.getElementById('ai-status-text').textContent = '📱 Muokataan pystyversiota...';
                updateLiveResponse('Käsitellään muokkausohjeita...', 'vertical');
                
                const verticalResponse = await fetch('ai-edit-stream.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_html: aiGeneratedVertical,
                        instructions: instructions,
                        selected_element: aiSelectedElement?.orientation === 'vertical' ? aiSelectedElement : null,
                        orientation: 'vertical',
                        image_urls: aiUploadedImageUrls
                    })
                });
                
                aiGeneratedVertical = await readStreamingResponse(verticalResponse, 'vertical');
                setProgressStep('vertical', 'done');
                
                // Edit horizontal version
                setProgressStep('horizontal', 'active');
                document.getElementById('ai-status-text').textContent = '🖥️ Muokataan vaakaversiota...';
                updateLiveResponse('Käsitellään muokkausohjeita...', 'horizontal');
                
                const horizontalResponse = await fetch('ai-edit-stream.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_html: aiGeneratedHorizontal,
                        instructions: instructions,
                        selected_element: aiSelectedElement?.orientation === 'horizontal' ? aiSelectedElement : null,
                        orientation: 'horizontal',
                        image_urls: aiUploadedImageUrls
                    })
                });
                
                aiGeneratedHorizontal = await readStreamingResponse(horizontalResponse, 'horizontal');
                setProgressStep('horizontal', 'done');
                
                document.getElementById('ai-status-text').textContent = '✅ Muokkaus valmis!';
                await new Promise(r => setTimeout(r, 500));
                
                // Clear edit instructions and selection
                document.getElementById('ai-edit-instructions').value = '';
                clearElementSelection();
                
                // Show updated previews
                showAiPreviews();
                
            } catch (error) {
                alert('Virhe muokkauksessa: ' + error.message);
                // Restore preview
                document.getElementById('ai-preview-section').style.display = 'block';
            } finally {
                document.getElementById('ai-loading').style.display = 'none';
            }
        }
        
        function regenerateAiAd() {
            generateAiAd();
        }
        
        async function approveAiAd() {
            if (!aiGeneratedVertical || !aiGeneratedHorizontal) {
                alert('Generoi mainos ensin');
                return;
            }
            
            try {
                // Save both versions
                const response = await fetch('ai-save.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vertical_html: aiGeneratedVertical,
                        horizontal_html: aiGeneratedHorizontal,
                        title: document.getElementById('ai-purpose').value.trim()
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                
                alert('Mainokset lisätty jonoon! Lataa sivu uudelleen nähdäksesi ne.');
                window.location.reload();
                
            } catch (error) {
                alert('Virhe tallennuksessa: ' + error.message);
            }
        }
        
        function selectTheme(theme) {
            document.getElementById('theme-input').value = theme;
            document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
            document.querySelector('.theme-option.' + theme + '-theme').classList.add('selected');
        }
        
        // Edit Modal Functions
        function openEditModal(slideId) {
            fetch('?get_slide=' + slideId)
                .then(response => response.json())
                .then(slide => {
                    if (slide.error) {
                        alert('Virhe ladattaessa slidea');
                        return;
                    }
                    
                    // Populate form fields
                    document.getElementById('edit_slide_id').value = slide.id;
                    document.getElementById('edit_slide_type').value = slide.type || 'image';
                    document.getElementById('edit_slide_title').value = slide.title || '';
                    document.getElementById('edit_slide_description').value = slide.description || '';
                    document.getElementById('edit_slide_old_price').value = slide.old_price || '';
                    document.getElementById('edit_slide_price').value = slide.price || '';
                    document.getElementById('edit_slide_discount').value = slide.discount || '';
                    document.getElementById('edit_slide_orientation').value = slide.orientation || 'both';
                    document.getElementById('edit_schedule_start').value = slide.schedule_start || '';
                    document.getElementById('edit_schedule_end').value = slide.schedule_end || '';
                    document.getElementById('edit_slide_image_url').value = slide.image && slide.image.indexOf('uploads/') !== 0 ? slide.image : '';
                    
                    // Show current image if exists
                    const imageContainer = document.getElementById('current-image-container');
                    const imagePreview = document.getElementById('current-image-preview');
                    if (slide.image) {
                        imagePreview.src = slide.image;
                        imageContainer.style.display = 'flex';
                    } else {
                        imageContainer.style.display = 'none';
                    }
                    
                    // Toggle appropriate fields
                    toggleEditFields();
                    
                    // Show modal
                    document.getElementById('edit-modal').classList.add('active');
                })
                .catch(err => {
                    console.error('Error:', err);
                    alert('Virhe ladattaessa slidea');
                });
        }
        
        function closeEditModal() {
            document.getElementById('edit-modal').classList.remove('active');
        }
        
        function toggleEditFields() {
            const type = document.getElementById('edit_slide_type').value;
            const imageFields = document.getElementById('edit-image-fields');
            const textFields = document.getElementById('edit-text-fields');
            const priceFields = document.getElementById('edit-price-fields');
            
            // Image type: show image fields, hide text/price
            // Offer type: show all fields
            // Promo type: show text fields, hide price
            
            if (type === 'image') {
                imageFields.style.display = 'block';
                textFields.style.display = 'none';
                priceFields.style.display = 'none';
            } else if (type === 'offer') {
                imageFields.style.display = 'block';
                textFields.style.display = 'block';
                priceFields.style.display = 'block';
            } else if (type === 'promo') {
                imageFields.style.display = 'none';
                textFields.style.display = 'block';
                priceFields.style.display = 'none';
            }
        }
        
        // Close modal on overlay click
        document.getElementById('edit-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeEditModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeEditModal();
            }
        });
        
        function toggleSchedulePanel() {
            const checkbox = document.getElementById('theme_schedule_enabled');
            const panel = document.getElementById('schedule-panel');
            if (checkbox.checked) {
                panel.classList.remove('disabled');
            } else {
                panel.classList.add('disabled');
            }
        }
        
        function toggleColorPanel() {
            const panel = document.getElementById('color-customization-panel');
            const toggle = document.getElementById('color-panel-toggle');
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                toggle.textContent = '▲ Sulje';
            } else {
                panel.style.display = 'none';
                toggle.textContent = '▼ Avaa';
            }
        }
        
        // Drag and drop reordering
        const list = document.getElementById('slide-list');
        if (list) {
            let dragging = null;
            
            list.querySelectorAll('.slide-item').forEach(item => {
                item.draggable = true;
                
                item.addEventListener('dragstart', function() {
                    dragging = this;
                    this.style.opacity = '0.5';
                });
                
                item.addEventListener('dragend', function() {
                    this.style.opacity = '1';
                    dragging = null;
                    
                    // Save new order
                    const order = [...list.querySelectorAll('.slide-item')].map(i => i.dataset.id);
                    const formData = new FormData();
                    formData.append('action', 'reorder');
                    formData.append('order', JSON.stringify(order));
                    fetch('', { method: 'POST', body: formData });
                });
                
                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    const rect = this.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        this.parentNode.insertBefore(dragging, this);
                    } else {
                        this.parentNode.insertBefore(dragging, this.nextSibling);
                    }
                });
            });
        }
    </script>
</body>
</html>
