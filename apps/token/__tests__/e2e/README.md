# E2E Tests for Token App

This directory contains end-to-end tests for the token app using Playwright with Page Object Model (POM) pattern.

## Structure

```
__tests__/e2e/
├── pages/              # Page Object Model classes
├── components/         # Reusable component objects
├── fixtures/           # Test fixtures and utilities
├── utils/              # Helper functions and constants
├── specs/              # Test specifications
├── playwright/         # Playwright artifacts
│   └── .auth/         # Authentication state storage
│       └── storage.json
├── global-setup.ts    # Global setup for tests
└── scripts/            # Utility scripts
    └── extract-auth-state.ts
```

## Authentication

Tests use a pre-authenticated state stored in `./playwright/.auth/storage.json`. This file contains cookies and session data that are automatically loaded by Playwright.

### Setting up authentication:

1. Run the extraction script:

   ```bash
   pnpm run e2e:extract-auth-state
   ```

2. Log in manually in the browser window that opens

3. Wait for the script to save the storage state

4. The storage state will be automatically used in all tests

## Running Tests

```bash
# Run all E2E tests
pnpm run e2e

# Run tests in debug mode
pnpm run e2e:debug

# Run tests with console output
pnpm run e2e:console
```

## Writing Tests

All tests should:

- Use Page Object Model classes from `pages/`
- Extend the `BasePage` class for common functionality
- Use the authenticated context (automatically loaded from storage.json)
- Be independent and not rely on test execution order

Example:

```typescript
import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard-page';

test('should load dashboard', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await dashboardPage.verifyDashboardDisplayed();
});
```

## Page Object Model

Page objects encapsulate page-specific logic and selectors. They extend `BasePage` which provides common functionality.

Key principles:

- One page object per page/route
- Methods represent user actions
- Selectors are encapsulated within the page object
- No assertions in page objects (keep them in tests)
