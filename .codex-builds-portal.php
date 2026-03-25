<?php

if (!defined('ABSPATH')) {
    exit;
}

function kanna_build_generate_portal_token($build_id, $type, $ttl, $revokeOld = false)
{
    global $wpdb;

    if ($revokeOld) {
        $wpdb->query(
            $wpdb->prepare(
                'UPDATE ' . kanna_portal_token_table_name() . '
                SET revoked_at = %s
                WHERE build_id = %d
                AND token_type = %s
                AND revoked_at IS NULL',
                kanna_build_now(),
                (int) $build_id,
                sanitize_key($type)
            )
        );
    }

    $raw_token = wp_generate_password(48, false, false);
    $inserted = $wpdb->insert(
        kanna_portal_token_table_name(),
        array(
            'build_id' => (int) $build_id,
            'wp_user_id' => null,
            'token_type' => sanitize_key($type),
            'token_hash' => hash('sha256', $raw_token),
            'expires_at' => gmdate('Y-m-d H:i:s', time() + (int) $ttl),
            'created_at' => kanna_build_now(),
        ),
        array('%d', '%d', '%s', '%s', '%s', '%s')
    );

    if ($inserted === false) {
        return new WP_Error('token_insert_failed', 'Could not create the portal token.');
    }

    return $raw_token;
}

/**
 * Returns a valid stored portal token row for a raw token.
 *
 * @param int    $build_id Build ID.
 * @param string $type     Token type.
 * @param string $token    Raw token.
 *
 * @return object|null
 */
function kanna_build_get_valid_token_row($build_id, $type, $token)
{
    global $wpdb;

    if (!is_string($token) || $token === '') {
        return null;
    }

    return $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_portal_token_table_name() . '
            WHERE build_id = %d
            AND token_type = %s
            AND token_hash = %s
            AND revoked_at IS NULL
            AND used_at IS NULL
            AND expires_at >= %s
            LIMIT 1',
            (int) $build_id,
            sanitize_key($type),
            hash('sha256', $token),
            kanna_build_now()
        )
    );
}

/**
 * Returns a valid session token row for a raw token.
 *
 * @param int    $build_id Build ID.
 * @param string $token    Raw token.
 *
 * @return object|null
 */
function kanna_build_get_valid_session_row($build_id, $token)
{
    global $wpdb;

    if (!is_string($token) || $token === '') {
        return null;
    }

    return $wpdb->get_row(
        $wpdb->prepare(
            'SELECT * FROM ' . kanna_portal_token_table_name() . '
            WHERE build_id = %d
            AND token_type = %s
            AND token_hash = %s
            AND revoked_at IS NULL
            AND expires_at >= %s
            LIMIT 1',
            (int) $build_id,
            'session',
            hash('sha256', $token),
            kanna_build_now()
        )
    );
}

/**
 * Creates and emails a portal claim link.
 *
 * @param int $build_id Build ID.
 *
 * @return string|WP_Error
 */
function kanna_build_send_portal_link_email($build_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $raw_token = kanna_build_generate_portal_token($build_id, 'claim', KANNA_PORTAL_CLAIM_TOKEN_TTL, true);

    if (is_wp_error($raw_token)) {
        return $raw_token;
    }

    $portal_url = kanna_build_frontend_base_url() . '/order/' . rawurlencode($build->public_order_number) . '?claim_token=' . rawurlencode($raw_token);
    $subject = sprintf('[Kanna Bikes] Order %s', $build->public_order_number);
    $message = implode(
        "\n\n",
        array(
            sprintf('Hi %s,', $build->customer_full_name),
            sprintf('We have created a new order number %s.', $build->public_order_number, 'for you'),
            'Use this secure link to open your order page, create your password, and continue with the deposit payment.',
            $portal_url,
            'After we receive your deposit, you will get access to the bike configurator, where you can follow next steps to get individual bike design for you.',
            'If you choose the classic transfer option, you will find the transfer details after you click the payment button.',
            'If the link expires, contact us and we will send a new one.',
            'Kanna Bikes',
        )
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
    );

    $sent = wp_mail($build->customer_email, $subject, $message, $headers);

    if (!$sent) {
        return new WP_Error('portal_email_failed', 'The portal link email could not be sent.');
    }

    kanna_build_log_event(
        $build_id,
        'portal_link_sent',
        array(
            'portal_url' => $portal_url,
        ),
        get_current_user_id()
    );

    return $portal_url;
}

/**
 * Sends the final payment ready email.
 *
 * @param int $build_id Build ID.
 *
 * @return bool|WP_Error
 */
function kanna_build_send_final_payment_email($build_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $portal_url = kanna_build_frontend_base_url() . '/order/' . rawurlencode($build->public_order_number);
    $subject = sprintf('[Kanna Bikes] Final payment is ready: %s', $build->public_order_number);
    $message = implode(
        "\n\n",
        array(
            sprintf('Hi %s,', $build->customer_full_name),
            'Your custom bike design has been approved and the final payment is now ready.',
            'Open your bike configurator with the link below to review the order and pay the remaining balance.',
            $portal_url,
            'Kanna Bikes',
        )
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
    );

    $sent = wp_mail($build->customer_email, $subject, $message, $headers);

    if ($sent) {
        kanna_build_log_event($build_id, 'final_payment_link_sent', array('portal_url' => $portal_url), get_current_user_id());
    }

    return $sent;
}

/**
 * Sends the design ready email.
 *
 * @param int $build_id Build ID.
 *
 * @return bool|WP_Error
 */
function kanna_build_send_design_ready_email($build_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $portal_url = kanna_build_frontend_base_url() . '/order/' . rawurlencode($build->public_order_number);
    $subject = sprintf('[Kanna Bikes] Your bike design is ready: %s', $build->public_order_number);
    $message = implode(
        "\n\n",
        array(
            sprintf('Hi %s,', $build->customer_full_name),
            'Your bike design is now ready for review.',
            'Open your order with the link below to review the design.',
            $portal_url,
            'If you are happy with it, continue on the order page to approve it and proceed with the final payment.',
            'Kanna Bikes',
        )
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
    );

    $sent = wp_mail($build->customer_email, $subject, $message, $headers);

    if ($sent) {
        kanna_build_log_event($build_id, 'design_ready_email_sent', array('portal_url' => $portal_url), get_current_user_id());
    }

    return $sent;
}

/**
 * Returns the pickup address used in ready-stage notifications.
 *
 * @return array<int, string>
 */
function kanna_build_pickup_address_lines()
{
    return array(
        'Kanna Bikes Sp. z o.o.',
        'ul. Przykladowa 12',
        '30-001 Krakow',
        'Poland',
    );
}

/**
 * Sends the ready for delivery or pickup email.
 *
 * @param int $build_id Build ID.
 *
 * @return bool|WP_Error
 */
function kanna_build_send_ready_email($build_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $shipping_state = kanna_build_normalize_shipping(kanna_build_decode_json($build->shipping_data));
    $shipping_option = isset($shipping_state['option']) && $shipping_state['option'] === 'pickup' ? 'pickup' : 'courier';
    $tracking_url = isset($shipping_state['trackingUrl']) ? trim((string) $shipping_state['trackingUrl']) : '';
    $portal_url = kanna_build_frontend_base_url() . '/order/' . rawurlencode($build->public_order_number);
    $subject = sprintf('[Kanna Bikes] Your bicycle is ready: %s', $build->public_order_number);
    $message_parts = array(
        sprintf('Hi %s,', $build->customer_full_name),
    );

    if ($shipping_option === 'courier') {
        if ($tracking_url === '') {
            return new WP_Error('missing_tracking_url', 'Add a courier tracking link before setting the build to Ready.');
        }

        $message_parts[] = 'Your bicycle has been handed over to the courier.';
        $message_parts[] = sprintf('Track your shipment here: %s', $tracking_url);
    } else {
        $message_parts[] = 'Your bicycle is ready for pickup.';
        $message_parts[] = "Pickup address:\n" . implode("\n", kanna_build_pickup_address_lines());
    }

    $message_parts[] = sprintf('Order page: %s', $portal_url);
    $message_parts[] = 'Kanna Bikes';

    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
    );

    $sent = wp_mail($build->customer_email, $subject, implode("\n\n", $message_parts), $headers);

    if ($sent) {
        kanna_build_log_event(
            $build_id,
            'ready_email_sent',
            array(
                'portal_url' => $portal_url,
                'shippingOption' => $shipping_option,
                'trackingUrl' => $tracking_url,
            ),
            get_current_user_id()
        );
    }

    return $sent;
}

/**
 * Sends the deposit confirmed email once per build.
 *
 * @param int $build_id Build ID.
 *
 * @return bool|WP_Error
 */
function kanna_build_send_confirmed_email($build_id)
{
    global $wpdb;

    $existing_event_id = (int) $wpdb->get_var(
        $wpdb->prepare(
            'SELECT id FROM ' . kanna_build_event_table_name() . '
            WHERE build_id = %d
            AND event_type = %s
            LIMIT 1',
            (int) $build_id,
            'deposit_confirmed_email_sent'
        )
    );

    if ($existing_event_id > 0) {
        return true;
    }

    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    $portal_url = kanna_build_frontend_base_url() . '/order/' . rawurlencode((string) $build->public_order_number);
    $subject = sprintf('[Kanna Bikes] Deposit received: %s', $build->public_order_number);
    $message = implode(
        "\n\n",
        array(
            sprintf('Hi %s,', $build->customer_full_name),
            'Thank you. We have received your deposit and your order is now confirmed.',
            'What happens next?',
            '1. It is time to configure your dream bike. Open the link below and fill in the required measurements and specification so we can make sure your bike fits you perfectly.',
            '2. Once this is completed, we will start designing your bike. This usually takes about 2 to 3 weeks. The faster you complete the form, the faster we can begin.',
            '3. When the design is ready, it will be waiting for your approval,you will also be asked to pay the final amount to complete your build.',
            '4. After that, we will produce your bicycle and either ship it to you or hand it over in person.',
            sprintf('Link: %s', $portal_url),
            'Kanna Bikes',
        )
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
    );

    $sent = wp_mail($build->customer_email, $subject, $message, $headers);

    if ($sent) {
        kanna_build_log_event($build_id, 'deposit_confirmed_email_sent', array('portal_url' => $portal_url), get_current_user_id());
    }

    return $sent;
}

/**
 * Moves the build into the confirmed stage after deposit verification.
 *
 * @param int                  $build_id    Build ID.
 * @param array<string, mixed> $event_data  Optional event data.
 *
 * @return array{changed:bool}|WP_Error
 */
function kanna_build_transition_to_confirmed($build_id, $event_data = array())
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.');
    }

    if (
        !in_array(
            (string) $build->stage,
            array('waiting_for_deposit', 'in_review', 'confirmed', 'waiting_for_measurements'),
            true
        )
    ) {
        return array('changed' => false);
    }

    if (empty($build->deposit_verified_at)) {
        kanna_build_update(
            $build_id,
            array(
                'deposit_verified_at' => kanna_build_now(),
            )
        );
    }

    if ((string) $build->stage === 'confirmed') {
        return array('changed' => false);
    }

    if (!kanna_build_update_stage($build_id, 'confirmed', $event_data)) {
        return new WP_Error('confirmed_stage_update_failed', 'The build could not be moved to Confirmed.');
    }

    return array('changed' => true);
}

/**
 * Sends a password reset email for a claimed portal.
 *
 * @param int $build_id Build ID.
 *
 * @return true|WP_Error
 */
function kanna_build_send_password_reset_email($build_id)
{
    $build = kanna_build_get_by_id($build_id);

    if (!$build) {
        return new WP_Error('build_not_found', 'Build not found.', array('status' => 404));
    }

    if (empty($build->portal_claimed_at)) {
        return new WP_Error('portal_not_claimed', 'This order has not been activated yet.', array('status' => 409));
    }

    $claim_token = kanna_build_generate_portal_token($build_id, 'claim', KANNA_PORTAL_CLAIM_TOKEN_TTL, true);

    if (is_wp_error($claim_token)) {
        return $claim_token;
    }

    $portal_url = add_query_arg(
        array(
            'claim_token' => rawurlencode($claim_token),
        ),
        trailingslashit(kanna_build_frontend_base_url()) . 'order/' . rawurlencode((string) $build->public_order_number)
    );

    $subject = sprintf('Reset your Kanna Bikes order password %s', (string) $build->public_order_number);
    $message_lines = array(
        sprintf('Hello %s,', $build->customer_full_name),
        '',
        'We received a request to reset the password for your protected bike configurator.',
        'Use the secure link below to create a new password:',
        $portal_url,
        '',
        'If you did not request this change, you can ignore this email.',
    );

    $sent = wp_mail($build->customer_email, $subject, implode("\n", $message_lines));

    if (!$sent) {
        return new WP_Error('password_reset_email_failed', 'The password reset email could not be sent.', array('status' => 500));
    }

    kanna_build_log_event(
        $build_id,
        'password_reset_link_sent',
        array(
            'portal_url' => $portal_url,
        ),
        null
    );

    return true;
}

/**
 * Creates a build record, payment order, and portal access from contact or manual data.
 *
 * @param array<string, mixed> $args Creation arguments.
 *
 * @return int|WP_Error
 */
function kanna_build_create($args = array())
{
    global $wpdb;

    if (!kanna_build_has_woocommerce()) {
        return new WP_Error('woocommerce_missing', 'WooCommerce must be installed and active before builds can be created.');
    }

    $contact_request_id = isset($args['contact_request_id']) ? (int) $args['contact_request_id'] : 0;
    $contact = null;

    if ($contact_request_id > 0) {
        $existing = kanna_build_get_by_contact_request_id($contact_request_id);

        if ($existing) {
            return new WP_Error('build_exists', 'A build already exists for this contact request.');
        }

        $contact = kanna_contact_get_request($contact_request_id);

        if (!$contact) {
            return new WP_Error('contact_not_found', 'Contact request not found.');
        }
    }

    $customer_full_name = isset($args['customer_full_name'])
        ? sanitize_text_field((string) $args['customer_full_name'])
        : ($contact ? sanitize_text_field((string) $contact->full_name) : '');
    $customer_email = isset($args['customer_email'])
        ? sanitize_email((string) $args['customer_email'])
        : ($contact ? sanitize_email((string) $contact->email) : '');
    $customer_phone = isset($args['customer_phone'])
        ? sanitize_text_field((string) $args['customer_phone'])
        : ($contact ? sanitize_text_field((string) $contact->phone_number) : '');
    $order_title = isset($args['order_title']) ? sanitize_text_field((string) $args['order_title']) : KANNA_DEFAULT_ORDER_TITLE;
    $deposit_amount = isset($args['deposit_amount']) ? max(0, (float) $args['deposit_amount']) : KANNA_DEFAULT_DEPOSIT_AMOUNT;
    $final_amount = isset($args['final_amount']) ? max(0, (float) $args['final_amount']) : 0;

    if (strlen($customer_full_name) < 2) {
        return new WP_Error('invalid_customer_full_name', 'Enter the customer full name.');
    }

    if (!$customer_email || !is_email($customer_email)) {
        return new WP_Error('invalid_customer_email', 'Enter a valid customer email address.');
    }

    $user_id = kanna_build_ensure_customer_user($customer_email, $customer_full_name);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $public_order_number = kanna_build_generate_public_order_number();
    $insert_data = array(
        'wp_user_id' => (int) $user_id,
        'public_order_number' => $public_order_number,
        'order_title' => $order_title,
        'customer_full_name' => $customer_full_name,
        'customer_email' => $customer_email,
        'customer_phone' => $customer_phone,
        'stage' => 'waiting_for_deposit',
        'currency' => KANNA_DEFAULT_CURRENCY,
        'deposit_amount' => $deposit_amount,
        'final_amount' => $final_amount,
        'created_at' => kanna_build_now(),
        'updated_at' => kanna_build_now(),
    );
    $insert_formats = array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s', '%s');

    if ($contact_request_id > 0) {
        $insert_data = array_merge(
            array(
                'contact_request_id' => $contact_request_id,
            ),
            $insert_data
        );
        array_unshift($insert_formats, '%d');
    }

    $inserted = $wpdb->insert(kanna_build_table_name(), $insert_data, $insert_formats);

    if ($inserted === false) {
        return new WP_Error('build_insert_failed', 'Could not create the build record.');
    }

    $event_data = array(
        'source' => $contact_request_id > 0 ? 'contact_request' : 'manual_admin',
    );

    if ($contact_request_id > 0) {
        $event_data['contact_request_id'] = $contact_request_id;
    }

    $build_id = (int) $wpdb->insert_id;
    kanna_build_log_event(
        $build_id,
        'build_created',
        $event_data,
        get_current_user_id()
    );

    $deposit_order_id = kanna_build_create_payment_order($build_id, KANNA_PAYMENT_KIND_DEPOSIT);

    if (is_wp_error($deposit_order_id)) {
        $wpdb->delete(kanna_build_table_name(), array('id' => $build_id), array('%d'));

        return $deposit_order_id;
    }

    $public_order_number = kanna_build_assign_public_order_number_from_order($build_id, (int) $deposit_order_id);

    if (is_wp_error($public_order_number)) {
        return $public_order_number;
    }

    $sent_link = kanna_build_send_portal_link_email($build_id);

    if (is_wp_error($sent_link)) {
        return $build_id;
    }

    return $build_id;
}

/**
 * Creates a build from a contact request.
 *
 * @param int                  $contact_request_id Contact request ID.
 * @param array<string, mixed> $overrides          Optional field overrides.
 *
 * @return int|WP_Error
 */
function kanna_build_create_from_contact_request($contact_request_id, $overrides = array())
{
    return kanna_build_create(
        array_merge(
            $overrides,
            array(
                'contact_request_id' => (int) $contact_request_id,
            )
        )
    );
}

/**
 * Creates a build without linking a contact request.
 *
 * @param array<string, mixed> $overrides Manual customer and build values.
 *
 * @return int|WP_Error
 */
function kanna_build_create_manual($overrides = array())
{
    return kanna_build_create($overrides);
}

/**
 * Extracts the bearer token from a request.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return string
 */
function kanna_build_get_request_bearer_token($request)
{
    $header = (string) $request->get_header('authorization');

    if ($header && preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
        return trim((string) $matches[1]);
    }

    return '';
}

/**
 * Resolves portal access for a build.
 *
 * @param string          $public_order_number Public order number.
 * @param WP_REST_Request $request             Request instance.
 * @param bool            $require_session     Whether a session is mandatory.
 *
 * @return array<string, mixed>|WP_Error
 */
function kanna_build_resolve_portal_access($public_order_number, $request, $require_session = false)
{
    global $wpdb;

    $build = kanna_build_get_by_public_order_number($public_order_number);

    if (!$build) {
        return new WP_Error('build_not_found', 'Order not found.', array('status' => 404));
    }

    $bearer_token = kanna_build_get_request_bearer_token($request);

    if ($bearer_token !== '') {
        $session_row = kanna_build_get_valid_session_row((int) $build->id, $bearer_token);

        if ($session_row) {
            $wpdb->update(
                kanna_portal_token_table_name(),
                array(
                    'last_used_at' => kanna_build_now(),
                ),
                array('id' => (int) $session_row->id),
                array('%s'),
                array('%d')
            );

            return array(
                'build' => $build,
                'access_state' => 'authenticated',
                'token_row' => $session_row,
            );
        }
    }

    if ($require_session) {
        return new WP_Error('unauthorized', 'A valid session token is required.', array('status' => 401));
    }

    $claim_token = sanitize_text_field((string) $request->get_param('claim_token'));

    if ($claim_token !== '') {
        $claim_row = kanna_build_get_valid_token_row((int) $build->id, 'claim', $claim_token);

        if ($claim_row) {
            return array(
                'build' => $build,
                'access_state' => 'claim_required',
                'token_row' => $claim_row,
            );
        }

        return new WP_Error('invalid_claim_token', 'The claim link is invalid or has expired.', array('status' => 401));
    }

    if ($build->portal_claimed_at) {
        return new WP_Error('unauthorized', 'Access to this order requires a valid portal session.', array('status' => 401));
    }

    return new WP_Error('claim_required', 'A valid claim token is required for the first access.', array('status' => 401));
}

/**
 * Returns the current Woo order object for a payment kind.
 *
 * @param object $build Build row.
 * @param string $kind  Payment kind.
 *
 * @return WC_Order|false
 */
function kanna_build_get_payment_order($build, $kind)
{
    if (!kanna_build_has_woocommerce()) {
        return false;
    }

    $order_id = $kind === KANNA_PAYMENT_KIND_FINAL ? (int) $build->final_order_id : (int) $build->deposit_order_id;

    if ($order_id <= 0) {
        return false;
    }

    return wc_get_order($order_id);
}

/**
 * Returns the portal payment method label key.
 *
 * @param WC_Order|false $order Payment order.
 *
 * @return string|null
 */
function kanna_build_get_portal_payment_method($order)
{
    if (!$order || !method_exists($order, 'get_payment_method')) {
        return null;
    }

    $payment_method = (string) $order->get_payment_method();

    if ($payment_method === 'bacs') {
        return 'classic_transfer';
    }

    if ($payment_method === 'stripe') {
        return 'stripe';
    }

    return null;
}

/**
 * Returns the best available payment timestamp for the portal payload.
 *
 * @param string|null    $verified_at Build verification timestamp.
 * @param WC_Order|false $order       Payment order.
 *
 * @return string|null
 */
function kanna_build_get_portal_payment_timestamp($verified_at, $order)
{
    if (!empty($verified_at)) {
        return mysql2date('c', (string) $verified_at, false);
    }

    if ($order && method_exists($order, 'get_date_paid')) {
        $date_paid = $order->get_date_paid();

        if ($date_paid) {
            return $date_paid->date('c');
        }
    }

    if ($order && method_exists($order, 'get_date_created')) {
        $date_created = $order->get_date_created();

        if ($date_created) {
            return $date_created->date('c');
        }
    }

    return null;
}

/**
 * Builds the customer-facing payload for a build.
 *
 * @param object $build        Build row.
 * @param string $access_state Access state.
 *
 * @return array<string, mixed>
 */
function kanna_build_prepare_portal_payload($build, $access_state)
{
    $measurement_values = kanna_build_decode_json($build->measurement_data);
    $specification_values = kanna_build_decode_json($build->specification_data);
    $design_state = kanna_build_normalize_design_data(kanna_build_decode_json($build->design_data));
    $shipping_state = kanna_build_decode_json($build->shipping_data);
    $deposit_order = kanna_build_get_payment_order($build, KANNA_PAYMENT_KIND_DEPOSIT);
    $final_order = kanna_build_get_payment_order($build, KANNA_PAYMENT_KIND_FINAL);

    return array(
        'publicOrderNumber' => $build->public_order_number,
        'stage' => $build->stage,
        'displayStatus' => kanna_build_display_status($build->stage, $deposit_order, $final_order),
        'stageLabel' => kanna_build_stage_label($build->stage),
        'accessState' => $access_state,
        'portalClaimed' => !empty($build->portal_claimed_at),
        'customer' => array(
            'orderTitle' => $build->order_title,
            'fullName' => $build->customer_full_name,
            'email' => $build->customer_email,
            'phoneNumber' => $build->customer_phone,
        ),
        'deposit' => array(
            'amountValue' => (float) $build->deposit_amount,
            'amount' => kanna_build_format_money((float) $build->deposit_amount, (string) $build->currency),
            'currency' => $build->currency,
            'orderId' => (int) $build->deposit_order_id,
            'orderStatus' => $deposit_order ? $deposit_order->get_status() : 'pending',
            'isConfirmed' => !empty($build->deposit_verified_at),
            'paidAt' => kanna_build_get_portal_payment_timestamp($build->deposit_verified_at, $deposit_order),
            'paymentMethod' => kanna_build_get_portal_payment_method($deposit_order),
        ),
        'finalPayment' => array(
            'amountValue' => (float) $build->final_amount,
            'amount' => kanna_build_format_money((float) $build->final_amount, (string) $build->currency),
            'currency' => $build->currency,
            'orderId' => (int) $build->final_order_id,
            'orderStatus' => $final_order ? $final_order->get_status() : 'pending',
            'isConfirmed' => !empty($build->final_payment_verified_at),
            'paymentMethod' => kanna_build_get_portal_payment_method($final_order),
        ),
        'measurementState' => array(
            'bodyType' => $build->body_type ? $build->body_type : 'male',
            'bodyWeight' => $build->body_weight ? $build->body_weight : '',
            'values' => $measurement_values,
            'isSubmitted' => !empty($measurement_values),
        ),
        'specificationState' => array(
            'specificationMode' => $build->specification_mode ? $build->specification_mode : null,
            'values' => $specification_values,
            'isSubmitted' => !empty($specification_values) || !empty($build->specification_mode),
        ),
        'designState' => array(
            'isApproved' => !empty($build->design_approved_at),
            'approvedAt' => $build->design_approved_at,
            'imageUrl' => $design_state['imageUrl'],
            'artistNote' => $design_state['artistNote'],
            'values' => $design_state['values'],
            'isReady' => $design_state['imageUrl'] !== '' || !empty($design_state['values']) || $design_state['artistNote'] !== '',
        ),
        'shippingState' => array(
            'option' => isset($shipping_state['option']) ? $shipping_state['option'] : 'courier',
            'address' => isset($shipping_state['address']) && is_array($shipping_state['address']) ? $shipping_state['address'] : array(
                'fullName' => '',
                'email' => '',
                'phoneNumber' => '',
                'street' => '',
                'postalCode' => '',
                'city' => '',
                'country' => '',
                'countryCode' => '',
            ),
            'shippingCost' => array_key_exists('shippingCost', $shipping_state) && $shipping_state['shippingCost'] !== null
                ? (float) $shipping_state['shippingCost']
                : null,
            'shippingRateLabel' => isset($shipping_state['shippingRateLabel']) ? sanitize_text_field((string) $shipping_state['shippingRateLabel']) : '',
            'shippingEstimateNotice' => isset($shipping_state['shippingEstimateNotice'])
                ? sanitize_text_field((string) $shipping_state['shippingEstimateNotice'])
                : '',
            'trackingUrl' => isset($shipping_state['trackingUrl']) ? esc_url_raw((string) $shipping_state['trackingUrl']) : '',
        ),
        'availablePaymentMethods' => array('stripe', 'classic_transfer'),
    );
}

/**
 * Creates a portal session token after claim.
 *
 * @param int $build_id Build ID.
 *
 * @return string|WP_Error
 */
function kanna_build_issue_session_token($build_id)
{
    return kanna_build_generate_portal_token($build_id, 'session', KANNA_PORTAL_SESSION_TTL, true);
}

/**
 * Handles the portal claim flow.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_claim_portal($request)
{
    global $wpdb;

    $public_order_number = sanitize_text_field((string) $request->get_param('public_order_number'));
    $claim_token = sanitize_text_field((string) $request->get_param('claim_token'));
    $password = (string) $request->get_param('password');

    if (strlen($password) < 8) {
        return new WP_Error('invalid_password', 'Password must have at least 8 characters.', array('status' => 422));
    }

    $build = kanna_build_get_by_public_order_number($public_order_number);

    if (!$build) {
        return new WP_Error('build_not_found', 'Order not found.', array('status' => 404));
    }

    $claim_row = kanna_build_get_valid_token_row((int) $build->id, 'claim', $claim_token);

    if (!$claim_row) {
        return new WP_Error('invalid_claim_token', 'The claim link is invalid or has expired.', array('status' => 401));
    }

    $customer_user = kanna_build_get_customer_user_for_build($build);

    if (is_wp_error($customer_user)) {
        return $customer_user;
    }

    wp_set_password($password, (int) $customer_user->ID);

    kanna_build_update(
        (int) $build->id,
        array(
            'portal_password_hash' => wp_hash_password($password),
            'portal_claimed_at' => kanna_build_now(),
        )
    );

    $wpdb->update(
        kanna_portal_token_table_name(),
        array(
            'used_at' => kanna_build_now(),
        ),
        array('id' => (int) $claim_row->id),
        array('%s'),
        array('%d')
    );

    $session_token = kanna_build_issue_session_token((int) $build->id);

    if (is_wp_error($session_token)) {
        return $session_token;
    }

    kanna_build_log_event((int) $build->id, 'portal_claimed', array(), null);
    $fresh_build = kanna_build_get_by_id((int) $build->id);

    return new WP_REST_Response(
        array(
            'sessionToken' => $session_token,
            'build' => kanna_build_prepare_portal_payload($fresh_build, 'authenticated'),
        ),
        200
    );
}

/**
 * Authenticates a claimed portal with the previously created password.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_login_portal($request)
{
    $public_order_number = sanitize_text_field((string) $request->get_param('public_order_number'));
    $password = (string) $request->get_param('password');

    if ($password === '') {
        return new WP_Error('invalid_password', 'Enter your order password.', array('status' => 422));
    }

    $build = kanna_build_get_by_public_order_number($public_order_number);

    if (!$build) {
        return new WP_Error('build_not_found', 'Order not found.', array('status' => 404));
    }

    if (empty($build->portal_claimed_at)) {
        return new WP_Error('portal_not_claimed', 'This order has not been activated yet.', array('status' => 409));
    }

    $customer_user = kanna_build_get_customer_user_for_build($build);

    if (is_wp_error($customer_user)) {
        return $customer_user;
    }

    $is_valid_password = wp_check_password($password, (string) $customer_user->user_pass, (int) $customer_user->ID);

    if (
        !$is_valid_password &&
        !empty($build->portal_password_hash) &&
        wp_check_password($password, (string) $build->portal_password_hash)
    ) {
        wp_set_password($password, (int) $customer_user->ID);
        $is_valid_password = true;
    }

    if (!$is_valid_password) {
        return new WP_Error('invalid_password', 'The password for this order is incorrect.', array('status' => 401));
    }

    $session_token = kanna_build_issue_session_token((int) $build->id);

    if (is_wp_error($session_token)) {
        return $session_token;
    }

    kanna_build_log_event((int) $build->id, 'portal_login', array(), null);

    return new WP_REST_Response(
        array(
            'sessionToken' => $session_token,
            'build' => kanna_build_prepare_portal_payload(kanna_build_get_by_id((int) $build->id), 'authenticated'),
        ),
        200
    );
}

/**
 * Sends a password reset link for the given order.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_forgot_password($request)
{
    $public_order_number = sanitize_text_field((string) $request->get_param('public_order_number'));

    if ($public_order_number === '') {
        return new WP_Error('build_not_found', 'Order not found.', array('status' => 404));
    }

    $build = kanna_build_get_by_public_order_number($public_order_number);

    if (!$build) {
        return new WP_Error('build_not_found', 'Order not found.', array('status' => 404));
    }

    $sent = kanna_build_send_password_reset_email((int) $build->id);

    if (is_wp_error($sent)) {
        return $sent;
    }

    return new WP_REST_Response(
        array(
            'success' => true,
            'message' => 'We sent a password reset link to the email address used for this order.',
        ),
        200
    );
}

/**
 * Returns the order portal payload.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_get_build($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, false);

    if (is_wp_error($access)) {
        return $access;
    }

    return new WP_REST_Response(
        kanna_build_prepare_portal_payload($access['build'], $access['access_state']),
        200
    );
}

/**
 * Stores customer measurements.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_submit_measurements($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, true);

    if (is_wp_error($access)) {
        return $access;
    }

    $body_type = $request->get_param('bodyType') === 'female' ? 'female' : 'male';
    $body_weight = sanitize_text_field((string) $request->get_param('bodyWeight'));
    $values = $request->get_param('values');
    $normalized = array();

    if (is_array($values)) {
        foreach ($values as $key => $value) {
            $normalized[sanitize_text_field((string) $key)] = sanitize_text_field((string) $value);
        }
    }

    kanna_build_update(
        (int) $access['build']->id,
        array(
            'body_type' => $body_type,
            'body_weight' => $body_weight,
            'measurement_data' => kanna_build_encode_json($normalized),
            'stage' => 'waiting_for_specification',
        )
    );
    kanna_build_log_event((int) $access['build']->id, 'measurements_submitted', array(), null);

    return new WP_REST_Response(
        kanna_build_prepare_portal_payload(kanna_build_get_by_id((int) $access['build']->id), 'authenticated'),
        200
    );
}

/**
 * Stores bike specification data.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_submit_specification($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, true);

    if (is_wp_error($access)) {
        return $access;
    }

    $mode = sanitize_text_field((string) $request->get_param('specificationMode'));
    $values = $request->get_param('values');
    $normalized = array();

    if (is_array($values)) {
        foreach ($values as $key => $value) {
            $normalized[sanitize_text_field((string) $key)] = sanitize_text_field((string) $value);
        }
    }

    kanna_build_update(
        (int) $access['build']->id,
        array(
            'specification_mode' => $mode,
            'specification_data' => kanna_build_encode_json($normalized),
            'stage' => 'waiting_for_design',
        )
    );
    kanna_build_log_event((int) $access['build']->id, 'specification_submitted', array('mode' => $mode), null);

    return new WP_REST_Response(
        kanna_build_prepare_portal_payload(kanna_build_get_by_id((int) $access['build']->id), 'authenticated'),
        200
    );
}

/**
 * Marks the design as approved.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_approve_design($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, true);

    if (is_wp_error($access)) {
        return $access;
    }

    $approved_at = kanna_build_now();
    $user_agent = sanitize_text_field((string) $request->get_header('user-agent'));

    if ($user_agent === '' && isset($_SERVER['HTTP_USER_AGENT'])) {
        $user_agent = sanitize_text_field((string) wp_unslash($_SERVER['HTTP_USER_AGENT']));
    }

    $device_type = kanna_build_detect_device_type($user_agent);

    kanna_build_update(
        (int) $access['build']->id,
        array(
            'design_approved_at' => $approved_at,
            'design_approved_device_type' => $device_type,
            'design_approved_user_agent' => $user_agent,
            'stage' => 'waiting_for_final_payment',
        )
    );
    kanna_build_log_event(
        (int) $access['build']->id,
        'design_approved',
        array(
            'approvedAt' => $approved_at,
            'deviceType' => $device_type,
            'userAgent' => $user_agent,
        ),
        null
    );

    return new WP_REST_Response(
        kanna_build_prepare_portal_payload(kanna_build_get_by_id((int) $access['build']->id), 'authenticated'),
        200
    );
}

/**
 * Returns the payment URL or manual flow for the current build payment.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_payment_link($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, true);

    if (is_wp_error($access)) {
        return $access;
    }

    $build = $access['build'];
    $payment_kind = $request->get_param('paymentKind') === 'final' ? KANNA_PAYMENT_KIND_FINAL : KANNA_PAYMENT_KIND_DEPOSIT;
    $payment_method = $request->get_param('paymentMethod') === 'classic_transfer' ? 'classic_transfer' : 'stripe';
    $extra_data = array();

    if ($payment_kind === KANNA_PAYMENT_KIND_FINAL) {
        $extra_data['shipping'] = kanna_build_calculate_shipping_quote(
            is_array($request->get_param('shipping')) ? $request->get_param('shipping') : array(),
            (float) $build->final_amount
        );

        if (!array_key_exists('shippingCost', $extra_data['shipping']) || $extra_data['shipping']['shippingCost'] === null) {
            return new WP_Error(
                'shipping_estimate_unavailable',
                'Shipping estimate unavailable for this country. Contact us to arrange delivery.',
                array('status' => 400)
            );
        }

        $extra_data['shipping_cost'] = $extra_data['shipping']['shippingCost'];

        kanna_build_update(
            (int) $build->id,
            array(
                'shipping_data' => kanna_build_encode_json($extra_data['shipping']),
            )
        );
    }

    $order_id = kanna_build_create_payment_order((int) $build->id, $payment_kind, $extra_data);

    if (is_wp_error($order_id)) {
        return $order_id;
    }

    $order = wc_get_order($order_id);

    if (!$order) {
        return new WP_Error('payment_order_missing', 'Payment order could not be loaded.', array('status' => 500));
    }

    if ($payment_method === 'classic_transfer') {
        $order->set_payment_method('bacs');
    } else {
        $order->set_payment_method('stripe');
    }

    $order->save();

    if ($payment_method === 'classic_transfer') {
        if (!in_array($order->get_status(), array('on-hold', 'processing', 'completed'), true)) {
            $order->update_status('on-hold', 'Awaiting manual bank transfer verification.');
        }

        $payment_url = add_query_arg(
            array(
                'checkout' => 'manual-review',
                'payment' => $payment_kind === KANNA_PAYMENT_KIND_FINAL ? 'final' : 'deposit',
            ),
            kanna_build_frontend_base_url() . '/order/' . rawurlencode((string) $build->public_order_number)
        );
    } else {
        $stripe_session = kanna_build_create_stripe_checkout_session($build, $order, $payment_kind);

        if (is_wp_error($stripe_session)) {
            return $stripe_session;
        }

        $order->update_meta_data('_kanna_stripe_checkout_session_id', (string) $stripe_session['sessionId']);
        $order->save();
        $payment_url = (string) $stripe_session['url'];
    }

    kanna_build_log_event(
        (int) $build->id,
        $payment_kind === KANNA_PAYMENT_KIND_FINAL ? 'final_payment_link_requested' : 'deposit_payment_link_requested',
        array(
            'payment_method' => $payment_method,
            'order_id' => (int) $order_id,
        ),
        null
    );

    return new WP_REST_Response(
        array(
            'paymentUrl' => $payment_url,
            'orderId' => (int) $order_id,
            'paymentMethod' => $payment_method,
            'build' => kanna_build_prepare_portal_payload(kanna_build_get_by_id((int) $build->id), 'authenticated'),
        ),
        200
    );
}

/**
 * Calculates a WooCommerce shipping quote for the current build.
 *
 * @param WP_REST_Request $request Request instance.
 *
 * @return WP_REST_Response|WP_Error
 */
function kanna_build_rest_shipping_quote($request)
{
    $access = kanna_build_resolve_portal_access((string) $request['public_order_number'], $request, true);

    if (is_wp_error($access)) {
        return $access;
    }

    $build = $access['build'];
    $shipping = kanna_build_calculate_shipping_quote(
        is_array($request->get_param('shipping')) ? $request->get_param('shipping') : array(),
        (float) $build->final_amount
    );

    return new WP_REST_Response(
        array(
            'shipping' => $shipping,
        ),
        200
    );
}
