// Core i18n library: holds the translations and the current language.
import i18n from 'i18next'
// Connects i18next to React so components can call useTranslation().
import { initReactI18next } from 'react-i18next'

// All user-facing copy lives here. BM ("ms") is the default; EN is the toggle. (DESIGN.md rule)
const resources = {
  // Bahasa Malaysia strings.
  ms: {
    translation: {
      // App name shown in the header wordmark.
      appName: 'MakaKami',
      // Generic states.
      loading: 'Memuatkan…',
      error: 'Tidak dapat memuatkan data. Sila cuba lagi.',
      empty: 'Belum ada produk lagi.',
      // Accessible name of the BM/EN switch (screen readers read this).
      switchLanguage: 'Tukar bahasa',
      // Words that appear on category cards.
      comingSoon: 'Datang tak lama lagi',
      // Home screen copy (from 1-mobile-home.html).
      home: {
        welcome: 'Selamat datang',
        headline: 'Produk ni buatan Malaysia ke?',
        searchLabel: 'Cari produk atau jenama',
        searchPlaceholder: 'cth. kicap, kerepek, sabun',
        scanTitle: 'Imbas kod bar',
        scanSubtitle: 'Halakan kamera ke kod bar untuk semak asal produk',
        categories: 'Kategori',
        seeAll: 'Lihat semua',
        recentlyVerified: 'Baru disahkan',
      },
      // Scan screen copy (from 2-mobile-scan.html).
      scan: {
        title: 'Imbas kod bar',
        close: 'Tutup',
        torch: 'Lampu suluh',
        hint: 'Letak kod bar dalam kotak',
        hintAuto: 'Imbasan berlaku secara automatik',
        manualLabel: 'Tak boleh imbas? Taip kod bar',
        manualPlaceholder: 'cth. 955…',
        check: 'Semak',
        invalid: 'Kod bar mesti 8 hingga 14 digit.',
        recent: 'Imbasan terkini',
        noRecent: 'Belum ada imbasan.',
        cameraDenied: 'Kamera tidak dapat dibuka. Benarkan akses kamera, atau taip kod bar di bawah.',
        cameraUnsupported: 'Kamera tidak tersedia pada pelayar ini. Taip kod bar di bawah.',
      },
      // Desktop home page (6-web-home.html).
      web: {
        badge: 'Maka kami, rakyat Malaysia…',
        headline1: 'Produk ni buatan Malaysia ke?',
        headline2: 'Semak dalam satu imbasan.',
        lead: 'Imbas kod bar, cari nama produk atau layari kategori. Setiap keputusan disertakan bukti supaya anda boleh sokong produk tempatan dengan yakin.',
        scanCta: 'Imbas dengan kamera',
        uploadCta: 'Muat naik gambar kod bar',
        uploadHint: 'Atau taip kod bar di bar carian di atas.',
        uploadFail: 'Tiada kod bar dikesan dalam gambar itu. Cuba gambar yang lebih jelas.',
        sampleLabel: 'Contoh keputusan imbasan',
        howTitle: 'Cara ia berfungsi',
        step1: { t: 'Imbas atau cari', d: 'Imbas kod bar dengan kamera, muat naik gambar, atau cari nama produk dan jenama.' },
        step2: { t: 'Semak bukti', d: 'Lihat status asal, tahap keyakinan dan bukti seperti foto label dan alamat pengilang.' },
        step3: { t: 'Sokong tempatan', d: 'Bukan produk Malaysia? Kami tunjukkan alternatif tempatan dalam kategori yang sama.' },
        browseTitle: 'Layari kategori',
        browseAll: 'Lihat semua produk',
        legendTitle: 'Maksud setiap lencana',
        legend: {
          verified_my: 'Disahkan admin melalui foto label atau alamat pengilang.',
          likely_my: 'Data terbuka atau undian pengguna menunjukkan buatan Malaysia.',
          unknown: 'Belum ada bukti. Anda boleh bantu dengan foto label.',
          foreign: 'Kami cadangkan alternatif tempatan yang serupa.',
        },
        footerTag: 'Sokong produk Malaysia',
      },
      // Categories page (4-mobile-categories.html).
      cat: { title: 'Kategori', search: 'Cari kategori', none: 'Tiada kategori sepadan.' },
      // Category list, filters and pagination (5-mobile-category-list.html, 7-web-catalogue.html).
      list: {
        count: '{{n}} produk Malaysia',
        countWeb: '{{n}} produk Malaysia · {{subs}} dan banyak lagi',
        filter: 'Tapis',
        reset: 'Set semula',
        subcategory: 'Subkategori',
        statusLabel: 'Status asal',
        state: 'Negeri pengilang',
        allStates: 'Semua negeri',
        halalOnly: 'Halal sahaja',
        showResults: 'Papar hasil',
        sort: 'Susun',
        sortPopular: 'Paling popular',
        sortNewest: 'Terbaru',
        sortAz: 'A–Z',
        all: 'Semua',
        empty: 'Tiada produk sepadan lagi.',
        emptyHint: 'Cuba tukar penapis, atau imbas produk untuk menambahnya.',
        comingSoonNote: 'Kategori ini datang tak lama lagi. Produk akan ditambah apabila komuniti mula menyumbang.',
        prev: 'Sebelumnya',
        next: 'Seterusnya',
        pages: 'Halaman',
        breadcrumb: 'Laluan',
        home: 'Utama',
        removeFilter: 'Buang penapis {{name}}',
        searchIn: 'Cari dalam {{name}}',
        state_chip: 'Negeri: {{name}}',
      },
      // Search page.
      search: {
        title: 'Cari',
        results: '{{n}} hasil',
        none: 'Tiada hasil untuk "{{q}}".',
        checkBarcode: 'Semak kod bar {{code}}',
        prompt: 'Taip nama produk, jenama atau kod bar.',
        inCategory: 'Dalam kategori: {{name}}',
      },
      // Legal pages and links (the full text lives in src/legal/content.ts).
      legal: {
        terms: 'Terma Perkhidmatan',
        privacy: 'Dasar Privasi',
        navLabel: 'Maklumat undang-undang',
        dataCredit: 'Data produk daripada',
        draftBanner: 'Draf: teks ini belum disemak oleh peguam dan boleh berubah sebelum pelancaran.',
        version: 'Versi: {{v}}',
        scanNotice: 'Imbasan direkodkan tanpa nama.',
      },
      // Result screen copy (from 3-mobile-result.html). Verdict text for statuses not in the design is marked (new).
      result: {
        title: 'Keputusan',
        back: 'Kembali',
        share: 'Kongsi',
        linkCopied: 'Pautan disalin',
        confidence: 'Tahap keyakinan',
        conf: { high: 'Tinggi', mid: 'Sederhana', low: 'Rendah' },
        evidence: 'Bukti',
        labelChecked: 'Foto label disahkan',
        labelCheckedSub: 'Foto label disemak oleh admin',
        manufacturer: 'Pengilang: {{name}}',
        prefix955: 'Kod bar bermula 955',
        prefix955Sub: 'Jenama berdaftar dengan GS1 Malaysia',
        offlineNote: 'Tiada sambungan. Memaparkan data yang disimpan pada {{date}}.',
        reviewNote: 'Catatan semakan',
        madeIn: 'Dibuat di: {{place}}',
        madeInSub: 'Berdasarkan data terbuka',
        sourcePrefix: 'Sumber data:',
        halal: 'Halal: {{status}}',
        halalYes: 'Ya',
        halalNo: 'Tidak',
        halalUnknown: 'Tiada maklumat',
        jakim: 'Semak di portal JAKIM',
        alt: { similar: 'Produk Malaysia serupa', category: 'Pilihan Malaysia dalam kategori ini', foreign: 'Alternatif buatan Malaysia' },
        cta: { verified: 'Imbas lagi', likely: 'Bantu sahkan', unknown: 'Ambil foto label', foreign: 'Lihat alternatif' },
        report: 'Laporkan salah',
        notFoundTitle: 'Produk tidak dijumpai',
        notFoundBody: 'Kami belum ada produk dengan kod bar {{barcode}}.',
        scanAgain: 'Imbas lagi',
        verdict: {
          verified_my: { title: 'Buatan Malaysia', sub: 'Disahkan admin berdasarkan foto label' },
          likely_my: { title: 'Mungkin buatan Malaysia', sub: 'Berdasarkan data terbuka dan undian pengguna. Belum disahkan admin.' },
          unknown: { title: 'Belum disahkan', sub: 'Kami belum ada maklumat asal produk ini. Ambil foto label untuk bantu.' },
          foreign: { title: 'Bukan produk Malaysia', sub: 'Mahu sokong produk tempatan? Cuba alternatif di bawah.' },
          // (new) statuses the design file doesn't cover:
          my_brand_unknown_origin: { title: 'Jenama Malaysia, asal belum disahkan', sub: 'Jenama ini berdaftar di Malaysia tetapi tempat pembuatan belum disahkan. Ambil foto label untuk bantu.' },
          my_brand_overseas: { title: 'Jenama Malaysia, dibuat luar negara', sub: 'Jenama ini milik Malaysia tetapi produk ini dibuat di luar negara.' },
          foreign_made_my: { title: 'Dibuat di Malaysia (jenama asing)', sub: 'Jenama asing, tetapi produk ini dikilang di Malaysia.' },
        },
      },
      // Short category names used in the 4-up tiles on Home, keyed by category slug.
      catShort: {
        food: 'Makanan',
        beverages: 'Minuman',
        'personal-care': 'Diri',
        household: 'Rumah',
      },
      // Bottom tab bar labels.
      tabs: {
        label: 'Navigasi utama',
        home: 'Utama',
        categories: 'Kategori',
        scan: 'Imbas',
        search: 'Cari',
        profile: 'Profil',
      },
      // Top navigation (web, >= 1024px).
      nav: {
        label: 'Utama',
        categories: 'Kategori',
        howItWorks: 'Cara ia berfungsi',
        about: 'Tentang',
        searchLabel: 'Cari produk',
        searchPlaceholder: 'Cari produk, jenama atau kod bar',
        login: 'Log masuk',
        downloadApk: 'Muat turun APK',
      },
      // Origin status badge text: long form and short form (short is used on tight cards).
      status: {
        verified_my: { long: 'Buatan Malaysia', short: 'Buatan MY' },
        likely_my: { long: 'Mungkin Malaysia', short: 'Mungkin MY' },
        unknown: { long: 'Belum disahkan', short: 'Belum disahkan' },
        foreign: { long: 'Bukan produk Malaysia', short: 'Bukan produk Malaysia' },
        my_brand_overseas: { long: 'Jenama MY, dibuat luar negara', short: 'Jenama MY, dibuat luar negara' },
      },
    },
  },
  // English strings (same keys as above).
  en: {
    translation: {
      appName: 'MakaKami',
      loading: 'Loading…',
      error: 'Could not load data. Please try again.',
      empty: 'No products yet.',
      switchLanguage: 'Switch language',
      comingSoon: 'Coming soon',
      home: {
        welcome: 'Welcome',
        headline: 'Is this product made in Malaysia?',
        searchLabel: 'Search products or brands',
        searchPlaceholder: 'e.g. soy sauce, chips, soap',
        scanTitle: 'Scan barcode',
        scanSubtitle: 'Point the camera at a barcode to check the product origin',
        categories: 'Categories',
        seeAll: 'See all',
        recentlyVerified: 'Recently verified',
      },
      scan: {
        title: 'Scan barcode',
        close: 'Close',
        torch: 'Torch',
        hint: 'Place the barcode inside the box',
        hintAuto: 'Scanning happens automatically',
        manualLabel: "Can't scan? Type the barcode",
        manualPlaceholder: 'e.g. 955…',
        check: 'Check',
        invalid: 'Barcode must be 8 to 14 digits.',
        recent: 'Recent scans',
        noRecent: 'No scans yet.',
        cameraDenied: 'Could not open the camera. Allow camera access, or type the barcode below.',
        cameraUnsupported: 'The camera is not available in this browser. Type the barcode below.',
      },
      web: {
        badge: 'Maka kami, rakyat Malaysia…',
        headline1: 'Is this product made in Malaysia?',
        headline2: 'Check it in one scan.',
        lead: 'Scan a barcode, search a product name or browse categories. Every result comes with evidence so you can support local products with confidence.',
        scanCta: 'Scan with camera',
        uploadCta: 'Upload a barcode photo',
        uploadHint: 'Or type the barcode in the search bar above.',
        uploadFail: 'No barcode was found in that picture. Try a clearer photo.',
        sampleLabel: 'Example scan result',
        howTitle: 'How it works',
        step1: { t: 'Scan or search', d: 'Scan a barcode with your camera, upload a photo, or search a product or brand name.' },
        step2: { t: 'Check the evidence', d: 'See the origin status, confidence level and evidence such as the label photo and manufacturer address.' },
        step3: { t: 'Support local', d: 'Not a Malaysian product? We show local alternatives in the same category.' },
        browseTitle: 'Browse categories',
        browseAll: 'See all products',
        legendTitle: 'What each badge means',
        legend: {
          verified_my: 'Confirmed by an admin from a label photo or manufacturer address.',
          likely_my: 'Open data or user votes suggest it is made in Malaysia.',
          unknown: 'No evidence yet. You can help with a label photo.',
          foreign: 'We suggest similar local alternatives.',
        },
        footerTag: 'Support Malaysian products',
      },
      cat: { title: 'Categories', search: 'Search categories', none: 'No matching categories.' },
      list: {
        count: '{{n}} Malaysian products',
        countWeb: '{{n}} Malaysian products · {{subs}} and more',
        filter: 'Filter',
        reset: 'Reset',
        subcategory: 'Subcategory',
        statusLabel: 'Origin status',
        state: 'Manufacturer state',
        allStates: 'All states',
        halalOnly: 'Halal only',
        showResults: 'Show results',
        sort: 'Sort',
        sortPopular: 'Most popular',
        sortNewest: 'Newest',
        sortAz: 'A–Z',
        all: 'All',
        empty: 'No matching products yet.',
        emptyHint: 'Try changing the filters, or scan a product to add it.',
        comingSoonNote: 'This category is coming soon. Products will be added once the community starts contributing.',
        prev: 'Previous',
        next: 'Next',
        pages: 'Pages',
        breadcrumb: 'Breadcrumb',
        home: 'Home',
        removeFilter: 'Remove filter {{name}}',
        searchIn: 'Search in {{name}}',
        state_chip: 'State: {{name}}',
      },
      search: {
        title: 'Search',
        results: '{{n}} results',
        none: 'No results for "{{q}}".',
        checkBarcode: 'Check barcode {{code}}',
        prompt: 'Type a product name, brand or barcode.',
        inCategory: 'In category: {{name}}',
      },
      legal: {
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        navLabel: 'Legal information',
        dataCredit: 'Product data from',
        draftBanner: 'Draft: this text has not been reviewed by a lawyer and may change before launch.',
        version: 'Version: {{v}}',
        scanNotice: 'Scans are recorded anonymously.',
      },
      result: {
        title: 'Result',
        back: 'Back',
        share: 'Share',
        linkCopied: 'Link copied',
        confidence: 'Confidence',
        conf: { high: 'High', mid: 'Medium', low: 'Low' },
        evidence: 'Evidence',
        labelChecked: 'Label photo verified',
        labelCheckedSub: 'Label photo reviewed by an admin',
        manufacturer: 'Manufacturer: {{name}}',
        prefix955: 'Barcode starts with 955',
        prefix955Sub: 'Brand registered with GS1 Malaysia',
        offlineNote: 'No connection. Showing data saved on {{date}}.',
        reviewNote: 'Review note',
        madeIn: 'Made in: {{place}}',
        madeInSub: 'Based on open data',
        sourcePrefix: 'Data source:',
        halal: 'Halal: {{status}}',
        halalYes: 'Yes',
        halalNo: 'No',
        halalUnknown: 'No information',
        jakim: 'Check on the JAKIM portal',
        alt: { similar: 'Similar Malaysian products', category: 'Malaysian picks in this category', foreign: 'Made-in-Malaysia alternatives' },
        cta: { verified: 'Scan again', likely: 'Help verify', unknown: 'Take a label photo', foreign: 'See alternatives' },
        report: 'Report an error',
        notFoundTitle: 'Product not found',
        notFoundBody: 'We do not have a product with barcode {{barcode}} yet.',
        scanAgain: 'Scan again',
        verdict: {
          verified_my: { title: 'Made in Malaysia', sub: 'Verified by an admin from a label photo' },
          likely_my: { title: 'Likely made in Malaysia', sub: 'Based on open data and user votes. Not yet verified by an admin.' },
          unknown: { title: 'Not yet verified', sub: 'We have no origin information for this product. Take a label photo to help.' },
          foreign: { title: 'Not a Malaysian product', sub: 'Want to support local? Try the alternatives below.' },
          my_brand_unknown_origin: { title: 'Malaysian brand, origin unconfirmed', sub: 'This brand is registered in Malaysia but where it is made is not confirmed. Take a label photo to help.' },
          my_brand_overseas: { title: 'Malaysian brand, made overseas', sub: 'This brand is Malaysian but this product is made overseas.' },
          foreign_made_my: { title: 'Made in Malaysia (foreign brand)', sub: 'A foreign brand, but this product is made in Malaysia.' },
        },
      },
      catShort: {
        food: 'Food',
        beverages: 'Drinks',
        'personal-care': 'Personal',
        household: 'Home',
      },
      tabs: {
        label: 'Main navigation',
        home: 'Home',
        categories: 'Categories',
        scan: 'Scan',
        search: 'Search',
        profile: 'Profile',
      },
      nav: {
        label: 'Main',
        categories: 'Categories',
        howItWorks: 'How it works',
        about: 'About',
        searchLabel: 'Search products',
        searchPlaceholder: 'Search products, brands or barcode',
        login: 'Log in',
        downloadApk: 'Download APK',
      },
      status: {
        verified_my: { long: 'Made in Malaysia', short: 'Made in MY' },
        likely_my: { long: 'Likely Malaysian', short: 'Likely MY' },
        unknown: { long: 'Not yet verified', short: 'Not verified' },
        foreign: { long: 'Not a Malaysian product', short: 'Not Malaysian' },
        my_brand_overseas: { long: 'Malaysian brand, made overseas', short: 'MY brand, made abroad' },
      },
    },
  },
}

// Read the saved language, falling back to BM when storage is empty or blocked.
function savedLanguage(): string {
  // Storage access can throw (private mode, blocked cookies), so guard it.
  try {
    // Use the stored choice if there is one, otherwise default to Malay.
    return localStorage.getItem('lang') ?? 'ms'
  } catch {
    // Storage unavailable: just use the default language.
    return 'ms'
  }
}

// Start i18next with the translations above.
i18n.use(initReactI18next).init({
  // The translation tables.
  resources,
  // Language to start in.
  lng: savedLanguage(),
  // If a key is missing in the current language, fall back to BM.
  fallbackLng: 'ms',
  // React already escapes output, so i18next must not escape it twice.
  interpolation: { escapeValue: false },
})

// Runs every time the language changes (including once at startup).
i18n.on('languageChanged', (lng) => {
  // Keep the <html lang="..."> attribute correct for screen readers and search engines.
  document.documentElement.lang = lng
  // Remember the choice for next visit; ignore failures if storage is blocked.
  try {
    // Save the language code.
    localStorage.setItem('lang', lng)
  } catch {
    // Nothing to do: the language just won't persist.
  }
})

// Set the <html lang> attribute for the very first render too.
document.documentElement.lang = i18n.language

// Export the instance so other files can import it if needed.
export default i18n
