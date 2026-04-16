const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de rutas
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, '.dist');
const VITE_BUILD_DIR = path.join(ROOT_DIR, 'dist');

console.log('🚀 Iniciando construcción para WordPress...');

// 1. Ejecutar el build de Vite (compilación de React)
try {
    console.log('📦 Compilando aplicación React (npm run build)...');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error al compilar el proyecto. Verifica que no haya errores de TypeScript.');
    process.exit(1);
}

// 2. Preparar carpeta .dist (limpiar si existe)
console.log(`📂 Preparando carpeta de destino: ${DIST_DIR}`);
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);

// 3. Copiar los assets generados (JS y CSS)
const assetsSrc = path.join(VITE_BUILD_DIR, 'assets');
const assetsDest = path.join(DIST_DIR, 'assets');

if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, assetsDest, { recursive: true });
} else {
    console.warn('⚠️ No se encontró carpeta assets estándar, copiando todo el contenido de dist.');
    fs.cpSync(VITE_BUILD_DIR, DIST_DIR, { recursive: true });
}

// 4. Identificar los archivos con hash (ej: index.a1b2c3.js)
const files = fs.readdirSync(assetsDest);
const jsFile = files.find(f => f.endsWith('.js'));
const cssFile = files.find(f => f.endsWith('.css'));

if (!jsFile) {
    console.error('❌ No se encontró el archivo JS principal.');
    process.exit(1);
}

// 5. Generar el archivo PHP del Plugin para WordPress
console.log('📝 Generando guiasai-business.php...');

const phpContent = `<?php
/**
 * Plugin Name: GuiaSAI Business App
 * Description: Panel de Gestión para Agencias y Super Admin (React App)
 * Version: 1.0.0
 * Author: GuiaSAI Team
 */

function guiasai_business_enqueue() {
    $plugin_url = plugin_dir_url(__FILE__);
    
    // Cargar JS principal
    wp_enqueue_script(
        'guiasai-business-js',
        $plugin_url . 'assets/${jsFile}',
        array(),
        '1.0.0',
        true
    );

    // Cargar CSS si existe
    ${cssFile ? `wp_enqueue_style(
        'guiasai-business-css',
        $plugin_url . 'assets/${cssFile}',
        array(),
        '1.0.0'
    );` : ''}
}
add_action('wp_enqueue_scripts', 'guiasai_business_enqueue');

// Shortcode para insertar la app: [guiasai_business_panel]
function guiasai_business_shortcode() {
    return '<div id="root" class="guiasai-business-container"></div>';
}
add_shortcode('guiasai_business_panel', 'guiasai_business_shortcode');
`;

fs.writeFileSync(path.join(DIST_DIR, 'guiasai-business.php'), phpContent);

// 6. Crear archivo de instrucciones
const readmeContent = `
INSTALACIÓN EN WORDPRESS
========================

1. Sube el contenido de esta carpeta (.dist) a tu servidor WordPress en:
   /wp-content/plugins/guiasai-business/

2. Ve al panel de administración de WordPress -> Plugins y activa "GuiaSAI Business App".

3. Crea una nueva página en WordPress y pega el siguiente shortcode donde quieras que aparezca la app:
   [guiasai_business_panel]

4. ¡Listo!
`;
fs.writeFileSync(path.join(DIST_DIR, 'LEEME.txt'), readmeContent);

console.log(`
✅ ¡ÉXITO! Archivos generados en: ${DIST_DIR}

Siguientes pasos:
1. Ve a la carpeta apps/GuiaSAI_Business/.dist
2. Sube esos archivos a tu WordPress (vía FTP o creando un ZIP)
3. Usa el shortcode [guiasai_business_panel]
`);