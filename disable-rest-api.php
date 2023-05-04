DISABLE REST
// Disable Root & WP Users routes for REST API
add_filter( 'rest_authentication_errors', 'wp_snippet_disable_rest_api' );
function wp_snippet_disable_rest_api( $access ) {
    $route = $_SERVER['REQUEST_URI'];
    if(preg_match('/^\/wp-json\/[^\/]*$/', $route) || preg_match('/^\/wp-json\/wp\/v2\/users\/?$/', $route) ) {
        return new WP_Error( 'rest_disabled', __('The WordPress REST API has been disabled.'), array( 'status' => rest_authorization_required_code()));
    }
}
