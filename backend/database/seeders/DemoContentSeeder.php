<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Salon;
use App\Models\SalonService;
use App\Models\User;
use App\Models\WorkingHour;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoContentSeeder extends Seeder
{
    private const STANDARD_HOURS = [
        ['day' => 0, 'closed' => true],
        ['day' => 1, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
        ['day' => 2, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
        ['day' => 3, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
        ['day' => 4, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
        ['day' => 5, 'closed' => false, 'open' => '09:00', 'close' => '19:00'],
        ['day' => 6, 'closed' => false, 'open' => '10:00', 'close' => '17:00'],
    ];

    public function run(): void
    {
        $this->backfillProductImages();
        $this->seedSalons();
        $this->seedProducts();
    }

    /**
     * The 4 products already in DatabaseSeeder that never got an image.
     */
    private function backfillProductImages(): void
    {
        $palette = ['#2db563', '#e8481c', '#3b82f6', '#a855f7'];

        Product::whereNull('image')->get()->each(function (Product $product, int $i) use ($palette) {
            $path = $this->placeholderImage('products', Str::slug($product->name), $product->name, $palette[$i % count($palette)]);
            $product->update(['image' => $path]);
        });
    }

    private function seedSalons(): void
    {
        $salons = [
            [
                'owner_email' => 'salon2@glow.com',
                'owner_name'  => 'Yasmin Haddad',
                'owner_phone' => '+963 99 100 0002',
                'name'        => 'Damascus Rose Salon',
                'description' => 'A cozy salon in the old city, specializing in bridal hair and traditional henna art.',
                'address'     => 'Al-Qaimariyah Street',
                'city'        => 'Damascus',
                'latitude'    => 33.5138,
                'longitude'   => 36.2765,
                'color'       => '#e8481c',
                'services'    => [
                    ['name' => 'Bridal Hair Styling', 'price' => 90, 'duration_minutes' => 90, 'category' => 'Hair'],
                    ['name' => 'Henna Art',            'price' => 25, 'duration_minutes' => 45, 'category' => 'Nails'],
                    ['name' => 'Classic Facial',       'price' => 50, 'duration_minutes' => 60, 'category' => 'Skin'],
                ],
            ],
            [
                'owner_email' => 'salon3@glow.com',
                'owner_name'  => 'Rania Aziz',
                'owner_phone' => '+963 99 200 0003',
                'name'        => 'Aleppo Elegance Studio',
                'description' => 'Modern styling studio known for precision haircuts and keratin treatments.',
                'address'     => 'Al-Furqan District',
                'city'        => 'Aleppo',
                'latitude'    => 36.2021,
                'longitude'   => 37.1343,
                'color'       => '#263238',
                'services'    => [
                    ['name' => 'Keratin Treatment', 'price' => 100, 'duration_minutes' => 120, 'category' => 'Hair'],
                    ['name' => 'Haircut & Style',    'price' => 35,  'duration_minutes' => 45,  'category' => 'Hair'],
                    ['name' => 'Manicure',           'price' => 25,  'duration_minutes' => 40,  'category' => 'Nails'],
                ],
            ],
            [
                'owner_email' => 'salon4@glow.com',
                'owner_name'  => 'Amina Bensaid',
                'owner_phone' => '+212 6 61 000 004',
                'name'        => 'Casablanca Glow Spa',
                'description' => 'A relaxing spa offering full-body treatments and Moroccan hammam rituals.',
                'address'     => 'Boulevard Anfa',
                'city'        => 'Casablanca',
                'latitude'    => 33.5731,
                'longitude'   => -7.5898,
                'color'       => '#2db563',
                'services'    => [
                    ['name' => 'Moroccan Hammam',  'price' => 60, 'duration_minutes' => 90, 'category' => 'Skin'],
                    ['name' => 'Deep Tissue Massage', 'price' => 70, 'duration_minutes' => 60, 'category' => 'Skin'],
                    ['name' => 'Pedicure',         'price' => 30, 'duration_minutes' => 45, 'category' => 'Nails'],
                ],
            ],
            [
                'owner_email' => 'salon5@glow.com',
                'owner_name'  => 'Leila Mansour',
                'owner_phone' => '+216 20 100 0005',
                'name'        => 'Tunis Beauty Lounge',
                'description' => 'Chic lounge for hair coloring, lash extensions, and everyday glam.',
                'address'     => 'Avenue Habib Bourguiba',
                'city'        => 'Tunis',
                'latitude'    => 36.8065,
                'longitude'   => 10.1815,
                'color'       => '#9333ea',
                'services'    => [
                    ['name' => 'Full Color',        'price' => 80, 'duration_minutes' => 100, 'category' => 'Hair'],
                    ['name' => 'Lash Extensions',   'price' => 45, 'duration_minutes' => 60,  'category' => 'Makeup'],
                    ['name' => 'Blow Dry',          'price' => 20, 'duration_minutes' => 30,  'category' => 'Hair'],
                ],
            ],
            [
                'owner_email' => 'salon6@glow.com',
                'owner_name'  => 'Nour El-Sayed',
                'owner_phone' => '+20 10 1000 0006',
                'name'        => 'Cairo Silk & Shine',
                'description' => 'Award-winning salon for silky blowouts and expert nail art.',
                'address'     => 'Zamalek District',
                'city'        => 'Cairo',
                'latitude'    => 30.0444,
                'longitude'   => 31.2357,
                'color'       => '#eab308',
                'services'    => [
                    ['name' => 'Silk Blowout',  'price' => 40, 'duration_minutes' => 50, 'category' => 'Hair'],
                    ['name' => 'Nail Art',      'price' => 35, 'duration_minutes' => 60, 'category' => 'Nails'],
                    ['name' => 'Eyebrow Threading', 'price' => 10, 'duration_minutes' => 15, 'category' => 'Makeup'],
                ],
            ],
            [
                'owner_email' => 'salon7@glow.com',
                'owner_name'  => 'Dana Qasim',
                'owner_phone' => '+962 7 9000 0007',
                'name'        => 'Amman Radiance Salon',
                'description' => 'Family-friendly salon offering haircuts, coloring, and skincare for all ages.',
                'address'     => 'Rainbow Street',
                'city'        => 'Amman',
                'latitude'    => 31.9454,
                'longitude'   => 35.9284,
                'color'       => '#0ea5e9',
                'services'    => [
                    ['name' => 'Haircut & Blow Dry', 'price' => 30, 'duration_minutes' => 45, 'category' => 'Hair'],
                    ['name' => 'Highlights',         'price' => 90, 'duration_minutes' => 120, 'category' => 'Hair'],
                    ['name' => 'Classic Facial',     'price' => 55, 'duration_minutes' => 60, 'category' => 'Skin'],
                ],
            ],
        ];

        foreach ($salons as $data) {
            $owner = User::firstOrCreate(
                ['email' => $data['owner_email']],
                ['name' => $data['owner_name'], 'password' => Hash::make('password'), 'role' => 'salon', 'phone' => $data['owner_phone']]
            );

            $logoPath = $this->placeholderImage('logos', Str::slug($data['name']), $data['name'], $data['color'], 500, 500);

            $salon = Salon::firstOrCreate(
                ['name' => $data['name']],
                [
                    'user_id'     => $owner->id,
                    'description' => $data['description'],
                    'address'     => $data['address'],
                    'city'        => $data['city'],
                    'latitude'    => $data['latitude'],
                    'longitude'   => $data['longitude'],
                    'status'      => 'approved',
                    'capacity'    => 1,
                    'logo'        => $logoPath,
                ]
            );

            if (!$salon->logo) {
                $salon->update(['logo' => $logoPath]);
            }

            foreach (self::STANDARD_HOURS as $h) {
                WorkingHour::updateOrCreate(
                    ['salon_id' => $salon->id, 'day_of_week' => $h['day']],
                    ['is_closed' => $h['closed'], 'open_time' => $h['open'] ?? null, 'close_time' => $h['close'] ?? null]
                );
            }

            foreach ($data['services'] as $s) {
                SalonService::firstOrCreate(
                    ['salon_id' => $salon->id, 'name' => $s['name']],
                    [...$s, 'is_active' => true]
                );
            }
        }
    }

    private function seedProducts(): void
    {
        $categoriesAr = [
            'Hair Care' => 'العناية بالشعر',
            'Skin Care' => 'العناية بالبشرة',
            'Nails'     => 'الأظافر',
            'Makeup'    => 'المكياج',
            'Tools'     => 'الأدوات',
        ];

        $products = [
            // Hair Care
            ['name' => 'Kerastase Hair Mask',      'description' => 'Deep repair mask for damaged, color-treated hair.',       'price' => 38, 'client_price' => 55, 'stock' => 25, 'category' => 'Hair Care', 'color' => '#e8481c'],
            ['name' => 'Redken Shampoo',            'description' => 'Sulfate-free shampoo for daily use, all hair types.',      'price' => 20, 'client_price' => 32, 'stock' => 40, 'category' => 'Hair Care', 'color' => '#e8481c'],
            ['name' => 'Argan Oil Serum',            'description' => 'Lightweight finishing serum for shine and frizz control.', 'price' => 18, 'client_price' => 29, 'stock' => 35, 'category' => 'Hair Care', 'color' => '#e8481c'],
            // Skin Care
            ['name' => 'Vitamin C Serum',            'description' => 'Brightening serum with 15% vitamin C for daily glow.',    'price' => 25, 'client_price' => 42, 'stock' => 30, 'category' => 'Skin Care', 'color' => '#2db563'],
            ['name' => 'Hyaluronic Acid Moisturizer', 'description' => 'Deep hydration cream for all skin types.',                'price' => 22, 'client_price' => 38, 'stock' => 28, 'category' => 'Skin Care', 'color' => '#2db563'],
            ['name' => 'Clay Face Mask',              'description' => 'Purifying clay mask for oily and combination skin.',     'price' => 15, 'client_price' => 24, 'stock' => 45, 'category' => 'Skin Care', 'color' => '#2db563'],
            // Nails
            ['name' => 'Gel Polish Kit',              'description' => 'Long-lasting gel polish set with base and top coat.',    'price' => 32, 'client_price' => 50, 'stock' => 20, 'category' => 'Nails', 'color' => '#a855f7'],
            ['name' => 'Cuticle Oil Set',             'description' => 'Nourishing cuticle oils in three fragrances.',           'price' => 14, 'client_price' => 22, 'stock' => 30, 'category' => 'Nails', 'color' => '#a855f7'],
            ['name' => 'Nail Art Kit',                'description' => 'Complete kit with brushes, gems, and stencils.',         'price' => 20, 'client_price' => 33, 'stock' => 18, 'category' => 'Nails', 'color' => '#a855f7'],
            // Makeup
            ['name' => 'Matte Lipstick Set',          'description' => 'Six long-wearing matte shades in one set.',              'price' => 28, 'client_price' => 45, 'stock' => 22, 'category' => 'Makeup', 'color' => '#eab308'],
            ['name' => 'Eyeshadow Palette',           'description' => '12-shade neutral and bold eyeshadow palette.',           'price' => 30, 'client_price' => 48, 'stock' => 20, 'category' => 'Makeup', 'color' => '#eab308'],
            ['name' => 'Foundation Stick',            'description' => 'Buildable full-coverage foundation, 10 shades.',         'price' => 24, 'client_price' => 39, 'stock' => 26, 'category' => 'Makeup', 'color' => '#eab308'],
            // Tools
            ['name' => 'Ceramic Hair Straightener',   'description' => 'Professional-grade ceramic plates, adjustable heat.',    'price' => 55, 'client_price' => 85, 'stock' => 15, 'category' => 'Tools', 'color' => '#3b82f6'],
            ['name' => 'Professional Hair Dryer',     'description' => 'Ionic hair dryer with diffuser and concentrator.',       'price' => 65, 'client_price' => 99, 'stock' => 12, 'category' => 'Tools', 'color' => '#3b82f6'],
            ['name' => 'Rotating Hair Brush Set',     'description' => 'Three-piece volumizing round brush set.',                'price' => 26, 'client_price' => 40, 'stock' => 24, 'category' => 'Tools', 'color' => '#3b82f6'],
        ];

        foreach ($products as $p) {
            $path = $this->placeholderImage('products', Str::slug($p['name']), $p['name'], $p['color']);

            Product::firstOrCreate(
                ['name' => $p['name']],
                [
                    'description'  => $p['description'],
                    'price'        => $p['price'],
                    'client_price' => $p['client_price'],
                    'stock'        => $p['stock'],
                    'category_en'  => $p['category'],
                    'category_ar'  => $categoriesAr[$p['category']] ?? null,
                    'image'        => $path,
                    'is_active'    => true,
                ]
            );
        }
    }

    /**
     * Generate a simple solid-color placeholder JPEG with the given text centered on it,
     * saved at a stable slug-based path (so re-running the seeder overwrites instead of
     * piling up new files each time).
     */
    private function placeholderImage(string $folder, string $slug, string $text, string $hex, int $width = 640, int $height = 400): string
    {
        $path = "{$folder}/{$slug}.png";

        sscanf($hex, '#%02x%02x%02x', $r, $g, $b);
        $im = imagecreatetruecolor($width, $height);
        $bg = imagecolorallocate($im, $r, $g, $b);
        imagefilledrectangle($im, 0, 0, $width, $height, $bg);

        $white = imagecolorallocate($im, 255, 255, 255);
        $font = 5;
        $charWidth = imagefontwidth($font);
        $charHeight = imagefontheight($font);
        $maxCharsPerLine = max(1, intdiv((int) ($width * 0.8), $charWidth));

        $lines = [];
        $current = '';
        foreach (explode(' ', $text) as $word) {
            $test = trim($current . ' ' . $word);
            if (strlen($test) > $maxCharsPerLine && $current !== '') {
                $lines[] = $current;
                $current = $word;
            } else {
                $current = $test;
            }
        }
        if ($current !== '') $lines[] = $current;

        $lineHeight = $charHeight + 6;
        $startY = intdiv($height - count($lines) * $lineHeight, 2);

        foreach ($lines as $i => $line) {
            $lineWidth = strlen($line) * $charWidth;
            $x = intdiv($width - $lineWidth, 2);
            $y = $startY + $i * $lineHeight;
            imagestring($im, $font, $x, $y, $line, $white);
        }

        ob_start();
        imagepng($im, null, 6);
        $data = ob_get_clean();
        imagedestroy($im);

        Storage::disk('public')->put($path, $data);

        return $path;
    }
}
