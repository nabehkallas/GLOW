<?php

return [

    'greeting' => 'مرحباً :name،',

    'appointment_booked' => [
        'title' => 'حجز جديد',
        'body' => 'حجز :service – :time',
    ],

    'appointment_status' => [
        // Full contextual phrase per status, shown as the notification title.
        'confirmed' => 'تم تأكيد موعدك',
        'completed' => 'اكتمل موعدك',
        'cancelled' => 'تم إلغاء موعدك',
        'cancellation_denied' => 'تم رفض طلب إلغاء موعدك',
        'mail_subject' => 'موعدك :status — Prima',
        'mail_line' => 'موعدك لخدمة **:service** بتاريخ :time أصبح **:status**.',
    ],

    'appointment_cancellation_requested' => [
        'title' => 'طلب إلغاء موعد',
        'body' => 'طلب أحد العملاء إلغاء موعده لخدمة :service بتاريخ :time.',
    ],

    'client_order' => [
        'push_title' => 'تحديث الطلب',
        'push_body' => 'الطلب رقم :id أصبح :status',
        'mail_subject' => 'الطلب رقم :id — :status — Prima',
        'mail_line' => 'حالة طلبك رقم **:id** (الإجمالي: :total) أصبحت **:status**.',
    ],

    'new_order' => [
        'title_b2b' => 'طلب تزويد جديد',
        'title_b2c' => 'طلب متجر جديد',
        'body' => 'الطلب رقم :id من :name',
    ],

    'order_return_requested' => [
        'title' => 'طلب إرجاع',
        'body' => 'الطلب رقم :id من :name — تم طلب الإرجاع',
    ],

    'order_cancellation_requested' => [
        'title' => 'طلب إلغاء',
        'body' => 'الطلب رقم :id من :name — تم طلب الإلغاء',
    ],

    'salon_pending' => [
        'mail_subject' => 'صالون جديد بانتظار الموافقة — Prima',
        'mail_line' => 'قام صالون جديد، **:name** (:city)، بالتسجيل وهو بانتظار الموافقة.',
        'mail_action' => 'مراجعة الصالون',
        'push_title' => 'صالون جديد بانتظار الموافقة',
        'push_body' => ':name (:city)',
    ],

    'order' => [
        'mail_subject' => 'الطلب رقم :id — :status — Prima',
        'mail_line' => 'حالة طلبك رقم **:id** (الإجمالي: :total) أصبحت **:status**.',
    ],

    'salon_approved' => [
        'mail_subject' => 'تمت الموافقة على صالونك — Prima',
        'mail_line' => 'تهانينا! تمت الموافقة على صالونك **:name** وهو الآن متاح على Prima.',
        'mail_action' => 'الذهاب إلى لوحة التحكم',
        'mail_footer' => 'يمكن للعملاء الآن اكتشاف خدماتك وحجزها.',
    ],

    'salon_rejected' => [
        'mail_subject' => 'لم تتم الموافقة على طلب صالونك — Prima',
        'mail_line' => 'للأسف، لم تتم الموافقة على صالونك **:name**.',
        'mail_reason' => 'السبب: :reason',
        'mail_footer' => 'يرجى التواصل مع الدعم إذا كانت لديك أي أسئلة.',
    ],

    'statuses' => [
        'pending' => 'قيد الانتظار',
        'confirmed' => 'مؤكد',
        'shipped' => 'تم الشحن',
        'delivered' => 'تم التسليم',
        'cancelled' => 'ملغى',
        'failed' => 'فشل',
        'returned' => 'مرتجع',
        'completed' => 'مكتمل',
        'cancellation_denied' => 'رفض طلب الإلغاء',
        'return_requested' => 'طلب إرجاع',
        'return_denied' => 'رفض طلب الإرجاع، الطلب ما زال في حالة التسليم',
    ],

];
