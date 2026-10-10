# MakaKami

Monorepo: `api/` (Laravel 13 + Sanctum, MySQL) and `web/` (Vite + React + TypeScript + Tailwind 4). Plan: `C:\Users\User\Downloads\MakaKami-Planning.md`.

## UI / Design
- All UI must follow `web/design/DESIGN.md`. Read it before creating or changing any component or page.
- Visual reference for each screen is in `web/design/screens/` — match it exactly, rebuilt as React + Tailwind.
- Use tokens from `web/design/theme.css` only; no raw hex values, no other fonts, no shadows for separation (use `border-line`).
- Origin status must always render via the shared `StatusBadge` component (icon + text + colour).
- BM is the default language; every user-facing string goes through i18n (`web/src/i18n.ts`).

## Code style
- Comment every line of code in English, explaining what it does and why. The owner studies the code later.
