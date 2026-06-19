# Project Structure Guide

This project follows an **Industrial, Feature-Driven, Layered Architecture** for React/TypeScript applications. The organization isolates business modules (features), structures clean page shells, encapsulates shared utilities, type signatures, and layout components.

---

## Directory Blueprint

```
src/
├── assets/                 # Static assets (images, icons, styles)
│   ├── images/
│   ├── icons/
│   └── styles/
│       └── index.css       # Tailwind & custom global stylesheets
│
├── components/             # Reusable Presentation UI components
│   ├── Button/
│   │   └── Button.tsx      # Atomic Button component
│   ├── Modal/
│   │   └── Modal.tsx       # Reusable wrapper modals
│   ├── Input/
│   │   └── Input.tsx       # Atomic Form Input fields
│   └── Loader/
│       └── Loader.tsx      # Load indicators
│
├── pages/                  # Top-level Page components (route containers)
│   ├── Dashboard/
│   │   └── Dashboard.tsx   # Dashboard Page View
│   ├── Billing/
│   │   └── Billing.tsx     # Billing View POS panel
│   ├── Customers/
│   │   └── Customers.tsx   # Customer CRM index page
│   ├── Services/
│   │   └── Services.tsx    # Services directory page
│   ├── Inventory/
│   │   └── Inventory.tsx   # Warehouse item list page
│   ├── Staff/
│   │   └── Staff.tsx       # Personnel security card page
│   ├── Settings/
│   │   └── Settings.tsx    # App and connection profile settings page
│   └── Login/
│       └── Login.tsx       # Centered Login interface page
│
├── features/               # Cohesive Business Domain Modules (Self-contained)
│   ├── auth/
│   │   ├── components/
│   │   │   └── AuthView.tsx # Login form component
│   │   ├── api.ts          # Authentication specific endpoints
│   │   ├── hooks.ts        # Authentication domain hooks
│   │   └── services.ts     # Domain authentication helpers
│   └── [domain]/           # Placeholder for other modules (users, products)
│
├── layouts/                # Wrapper templates defining app layout structures
│   ├── MainLayout.tsx      # Sidebar + Header content wrap
│   ├── AuthLayout.tsx      # Form centering layout template
│   └── components/         # Layout specific sub-components
│       ├── Sidebar.tsx
│       └── Header.tsx
│
├── routes/                 # Routing engine and guards
│   ├── AppRoutes.tsx       # Directs and renders tabs within layout wrapping
│   └── ProtectedRoute.tsx  # Auth state guard redirection controller
│
├── services/               # Global Client APIs & network requests layer
│   ├── auth.service.ts     # Auth service endpoints
│   └── product.service.ts  # Product service mappings
│
├── hooks/                  # Global reusable React custom hooks
│   ├── useAuth.ts          # Reads context credentials
│   ├── useDebounce.ts      # Delays value mutation updates
│   └── useApi.ts           # Unified API request controller status
│
├── context/                # Global React Context providers
│   ├── AuthContext.tsx     # Shared current branch/user login context
│   └── ThemeContext.tsx    # Dark/light theme styling context
│
├── store/                  # Global state management configuration (Zustand/Redux)
│   └── index.ts            # State slices setup placeholder
│
├── utils/                  # Shared helper constants and functions
│   ├── constants.ts        # Mock database initialization seeds
│   ├── validators.ts       # Email/phone validate regex logic
│   └── formatters.ts       # Currency/Date format helpers
│
├── types/                  # Typed definitions/interfaces database
│   ├── customer.types.ts
│   ├── service.types.ts
│   ├── inventory.types.ts
│   ├── staff.types.ts
│   ├── billing.types.ts
│   ├── settings.types.ts
│   ├── auth.types.ts
│   ├── user.types.ts
│   └── index.ts            # Consolidating type re-exports
│
├── App.tsx                 # Main application provider wrapping shell
├── main.tsx                # Bootstrap target mount node
└── vite-env.d.ts           # Typescript compiler environment definitions
```

---

## Structural Principles

### 1. Feature Isolation (`src/features/`)
Features contain domain-specific logic, components, APIs, and hooks that belong strictly to a single business concern.
* **Example**: Everything regarding `Authentication` (API login calls, verification views, login form sub-components) is encapsulated within `features/auth/`.
* Pages import from features, not vice versa.

### 2. Page & Layout Separation (`src/pages/` vs `src/layouts/`)
* **Layouts**: Outline the visual structure (scaffolding). They handle sidebars, mobile navigation drawers, and placement of page elements.
* **Pages**: Act as container modules. They fetch or manage page-specific data and state before rendering features/views inside layouts. 
* To prevent duplicate tab names in code editors, pages are named matching their directory (e.g. `Dashboard/Dashboard.tsx`) rather than generic `index.tsx` files.

### 3. Layered Responsibility
* **`services/`**: Exposes clear methods to call external endpoints (simulated or real).
* **`hooks/`**: Global reusable hooks (e.g. `useDebounce`, `useApi`).
* **`context/`**: Exposes global configurations that components down the tree need to share (e.g., user profiles or selected workspace branch).
* **`utils/`**: Simple helper functions that are pure and context-free (currency formatters, string validators).

---

## Guidelines for Adding Code

### Creating a New Page
1. Create a folder under `src/pages/MyNewPage/`.
2. Write a descriptive component file: `src/pages/MyNewPage/MyNewPage.tsx`.
3. Add a routing route in `src/routes/AppRoutes.tsx` or wrap it with `ProtectedRoute` as required.

### Adding Types
1. Create a `src/types/domainName.types.ts` defining your types.
2. Re-export those types inside `src/types/index.ts`.
3. Import variables using `import { TypeName } from '@/src/types'`.
