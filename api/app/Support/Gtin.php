<?php

// Namespace for small helper classes.
namespace App\Support;

// Helpers for product barcodes (GTIN: EAN-8, UPC-A, EAN-13, GTIN-14).
class Gtin
{
    // True when the last digit is the correct check digit for the others (catches typos).
    public static function isValid(string $code): bool
    {
        // Only 8, 12, 13 or 14 digits are real GTIN lengths.
        if (! preg_match('/^(\d{8}|\d{12,14})$/', $code)) {
            return false;
        }

        // Everything except the last digit, and the last digit itself.
        $body = substr($code, 0, -1);
        $check = (int) substr($code, -1);
        // Walk the body from the right: weights 3, 1, 3, 1...
        $sum = 0;
        foreach (array_reverse(str_split($body)) as $i => $digit) {
            $sum += (int) $digit * ($i % 2 === 0 ? 3 : 1);
        }

        // The check digit tops the sum up to the next multiple of 10.
        return (10 - $sum % 10) % 10 === $check;
    }

    // A 12-digit UPC-A is the same product as the 13-digit EAN with a leading zero; the app stores that form.
    public static function normalise(string $code): string
    {
        return strlen($code) === 12 ? '0'.$code : $code;
    }
}
