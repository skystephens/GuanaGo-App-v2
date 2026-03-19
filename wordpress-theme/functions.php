<?php
/**
 * GuiaSAI B2B - Funciones del Tema WordPress
 * Integración del sistema de cotización para agencias
 */

// Definir constantes
define('GUIASAI_API_URL', 'http://localhost:3000/api'); // Cambiar en producción
define('GUIASAI_VERSION', '1.0.0');

/**
 * Registrar scripts y estilos
 */
function guiasai_enqueue_scripts() {
    // Solo cargar en la página de cotización
    if (is_page('cotizacion-agencias') || has_shortcode(get_post()->post_content, 'guiasai_cotizador')) {
        
        // React y ReactDOM desde CDN
        wp_enqueue_script(
            'react',
            'https://unpkg.com/react@18/umd/react.production.min.js',
            array(),
            '18.2.0',
            true
        );
        
        wp_enqueue_script(
            'react-dom',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            array('react'),
            '18.2.0',
            true
        );
        
        // Aplicación GuiasAI B2B compilada
        wp_enqueue_script(
            'guiasai-b2b-app',
            get_template_directory_uri() . '/guiasai-agencias/assets/index.js',
            array('react', 'react-dom'),
            GUIASAI_VERSION,
            true
        );
        
        // Estilos
        wp_enqueue_style(
            'guiasai-b2b-styles',
            get_template_directory_uri() . '/guiasai-agencias/assets/index.css',
            array(),
            GUIASAI_VERSION
        );
        
        // Pasar datos de configuración a JavaScript
        wp_localize_script('guiasai-b2b-app', 'guiasaiConfig', array(
            'apiUrl' => GUIASAI_API_URL,
            'nonce' => wp_create_nonce('guiasai_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php')
        ));
    }
}
add_action('wp_enqueue_scripts', 'guiasai_enqueue_scripts');

/**
 * Shortcode para el cotizador
 * Uso: [guiasai_cotizador]
 */
function guiasai_cotizador_shortcode($atts) {
    $atts = shortcode_atts(array(
        'view' => 'full', // full, simple, embed
    ), $atts);
    
    ob_start();
    ?>
    <div id="guiasai-b2b-root" class="guiasai-cotizador-container" data-view="<?php echo esc_attr($atts['view']); ?>">
        <div class="loading-spinner">Cargando cotizador...</div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('guiasai_cotizador', 'guiasai_cotizador_shortcode');

/**
 * Agregar página de administración en WordPress
 */
function guiasai_add_admin_menu() {
    add_menu_page(
        'GuiaSAI Cotizaciones',           // Título de la página
        'GuiaSAI B2B',                    // Título del menú
        'manage_options',                 // Capacidad requerida
        'guiasai-cotizaciones',           // Slug del menú
        'guiasai_admin_page',             // Función de callback
        'dashicons-tickets-alt',          // Icono
        30                                // Posición
    );
    
    // Submenú para gestión
    add_submenu_page(
        'guiasai-cotizaciones',
        'Gestionar Cotizaciones',
        'Todas las Cotizaciones',
        'manage_options',
        'guiasai-cotizaciones',
        'guiasai_admin_page'
    );
    
    add_submenu_page(
        'guiasai-cotizaciones',
        'Configuración',
        'Configuración',
        'manage_options',
        'guiasai-configuracion',
        'guiasai_settings_page'
    );
}
add_action('admin_menu', 'guiasai_add_admin_menu');

/**
 * Página de administración principal
 */
function guiasai_admin_page() {
    ?>
    <div class="wrap">
        <h1>Gestión de Cotizaciones GuiaSAI</h1>
        
        <div class="guiasai-admin-container">
            <div id="guiasai-admin-root">
                <p>Cargando panel de administración...</p>
            </div>
        </div>
        
        <script>
        // Cargar cotizaciones vía API
        jQuery(document).ready(function($) {
            loadQuotations();
            
            function loadQuotations() {
                $.ajax({
                    url: '<?php echo GUIASAI_API_URL; ?>/quotations',
                    method: 'GET',
                    success: function(response) {
                        if (response.success) {
                            renderQuotations(response.data);
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error loading quotations:', error);
                        $('#guiasai-admin-root').html('<div class="error"><p>Error al cargar cotizaciones. Verifica que el backend esté corriendo.</p></div>');
                    }
                });
            }
            
            function renderQuotations(quotations) {
                let html = '<table class="wp-list-table widefat fixed striped">';
                html += '<thead><tr>';
                html += '<th>ID</th>';
                html += '<th>Agencia</th>';
                html += '<th>Fecha</th>';
                html += '<th>Total</th>';
                html += '<th>Estado</th>';
                html += '<th>Acciones</th>';
                html += '</tr></thead><tbody>';
                
                quotations.forEach(function(q) {
                    const statusClass = q.status === 'confirmed' ? 'success' : (q.status === 'cancelled' ? 'error' : 'warning');
                    const statusText = q.status === 'confirmed' ? 'Confirmada' : (q.status === 'cancelled' ? 'Cancelada' : 'Pendiente');
                    
                    html += '<tr>';
                    html += '<td><strong>' + q.id + '</strong></td>';
                    html += '<td>' + q.agencyName + '<br><small>' + q.agencyEmail + '</small></td>';
                    html += '<td>' + new Date(q.createdAt).toLocaleDateString('es-CO') + '</td>';
                    html += '<td>$' + q.total.toLocaleString('es-CO') + ' COP</td>';
                    html += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
                    html += '<td>';
                    html += '<button class="button view-quotation" data-id="' + q.id + '">Ver Detalle</button> ';
                    if (q.status === 'pending') {
                        html += '<button class="button button-primary confirm-quotation" data-id="' + q.id + '">Confirmar</button> ';
                        html += '<button class="button cancel-quotation" data-id="' + q.id + '">Cancelar</button>';
                    }
                    html += '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                
                if (quotations.length === 0) {
                    html = '<div class="notice notice-info"><p>No hay cotizaciones pendientes.</p></div>';
                }
                
                $('#guiasai-admin-root').html(html);
                
                // Agregar eventos
                $('.confirm-quotation').on('click', function() {
                    confirmQuotation($(this).data('id'));
                });
                
                $('.cancel-quotation').on('click', function() {
                    cancelQuotation($(this).data('id'));
                });
                
                $('.view-quotation').on('click', function() {
                    viewQuotation($(this).data('id'));
                });
            }
            
            function confirmQuotation(id) {
                if (!confirm('¿Confirmar esta cotización?')) return;
                
                $.ajax({
                    url: '<?php echo GUIASAI_API_URL; ?>/quotations/' + id + '/status',
                    method: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: 'confirmed' }),
                    success: function(response) {
                        alert('Cotización confirmada exitosamente');
                        loadQuotations();
                    },
                    error: function() {
                        alert('Error al confirmar cotización');
                    }
                });
            }
            
            function cancelQuotation(id) {
                const reason = prompt('Motivo de cancelación (opcional):');
                if (reason === null) return;
                
                $.ajax({
                    url: '<?php echo GUIASAI_API_URL; ?>/quotations/' + id + '/status',
                    method: 'PATCH',
                    contentType: 'application/json',
                    data: JSON.stringify({ status: 'cancelled', reason: reason }),
                    success: function(response) {
                        alert('Cotización cancelada');
                        loadQuotations();
                    },
                    error: function() {
                        alert('Error al cancelar cotización');
                    }
                });
            }
            
            function viewQuotation(id) {
                window.location.href = '?page=guiasai-cotizaciones&action=view&id=' + id;
            }
        });
        </script>
        
        <style>
        .guiasai-admin-container {
            margin-top: 20px;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        .status-badge.error {
            background: #f8d7da;
            color: #721c24;
        }
        </style>
    </div>
    <?php
}

/**
 * Página de configuración
 */
function guiasai_settings_page() {
    ?>
    <div class="wrap">
        <h1>Configuración GuiaSAI B2B</h1>
        
        <form method="post" action="options.php">
            <?php
            settings_fields('guiasai_settings');
            do_settings_sections('guiasai-configuracion');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

/**
 * Registrar configuraciones
 */
function guiasai_register_settings() {
    register_setting('guiasai_settings', 'guiasai_api_url');
    register_setting('guiasai_settings', 'guiasai_airtable_key');
    register_setting('guiasai_settings', 'guiasai_make_webhook');
    
    add_settings_section(
        'guiasai_api_section',
        'Configuración de API',
        null,
        'guiasai-configuracion'
    );
    
    add_settings_field(
        'guiasai_api_url',
        'URL de API Backend',
        'guiasai_api_url_callback',
        'guiasai-configuracion',
        'guiasai_api_section'
    );
}
add_action('admin_init', 'guiasai_register_settings');

function guiasai_api_url_callback() {
    $value = get_option('guiasai_api_url', GUIASAI_API_URL);
    echo '<input type="text" name="guiasai_api_url" value="' . esc_attr($value) . '" class="regular-text" />';
    echo '<p class="description">URL del backend API (ej: https://api.guiasai.com/api)</p>';
}

/**
 * AJAX endpoint para proxy de API
 */
function guiasai_ajax_proxy() {
    check_ajax_referer('guiasai_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('No autorizado');
    }
    
    $endpoint = $_POST['endpoint'];
    $method = $_POST['method'] ?? 'GET';
    $data = $_POST['data'] ?? null;
    
    $response = wp_remote_request(GUIASAI_API_URL . '/' . $endpoint, array(
        'method' => $method,
        'body' => $data ? json_encode($data) : null,
        'headers' => array(
            'Content-Type' => 'application/json'
        )
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error($response->get_error_message());
    }
    
    $body = wp_remote_retrieve_body($response);
    wp_send_json(json_decode($body, true));
}
add_action('wp_ajax_guiasai_proxy', 'guiasai_ajax_proxy');
