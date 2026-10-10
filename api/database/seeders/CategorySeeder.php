<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * [name_ms, name_en, off_tag, coming_soon, [[sub_ms, sub_en, off_tag], ...]]
     * Categories 10-12 are browse-only in v1 (see planning doc).
     */
    private array $categories = [
        ['Makanan', 'Food', 'en:foods', false, [
            ['Snek', 'Snacks', 'en:snacks'],
            ['Makanan segera', 'Instant food', 'en:instant-foods'],
            ['Roti & kek', 'Bakery', 'en:bakery-products'],
            ['Sos & perencah', 'Sauces & condiments', 'en:sauces'],
            ['Rempah & pes', 'Spices & paste', 'en:spices'],
            ['Beku', 'Frozen', 'en:frozen-foods'],
            ['Tin', 'Canned', 'en:canned-foods'],
            ['Beras & mi', 'Rice & noodles', 'en:cereals-and-potatoes'],
        ]],
        ['Minuman', 'Beverages', 'en:beverages', false, [
            ['Kopi & teh', 'Coffee & tea', 'en:coffees'],
            ['Jus', 'Juice', 'en:juices'],
            ['Berkarbonat', 'Carbonated', 'en:carbonated-drinks'],
            ['Malt / 3-dalam-1', 'Malt/3-in-1', 'en:malt-drinks'],
            ['Air mineral', 'Bottled water', 'en:waters'],
        ]],
        ['Tenusu & Telur', 'Dairy & Eggs', 'en:dairies', false, [
            ['Susu', 'Milk', 'en:milks'],
            ['Yogurt', 'Yogurt', 'en:yogurts'],
            ['Keju', 'Cheese', 'en:cheeses'],
            ['Telur', 'Eggs', 'en:eggs'],
        ]],
        ['Konfeksi', 'Confectionery', 'en:confectioneries', false, [
            ['Coklat', 'Chocolate', 'en:chocolates'],
            ['Gula-gula', 'Candy', 'en:candies'],
            ['Biskut', 'Biscuits', 'en:biscuits'],
        ]],
        ['Penjagaan Diri', 'Personal Care', 'en:personal-care', false, [
            ['Penjagaan kulit', 'Skincare', 'en:skin-care'],
            ['Penjagaan rambut', 'Haircare', 'en:hair-care'],
            ['Badan', 'Body', 'en:body-care'],
            ['Penjagaan mulut', 'Oral care', 'en:oral-care'],
            ['Minyak wangi', 'Fragrance', 'en:perfumes'],
        ]],
        ['Kosmetik', 'Cosmetics', 'en:makeup', false, [
            ['Solekan', 'Makeup', 'en:makeup'],
            ['Kuku', 'Nails', 'en:nail-care'],
        ]],
        ['Kesihatan', 'Health', 'en:health', false, [
            ['Suplemen', 'Supplements', 'en:dietary-supplements'],
            ['Herba (jamu)', 'Herbal (jamu)', 'en:herbal-products'],
            ['Ubat OTC', 'OTC', 'en:otc-medicines'],
        ]],
        ['Rumah', 'Household', 'en:household', false, [
            ['Pembersih', 'Cleaning', 'en:cleaning-products'],
            ['Dobi', 'Laundry', 'en:laundry-products'],
            ['Peralatan dapur', 'Kitchenware', 'en:kitchenware'],
        ]],
        ['Bayi & Kanak-kanak', 'Baby & Kids', 'en:baby-products', false, [
            ['Susu formula', 'Formula', 'en:infant-formulas'],
            ['Lampin', 'Diapers', 'en:diapers'],
            ['Penjagaan bayi', 'Baby care', 'en:baby-care'],
        ]],
        ['Fesyen', 'Fashion', null, true, [
            ['Pakaian', 'Clothing', null],
            ['Batik & songket', 'Batik & songket', null],
            ['Kasut', 'Shoes', null],
            ['Beg', 'Bags', null],
        ]],
        ['Elektronik & Automotif', 'Electronics & Automotive', null, true, [
            ['Perkakas', 'Appliances', null],
            ['Gajet', 'Gadgets', null],
            ['Alat ganti kereta', 'Car parts', null],
        ]],
        ['Kraf & Lain-lain', 'Crafts & Others', null, true, [
            ['Kraftangan', 'Handicraft', null],
            ['Piuter', 'Pewter', null],
            ['Cenderamata', 'Souvenirs', null],
            ['Alat tulis', 'Stationery', null],
        ]],
    ];

    public function run(): void
    {
        foreach ($this->categories as $i => [$ms, $en, $tag, $soon, $subs]) {
            $parent = Category::updateOrCreate(
                ['slug' => Str::slug($en)],
                ['name_ms' => $ms, 'name_en' => $en, 'off_tag' => $tag, 'coming_soon' => $soon, 'sort_order' => $i + 1],
            );

            foreach ($subs as $j => [$subMs, $subEn, $subTag]) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($en.' '.$subEn)],
                    [
                        'parent_id' => $parent->id,
                        'name_ms' => $subMs,
                        'name_en' => $subEn,
                        'off_tag' => $subTag,
                        'coming_soon' => $soon,
                        'sort_order' => $j + 1,
                    ],
                );
            }
        }
    }
}
