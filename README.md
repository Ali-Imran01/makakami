# MakaKami

**Scan a barcode. See whether a product is linked to Malaysia, with the evidence behind the answer.**

MakaKami helps Malaysians check a product's origin so it is easy to support local products. Every result shows an **origin status**, the **evidence** for it, and a **confidence level**. The app does not rate or rank brands: only facts and evidence.

> **Status:** in active development. The app is bilingual, with Bahasa Malaysia (default) and English.

**Live demo (dummy data, no server):** https://makakami-showcase.pages.dev
Use the demo account shown on the login page to try the contributor and staff screens.

---

## What it does

| For | Features |
|---|---|
| **Everyone** | Scan a barcode with the phone camera (or type it), search by name, browse categories, see origin status with evidence and source links, work offline for recently viewed products |
| **Contributors** (free account, confirmed email) | Submit a new product or a correction, report wrong information, follow the status of their own submissions |
| **Staff** (moderator and above) | Review queue for submissions and reports, add or correct products directly, manage roles, read the audit log |

### How origin status works

Every product has exactly one status. Trust is earned through evidence, never assumed.

| Status | Meaning |
|---|---|
| `verified_my` | Made in Malaysia. **Only an admin can set this**, after seeing evidence such as a label photo or manufacturer address |
| `likely_my` | Probably Malaysian, based on open data |
| `my_brand_unknown_origin` | Believed to be a Malaysian-owned brand, but where it is made is not confirmed |
| `my_brand_overseas` | Malaysian brand, made abroad |
| `foreign_made_my` | Foreign brand, made in Malaysia |
| `foreign` | Confirmed foreign |
| `unknown` | No evidence yet (the default) |

Contributors can send information, but a moderator always reviews it first, and contributors cannot set a status.

### Roles

`user` → `moderator` → `admin` → `super_admin`. Each role can do everything the roles below it can. A person can only grant roles strictly below their own, and `super_admin` can only be created from the command line.

---

## How it is built

This is a monorepo with two apps.

```
makakami/
├── api/   Laravel 13 REST API (PHP 8.3+, Sanctum token auth)
└── web/   React single-page app (Vite, TypeScript, Tailwind CSS 4)
```

| Part | Main tools |
|---|---|
| **API** | Laravel 13, Laravel Sanctum, MySQL (SQLite works for a quick local try), Resend for email |
| **Web** | React 19, React Router, TanStack Query, i18next, `@zxing` for camera barcode scanning, Lucide icons |
| **Design** | Design tokens and reference screens in [`web/design/`](web/design/) |

Where to look:

- `api/routes/api.php`: every endpoint, with rate limits and role checks
- `api/app/Models/`: Product, Brand, Manufacturer, Category, Evidence, Submission, Report, ScanLog, AuditLog, User
- `api/app/Console/Commands/`: admin command-line tools (see below)
- `web/src/pages/`: one file per screen
- `web/src/i18n.ts`: all user-facing text (BM and English)
- `web/src/demo/`: the mock API used by the showcase build

### Data sources

Product data is imported from [Open Food Facts](https://world.openfoodfacts.org), Open Beauty Facts and Open Products Facts (ODbL licence), plus reviewed contributions. Each product links back to its source.

---

## Run it locally

You need PHP 8.3+, Composer, Node.js and a database (MySQL, or SQLite for a quick try).

**1. Start the API** (runs on http://localhost:8000)

```bash
cd api
composer install
cp .env.example .env          # then edit .env: database, mail
php artisan key:generate
php artisan migrate --seed    # creates tables, categories and the Malaysian brand list
php artisan serve
```

**2. Start the web app** (in a second terminal)

```bash
cd web
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:8000/api
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

### Showcase mode (no API needed)

The whole app can run on dummy data with no server. This is how the live demo is built.

```bash
cd web
npm run dev:demo      # develop in showcase mode
npm run build:demo    # build the static showcase into web/dist
```

### Environment files

Real `.env` files hold secrets and are **never committed**. Only the templates are: `api/.env.example`, `web/.env.example` and `web/.env.demo`.

---

## Admin command-line tools

Run from the `api/` folder.

| Command | What it does |
|---|---|
| `php artisan off:import --prefix=955 --enrich` | Bulk-import products from Open Food Facts (`955` is the GS1 Malaysia prefix). Add `--dry-run` to preview |
| `php artisan product:add <barcode> --name=... --status=...` | Add or correct one product by hand; `--evidence` is required for `verified_my`, `foreign` and `foreign_made_my` |
| `php artisan user:role <email> <role>` | Set a person's role; the only way to create a `super_admin` |
| `php artisan mail:test <address>` | Send a test email to check the mail settings |

---

## Notes and limits

- Information can be wrong or out of date. **Do not rely on it for safety, allergy or halal decisions.** For halal, check the official JAKIM portal.
- "Malaysian brand" is based on a list of brands believed to be Malaysian-owned that has not been fully verified. It does not mean the product is made in Malaysia.
- MakaKami is not affiliated with any brand, GS1 Malaysia, JAKIM or Open Food Facts.
- Found wrong information, or you own a brand and want something corrected? Use the "report" button on the product, or see the About page in the app.
- The contact email and operator details on the About page are still placeholders.
