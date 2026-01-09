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
    'offer_duration' => 6
];

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Update settings
    if (isset($_POST['action']) && $_POST['action'] === 'update_settings') {
        $config['mode'] = $_POST['mode'];
        $config['rotation_interval'] = (int)$_POST['rotation_interval'];
        $config['show_offers'] = isset($_POST['show_offers']);
        $config['offer_duration'] = (int)$_POST['offer_duration'];
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
        foreach ($config['slides'] as &$slide) {
            if ($slide['id'] === $slide_id) {
                $slide['enabled'] = !$slide['enabled'];
                break;
            }
        }
        file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
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
                        
                        <button type="submit" class="btn btn-primary">Tallenna asetukset</button>
                    </form>
                    
                    <a href="../babylon-ad.html" target="_blank" class="preview-link">📺 Avaa TV-näyttö</a>
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
                    </div>
                    
                    <form method="POST" enctype="multipart/form-data">
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
                        
                        <!-- Schedule (all types) -->
                        <div class="form-row" style="margin-top: 20px;">
                            <div class="form-group">
                                <label>Näytä alkaen (valinnainen)</label>
                                <input type="datetime-local" name="schedule_start">
                            </div>
                            <div class="form-group">
                                <label>Näytä asti (valinnainen)</label>
                                <input type="datetime-local" name="schedule_end">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Lisää slide</button>
                    </form>
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
                                        <?php if (!empty($slide['schedule_start']) || !empty($slide['schedule_end'])): ?>
                                            <br>📅 <?php echo $slide['schedule_start'] ?? ''; ?> - <?php echo $slide['schedule_end'] ?? ''; ?>
                                        <?php endif; ?>
                                    </p>
                                </div>
                                <div class="actions">
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
    
    <script>
        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');
            document.getElementById('slide_type').value = tab;
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
