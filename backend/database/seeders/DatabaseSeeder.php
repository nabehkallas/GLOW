<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Salon;
use App\Models\SalonService;
use App\Models\User;
use App\Models\WorkingHour;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@glow.com'],
            ['name' => 'Super Admin', 'password' => Hash::make('password'), 'role' => 'admin']
        );

        // ── Salon owner ────────────────────────────────────────
        $salonUser = User::firstOrCreate(
            ['email' => 'salon@glow.com'],
            ['name' => 'Sara Khalil', 'password' => Hash::make('password'), 'role' => 'salon', 'phone' => '+961 71 000 001']
        );

        $salon = Salon::firstOrCreate(
            ['user_id' => $salonUser->id],
            [
                'name'        => 'Glow Beauty Studio',
                'description' => 'Premium hair and beauty treatments in the heart of Beirut.',
                'address'     => '14 Hamra Street',
                'city'        => 'Beirut',
                'latitude'    => 33.8938,
                'longitude'   => 35.5018,
                'status'      => 'approved',
            ]
        );

        // ── Working Hours (Mon–Sat open, Sun closed) ───────────
        $schedule = [
            ['day' => 0, 'closed' => true],
            ['day' => 1, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
            ['day' => 2, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
            ['day' => 3, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
            ['day' => 4, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
            ['day' => 5, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
            ['day' => 6, 'closed' => false, 'open' => '10:00', 'close' => '17:00'],
        ];

        foreach ($schedule as $s) {
            WorkingHour::updateOrCreate(
                ['salon_id' => $salon->id, 'day_of_week' => $s['day']],
                ['is_closed' => $s['closed'], 'open_time' => $s['open'] ?? null, 'close_time' => $s['close'] ?? null]
            );
        }

        // ── Services ───────────────────────────────────────────
        $services = [
            ['name' => 'Haircut & Blow Dry',    'price' => 45,  'duration_minutes' => 60,  'category' => 'Hair'],
            ['name' => 'Full Color',             'price' => 120, 'duration_minutes' => 120, 'category' => 'Hair'],
            ['name' => 'Highlights',             'price' => 150, 'duration_minutes' => 150, 'category' => 'Hair'],
            ['name' => 'Manicure',               'price' => 30,  'duration_minutes' => 45,  'category' => 'Nails'],
            ['name' => 'Pedicure',               'price' => 40,  'duration_minutes' => 60,  'category' => 'Nails'],
            ['name' => 'Classic Facial',         'price' => 80,  'duration_minutes' => 60,  'category' => 'Skin'],
        ];

        $createdServices = [];
        foreach ($services as $s) {
            $createdServices[] = SalonService::firstOrCreate(
                ['salon_id' => $salon->id, 'name' => $s['name']],
                [...$s, 'is_active' => true]
            );
        }

        // ── Products ───────────────────────────────────────────
        $products = [
            ['name' => 'Olaplex No.3',           'price' => 28,  'stock' => 50, 'category' => 'Hair Care'],
            ['name' => 'Moroccan Oil Treatment',  'price' => 45,  'stock' => 30, 'category' => 'Hair Care'],
            ['name' => 'OPI Nail Polish Set',     'price' => 60,  'stock' => 20, 'category' => 'Nails'],
            ['name' => 'La Mer Face Cream',       'price' => 180, 'stock' => 15, 'category' => 'Skin Care'],
            ['name' => 'Color Depositing Mask',   'price' => 22,  'stock' => 40, 'category' => 'Hair Care'],
        ];

        $createdProducts = [];
        foreach ($products as $p) {
            $createdProducts[] = Product::firstOrCreate(
                ['name' => $p['name']],
                [...$p, 'is_active' => true]
            );
        }

        // ── Client ─────────────────────────────────────────────
        $client = User::firstOrCreate(
            ['email' => 'client@glow.com'],
            ['name' => 'Lara Nassar', 'password' => Hash::make('password'), 'role' => 'client', 'phone' => '+961 70 000 002']
        );

        // ── Appointments ───────────────────────────────────────
        $haircut  = $createdServices[0];
        $color    = $createdServices[1];
        $manicure = $createdServices[3];

        $appointments = [
            // completed — can be reviewed
            [
                'service'      => $haircut,
                'scheduled_at' => now()->subDays(10)->setTime(10, 0),
                'status'       => 'completed',
            ],
            // completed — can be reviewed
            [
                'service'      => $manicure,
                'scheduled_at' => now()->subDays(5)->setTime(11, 0),
                'status'       => 'completed',
            ],
            // confirmed — upcoming
            [
                'service'      => $color,
                'scheduled_at' => now()->addDays(3)->setTime(14, 0),
                'status'       => 'confirmed',
            ],
            // pending
            [
                'service'      => $manicure,
                'scheduled_at' => now()->addDays(7)->setTime(10, 0),
                'status'       => 'pending',
            ],
            // cancelled
            [
                'service'      => $haircut,
                'scheduled_at' => now()->subDays(2)->setTime(15, 0),
                'status'       => 'cancelled',
            ],
        ];

        $createdAppointments = [];
        foreach ($appointments as $a) {
            $createdAppointments[] = Appointment::firstOrCreate(
                [
                    'client_id'        => $client->id,
                    'salon_id'         => $salon->id,
                    'salon_service_id' => $a['service']->id,
                    'scheduled_at'     => $a['scheduled_at'],
                ],
                [
                    'status'           => $a['status'],
                    'price_at_booking' => $a['service']->price,
                ]
            );
        }

        // ── Reviews (on completed appointments) ────────────────
        $completedAppts = array_filter($createdAppointments, fn($a) => $a->status === 'completed');
        $reviews = [
            ['rating' => 5, 'comment' => 'Amazing haircut! Sara is so talented, highly recommend.'],
            ['rating' => 4, 'comment' => 'Great manicure, very clean and professional.'],
        ];

        foreach (array_values($completedAppts) as $i => $appt) {
            if (!isset($reviews[$i])) break;
            Review::firstOrCreate(
                ['appointment_id' => $appt->id],
                [
                    'client_id' => $client->id,
                    'salon_id'  => $salon->id,
                    'rating'    => $reviews[$i]['rating'],
                    'comment'   => $reviews[$i]['comment'],
                ]
            );
        }

        // ── Orders ─────────────────────────────────────────────
        $order = Order::firstOrCreate(
            ['salon_id' => $salon->id, 'status' => 'pending'],
            ['total_amount' => $createdProducts[0]->price * 2 + $createdProducts[2]->price, 'status' => 'pending']
        );

        if ($order->items()->count() === 0) {
            $order->items()->createMany([
                ['product_id' => $createdProducts[0]->id, 'quantity' => 2, 'unit_price' => $createdProducts[0]->price],
                ['product_id' => $createdProducts[2]->id, 'quantity' => 1, 'unit_price' => $createdProducts[2]->price],
            ]);
        }
    }
}
