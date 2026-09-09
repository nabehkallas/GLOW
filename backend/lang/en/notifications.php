<?php

return [

    'greeting' => 'Hello :name,',

    'appointment_booked' => [
        'title' => 'New Booking',
        'body' => ':service – :time',
    ],

    'appointment_status' => [
        'confirmed' => 'Your appointment is confirmed',
        'completed' => 'Your appointment is complete',
        'cancelled' => 'Your appointment was cancelled',
        'cancellation_denied' => 'Your cancellation request was denied',
        'mail_subject' => 'Appointment :status — Prima',
        'mail_line' => 'Your appointment for **:service** on :time has been **:status**.',
    ],

    'appointment_cancellation_requested' => [
        'title' => 'Cancellation requested',
        'body' => 'A client requested to cancel their appointment for :service on :time.',
    ],

    'client_order' => [
        'push_title' => 'Order Update',
        'push_body' => 'Order #:id is now :status',
        'mail_subject' => 'Order #:id :status — Prima',
        'mail_line' => 'Your order **#:id** (total: :total) status has changed to **:status**.',
    ],

    'new_order' => [
        'title_b2b' => 'New restock order',
        'title_b2c' => 'New shop order',
        'body' => 'Order #:id from :name',
    ],

    'order_return_requested' => [
        'title' => 'Return requested',
        'body' => 'Order #:id from :name — return requested',
    ],

    'order_cancellation_requested' => [
        'title' => 'Cancellation requested',
        'body' => 'Order #:id from :name — cancellation requested',
    ],

    'salon_pending' => [
        'mail_subject' => 'New salon awaiting approval — Prima',
        'mail_line' => 'A new salon, **:name** (:city), has registered and is awaiting approval.',
        'mail_action' => 'Review Salon',
        'push_title' => 'New salon awaiting approval',
        'push_body' => ':name (:city)',
    ],

    'order' => [
        'mail_subject' => 'Order #:id :status — Prima',
        'mail_line' => 'Your order **#:id** (total: :total) status has changed to **:status**.',
    ],

    'salon_approved' => [
        'mail_subject' => 'Your salon has been approved — Prima',
        'mail_line' => 'Congratulations! Your salon **:name** has been approved and is now live on Prima.',
        'mail_action' => 'Go to Dashboard',
        'mail_footer' => 'Clients can now discover and book your services.',
    ],

    'salon_rejected' => [
        'mail_subject' => 'Your salon application was not approved — Prima',
        'mail_line' => 'Unfortunately, your salon **:name** was not approved.',
        'mail_reason' => 'Reason: :reason',
        'mail_footer' => 'Please contact support if you have questions.',
    ],

    'statuses' => [
        'pending' => 'pending',
        'confirmed' => 'confirmed',
        'shipped' => 'shipped',
        'delivered' => 'delivered',
        'cancelled' => 'cancelled',
        'failed' => 'failed',
        'returned' => 'returned',
        'completed' => 'completed',
        'cancellation_denied' => 'cancellation denied',
        'return_requested' => 'return requested',
        'return_denied' => 'kept delivered (return denied)',
    ],

];
