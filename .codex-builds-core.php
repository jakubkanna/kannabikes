<?php

if (!defined('ABSPATH')) {
    exit;
}

const KANNA_BUILD_STAGES = array(
    'waiting_for_deposit',
    'in_review',
    'confirmed',
    'waiting_for_measurements',
    'waiting_for_specification',
    'waiting_for_design',
    'waiting_for_design_approval',
    'waiting_for_final_payment',
    'final_payment_in_review',
    'in_production',
    'waiting_for_delivery',
    'delivered',
);

/**
 * Returns the builds table name.
 *
 * @return string
 */
function kanna_build_table_name()
{
    global $wpdb;

    return $wpdb->prefix . KANNA_BUILD_TABLE_SUFFIX;
}

/**
 * Returns the build events table name.
 *
 * @return string
 */
function kanna_build_event_table_name()
{
    global $wpdb;

    return $wpdb->prefix . KANNA_BUILD_EVENT_TABLE_SUFFIX;
}

/**
 * Returns the portal token table name.
 *
 * @return string
 */
function kanna_portal_token_table_name()
{
    global $wpdb;

    return $wpdb->prefix . KANNA_PORTAL_TOKEN_TABLE_SUFFIX;
}

/**
 * Creates or updates build-related tables.
 *
 * @return void
 */
function kanna_build_install()
{
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $builds_table = kanna_build_table_name();
    $events_table = kanna_build_event_table_name();
    $tokens_table = kanna_portal_token_table_name();

    dbDelta("CREATE TABLE {$builds_table} (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        contact_request_id BIGINT(20) UNSIGNED NULL,
        wp_user_id BIGINT(20) UNSIGNED NULL,
        public_order_number VARCHAR(64) NOT NULL,
        order_title VARCHAR(191) NOT NULL,
        customer_full_name VARCHAR(191) NOT NULL,
        customer_email VARCHAR(191) NOT NULL,
        customer_phone VARCHAR(191) NOT NULL,
        stage VARCHAR(32) NOT NULL DEFAULT 'waiting_for_deposit',
        currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
        deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 590.00,
        final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        deposit_order_id BIGINT(20) UNSIGNED NULL,
        final_order_id BIGINT(20) UNSIGNED NULL,
        portal_password_hash TEXT NULL,
        portal_claimed_at DATETIME NULL,
        deposit_verified_at DATETIME NULL,
        final_payment_verified_at DATETIME NULL,
        design_approved_at DATETIME NULL,
        design_approved_device_type VARCHAR(32) NULL,
        design_approved_user_agent TEXT NULL,
        body_type VARCHAR(16) NULL,
        body_weight VARCHAR(64) NULL,
        measurement_data LONGTEXT NULL,
        specification_mode VARCHAR(32) NULL,
        specification_data LONGTEXT NULL,
        design_data LONGTEXT NULL,
        shipping_data LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        UNIQUE KEY public_order_number (public_order_number),
        KEY contact_request_id (contact_request_id),
        KEY wp_user_id (wp_user_id),
        KEY stage (stage)
    ) {$charset_collate};");

    dbDelta("CREATE TABLE {$events_table} (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        build_id BIGINT(20) UNSIGNED NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        event_data LONGTEXT NULL,
        created_by BIGINT(20) UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY build_id (build_id),
        KEY event_type (event_type),
        KEY created_at (created_at)
    ) {$charset_collate};");

    dbDelta("CREATE TABLE {$tokens_table} (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        build_id BIGINT(20) UNSIGNED NOT NULL,
        wp_user_id BIGINT(20) UNSIGNED NULL,
        token_type VARCHAR(16) NOT NULL,
        token_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        revoked_at DATETIME NULL,
        last_used_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY build_id (build_id),
        KEY token_type (token_type),
        KEY expires_at (expires_at),
        UNIQUE KEY token_hash (token_hash)
    ) {$charset_collate};");
}

/**
 * Ensures the latest build schema is present for active installs.
 *
 * @return void
 */
function kanna_build_maybe_migrate_schema()
{
    $installed_version = (string) get_option('kanna_build_schema_version', '');

    if ($installed_version === '2026-03-23-design-approval-device') {
        return;
    }

    kanna_build_install();
    update_option('kanna_build_schema_version', '2026-03-23-design-approval-device', false);
}

add_action('plugins_loaded', 'kanna_build_maybe_migrate_schema');

/**
 * Returns the current GMT datetime.
 *
 * @return string
 */
function kanna_build_now()
{
    return gmdate('Y-m-d H:i:s');
}

/**
 * Returns a normalized device type for a request user agent.
 *
 * @param string $user_agent Raw request user agent.
 *
 * @return string
 */
function kanna_build_detect_device_type($user_agent)
{
    $user_agent = strtolower(trim((string) $user_agent));

    if ($user_agent === '') {
        return 'unknown';
    }

    if (
        strpos($user_agent, 'bot') !== false ||
        strpos($user_agent, 'spider') !== false ||
        strpos($user_agent, 'crawl') !== false
    ) {
        return 'bot';
    }

    if (
        strpos($user_agent, 'ipad') !== false ||
        strpos($user_agent, 'tablet') !== false ||
        strpos($user_agent, 'sm-t') !== false ||
        (strpos($user_agent, 'android') !== false && strpos($user_agent, 'mobile') === false)
    ) {
        return 'tablet';
    }

    if (
        strpos($user_agent, 'iphone') !== false ||
        strpos($user_agent, 'mobi') !== false ||
        strpos($user_agent, 'android') !== false ||
        strpos($user_agent, 'phone') !== false
    ) {
        return 'mobile';
    }

    return 'desktop';
}

/**
 * Returns the frontend base URL for portal links.
 *
 * @return string
 */
function kanna_build_frontend_base_url()
{
    $base_url = getenv('KANNA_FRONTEND_BASE_URL') ? (string) getenv('KANNA_FRONTEND_BASE_URL') : 'http://localhost:5173';

    return rtrim($base_url, '/');
}

/**
 * Returns the configured Stripe secret key.
 *
 * @return string
 */
function kanna_build_stripe_secret_key()
{
    return getenv('KANNA_STRIPE_SECRET_KEY') ? trim((string) getenv('KANNA_STRIPE_SECRET_KEY')) : '';
}

/**
 * Returns the configured Stripe webhook signing secret.
 *
 * @return string
 */
function kanna_build_stripe_webhook_secret()
{
    return getenv('KANNA_STRIPE_WEBHOOK_SECRET') ? trim((string) getenv('KANNA_STRIPE_WEBHOOK_SECRET')) : '';
}

/**
 * Returns the allowed wheel size options.
 *
 * @return array<int, string>
 */
function kanna_build_wheel_size_options()
{
    return array('32"', '29"', '27.5"', '26"', '700c');
}

/**
 * Returns whether the given design field is a constrained wheel size field.
 *
 * @param string $field_key Design field key.
 *
 * @return bool
 */
function kanna_build_is_wheel_size_field($field_key)
{
    return in_array($field_key, array('Front wheel:Size', 'Back wheel:Size'), true);
}

/**
 * Returns stage labels for admin/UI usage.
 *
 * @param string $stage Build stage.
 *
 * @return string
 */
function kanna_build_stage_label($stage)
{
    $labels = array(
        'waiting_for_deposit' => 'Waiting for deposit',
        'in_review' => 'In review',
        'confirmed' => 'Confirmed',
        'waiting_for_measurements' => 'Waiting for measurements',
        'waiting_for_specification' => 'Waiting for specification',
        'waiting_for_design' => 'Waiting for design',
        'waiting_for_design_approval' => 'Waiting for design approval',
        'waiting_for_final_payment' => 'Waiting for final payment',
        'final_payment_in_review' => 'Final payment in review',
        'in_production' => 'In production',
        'waiting_for_delivery' => 'Ready',
        'delivered' => 'Completed',
    );

    return isset($labels[$stage]) ? $labels[$stage] : ucfirst(str_replace('_', ' ', $stage));
}

/**
 * Returns the simplified display status for the frontend badge.
 *
 * @param string $stage Build stage.
 *
 * @return string
 */
function kanna_build_normalize_order_status_for_display($status)
{
    $status = sanitize_key((string) $status);

    if ($status === 'pending' || $status === 'checkout-draft') {
        return 'pending_payment';
    }

    if ($status === 'on-hold') {
        return 'on_hold';
    }

    if ($status === 'processing') {
        return 'processing';
    }

    if ($status === 'completed') {
        return 'completed';
    }

    return '';
}

/**
 * Returns the simplified display status for the frontend badge.
 *
 * @param string               $stage       Build stage.
 * @param WC_Order|false|null  $deposit_order Deposit payment order.
 * @param WC_Order|false|null  $final_order Final payment order.
 *
 * @return string
 */
function kanna_build_display_status($stage, $deposit_order = false, $final_order = false)
{
    if ($stage === 'delivered') {
        return 'completed';
    }

    $uses_final_order = in_array(
        $stage,
        array('waiting_for_final_payment', 'final_payment_in_review', 'in_production', 'waiting_for_delivery'),
        true
    );
    $relevant_order = $uses_final_order && $final_order ? $final_order : $deposit_order;

    if ($relevant_order && method_exists($relevant_order, 'get_status')) {
        $normalized_status = kanna_build_normalize_order_status_for_display((string) $relevant_order->get_status());

        if ($normalized_status !== '') {
            return $normalized_status;
        }
    }

    if ($stage === 'waiting_for_deposit' || $stage === 'waiting_for_final_payment') {
        return 'pending_payment';
    }

    if (
        $stage === 'in_review' ||
        $stage === 'waiting_for_measurements' ||
        $stage === 'waiting_for_specification' ||
        $stage === 'waiting_for_design_approval' ||
        $stage === 'final_payment_in_review'
    ) {
        return 'on_hold';
    }

    if (
        $stage === 'confirmed' ||
        $stage === 'waiting_for_design' ||
        $stage === 'in_production' ||
        $stage === 'waiting_for_delivery'
    ) {
        return 'processing';
    }

    return 'completed';
}

/**
 * Decodes JSON stored in a build record.
 *
 * @param string|null $value JSON string.
 *
 * @return array<string, mixed>
 */
function kanna_build_decode_json($value)
{
    if (!is_string($value) || $value === '') {
        return array();
    }

    $decoded = json_decode($value, true);

    return is_array($decoded) ? $decoded : array();
}

/**
 * Encodes data as JSON for storage.
 *
 * @param array<string, mixed> $value Data to encode.
 *
 * @return string
 */
function kanna_build_encode_json($value)
{
    return wp_json_encode($value);
}

/**
 * Returns a build row by ID.
 *
 * @param int $build_id Build ID.
 *
 * @return object|null
 */
function kanna_build_get_by_id($build_id)
{
    global $wpdb;

    $build = $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_build_table_name() . ' WHERE id = %d LIMIT 1',
            (int) $build_id
        )
    );

    return kanna_build_sync_runtime_stage($build);
}

/**
 * Returns a build row by public order number.
 *
 * @param string $public_order_number Public build number.
 *
 * @return object|null
 */
function kanna_build_get_by_public_order_number($public_order_number)
{
    global $wpdb;

    $build = $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_build_table_name() . ' WHERE public_order_number = %s LIMIT 1',
            sanitize_text_field($public_order_number)
        )
    );

    return kanna_build_sync_runtime_stage($build);
}

/**
 * Returns a build row for a contact request.
 *
 * @param int $contact_request_id Contact request ID.
 *
 * @return object|null
 */
function kanna_build_get_by_contact_request_id($contact_request_id)
{
    global $wpdb;

    $build = $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_build_table_name() . ' WHERE contact_request_id = %d LIMIT 1',
            (int) $contact_request_id
        )
    );

    return kanna_build_sync_runtime_stage($build);
}

/**
 * Returns all builds for the admin list.
 *
 * @param int $limit Result limit.
 *
 * @return array<int, object>
 */
function kanna_build_get_builds($limit = 100)
{
    global $wpdb;

    $builds = $wpdb->get_results(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_build_table_name() . ' ORDER BY created_at DESC, id DESC LIMIT %d',
            max(1, min(500, (int) $limit))
        )
    );

    return array_map('kanna_build_sync_runtime_stage', is_array($builds) ? $builds : array());
}

/**
 * Repairs stale runtime stage values from Woo payment orders when possible.
 *
 * @param object|null $build Build row.
 *
 * @return object|null
 */
function kanna_build_sync_runtime_stage($build)
{
    if (
        !is_object($build) ||
        !kanna_build_has_woocommerce() ||
        !function_exists('wc_get_order')
    ) {
        return $build;
    }

    $next_values = array();
    $current_stage = isset($build->stage) ? (string) $build->stage : '';

    if (
        in_array($current_stage, array('waiting_for_deposit', 'in_review', 'confirmed', 'waiting_for_measurements'), true) &&
        !empty($build->deposit_order_id)
    ) {
        $deposit_order = wc_get_order((int) $build->deposit_order_id);

        if ($deposit_order && method_exists($deposit_order, 'get_status')) {
            $deposit_status = (string) $deposit_order->get_status();

            if (
                $deposit_status === 'on-hold' &&
                $current_stage === 'waiting_for_deposit'
            ) {
                $next_values['stage'] = 'in_review';
            }

            if (in_array($deposit_status, array('processing', 'completed'), true)) {
                $next_values['stage'] = 'confirmed';

                if (empty($build->deposit_verified_at)) {
                    $next_values['deposit_verified_at'] = kanna_build_now();
                }
            }
        }
    }

    if (
        in_array($current_stage, array('waiting_for_final_payment', 'final_payment_in_review', 'in_production', 'waiting_for_delivery'), true) &&
        !empty($build->final_order_id)
    ) {
        $final_order = wc_get_order((int) $build->final_order_id);

        if ($final_order && method_exists($final_order, 'get_status')) {
            $final_status = (string) $final_order->get_status();

            if (
                $final_status === 'on-hold' &&
                $current_stage === 'waiting_for_final_payment'
            ) {
                $next_values['stage'] = 'final_payment_in_review';
            }

            if (
                $final_status === 'processing' &&
                $current_stage !== 'waiting_for_delivery'
            ) {
                $next_values['stage'] = 'in_production';
            }

            if ($final_status === 'completed') {
                $next_values['stage'] = 'delivered';
            }

            if (in_array($final_status, array('processing', 'completed'), true)) {
                if (empty($build->final_payment_verified_at)) {
                    $next_values['final_payment_verified_at'] = kanna_build_now();
                }
            }
        }
    }

    if (empty($next_values)) {
        return $build;
    }

    kanna_build_update((int) $build->id, $next_values);

    foreach ($next_values as $key => $value) {
        $build->{$key} = $value;
    }

    return $build;
}

/**
 * Returns events for a build.
 *
 * @param int $build_id Build ID.
 *
 * @return array<int, object>
 */
function kanna_build_get_events($build_id)
{
    global $wpdb;

    return $wpdb->get_results(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_build_event_table_name() . ' WHERE build_id = %d ORDER BY created_at DESC, id DESC',
            (int) $build_id
        )
    );
}

/**
 * Adds a build event.
 *
 * @param int                  $build_id    Build ID.
 * @param string               $event_type  Event type.
 * @param array<string, mixed> $event_data  Event payload.
 * @param int|null             $created_by  Creating user ID.
 *
 * @return void
 */
function kanna_build_log_event($build_id, $event_type, $event_data = array(), $created_by = null)
{
    global $wpdb;

    $wpdb->insert(
        kanna_build_event_table_name(),
        array(
            'build_id' => (int) $build_id,
            'event_type' => sanitize_key($event_type),
            'event_data' => empty($event_data) ? null : kanna_build_encode_json($event_data),
            'created_by' => $created_by ? (int) $created_by : null,
            'created_at' => kanna_build_now(),
        ),
        array('%d', '%s', '%s', '%d', '%s')
    );
}

/**
 * Updates one or more build fields.
 *
 * @param int                  $build_id Build ID.
 * @param array<string, mixed> $values   Values to update.
 *
 * @return bool
 */
function kanna_build_update($build_id, $values)
{
    global $wpdb;

    if (empty($values)) {
        return true;
    }

    $values['updated_at'] = kanna_build_now();

    $formats = array();
    foreach ($values as $key => $value) {
        if (is_int($value) || is_bool($value)) {
            $formats[] = '%d';
        } else {
            $formats[] = '%s';
        }
    }

    return $wpdb->update(
        kanna_build_table_name(),
        $values,
        array('id' => (int) $build_id),
        $formats,
        array('%d')
    ) !== false;
}

/**
 * Updates the build stage and records an event.
 *
 * @param int                  $build_id   Build ID.
 * @param string               $stage      New stage.
 * @param array<string, mixed> $event_data Event payload.
 *
 * @return bool
 */
function kanna_build_update_stage($build_id, $stage, $event_data = array())
{
    $stage = sanitize_key($stage);

    if (!in_array($stage, KANNA_BUILD_STAGES, true)) {
        return false;
    }

    $updated = kanna_build_update(
        $build_id,
        array(
            'stage' => $stage,
        )
    );

    if ($updated) {
        kanna_build_log_event($build_id, 'stage_changed', array_merge($event_data, array('stage' => $stage)), get_current_user_id());
    }

    return $updated;
}

/**
 * Returns the contact request row.
 *
 * @param int $contact_request_id Contact request ID.
 *
 * @return object|null
 */
function kanna_contact_get_request($contact_request_id)
{
    global $wpdb;

    return $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_contact_table_name() . ' WHERE id = %d LIMIT 1',
            (int) $contact_request_id
        )
    );
}

/**
 * Generates a unique public order number.
 *
 * @return string
 */
function kanna_build_generate_public_order_number()
{
    do {
        $candidate = 'tmp-' . gmdate('YmdHis') . '-' . wp_rand(1000, 9999);
    } while (kanna_build_get_by_public_order_number($candidate));

    return $candidate;
}

/**
 * Formats the public order number from the build date and Woo order ID.
 *
 * @param int         $woo_order_id      Woo order ID.
 * @param string|null $build_created_at  Optional build creation timestamp in UTC.
 *
 * @return string
 */
function kanna_build_format_public_order_number($woo_order_id, $build_created_at = null)
{
    $timestamp = $build_created_at ? strtotime((string) $build_created_at . ' UTC') : false;

    if (!$timestamp) {
        $timestamp = time();
    }

    return gmdate('Ymd', $timestamp) . (int) $woo_order_id;
}

/**
 * Replaces the temporary public order number with the Woo-based final order number.
 *
 * @param int $build_id  Build ID.
 * @param int $order_id  Woo order ID.
 *
 * @return string|WP_Error
 */
function kanna_build_assign_public_order_number_from_order($build_id, $order_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $public_order_number = kanna_build_format_public_order_number((int) $order_id, (string) $build->created_at);

    if (!kanna_build_update(
        (int) $build_id,
        array(
            'public_order_number' => $public_order_number,
        )
    )) {
        return new WP_Error('public_order_number_update_failed', 'Could not assign the public order number.');
    }

    $order = kanna_build_has_woocommerce() ? wc_get_order((int) $order_id) : false;

    if ($order) {
        $order->update_meta_data('_kanna_public_order_number', $public_order_number);
        $order->save();
    }

    return $public_order_number;
}

/**
 * Ensures a customer user exists for the build email.
 *
 * @param string $email     Customer email.
 * @param string $full_name Customer name.
 *
 * @return int|WP_Error
 */
function kanna_build_ensure_customer_user($email, $full_name)
{
    $email = sanitize_email($email);

    if (!$email || !is_email($email)) {
        return new WP_Error('invalid_customer_email', 'The customer email is invalid.');
    }

    $existing_user = get_user_by('email', $email);

    if ($existing_user instanceof WP_User) {
        return (int) $existing_user->ID;
    }

    $parts = preg_split('/\s+/', trim((string) $full_name));
    $first_name = isset($parts[0]) ? $parts[0] : '';
    $last_name = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
    $user_login = sanitize_user(current(explode('@', $email)), true);

    if ($user_login === '') {
        $user_login = 'kanna-customer-' . wp_rand(1000, 9999);
    }

    while (username_exists($user_login)) {
        $user_login .= wp_rand(1, 9);
    }

    $user_id = wp_insert_user(
        array(
            'user_login' => $user_login,
            'user_email' => $email,
            'user_pass' => wp_generate_password(24, true, true),
            'display_name' => $full_name,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'role' => 'customer',
        )
    );

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    return (int) $user_id;
}

/**
 * Returns the linked customer user for a build, creating or repairing the link if needed.
 *
 * @param object $build Build row.
 *
 * @return WP_User|WP_Error
 */
function kanna_build_get_customer_user_for_build($build)
{
    if (!is_object($build)) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $user = null;

    if (!empty($build->wp_user_id)) {
        $user = get_user_by('id', (int) $build->wp_user_id);
    }

    if (!$user instanceof WP_User) {
        $user_id = kanna_build_ensure_customer_user((string) $build->customer_email, (string) $build->customer_full_name);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        if ((int) $build->wp_user_id !== (int) $user_id) {
            kanna_build_update(
                (int) $build->id,
                array(
                    'wp_user_id' => (int) $user_id,
                )
            );
        }

        $user = get_user_by('id', (int) $user_id);
    }

    if (!$user instanceof WP_User) {
        return new WP_Error('customer_user_missing', 'The customer account could not be loaded.');
    }

    return $user;
}

/**
 * Returns whether WooCommerce is available.
 *
 * @return bool
 */
function kanna_build_has_woocommerce()
{
    return function_exists('wc_create_order') && function_exists('wc_get_order');
}

/**
 * Returns a Woo admin edit URL for an order.
 *
 * @param int $order_id Order ID.
 *
 * @return string
 */
function kanna_build_get_order_admin_url($order_id)
{
    if (!kanna_build_has_woocommerce()) {
        return '';
    }

    if (class_exists('Automattic\WooCommerce\Utilities\OrderUtil') && Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled()) {
        return admin_url('admin.php?page=wc-orders&action=edit&id=' . (int) $order_id);
    }

    return admin_url('post.php?post=' . (int) $order_id . '&action=edit');
}

/**
 * Returns the option key storing a product ID for a payment kind.
 *
 * @param string $kind Payment kind.
 *
 * @return string
 */
function kanna_build_payment_product_option_key($kind)
{
    return $kind === KANNA_PAYMENT_KIND_FINAL ? 'kanna_final_payment_product_id' : 'kanna_deposit_payment_product_id';
}

/**
 * Ensures the hidden payment product exists.
 *
 * @param string $kind Payment kind.
 *
 * @return int|WP_Error
 */
function kanna_build_ensure_payment_product($kind)
{
    if (!kanna_build_has_woocommerce() || !class_exists('WC_Product_Simple')) {
        return new WP_Error('woocommerce_missing', 'WooCommerce is required to create payment orders.');
    }

    $option_key = kanna_build_payment_product_option_key($kind);
    $existing_id = (int) get_option($option_key);

    if ($existing_id > 0 && get_post_status($existing_id)) {
        $existing_product = wc_get_product($existing_id);

        if ($existing_product) {
            $needs_save = false;

            if ($existing_product->get_tax_status() !== 'taxable') {
                $existing_product->set_tax_status('taxable');
                $needs_save = true;
            }

            if ((string) $existing_product->get_tax_class() !== '') {
                $existing_product->set_tax_class('');
                $needs_save = true;
            }

            if ($needs_save) {
                $existing_product->save();
            }
        }

        return $existing_id;
    }

    $product = new WC_Product_Simple();
    $product->set_name($kind === KANNA_PAYMENT_KIND_FINAL ? 'Custom Bike Build Final Balance' : 'Custom Bike Build Deposit');
    $product->set_status('private');
    $product->set_catalog_visibility('hidden');
    $product->set_virtual(true);
    $product->set_regular_price('0');
    $product->set_sold_individually(true);
    $product->set_tax_status('taxable');
    $product->set_tax_class('');
    $product_id = $product->save();

    update_option($option_key, (int) $product_id);

    return (int) $product_id;
}

/**
 * Creates or updates a Woo payment order for a build.
 *
 * @param int                  $build_id   Build ID.
 * @param string               $kind       Payment kind.
 * @param array<string, mixed> $extra_data Optional extra data.
 *
 * @return int|WP_Error
 */
function kanna_build_create_payment_order($build_id, $kind, $extra_data = array())
{
    if (!kanna_build_has_woocommerce()) {
        return new WP_Error('woocommerce_missing', 'WooCommerce is required to create payment orders.');
    }

    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $kind = $kind === KANNA_PAYMENT_KIND_FINAL ? KANNA_PAYMENT_KIND_FINAL : KANNA_PAYMENT_KIND_DEPOSIT;
    $existing_order_id = $kind === KANNA_PAYMENT_KIND_FINAL ? (int) $build->final_order_id : (int) $build->deposit_order_id;

    if ($existing_order_id > 0) {
        $order = wc_get_order($existing_order_id);

        if ($order) {
            return $existing_order_id;
        }
    }

    $product_id = kanna_build_ensure_payment_product($kind);

    if (is_wp_error($product_id)) {
        return $product_id;
    }

    if (function_exists('kanna_tax_sync_standard_rates')) {
        kanna_tax_sync_standard_rates();
    }

    $amount = $kind === KANNA_PAYMENT_KIND_FINAL ? (float) $build->final_amount : (float) $build->deposit_amount;
    $shipping_amount = 0.0;

    if ($kind === KANNA_PAYMENT_KIND_FINAL && $amount <= 0) {
        return new WP_Error('final_amount_required', 'Set the final amount before creating the final payment order.');
    }

    if ($kind === KANNA_PAYMENT_KIND_FINAL && isset($extra_data['shipping_cost'])) {
        $shipping_amount = max(0, (float) $extra_data['shipping_cost']);
    }

    $order = wc_create_order(
        array(
            'customer_id' => (int) $build->wp_user_id,
            'created_via' => 'kanna_headless_builds',
        )
    );

    if (is_wp_error($order)) {
        return $order;
    }

    $product = wc_get_product($product_id);

    if (!$product) {
        return new WP_Error('payment_product_missing', 'Payment product could not be loaded.');
    }

    if (method_exists($order, 'set_prices_include_tax')) {
        $order->set_prices_include_tax('yes' === get_option('woocommerce_prices_include_tax'));
    }

    $product_breakdown = function_exists('kanna_tax_calculate_inclusive_amount_breakdown')
        ? kanna_tax_calculate_inclusive_amount_breakdown($amount, $product->get_tax_class(), false)
        : array(
            'gross' => $amount,
            'net' => $amount,
            'taxes' => array(),
            'total_tax' => 0.0,
        );

    $item = new WC_Order_Item_Product();
    $item->set_product($product);
    $item->set_name($kind === KANNA_PAYMENT_KIND_FINAL ? 'Custom Bike Build Final Balance' : 'Custom Bike Build Deposit');
    $item->set_quantity(1);
    $item->set_subtotal($product_breakdown['net']);
    $item->set_total($product_breakdown['net']);

    $order->add_item($item);
    $currency = strtoupper(trim((string) $build->currency));

    if ($currency === '' || !array_key_exists($currency, get_woocommerce_currencies())) {
        $currency = KANNA_DEFAULT_CURRENCY;
    }

    $order->set_currency($currency);

    $billing_address = array(
        'first_name' => $build->customer_full_name,
        'email' => $build->customer_email,
        'phone' => $build->customer_phone,
    );
    $shipping_address = array();

    if ($kind === KANNA_PAYMENT_KIND_FINAL && !empty($extra_data['shipping']) && is_array($extra_data['shipping'])) {
        $shipping_data = kanna_build_normalize_shipping($extra_data['shipping']);
        $shipping_address = isset($shipping_data['address']) && is_array($shipping_data['address']) ? $shipping_data['address'] : array();

        if (!empty($shipping_address['fullName'])) {
            $billing_address['first_name'] = $shipping_address['fullName'];
        }

        if (!empty($shipping_address['email'])) {
            $billing_address['email'] = $shipping_address['email'];
        }

        if (!empty($shipping_address['phoneNumber'])) {
            $billing_address['phone'] = $shipping_address['phoneNumber'];
        }

        if (!empty($shipping_address['countryCode'])) {
            $billing_address['country'] = $shipping_address['countryCode'];
        }

        if (!empty($shipping_address['city'])) {
            $billing_address['city'] = $shipping_address['city'];
        }

        if (!empty($shipping_address['postalCode'])) {
            $billing_address['postcode'] = $shipping_address['postalCode'];
        }

        if (!empty($shipping_address['street'])) {
            $billing_address['address_1'] = $shipping_address['street'];
        }
    }

    $order->set_address($billing_address, 'billing');

    if (!empty($shipping_address)) {
        $order->set_address(
            array(
                'first_name' => isset($shipping_address['fullName']) ? $shipping_address['fullName'] : '',
                'country' => isset($shipping_address['countryCode']) ? $shipping_address['countryCode'] : '',
                'city' => isset($shipping_address['city']) ? $shipping_address['city'] : '',
                'postcode' => isset($shipping_address['postalCode']) ? $shipping_address['postalCode'] : '',
                'address_1' => isset($shipping_address['street']) ? $shipping_address['street'] : '',
                'email' => isset($shipping_address['email']) ? $shipping_address['email'] : '',
                'phone' => isset($shipping_address['phoneNumber']) ? $shipping_address['phoneNumber'] : '',
            ),
            'shipping'
        );
    }

    $order->update_meta_data('_kanna_build_id', (int) $build->id);
    $order->update_meta_data('_kanna_payment_kind', $kind);
    $order->update_meta_data('_kanna_public_order_number', $build->public_order_number);

    if ($kind === KANNA_PAYMENT_KIND_FINAL && !empty($extra_data['shipping'])) {
        $order->update_meta_data('_kanna_shipping_data', kanna_build_encode_json($extra_data['shipping']));
    }

    if ($kind === KANNA_PAYMENT_KIND_FINAL && $shipping_amount > 0) {
        $shipping_breakdown = function_exists('kanna_tax_calculate_inclusive_amount_breakdown')
            ? kanna_tax_calculate_inclusive_amount_breakdown($shipping_amount, '', true)
            : array(
                'gross' => $shipping_amount,
                'net' => $shipping_amount,
                'taxes' => array(),
                'total_tax' => 0.0,
            );

        $shipping_item = new WC_Order_Item_Shipping();
        $shipping_item->set_method_title(
            !empty($extra_data['shipping']['shippingRateLabel'])
                ? (string) $extra_data['shipping']['shippingRateLabel']
                : 'DHL Courier'
        );
        $shipping_item->set_method_id(
            !empty($extra_data['shipping']['shippingRateId'])
                ? (string) $extra_data['shipping']['shippingRateId']
                : 'flat_rate'
        );
        $shipping_item->set_total($shipping_breakdown['net']);

        $order->add_item($shipping_item);
    }

    $tax_location = function_exists('kanna_tax_base_location_args')
        ? kanna_tax_base_location_args()
        : array(
            'country' => 'PL',
            'state' => '',
            'postcode' => '',
            'city' => '',
        );

    $order->calculate_taxes(
        array(
            'country' => isset($tax_location['country']) ? (string) $tax_location['country'] : 'PL',
            'state' => isset($tax_location['state']) ? (string) $tax_location['state'] : '',
            'postcode' => isset($tax_location['postcode']) ? (string) $tax_location['postcode'] : '',
            'city' => isset($tax_location['city']) ? (string) $tax_location['city'] : '',
        )
    );
    $order->calculate_totals(false);
    $order->save();

    $field = $kind === KANNA_PAYMENT_KIND_FINAL ? 'final_order_id' : 'deposit_order_id';
    kanna_build_update(
        $build_id,
        array(
            $field => (int) $order->get_id(),
        )
    );
    kanna_build_log_event(
        $build_id,
        $kind === KANNA_PAYMENT_KIND_FINAL ? 'final_payment_order_created' : 'deposit_order_created',
        array(
            'order_id' => (int) $order->get_id(),
            'amount' => $amount,
            'shipping_amount' => $shipping_amount,
            'gross_total' => (float) $order->get_total(),
        ),
        get_current_user_id()
    );

    return (int) $order->get_id();
}

/**
 * Returns the formatted currency string.
 *
 * @param float  $amount   Amount.
 * @param string $currency Currency code.
 *
 * @return string
 */
function kanna_build_format_money($amount, $currency)
{
    $normalized = number_format((float) $amount, 2, '.', ' ');
    $trimmed = preg_replace('/\.00$/', '', $normalized);

    return trim($trimmed . ' ' . strtoupper($currency));
}

/**
 * Sends a request to the Stripe API.
 *
 * @param string               $method HTTP method.
 * @param string               $path   API path.
 * @param array<string, mixed> $body   Request body.
 *
 * @return array<string, mixed>|WP_Error
 */
function kanna_build_stripe_api_request($method, $path, $body = array())
{
    $secret_key = kanna_build_stripe_secret_key();

    if ($secret_key === '') {
        return new WP_Error('stripe_not_configured', 'Stripe is not configured.');
    }

    $response = wp_remote_request(
        'https://api.stripe.com/v1' . $path,
        array(
            'method' => strtoupper((string) $method),
            'headers' => array(
                'Authorization' => 'Bearer ' . $secret_key,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ),
            'body' => $body,
            'timeout' => 20,
        )
    );

    if (is_wp_error($response)) {
        return $response;
    }

    $status_code = (int) wp_remote_retrieve_response_code($response);
    $payload = json_decode((string) wp_remote_retrieve_body($response), true);

    if ($status_code < 200 || $status_code >= 300 || !is_array($payload)) {
        $message = is_array($payload) && isset($payload['error']['message'])
            ? (string) $payload['error']['message']
            : 'Stripe API request failed.';

        return new WP_Error('stripe_api_error', $message, array('status' => 502));
    }

    return $payload;
}

/**
 * Builds the customer return URL after Stripe Checkout.
 *
 * @param object $build        Build row.
 * @param string $checkout     Checkout state.
 * @param string $payment_kind Payment kind.
 *
 * @return string
 */
function kanna_build_frontend_return_url($build, $checkout, $payment_kind)
{
    return add_query_arg(
        array(
            'checkout' => sanitize_key($checkout),
            'payment' => $payment_kind === KANNA_PAYMENT_KIND_FINAL ? 'final' : 'deposit',
            'stripe_session_id' => '{CHECKOUT_SESSION_ID}',
        ),
        kanna_build_frontend_base_url() . '/order/' . rawurlencode((string) $build->public_order_number)
    );
}

/**
 * Creates a hosted Stripe Checkout Session for a Woo payment order.
 *
 * @param object   $build        Build row.
 * @param WC_Order $order        Woo order.
 * @param string   $payment_kind Payment kind.
 *
 * @return array{sessionId:string,url:string}|WP_Error
 */
function kanna_build_create_stripe_checkout_session($build, $order, $payment_kind)
{
    if (!$order || !method_exists($order, 'get_id') || !method_exists($order, 'get_order_key')) {
        return new WP_Error('payment_order_missing', 'Payment order could not be loaded.', array('status' => 500));
    }

    $amount = (float) $order->get_total();

    if ($amount <= 0) {
        return new WP_Error('invalid_payment_amount', 'Stripe Checkout requires a positive amount.', array('status' => 422));
    }

    $currency = strtolower((string) ($build->currency ? $build->currency : KANNA_DEFAULT_CURRENCY));
    $payment_kind = $payment_kind === KANNA_PAYMENT_KIND_FINAL ? KANNA_PAYMENT_KIND_FINAL : KANNA_PAYMENT_KIND_DEPOSIT;
    $line_item_name = $payment_kind === KANNA_PAYMENT_KIND_FINAL
        ? sprintf('Final payment for order %s', $build->public_order_number)
        : sprintf('Deposit for order %s', $build->public_order_number);

    $response = kanna_build_stripe_api_request(
        'POST',
        '/checkout/sessions',
        array(
            'mode' => 'payment',
            'success_url' => kanna_build_frontend_return_url($build, 'success', $payment_kind),
            'cancel_url' => kanna_build_frontend_return_url($build, 'cancelled', $payment_kind),
            'client_reference_id' => (string) $build->public_order_number,
            'customer_email' => (string) $build->customer_email,
            'payment_intent_data[metadata][build_id]' => (string) $build->id,
            'payment_intent_data[metadata][public_order_number]' => (string) $build->public_order_number,
            'payment_intent_data[metadata][payment_kind]' => (string) $payment_kind,
            'payment_intent_data[metadata][woo_order_id]' => (string) $order->get_id(),
            'metadata[build_id]' => (string) $build->id,
            'metadata[public_order_number]' => (string) $build->public_order_number,
            'metadata[payment_kind]' => (string) $payment_kind,
            'metadata[woo_order_id]' => (string) $order->get_id(),
            'line_items[0][quantity]' => '1',
            'line_items[0][price_data][currency]' => $currency,
            'line_items[0][price_data][unit_amount]' => (string) round($amount * 100),
            'line_items[0][price_data][product_data][name]' => $line_item_name,
        )
    );

    if (is_wp_error($response)) {
        return $response;
    }

    if (empty($response['id']) || empty($response['url'])) {
        return new WP_Error('stripe_checkout_failed', 'Stripe Checkout session could not be created.', array('status' => 502));
    }

    return array(
        'sessionId' => (string) $response['id'],
        'url' => (string) $response['url'],
    );
}

/**
 * Verifies the Stripe webhook signature.
 *
 * @param string $payload          Raw request body.
 * @param string $signature_header Stripe-Signature header value.
 *
 * @return bool
 */
function kanna_build_verify_stripe_signature($payload, $signature_header)
{
    $webhook_secret = kanna_build_stripe_webhook_secret();

    if ($webhook_secret === '' || !is_string($signature_header) || $signature_header === '') {
        return false;
    }

    $timestamp = null;
    $signatures = array();

    foreach (explode(',', $signature_header) as $part) {
        $pair = explode('=', trim($part), 2);

        if (count($pair) !== 2) {
            continue;
        }

        if ($pair[0] === 't') {
            $timestamp = (int) $pair[1];
        }

        if ($pair[0] === 'v1') {
            $signatures[] = $pair[1];
        }
    }

    if (!$timestamp || empty($signatures) || abs(time() - $timestamp) > KANNA_STRIPE_WEBHOOK_TOLERANCE) {
        return false;
    }

    $expected_signature = hash_hmac('sha256', $timestamp . '.' . $payload, $webhook_secret);

    foreach ($signatures as $signature) {
        if (hash_equals($expected_signature, $signature)) {
            return true;
        }
    }

    return false;
}

/**
 * Returns a normalized shipping data array and cost.
 *
 * @param array<string, mixed> $shipping_data Raw shipping data.
 *
 * @return array<string, mixed>
 */
function kanna_build_normalize_shipping($shipping_data)
{
    $option = isset($shipping_data['option']) && $shipping_data['option'] === 'pickup' ? 'pickup' : 'courier';
    $address = isset($shipping_data['address']) && is_array($shipping_data['address']) ? $shipping_data['address'] : array();
    $tracking_url = isset($shipping_data['trackingUrl']) ? esc_url_raw((string) $shipping_data['trackingUrl']) : '';
    $country_code = isset($address['countryCode']) ? strtoupper(sanitize_text_field((string) $address['countryCode'])) : '';

    $normalized_address = array(
        'fullName' => isset($address['fullName']) ? sanitize_text_field((string) $address['fullName']) : '',
        'email' => isset($address['email']) ? sanitize_email((string) $address['email']) : '',
        'phoneNumber' => isset($address['phoneNumber']) ? sanitize_text_field((string) $address['phoneNumber']) : '',
        'street' => isset($address['street']) ? sanitize_text_field((string) $address['street']) : '',
        'postalCode' => isset($address['postalCode']) ? sanitize_text_field((string) $address['postalCode']) : '',
        'city' => isset($address['city']) ? sanitize_text_field((string) $address['city']) : '',
        'country' => isset($address['country']) ? sanitize_text_field((string) $address['country']) : '',
        'countryCode' => $country_code,
    );

    return array(
        'option' => $option,
        'address' => $normalized_address,
        'shippingCost' => 0,
        'shippingEstimateNotice' => '',
        'trackingUrl' => $tracking_url,
    );
}

/**
 * Returns estimated DHL Parcel ForYou International XXL gross rates from Poland.
 *
 * Source: DHL Poland "Price list International shipments" PDF, crawled March 22, 2026.
 * These are fallback estimates used only when WooCommerce shipping methods do not return a rate.
 *
 * @return array<string, float>
 */
function kanna_build_estimated_dhl_xxl_rates()
{
    return array(
        'AT' => 200.00,
        'BE' => 200.00,
        'BG' => 276.00,
        'HR' => 263.00,
        'CY' => 276.00,
        'CZ' => 200.00,
        'DK' => 200.00,
        'EE' => 200.00,
        'FI' => 200.00,
        'FR' => 276.00,
        'DE' => 200.00,
        'GR' => 276.00,
        'HU' => 200.00,
        'IE' => 276.00,
        'IT' => 263.00,
        'LV' => 200.00,
        'LT' => 200.00,
        'LU' => 200.00,
        'MT' => 755.00,
        'MC' => 276.00,
        'NL' => 200.00,
        'PT' => 276.00,
        'RO' => 276.00,
        'SK' => 200.00,
        'SI' => 200.00,
        'ES' => 276.00,
        'SE' => 200.00,
        'GB' => 224.39,
    );
}

/**
 * Resolves a WooCommerce country code from normalized address data.
 *
 * @param array<string, string> $normalized_address Normalized address data.
 *
 * @return string
 */
function kanna_build_resolve_country_code($normalized_address)
{
    $country_code = isset($normalized_address['countryCode']) ? strtoupper(trim((string) $normalized_address['countryCode'])) : '';

    if ($country_code !== '') {
        return $country_code;
    }

    if (!function_exists('WC')) {
        return '';
    }

    $country_name = strtolower(trim((string) $normalized_address['country']));
    $countries = WC()->countries ? WC()->countries->get_countries() : array();

    foreach ($countries as $code => $name) {
        if (strtolower((string) $name) === $country_name) {
            return (string) $code;
        }
    }

    return '';
}

/**
 * Calculates shipping rates using WooCommerce shipping methods.
 *
 * @param array<string, mixed> $shipping_data Raw shipping data.
 * @param float                $contents_cost Order subtotal used for shipping methods.
 *
 * @return array<string, mixed>
 */
function kanna_build_calculate_shipping_quote($shipping_data, $contents_cost = 0.0)
{
    $normalized_shipping = kanna_build_normalize_shipping($shipping_data);
    $normalized_address = $normalized_shipping['address'];
    $option = $normalized_shipping['option'];

    if ($option === 'pickup') {
        $normalized_shipping['shippingRateLabel'] = 'Studio pickup';
        $normalized_shipping['shippingRateId'] = 'pickup';
        $normalized_shipping['availableRates'] = array();

        return $normalized_shipping;
    }

    $country_code = kanna_build_resolve_country_code($normalized_address);
    $normalized_shipping['address']['countryCode'] = $country_code;

    if (!kanna_build_has_woocommerce() || !class_exists('WC_Shipping_Zones') || !function_exists('WC') || !WC()->shipping()) {
        $estimated_rates = kanna_build_estimated_dhl_xxl_rates();

        if ($country_code !== '' && isset($estimated_rates[$country_code])) {
            $normalized_shipping['shippingCost'] = (float) $estimated_rates[$country_code];
            $normalized_shipping['shippingRateLabel'] = 'Estimated DHL XXL parcel';
            $normalized_shipping['shippingRateId'] = 'estimated_dhl_xxl';
            $normalized_shipping['shippingEstimateNotice'] = 'Estimated DHL XXL parcel rate from Poland.';
            $normalized_shipping['availableRates'] = array();

            return $normalized_shipping;
        }

        $normalized_shipping['shippingCost'] = null;
        $normalized_shipping['shippingRateLabel'] = '';
        $normalized_shipping['shippingRateId'] = 'estimate_unavailable';
        $normalized_shipping['shippingEstimateNotice'] = 'Oops! We need to estimate shipping price for your country.';
        $normalized_shipping['availableRates'] = array();

        return $normalized_shipping;
    }

    $package = array(
        'contents' => array(),
        'contents_cost' => max(0, (float) $contents_cost),
        'applied_coupons' => array(),
        'cart_subtotal' => max(0, (float) $contents_cost),
        'destination' => array(
            'country' => $country_code,
            'state' => '',
            'postcode' => $normalized_address['postalCode'],
            'city' => $normalized_address['city'],
            'address' => $normalized_address['street'],
            'address_1' => $normalized_address['street'],
            'address_2' => '',
        ),
    );

    $shipping_zone = WC_Shipping_Zones::get_zone_matching_package($package);
    $shipping_methods = $shipping_zone ? $shipping_zone->get_shipping_methods(true) : array();
    $available_rates = array();

    foreach ($shipping_methods as $shipping_method) {
        if (!is_object($shipping_method) || !method_exists($shipping_method, 'get_rates_for_package')) {
            continue;
        }

        if (!method_exists($shipping_method, 'get_instance_id') || (!$shipping_method->supports('shipping-zones') && !$shipping_method->get_instance_id())) {
            continue;
        }

        $method_rates = $shipping_method->get_rates_for_package($package);

        foreach ($method_rates as $rate) {
            $method_id = method_exists($rate, 'get_method_id') ? (string) $rate->get_method_id() : '';

            if ($method_id === 'local_pickup') {
                continue;
            }

            $available_rates[] = array(
                'id' => method_exists($rate, 'get_id') ? (string) $rate->get_id() : '',
                'label' => method_exists($rate, 'get_label') ? (string) $rate->get_label() : 'Shipping',
                'cost' => round(
                    (method_exists($rate, 'get_cost') ? (float) $rate->get_cost() : 0.0)
                    + (method_exists($rate, 'get_taxes') ? array_sum((array) $rate->get_taxes()) : 0.0),
                    2
                ),
                'methodId' => $method_id,
            );
        }
    }

    if (!empty($available_rates)) {
        usort(
            $available_rates,
            static function ($left, $right) {
                return ((float) $left['cost']) <=> ((float) $right['cost']);
            }
        );

        $selected_rate = $available_rates[0];
        $normalized_shipping['shippingCost'] = (float) $selected_rate['cost'];
        $normalized_shipping['shippingRateLabel'] = (string) $selected_rate['label'];
        $normalized_shipping['shippingRateId'] = (string) $selected_rate['id'];
        $normalized_shipping['availableRates'] = $available_rates;

        return $normalized_shipping;
    }

    $estimated_rates = kanna_build_estimated_dhl_xxl_rates();

    if ($country_code !== '' && isset($estimated_rates[$country_code])) {
        $normalized_shipping['shippingCost'] = (float) $estimated_rates[$country_code];
        $normalized_shipping['shippingRateLabel'] = 'Estimated DHL XXL parcel';
        $normalized_shipping['shippingRateId'] = 'estimated_dhl_xxl';
        $normalized_shipping['shippingEstimateNotice'] = 'Estimated DHL XXL parcel rate from Poland.';
        $normalized_shipping['availableRates'] = array();

        return $normalized_shipping;
    }

    $normalized_shipping['shippingCost'] = null;
    $normalized_shipping['shippingRateLabel'] = '';
    $normalized_shipping['shippingRateId'] = 'estimate_unavailable';
    $normalized_shipping['shippingEstimateNotice'] = 'Oops! We need to estimate shipping price for your country.';
    $normalized_shipping['availableRates'] = array();

    return $normalized_shipping;
}

/**
 * Returns the editable component sections for a prepared design.
 *
 * @return array<int, array{title:string, fields:array<int, string>}>
 */
function kanna_build_design_component_sections()
{
    return array(
        array(
            'title' => 'Frameset',
            'fields' => array('Frame', 'Fork', 'Headset', 'Cockpit'),
        ),
        array(
            'title' => 'Front wheel',
            'fields' => array('Size', 'Front rim', 'Front hub', 'Front tire'),
        ),
        array(
            'title' => 'Back wheel',
            'fields' => array('Size', 'Rear rim', 'Rear hub', 'Rear tire'),
        ),
        array(
            'title' => 'Drivetrain',
            'fields' => array('Crankset', 'Chainring', 'Cassette', 'Rear derailleur', 'Chain', 'Shifters'),
        ),
        array(
            'title' => 'Brakes',
            'fields' => array('Front brake', 'Rear brake', 'Rotors'),
        ),
        array(
            'title' => 'Other',
            'fields' => array('Saddle', 'Seatpost', 'Pedals', 'Accessories'),
        ),
    );
}

/**
 * Returns the editable geometry fields for a prepared design.
 *
 * @return array<int, array{title:string, key:string}>
 */
function kanna_build_design_geometry_fields()
{
    return array(
        array('title' => 'Stack', 'key' => 'Geometry:Stack'),
        array('title' => 'Reach', 'key' => 'Geometry:Reach'),
        array('title' => 'Top tube', 'key' => 'Geometry:TopTube'),
        array('title' => 'Seat tube', 'key' => 'Geometry:SeatTube'),
        array('title' => 'Head tube', 'key' => 'Geometry:HeadTube'),
        array('title' => 'Head angle', 'key' => 'Geometry:HeadAngle'),
        array('title' => 'Seat angle', 'key' => 'Geometry:SeatAngle'),
        array('title' => 'Chainstay', 'key' => 'Geometry:Chainstay'),
        array('title' => 'BB height', 'key' => 'Geometry:BBHeight'),
    );
}

/**
 * Normalizes design data stored with a build.
 *
 * @param mixed $design_data Raw design data.
 *
 * @return array{imageUrl:string,imageAttachmentId:int,artistNote:string,values:array<string,string>}
 */
function kanna_build_normalize_design_data($design_data)
{
    $design_state = is_array($design_data) ? $design_data : array();
    $values = isset($design_state['values']) && is_array($design_state['values']) ? $design_state['values'] : array();
    $normalized_values = array();

    foreach ($values as $key => $value) {
        $normalized_key = sanitize_text_field((string) $key);

        if ($normalized_key === '') {
            continue;
        }

        $normalized_values[$normalized_key] = sanitize_text_field((string) $value);
    }

    return array(
        'imageUrl' => isset($design_state['imageUrl']) ? esc_url_raw((string) $design_state['imageUrl']) : '',
        'imageAttachmentId' => isset($design_state['imageAttachmentId']) ? (int) $design_state['imageAttachmentId'] : 0,
        'artistNote' => isset($design_state['artistNote']) ? sanitize_textarea_field((string) $design_state['artistNote']) : '',
        'values' => $normalized_values,
    );
}

require_once __DIR__ . '/builds-portal.php';
require_once __DIR__ . '/builds-rest.php';
