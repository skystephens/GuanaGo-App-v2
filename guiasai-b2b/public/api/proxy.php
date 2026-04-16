<?php
/**
 * GuiaSAI Airtable Proxy
 *
 * Protege el API key de Airtable: el token nunca llega al browser.
 * El cliente llama a este archivo; este archivo llama a api.airtable.com
 * y agrega el header Authorization en el servidor.
 *
 * Ubicación en producción (WordPress): /agencias/api/proxy.php
 * URL del cliente: /agencias/api/proxy.php?path=/v0/BASE_ID/TABLE
 */

// ──────────────────────────────────────────────
// CONFIGURACIÓN (solo en el servidor)
// ──────────────────────────────────────────────
// NOTA: este proxy.php es solo para WordPress (guiasanandresislas.com).
// En Render.com el proxy lo maneja server.js (/agencias/api/proxy.php route).
// Configura la variable en el servidor WordPress, NO la incluyas en el repo.
define('AIRTABLE_API_KEY', getenv('AIRTABLE_API_KEY') ?: '');

// ──────────────────────────────────────────────
// CORS: permite solo el mismo origen
// ──────────────────────────────────────────────
$origin = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ──────────────────────────────────────────────
// VALIDAR PARÁMETRO ?path=
// ──────────────────────────────────────────────
$path = $_GET['path'] ?? '';

if (!$path) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameter: path']);
    exit();
}

// Solo aceptar rutas que empiecen con /v0/ (previene abuso del proxy)
if (!preg_match('#^/v0/#', $path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path — must start with /v0/']);
    exit();
}

// ──────────────────────────────────────────────
// CONSTRUIR URL DE AIRTABLE
// ──────────────────────────────────────────────
// Reenviar todos los query params excepto 'path'
$extraParams = array_diff_key($_GET, ['path' => '']);
$queryString = !empty($extraParams) ? '?' . http_build_query($extraParams) : '';
$targetUrl   = 'https://api.airtable.com' . $path . $queryString;

// ──────────────────────────────────────────────
// PROXY: reenviar la petición a Airtable
// ──────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$body   = file_get_contents('php://input');

$curlHeaders = [
    'Authorization: Bearer ' . AIRTABLE_API_KEY,
    'Content-Type: application/json',
];

$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $curlHeaders,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_TIMEOUT        => 15,
]);

if (in_array($method, ['POST', 'PATCH']) && $body) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
    exit();
}

http_response_code($httpCode);
echo $response;
