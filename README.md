# TransitOps – Smart Transport Operations Platform

> **Hackathon Duration:** 8 hours

TransitOps is a modern, end‑to‑end web platform that digitises **vehicle, driver, dispatch, maintenance & expense management** while enforcing strict business rules and delivering real‑time operational insights.

---

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Business Context & Goals](#business-context-goals)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Model (Prisma)](#database-model-prisma)
- [API Design](#api-design)
- [UI / Component Library](#ui-component-library)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Testing & Verification](#testing-verification)
- [Deployment Guide](#deployment-guide)
- [Contribution Workflow](#contribution-workflow)
- [License](#license)

---

## 🎯 Project Overview
TransitOps is built with **Next.js 16 (App Router) + TypeScript** and a **PostgreSQL** backend accessed through **Prisma**. All server‑actions use a **single global revalidation** (`revalidatePath("/", "layout")`) so **any data change instantly refreshes every page** – Dashboard, Reports, Fleet, Drivers, Trips, Maintenance, Finance.

The UI follows a **premium dark‑mode / glass‑morphism** design, with an animated `SubmitButton` component that shows loading dots and prevents double‑submission.

---

## 📚 Business Context & Goals
| Problem | TransitOps Solution |
|---------|----------------------|
| Spreadsheet‑driven logistics → scheduling clashes, under‑utilised assets, missed maintenance | Centralised web UI with strict validation and live KPI dashboards |
| Manual expense & fuel tracking | Automated logging + cost aggregation with live profit calculations |
| Compliance opacity (expired licences, vehicle status) | RBAC + rule‑driven dispatch constraints |
| Low visibility into fleet utilisation & operational cost | Interactive Dashboard & Reports with custom filters, CSV export and profit analytics |

**Goal:** Provide a single source of truth for fleet operations that can be built, tested and shipped within an 8‑hour hackathon.

---

## ✨ Key Features
| Area | Feature | Business Rule |
|------|---------|----------------|
| **Authentication** | Email + Password login, JWT sessions, RBAC (`SUPER_ADMIN`, `MANAGER`, `DRIVER`, `SAFETY_OFFICER`, `ANALYST`) | Only authenticated users can access the app |
| **Dashboard** | Live KPI cards (vehicles, trips, drivers, utilisation, revenue, profit) + filter panel (type, status, region) | All metrics refresh on any data change |
| **Vehicle Registry** | CRUD, unique registration number, status enum (`AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`) | Retired / In‑Shop vehicles never appear in dispatch |
| **Driver Management** | CRUD, licence details, safety score, status enum (`AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`) | Expired licence / Suspended drivers cannot be assigned |
| **Trip Management** | Draft → Dispatched → Completed → Cancelled workflow; fields: source, destination, vehicle, driver, cargo weight, planned distance | • Cargo ≤ vehicle.maxLoadCapacity  <br>• Vehicle & Driver status → `ON_TRIP` on dispatch <br>• Revert to `AVAILABLE` on complete / cancel |
| **Maintenance** | Open/close logs, auto‑switch vehicle status to `IN_SHOP`/`AVAILABLE` | Vehicles in shop excluded from dispatch |
| **Fuel & Expense** | Log fuel (litres, cost) and generic expenses, auto‑sum operational cost per vehicle | Cost feeds live Dashboard & Profit KPI |
| **Reports & Analytics** | Fuel efficiency, fleet utilisation, ROI, CSV export | All calculations run on the server and are globally revalidated |
| **UI Enhancements** | `SubmitButton` with `useFormStatus`, glass‑morphism cards, micro‑animations | Improves perceived performance and prevents double‑clicks |

---

## 🛠️ Tech Stack
| Layer | Tech | Reason |
|-------|------|--------|
| **Framework** | **Next.js 16 (App Router)** | Server‑actions, edge‑ready, built‑in revalidation |
| **Language** | **TypeScript** | End‑to‑end type safety |
| **Database** | **PostgreSQL** (Neon or local) | Relational ACID guarantees |
| **ORM** | **Prisma 5** | Auto‑generated types, migrations, safe queries |
| **Styling** | **Tailwind CSS 3** + custom CSS variables | Rapid UI, dark‑mode, glassmorphism |
| **Components** | **shadcn/ui** + custom `SubmitButton` | Accessible, headless UI primitives |
| **Animations** | **GSAP** | High‑performance micro‑animations |
| **Auth** | **JWT (HttpOnly cookies)** + `bcryptjs` | Secure, stateless sessions |
| **Validation** | **Zod** | Declarative, type‑aware request validation |
| **Testing** | **Jest** + **React Testing Library** | Unit & integration coverage |
| **Deployment** | Vercel / Netlify / Railway (Docker) | Zero‑config CI/CD pipelines |

---

## 🏗️ System Architecture
```mermaid
graph TD
    subgraph Client
        UI[🖥️ UI (React/TSX)]
        ANIM[✨ GSAP Animations]
        BUTTON[🔘 SubmitButton]
    end

    subgraph Server
        NA[🌐 Next.js Server Actions]
        AUTH[🔐 JWT Middleware]
        VALID[✅ Zod Validation]
        PRISMA[🗄️ Prisma ORM]
        DB[🗂️ PostgreSQL]
    end

    subgraph Services
        EMAIL[Nodemailer (OTP, alerts)]
        REPORT[CSV Export Service]
    end

    UI --> BUTTON
    UI --> ANIM
    UI --> NA
    NA --> AUTH
    AUTH --> VALID
    VALID --> PRISMA
    PRISMA --> DB
    NA --> EMAIL
    NA --> REPORT
```
*All actions (`create`, `update`, `delete`) call `revalidatePath("/", "layout")` → **global cache bust**, guaranteeing fresh data everywhere.*

---

## 📂 Database Model (Prisma)
> Full schema lives in `prisma/schema.prisma`. Below is a concise overview.

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **User** | `id`, `email`, `passwordHash`, `role` (`SUPER_ADMIN`, `MANAGER`, `DRIVER`, `SAFETY_OFFICER`, `ANALYST`) | `organizationId` |
| **Vehicle** | `id`, `registrationNumber` *(unique)*, `nameModel`, `type`, `maxLoadCapacity`, `odometer`, `acquisitionCost`, `status` | `maintenanceLogs`, `trips` |
| **Driver** | `id`, `name`, `licenseNumber`, `licenseCategory`, `licenseExpiry`, `safetyScore`, `status` | `trips` |
| **Trip** | `id`, `source`, `destination`, `plannedDistance`, `cargoWeight`, `status` (`DRAFT`, `DISPATCHED`, `COMPLETED`, `CANCELLED`) | `vehicleId`, `driverId` |
| **MaintenanceLog** | `id`, `description`, `date`, `cost`, `isOpen` | `vehicleId` |
| **FuelLog** | `id`, `date`, `liters`, `cost` | `vehicleId` |
| **Expense** | `id`, `date`, `description`, `amount` | `vehicleId` (optional) |
| **Organization** | `id`, `name` | `users`, `vehicles`, `drivers`, `trips` |

All foreign‑key constraints are enforced; indexes on `registrationNumber`, `licenseNumber`, and `status` guarantee fast dispatch look‑ups.

---

## 🔌 API Design
| Route | Method | Purpose | Auth | Validation |
|-------|--------|---------|------|------------|
| `/api/auth/login` | POST | Issue JWT | ❌ | Email, password |
| `/api/auth/signup` | POST | Create user (invite‑only) | ❌ | Invite code, role |
| `/api/vehicles` | GET/POST/PUT/DELETE | CRUD vehicle | ✅ (`MANAGER`+) | Unique registration, status rules |
| `/api/drivers` | GET/POST/PUT/DELETE | CRUD driver | ✅ (`MANAGER`+) | Licence expiry, status |
| `/api/trips` | POST/PUT/DELETE | Manage trips lifecycle | ✅ (`MANAGER`/`DRIVER`) | Capacity, driver/vehicle availability |
| `/api/maintenance` | POST/PUT/DELETE | Maintenance logs | ✅ (`MANAGER`) | Vehicle status transition |
| `/api/fuel` | POST/GET | Fuel logs | ✅ (`MANAGER`) | Cost > 0 |
| `/api/expenses` | POST/GET | Misc expenses | ✅ (`MANAGER`) | Amount > 0 |
| `/api/reports/summary` | GET | Dashboard KPI aggregation | ✅ (`ANALYST`+) | – |
| `/api/reports/csv` | GET | CSV export of trips/expenses | ✅ (`ANALYST`+) | – |

All endpoints return a **standard envelope**:
```json
{ "success": true, "data": { … } }
```
Errors:
```json
{ "success": false, "error": "Human‑readable message" }
```

---

## 🎨 UI / Component Library
| Component | Description | Usage |
|-----------|-------------|-------|
| `AppShell` | Layout with sidebar, header, dark‑mode toggle | All protected pages |
| `SubmitButton` | Server‑action aware button with loading dots | All forms (trip, vehicle, driver, maintenance) |
| `MetricCard` | KPI card with colored tone | Dashboard, Reports |
| `StatGrid` | Responsive grid for `MetricCard`s | Dashboard |
| `Panel` | Card container with title/subtitle | Dashboard sections |
| `Table` | Generic sortable, responsive table | Trips, Vehicles, Maintenance, Reports |
| `Pill` | Status badge with color tone | Trip & Vehicle tables |
| `DashboardFilters` | Multi‑select filter panel (type, status, region) | Dashboard |
| `Chart` (GSAP) | Animated bar/line charts for trends | Reports page |
| `Hero3D` | Optional Three.js canvas visualising fleet distribution | Landing page (demo) |

All components are **type‑safe**, **responsive**, and **styled with Tailwind variables** for a cohesive premium look.

---

## 🚀 Getting Started (Local Development)
1. **Clone the repo**
   ```bash
   git clone https://github.com/yourorg/TransitOps.git
   cd TransitOps
   ```
2. **Install dependencies**
   ```bash
   pnpm install   # or npm/yarn
   ```
3. **Create `.env.local`**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/transitops?sslmode=require
   JWT_SECRET=super‑strong‑32‑char‑random‑string
   NEXTAUTH_URL=http://localhost:3000
   EMAIL_SERVICE=gmail
   EMAIL_USER=you@example.com
   EMAIL_PASSWORD=app‑specific‑password
   ```
4. **Run Prisma migrations & seed**
   ```bash
   npx prisma migrate dev --name init
   node prisma/seed.js   # creates demo org, admin user, sample data
   ```
5. **Start the dev server**
   ```bash
   pnpm dev
   ```
   Visit <http://localhost:3000>. The seed creates an admin user:
   - **Email:** `admin@transitops.dev`
   - **Password:** `Passw0rd!`
6. **Run tests (optional)**
   ```bash
   pnpm test
   ```
   – Includes unit tests for server actions and API validation.

---

## 🧪 Testing & Verification
| Type | Tool | Coverage |
|------|------|----------|
| **Unit** | Jest + `ts-jest` | Server‑action logic (dispatch, completeTrip, status transitions) |
| **Integration** | Supertest (`npm test:api`) | End‑to‑end request/response, auth middleware |
| **E2E (optional)** | Playwright | UI flow: login → create vehicle → dispatch trip → complete → view KPI changes |
| **Type‑checking** | `tsc --noEmit` | No TypeScript errors |
| **Lint** | ESLint + Prettier | Code style consistency |

All CI steps run on push (GitHub Actions). The current build passes with **zero TypeScript errors** and **all tests green**.

---

## 📦 Deployment Guide
| Platform | Steps |
|----------|-------|
| **Vercel** | Connect GitHub repo → set environment variables → automatic `next build` & `next start`. |
| **Netlify** | Same as Vercel (build command `pnpm build`). |
| **Railway / Render** | Add a PostgreSQL add‑on, set env vars, enable Dockerfile (already provided). |
| **Docker** | ```bash
   docker build -t transitops .
   docker run -p 3000:3000 transitops
   ```
   Use your own Postgres container or external DB. |

**Production notes**
- Use a **strong 32‑byte `JWT_SECRET`**.  
- Set `NEXTAUTH_URL` to the public URL (e.g., `https://ops.yourdomain.com`).
- Enable **HTTPS** on your host; cookies are `Secure` when `NODE_ENV=production`.

---

## 🤝 Contribution Workflow
1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/awesome‑feature
   ```
3. Make **atomic commits** (`git commit -m "feat: add XYZ"`).
4. Run the full test suite (`pnpm test && pnpm lint`).
5. Push and open a **Pull Request** against `main`.
6. Ensure CI passes (type‑check, lint, tests).  
7. Request a review; once approved the PR will be merged automatically.

**Commit conventions** – use Conventional Commits (`feat:`, `fix:`, `chore:`) and update the README or diagrams when relevant.

---

## 📄 License
This project is released under the **MIT License** – see the `LICENSE` file for details.

---

*Happy dispatching!* 🚚💨