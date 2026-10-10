// DRAFT legal text for MakaKami. NOT reviewed by a lawyer.
// It must be reviewed by a Malaysian lawyer before public launch / Play Store release (see MakaKami-Planning.md, section 1).
// Placeholders in [square brackets] must be filled in (operator name, contact email) before launch.

// Version label shown on the pages. Change it on every edit and keep old versions (needed to record what a user accepted).
export const LEGAL_VERSION = '2026-10-10-draft-5'

// One block of a document: a heading and its paragraphs.
export interface Section {
  // Section heading.
  h: string
  // Paragraphs under the heading.
  p: string[]
}

// One document in one language.
export interface Doc {
  // Page title.
  title: string
  // The sections in order.
  sections: Section[]
}

// The two documents, each in Malay (ms) and English (en).
export const LEGAL: Record<'terms' | 'privacy', Record<'ms' | 'en', Doc>> = {
  // ---------------------------------------------------------------- Terms of Service
  terms: {
    // Bahasa Malaysia (the version that prevails if the two differ; to be confirmed by the lawyer).
    ms: {
      title: 'Terma Perkhidmatan',
      sections: [
        {
          h: '1. Tentang MakaKami',
          p: [
            'MakaKami ialah perkhidmatan yang membantu anda menyemak sama ada sesuatu produk dikaitkan dengan Malaysia, melalui imbasan kod bar, carian atau katalog. Perkhidmatan ini dikendalikan oleh [nama pengendali – akan diisi].',
            'Dengan menggunakan laman web atau aplikasi MakaKami, anda bersetuju dengan terma ini. Jika anda tidak bersetuju, sila berhenti menggunakannya.',
          ],
        },
        {
          h: '2. Maklumat sahaja, bukan jaminan',
          p: [
            'Status asal produk (contohnya "Buatan Malaysia" atau "Mungkin Malaysia") ialah maklumat berdasarkan data terbuka, undian komuniti dan semakan kami. Ia boleh tersilap atau ketinggalan zaman. Kami sentiasa menunjukkan bukti dan tahap keyakinan supaya anda boleh menilai sendiri.',
            'Jangan bergantung pada MakaKami untuk keputusan berkaitan keselamatan, alahan, kesihatan, status halal atau urusan undang-undang. Untuk status halal, sila semak portal rasmi JAKIM.',
            'Kami tidak menilai atau menyokong mana-mana jenama. Kami hanya memaparkan fakta dan bukti yang ada.',
          ],
        },
        {
          h: '3. Sumber data',
          p: [
            'Maklumat produk datang daripada Open Food Facts, Open Beauty Facts dan Open Products Facts (dilesenkan di bawah Open Database License, ODbL; imej biasanya di bawah CC BY-SA) serta sumbangan pengguna. Pautan sumber ditunjukkan pada halaman produk.',
          ],
        },
        {
          h: '4. Perkhidmatan "seperti sedia ada" (beta)',
          p: [
            'MakaKami masih dalam peringkat beta. Perkhidmatan disediakan "seperti sedia ada", tanpa jaminan bahawa ia bebas ralat atau sentiasa tersedia. Kami boleh mengubah, menggantung atau menghentikan mana-mana bahagian pada bila-bila masa.',
          ],
        },
        {
          h: '5. Penggunaan yang dibenarkan',
          p: [
            'Anda tidak boleh: menyalahgunakan perkhidmatan atau cuba mengganggu operasinya; menghantar permintaan automatik secara berlebihan; cuba mengakses data yang bukan untuk anda; atau menggunakan perkhidmatan untuk tujuan yang menyalahi undang-undang.',
          ],
        },
        // New section: accounts.
        {
          h: '6. Akaun anda',
          p: [
            'Anda boleh menggunakan MakaKami tanpa akaun. Jika anda mendaftar, anda mesti memberi maklumat yang betul, menjaga kata laluan anda daripada pengetahuan orang lain, dan bertanggungjawab atas aktiviti di bawah akaun anda. Beritahu kami jika anda fikir akaun anda telah disalahgunakan.',
            'Peranan moderator dan admin diberikan oleh kami dan boleh ditarik balik pada bila-bila masa. Keputusan mereka ialah maklumat dan tertakluk kepada semakan. Kami boleh menggantung atau menutup akaun yang melanggar terma ini.',
          ],
        },
        {
          h: '7. Kandungan anda (sumbangan)',
          p: [
            'Anda kekal memiliki apa yang anda hantar (contohnya maklumat produk, dan kelak foto label). Anda memberi kami lesen terhad, bukan eksklusif, untuk menyimpan dan memaparkannya dalam MakaKami bagi tujuan mengesahkan dan menunjukkan maklumat produk. Sumbangan sentiasa disemak oleh moderator sebelum dipaparkan, dan penyumbang tidak boleh menetapkan status asal sesuatu produk.',
            'Anda menjamin bahawa anda berhak menghantar kandungan itu dan ia tidak melanggar hak orang lain atau undang-undang. Kami boleh membuang kandungan yang melanggar terma ini.',
          ],
        },
        {
          h: '8. Pembetulan dan aduan',
          p: [
            'Jika anda pemilik jenama atau pengguna dan mendapati maklumat yang salah, hubungi kami. Kami akan menyemak dan membetulkan atau membuang maklumat itu jika wajar.',
          ],
        },
        {
          h: '9. Hak harta intelek dan pihak ketiga',
          p: [
            'Reka bentuk dan kod MakaKami adalah milik kami. Nama jenama dan imej produk kekal milik pemiliknya masing-masing; MakaKami tidak berafiliasi dengan mana-mana jenama, GS1 Malaysia, JAKIM atau Open Food Facts. Kami tidak bertanggungjawab atas laman atau perkhidmatan pihak ketiga yang dipautkan.',
          ],
        },
        {
          h: '10. Had liabiliti',
          p: [
            'Setakat yang dibenarkan oleh undang-undang, MakaKami tidak bertanggungjawab atas kerugian tidak langsung atau berbangkit akibat penggunaan atau ketidakupayaan menggunakan perkhidmatan. Tiada apa-apa dalam terma ini yang mengecualikan liabiliti yang tidak boleh dikecualikan di bawah undang-undang Malaysia, termasuk undang-undang perlindungan pengguna.',
          ],
        },
        {
          h: '11. Perubahan terma',
          p: [
            'Kami boleh mengemas kini terma ini. Versi terkini sentiasa di halaman ini bersama nombor versinya. Penggunaan berterusan selepas perubahan bermaksud anda menerimanya.',
          ],
        },
        {
          h: '12. Undang-undang dan hubungi kami',
          p: [
            'Terma ini tertakluk kepada undang-undang Malaysia dan mahkamah Malaysia. Kami menggalakkan penyelesaian secara rundingan dahulu.',
            'Pertanyaan dan notis: [emel perhubungan – akan diisi].',
          ],
        },
      ],
    },
    // English translation.
    en: {
      title: 'Terms of Service',
      sections: [
        {
          h: '1. About MakaKami',
          p: [
            'MakaKami is a service that helps you check whether a product is linked to Malaysia, by scanning a barcode, searching, or browsing a catalogue. It is operated by [operator name – to be added].',
            'By using the MakaKami website or app you agree to these terms. If you do not agree, please stop using it.',
          ],
        },
        {
          h: '2. Information only, not a guarantee',
          p: [
            'A product origin status (for example "Made in Malaysia" or "Likely Malaysian") is information based on open data, community votes and our own checks. It can be wrong or out of date. We always show the evidence and a confidence level so you can judge for yourself.',
            'Do not rely on MakaKami for decisions about safety, allergies, health, halal status or legal matters. For halal status, check the official JAKIM portal.',
            'We do not rate or endorse any brand. We only show the facts and evidence we have.',
          ],
        },
        {
          h: '3. Data sources',
          p: [
            'Product information comes from Open Food Facts, Open Beauty Facts and Open Products Facts (licensed under the Open Database License, ODbL; images are usually CC BY-SA) and from user contributions. A link to the source is shown on each product page.',
          ],
        },
        {
          h: '4. "As is" service (beta)',
          p: [
            'MakaKami is in beta. The service is provided "as is", with no promise that it is error-free or always available. We may change, suspend or stop any part of it at any time.',
          ],
        },
        {
          h: '5. Acceptable use',
          p: [
            'You must not: misuse the service or try to disrupt it; send excessive automated requests; try to access data that is not meant for you; or use the service for anything unlawful.',
          ],
        },
        // New section: accounts.
        {
          h: '6. Your account',
          p: [
            'You can use MakaKami without an account. If you sign up, you must give correct information, keep your password to yourself, and you are responsible for activity under your account. Tell us if you think your account has been misused.',
            'Moderator and admin roles are granted by us and can be withdrawn at any time. Their decisions are information and are open to review. We may suspend or close accounts that break these terms.',
          ],
        },
        {
          h: '7. Your content (contributions)',
          p: [
            'You keep ownership of what you submit (for example product details, and later label photos). You give us a limited, non-exclusive licence to store and display it in MakaKami in order to verify and show product information. Contributions are always reviewed by a moderator before anything is shown, and contributors cannot set a product\'s origin status.',
            'You promise that you have the right to submit the content and that it does not infringe anyone else\'s rights or the law. We may remove content that breaks these terms.',
          ],
        },
        {
          h: '8. Corrections and complaints',
          p: [
            'If you are a brand owner or a user and you find wrong information, contact us. We will review it and correct or remove it where appropriate.',
          ],
        },
        {
          h: '9. Intellectual property and third parties',
          p: [
            'The MakaKami design and code belong to us. Brand names and product images remain the property of their owners; MakaKami is not affiliated with any brand, GS1 Malaysia, JAKIM or Open Food Facts. We are not responsible for third-party sites or services we link to.',
          ],
        },
        {
          h: '10. Limit of liability',
          p: [
            'To the extent the law allows, MakaKami is not liable for indirect or consequential loss arising from using, or being unable to use, the service. Nothing in these terms excludes liability that cannot be excluded under Malaysian law, including consumer protection law.',
          ],
        },
        {
          h: '11. Changes to these terms',
          p: [
            'We may update these terms. The latest version is always on this page with its version number. Continuing to use the service after a change means you accept it.',
          ],
        },
        {
          h: '12. Governing law and contact',
          p: [
            'These terms are governed by Malaysian law and the courts of Malaysia. We encourage settling disputes by talking first.',
            'Questions and notices: [contact email – to be added].',
          ],
        },
      ],
    },
  },
  // ---------------------------------------------------------------- Privacy Policy
  privacy: {
    // Bahasa Malaysia.
    ms: {
      title: 'Dasar Privasi',
      sections: [
        {
          h: '1. Siapa kami',
          p: [
            'MakaKami dikendalikan oleh [nama pengendali – akan diisi]. Untuk soalan privasi atau permintaan akses, pembetulan atau pemadaman data, hubungi [emel privasi – akan diisi].',
          ],
        },
        {
          h: '2. Data yang kami kumpul sekarang',
          p: [
            'Imbasan: apabila anda mengimbas atau menaip kod bar, kami merekod kod bar itu dan masanya, untuk mengira produk yang paling banyak diimbas dan memahami produk yang tiada dalam pangkalan data kami. Rekod ini tidak dikaitkan dengan nama atau e-mel anda, dan aplikasi kami tidak menyimpan alamat IP anda dalam rekod ini.',
            'Teks yang anda taip (carian atau kod bar) dihantar ke pelayan kami untuk mencari produk.',
            'Log teknikal: penyedia pelayan atau hos kami mungkin merekod alamat IP, jenis pelayar dan masa akses untuk keselamatan dan penyelenggaraan.',
            'Kamera: gambar kamera diproses terus pada peranti anda untuk membaca kod bar. Ia tidak dirakam atau dimuat naik.',
          ],
        },
        {
          h: '3. Data pada peranti anda',
          p: [
            'Kami menyimpan pilihan bahasa, 5 imbasan terkini dan salinan 20 produk yang baru anda lihat (supaya ia boleh dibuka tanpa sambungan) dalam storan pelayar anda (localStorage). Data ini kekal pada peranti anda dan tidak dihantar kepada kami. Jika anda log masuk, token log masuk anda juga disimpan di sini sehingga anda log keluar atau ia tamat (14 hari). Anda boleh memadamnya dengan mengosongkan data tapak dalam pelayar.',
            'Kami tidak menggunakan kuki pengiklanan atau analitik.',
          ],
        },
        {
          h: '4. Akaun',
          p: [
            'Akaun adalah pilihan. Jika anda mendaftar, kami menyimpan nama, alamat emel, kata laluan anda (disimpan dalam bentuk cincang yang tidak boleh dibaca semula, jadi kami tidak dapat melihatnya), peranan akaun, serta masa dan versi Terma dan Dasar Privasi yang anda setuju. Kami menghantar emel untuk mengesahkan alamat anda, dan untuk menetapkan semula kata laluan jika anda memintanya.',
            'Tindakan kakitangan yang mengubah data (contohnya menukar peranan seseorang atau status sesuatu produk) direkodkan dalam log audit bersama akaun yang melakukannya, sebab dan masanya.',
            'Jika anda menghantar sumbangan, kami menyimpan apa yang anda isi (kod bar, nama, jenama, kategori, pengilang, negeri, status halal, saiz pek, pautan imej dan nota sumber) bersama akaun anda, serta keputusan semakan moderator. Sumbangan disemak sebelum dipaparkan, dan nama atau emel anda tidak dipaparkan secara awam. Muat naik foto dan log masuk dengan Google belum tersedia.',
          ],
        },
        {
          h: '5. Pihak ketiga',
          p: [
            'Open Food Facts: untuk produk yang tiada dalam pangkalan data kami, pelayan kami menghantar kod bar itu sahaja kepada Open Food Facts. Alamat IP anda tidak dihantar.',
            'Hos: laman web dan API dihos oleh penyedia pihak ketiga (dirancang: Cloudflare dan Hostinger) yang memproses data teknikal bagi pihak kami.',
            'Penghantaran emel: emel pengesahan dan penetapan semula kata laluan dihantar melalui penyedia perkhidmatan emel [penyedia emel – akan diisi], yang menerima alamat emel anda untuk tujuan itu.',
          ],
        },
        {
          h: '6. Tujuan dan tempoh simpanan',
          p: [
            'Kami menggunakan data di atas untuk menjalankan, menambah baik dan melindungi perkhidmatan. Rekod imbasan disimpan sehingga [12 bulan – akan disahkan], kemudian dipadam atau dijadikan statistik tanpa nama.',
          ],
        },
        {
          h: '7. Hak anda',
          p: [
            'Anda boleh meminta akses kepada, pembetulan atau pemadaman data peribadi anda, atau menarik balik persetujuan. Hubungi alamat dalam bahagian 1. Oleh sebab imbasan tanpa akaun tidak dikaitkan dengan anda, kami mungkin tidak dapat mengenal pasti rekod tertentu sebagai milik anda.',
          ],
        },
        {
          h: '8. Keselamatan',
          p: [
            'Kami mengambil langkah munasabah untuk melindungi data, tetapi tiada sistem yang sepenuhnya selamat. Kami hanya mengumpul apa yang diperlukan.',
          ],
        },
        {
          h: '9. Kanak-kanak',
          p: ['MakaKami tidak direka khusus untuk kanak-kanak dan kami tidak sengaja mengumpul data peribadi mereka.'],
        },
        {
          h: '10. Perubahan dasar',
          p: [
            'Kami akan mengemas kini dasar ini apabila amalan kami berubah, dan menunjukkan nombor versi di halaman ini. Versi Bahasa Malaysia diutamakan jika terdapat percanggahan dengan terjemahan Inggeris [akan disahkan oleh peguam].',
          ],
        },
      ],
    },
    // English translation.
    en: {
      title: 'Privacy Policy',
      sections: [
        {
          h: '1. Who we are',
          p: [
            'MakaKami is operated by [operator name – to be added]. For privacy questions or requests to access, correct or delete data, contact [privacy email – to be added].',
          ],
        },
        {
          h: '2. Data we collect now',
          p: [
            'Scans: when you scan or type a barcode, we record that barcode and the time, to count the most-scanned products and to learn which products are missing from our database. This record is not linked to your name or email, and our application does not store your IP address in it.',
            'Text you type (a search or a barcode) is sent to our server to look the product up.',
            'Technical logs: our server or hosting provider may record your IP address, browser type and access time for security and maintenance.',
            'Camera: the camera picture is processed directly on your device to read the barcode. It is not recorded or uploaded.',
          ],
        },
        {
          h: '3. Data on your device',
          p: [
            'We keep your language choice, your last 5 scans and a copy of the last 20 products you viewed (so they can open without a connection) in your browser storage (localStorage). This stays on your device and is not sent to us. If you log in, your login token is also kept here until you log out or it expires (14 days). You can delete it by clearing site data in your browser.',
            'We do not use advertising or analytics cookies.',
          ],
        },
        {
          h: '4. Accounts',
          p: [
            'An account is optional. If you sign up, we store your name, email address, your password (kept as a one-way scrambled hash, so we cannot see it), your account role, and the time and version of the Terms and Privacy Policy you agreed to. We send an email to confirm your address, and to reset your password if you ask for it.',
            'Staff actions that change data (for example changing someone\'s role or a product\'s status) are recorded in an audit log together with the account that did it, the reason and the time.',
            'If you send in a contribution, we store what you filled in (barcode, name, brand, category, manufacturer, state, halal status, pack size, image link and source note) together with your account, and the moderator\'s review decision. Contributions are reviewed before anything is shown, and your name or email is not shown publicly. Photo upload and logging in with Google are not available yet.',
          ],
        },
        {
          h: '5. Third parties',
          p: [
            'Open Food Facts: for products that are not in our database, our server sends only the barcode to Open Food Facts. Your IP address is not sent.',
            'Hosting: the website and API are hosted by third-party providers (planned: Cloudflare and Hostinger) that process technical data on our behalf.',
            'Email delivery: confirmation and password-reset emails are sent through an email service provider [email provider – to be added], which receives your email address for that purpose.',
          ],
        },
        {
          h: '6. Purpose and retention',
          p: [
            'We use the data above to run, improve and protect the service. Scan records are kept for [12 months – to be confirmed], then deleted or turned into anonymous statistics.',
          ],
        },
        {
          h: '7. Your rights',
          p: [
            'You can ask to access, correct or delete your personal data, or withdraw consent. Contact the address in section 1. Because scans made without an account are not linked to you, we may not be able to identify a particular record as yours.',
          ],
        },
        {
          h: '8. Security',
          p: [
            'We take reasonable steps to protect data, but no system is completely secure. We only collect what we need.',
          ],
        },
        {
          h: '9. Children',
          p: ['MakaKami is not designed specifically for children and we do not knowingly collect their personal data.'],
        },
        {
          h: '10. Changes to this policy',
          p: [
            'We will update this policy when our practices change, and show the version number on this page. The Bahasa Malaysia version prevails if it differs from the English translation [to be confirmed by a lawyer].',
          ],
        },
      ],
    },
  },
}
