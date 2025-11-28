# Playwright E2E Tests with Page Object Model

## Project Summary

### Pages Identified

**Public Pages:**

- `/` - Login/Home page with wallet connection
- `/in` - Auth redirect page
- `/onboarding` - Email verification and onboarding flow

**User Dashboard Pages:**

- `/dashboard` - Main dashboard with fundraising progress, token cards, recent transactions
- `/dashboard/buy` - Token purchase page
- `/dashboard/buy/[tx]` - Transaction confirmation page with KYC/SAFT/Payment steps
- `/dashboard/buy/[tx]/[status]` - Transaction status pages (success/failure/pending)
- `/dashboard/transactions` - User transaction history

**Admin Pages:**

- `/admin` - Admin dashboard (redirects to `/admin/sales`)
- `/admin/sales` - Sales list management
- `/admin/sales/create` - Create new token sale
- `/admin/transactions` - Admin transaction management
- `/admin/users` - User management

### API Routes Identified

**Authentication:**

- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout user

**Proxy API (Main API endpoint):**

- `GET /api/proxy/sales` - Get sales list
- `GET /api/proxy/sales/[id]` - Get sale details
- `GET /api/proxy/users/me` - Get current user
- `GET /api/proxy/transactions/me` - Get user transactions
- `GET /api/proxy/feeds/rates` - Get exchange rates
- `GET /api/proxy/admin/*` - Admin endpoints (transactions, users, documents)

**Webhooks:**

- `/api/webhooks/*` - Various webhook endpoints (not directly testable via E2E)

## Implementation Plan

### 1. Directory Structure

Create the following structure under `__tests__/e2e/`:

```
__tests__/e2e/
├── pages/
│   ├── base-page.ts          # Base page class with common methods
│   ├── login-page.ts         # Login/home page (TODO: for future login tests)
│   ├── onboarding-page.ts    # Onboarding/email verification page
│   ├── dashboard-page.ts     # Main dashboard page
│   ├── buy-page.ts           # Token purchase page
│   ├── transaction-page.ts   # Transaction confirmation page
│   ├── transactions-list-page.ts  # User transactions list
│   ├── admin-dashboard-page.ts    # Admin dashboard
│   ├── admin-sales-page.ts        # Admin sales management
│   └── admin-users-page.ts        # Admin users management
├── components/
│   ├── wallet-connect.ts      # Wallet connection component
│   ├── transaction-stepper.ts   # Transaction step component
│   └── navigation.ts         # Navigation components
├── fixtures/
│   ├── auth.ts               # Authentication fixtures
│   ├── test-data.ts          # Test data generators
│   └── api-helpers.ts        # API helper functions
├── utils/
│   ├── helpers.ts            # Test utilities
│   └── constants.ts          # Test constants
├── global-setup.ts           # Global setup to load authentication state
└── specs/
    ├── auth.spec.ts          # TODO: Authentication flow tests (skipped for now)
    ├── dashboard.spec.ts     # Dashboard tests
    ├── buy-flow.spec.ts      # Token purchase flow tests
    ├── transactions.spec.ts  # Transaction management tests
    └── admin.spec.ts         # Admin panel tests
```

### 2. Page Object Model Classes

**Base Page (`pages/base-page.ts`):**

- Common navigation methods
- Wait utilities
- Common element selectors
- Error handling

**Login Page (`pages/login-page.ts`) - TODO:**

- Wallet connection methods
- Login flow
- Redirect handling
- **Note:** Will be created but not used in active tests (login tests deferred)

**Dashboard Page (`pages/dashboard-page.ts`):**

- Token cards verification
- Fundraising progress checks
- Recent transactions verification
- Navigation to buy page

**Buy Page (`pages/buy-page.ts`):**

- Token amount input
- Payment method selection (FIAT/CRYPTO)
- Form submission
- Transaction creation

**Transaction Page (`pages/transaction-page.ts`):**

- Step navigation (KYC/SAFT/Payment/Confirmation)
- Document upload (KYC)
- SAFT signing
- Payment submission
- Status verification

### 3. Test Fixtures

**Auth Fixtures (`fixtures/auth.ts`):**

- Authentication state validation helpers
- Session management utilities
- Admin user setup helpers
- Wallet connection helpers (for future use)
- **Note:** Actual authentication is handled via storage.json, fixtures provide validation utilities

**Test Data (`fixtures/test-data.ts`):**

- Mock transaction data
- Mock sale data
- Test user data generators

### 4. Test Specifications

**auth.spec.ts (TODO - Skipped for now):**

- Login flow with wallet connection
- Email verification flow
- Logout functionality
- Session persistence
- **Note:** Login tests are deferred because storing login state with Thirdweb authentication is complex. The login page object model will be created but tests will be skipped.

**dashboard.spec.ts:**

- Dashboard page load
- Token cards display
- Fundraising progress display
- Recent transactions display
- Navigation between pages

**buy-flow.spec.ts:**

- Complete token purchase flow (FIAT)
- Complete token purchase flow (CRYPTO)
- KYC document upload (if required)
- SAFT signing (if required)
- Payment submission
- Transaction status verification

**transactions.spec.ts:**

- View transaction history
- Filter transactions
- Transaction details view

**admin.spec.ts:**

- Admin login and access
- Sales list view
- Create new sale
- Transaction management
- User management

### 5. Authentication State Management

**Storage Location:**

- Authentication state will be stored in `playwright/.auth/storage.json`
- This file will be manually populated with cookies by the user
- The state will be reused across all tests via browserContext

**Global Setup (`global-setup.ts`):**

- Check if `playwright/.auth/storage.json` exists
- If it exists, validate the storage state format
- If it doesn't exist, log a warning but continue (tests will run unauthenticated)
- Export setup function that Playwright can use

**playwright.config.ts Updates:**

- Add `globalSetup` pointing to `./__tests__/e2e/global-setup.ts`
- Configure `storageState: 'playwright/.auth/storage.json'` in the `use` section
- Ensure `testDir` is set to `./__tests__/e2e/` (already configured)
- Add fixtures configuration
- Configure test data setup/teardown

### 6. Utilities and Helpers

**Test Constants (`utils/constants.ts`):**

- Test user credentials
- API endpoints
- Timeouts
- Test environment variables

**Helpers (`utils/helpers.ts`):**

- Database cleanup helpers
- API mocking utilities
- Test data generators
- Assertion helpers

## Key Considerations

1. **Authentication State Reuse:**

   - Authentication state is manually stored in `playwright/.auth/storage.json` by the user
   - Global setup (`global-setup.ts`) checks if the file exists and validates its format
   - If storage.json exists, it's loaded via Playwright's `storageState` configuration
   - All tests use the same authenticated browserContext (cookies and session data are reused)
   - If storage.json doesn't exist, global setup logs a warning but tests continue (unauthenticated)
   - The storage state file should not be modified by tests - it's read-only

2. **Login Tests:**

   - Login tests are **skipped for now** (marked as TODO)
   - Reason: Difficult to store login state with current Thirdweb authentication methods
   - Login page object model will be created but not used in active tests

3. **State Management:**

   - Use Playwright's `storageState` configuration in `playwright.config.ts` to automatically load authentication state
   - BrowserContext will reuse the stored cookies and session data from `playwright/.auth/storage.json`
   - No need to authenticate in each test - state is pre-loaded via global setup
   - The global setup runs once before all tests and validates the storage state file

4. **Test Isolation:**

   - Each test should be independent with proper setup/teardown
   - Authentication state is shared, but test data should be isolated

5. **API Mocking:**

   - Consider mocking external services (Thirdweb, Documenso) for faster tests
   - Use `E2E_TEST_MODE` environment variable to bypass auth in tests (already present in middleware)

6. **Data Cleanup:**

   - Ensure test data is cleaned up after tests
   - Authentication state file should not be modified by tests

7. **Parallel Execution:**

   - Configure workers appropriately to avoid conflicts
   - Shared authentication state should work with multiple workers

## Testing Strategy

- **Smoke Tests:** Critical user flows (login, buy token)
- **Regression Tests:** All major features
- **Admin Tests:** Admin-specific functionality
- **Edge Cases:** Error handling, validation, boundary conditions
