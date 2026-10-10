<?php

// MakaKami-specific settings.
return [
    // Address of the website (React app); the email-verification link sends people back here.
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    // The version of the Terms and Privacy Policy people must accept when they sign up.
    // Must equal LEGAL_VERSION in web/src/legal/content.ts; change both together whenever the legal text changes.
    'terms_version' => env('TERMS_VERSION', '2026-10-10-draft-3'),

    // Malaysian states and federal territories (the only values accepted for a manufacturer's state).
    'states' => [
        'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang',
        'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya',
    ],

    // How long a login token stays valid, in days.
    'token_days' => 14,
];
