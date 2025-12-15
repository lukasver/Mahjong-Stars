# Playwright E2E Test Plan

## Test Scope

This plan covers end-to-end testing for the The Tiles Company token platform deployed at `https://mjs-token-env-tests-smat-sa.vercel.app`. Tests assume authentication state is pre-loaded via `playwright/.auth/storage.json`.

## Test Categories

### 1. Dashboard Tests

**Test Suite: Dashboard Display and Navigation**

- **TC-DASH-001: Dashboard Page Load**
- Navigate to `/dashboard`
- Verify page title contains "$TILE"
- Verify main content area is visible
- Verify dashboard heading is displayed
- Expected: Dashboard loads within 5 seconds

- **TC-DASH-002: Fundraising Progress Display**
- Navigate to `/dashboard`
- Verify fundraising progress section is visible
- Verify progress bar is displayed
- Verify current sale name is displayed (e.g., "Test Sale")
- Verify progress percentage is displayed
- Verify tokens sold/total tokens are displayed
- Verify countdown timer is displayed (if active sale)
- Expected: All fundraising metrics are accurate and visible

- **TC-DASH-003: Token Cards Display**
- Navigate to `/dashboard`
- Verify "Your tokens" card is displayed
- Verify "Tokens pending confirmation" card is displayed
- Verify "Token Price" card is displayed with correct price
- Verify "Remaining Tokens" card is displayed
- Expected: All token cards show correct values

- **TC-DASH-004: Recent Transactions Table**
- Navigate to `/dashboard`
- Verify "Recent Transactions" section is visible
- Verify table headers: Tokens, Amount, Wallet, Time
- Verify at least one transaction row is displayed (if transactions exist)
- Verify transaction data format (tokens, amount, wallet address, relative time)
- Verify table is scrollable if more than 10 transactions
- Expected: Transactions table displays correctly with proper formatting

- **TC-DASH-005: ICO Phases Section**
- Navigate to `/dashboard`
- Verify "ICO Phases" section is visible
- Verify section title and description are displayed
- Verify at least one phase card is displayed
- For each phase card, verify:
- Phase name is displayed
- Status badge (Active/Upcoming/Completed) is displayed
- Date range is displayed
- Price is displayed
- Target amount is displayed (if applicable)
- Expected: All ICO phases are displayed with correct information

- **TC-DASH-006: Navigation to Buy Page**
- Navigate to `/dashboard`
- Click "Buy" link in sidebar navigation
- Verify URL changes to `/dashboard/buy`
- Verify buy page loads successfully
- Expected: Navigation works correctly

- **TC-DASH-007: Navigation to Transactions Page**
- Navigate to `/dashboard`
- Click "Transactions" link in sidebar navigation
- Verify URL changes to `/dashboard/transactions`
- Verify transactions page loads successfully
- Expected: Navigation works correctly

- **TC-DASH-008: Header Buy Button Navigation**
- Navigate to `/dashboard`
- Click "Buy TILE" button in header
- Verify navigation to buy page or scroll to invest component
- Expected: Header button navigates correctly

- **TC-DASH-009: Sidebar Functionality**
- Navigate to `/dashboard`
- Verify sidebar is visible
- Verify "The Tiles Company" logo is displayed
- Verify "Overview" section is expanded
- Verify navigation links (Dashboard, Buy, Transactions) are visible
- Click "Toggle Sidebar" button
- Verify sidebar collapses/expands
- Expected: Sidebar functions correctly

- **TC-DASH-010: Theme Toggle**
- Navigate to `/dashboard`
- Click "Toggle theme" button
- Verify theme changes (light/dark)
- Click again to verify toggle back
- Expected: Theme toggle works correctly

- **TC-DASH-011: Footer Links**
- Navigate to `/dashboard`
- Scroll to footer
- Verify footer links are visible: Home, Docs, Who We Are, Terms, Privacy, Contact
- Verify social media links (Twitter, TikTok, Discord) are visible
- Click each footer link and verify navigation (if internal) or external link opens
- Expected: All footer links are functional

- **TC-DASH-012: Responsive Layout**
- Navigate to `/dashboard`
- Test at mobile viewport (375px width)
- Test at tablet viewport (768px width)
- Test at desktop viewport (1920px width)
- Verify layout adapts correctly at each breakpoint
- Expected: Dashboard is responsive across all viewports

### 2. Buy Page Tests

**Test Suite: Token Purchase Page**

- **TC-BUY-001: Buy Page Load**
- Navigate to `/dashboard/buy`
- Verify page title contains "$TILE"
- Verify sale name is displayed (e.g., "Test Sale")
- Verify sale description is displayed
- Verify main content area is visible
- Expected: Buy page loads successfully

- **TC-BUY-002: Sale Information Tabs**
- Navigate to `/dashboard/buy`
- Verify "Information" tab is selected by default
- Verify "Documents" tab is visible with count (e.g., "Documents (0)")
- Verify "Gallery" tab is visible with count (e.g., "Gallery (0)")
- Click "Documents" tab
- Verify documents content is displayed
- Click "Gallery" tab
- Verify gallery content is displayed
- Click "Information" tab
- Verify information content is displayed
- Expected: All tabs function correctly

- **TC-BUY-003: Sale Information Content**
- Navigate to `/dashboard/buy`
- Verify "Information" tab content includes accordion with expandable sections
- Verify accordion is visible and contains at least one accordion item
- For each accordion item:
- Verify accordion trigger button is present and attached to DOM
- Click to expand/collapse the section
- Verify accordion state changes correctly (aria-expanded attribute)
- Verify content region exists for each accordion item
- If expanded, verify content is visible
- Expected: All information sections are accessible and expandable/collapsible

- **TC-BUY-004: Sale Overview Section**
- Navigate to `/dashboard/buy`
- Verify "Overview" section is visible
- Verify "Overview" title/heading is displayed
- Verify overview metrics are displayed (dynamically check for presence and format):
- "Tokens available" field with numeric value
- "Sold" percentage field with percentage format
- Progress bar element is present
- "Total Tokens" field with numeric value
- "Name" field with token name (any non-empty value)
- "Symbol" field with token symbol (any non-empty value)
- "Total supply" field with numeric value
- "Price per token" field with currency/price format
- "Sale starts" date field with date value
- "Sale ends" date field with date value
- Expected: All overview metrics are displayed with valid values

- **TC-BUY-005: Invest Form Display**
- Navigate to `/dashboard/buy`
- Scroll to "Invest" section
- Verify "Invest" heading is displayed
- Verify countdown timer is displayed (if sale is active)
- Verify token amount input field is visible
- Verify USD amount input field is visible
- Verify payment method selector is visible
- Verify "Continue" or "Invest" button is visible
- Expected: Invest form is displayed correctly

- **TC-BUY-006: Token Amount Input Validation**
- Navigate to `/dashboard/buy`
- Enter invalid token amount (negative number)
- Verify error message is displayed
- Enter token amount exceeding available tokens
- Verify error message or warning is displayed
- Enter valid token amount
- Verify USD amount updates automatically
- Verify no error messages are displayed
- Expected: Input validation works correctly

- **TC-BUY-007: USD Amount Input Validation**
- Navigate to `/dashboard/buy`
- Enter USD amount in token input field
- Verify token amount updates automatically based on price
- Enter invalid USD amount
- Verify error message is displayed
- Expected: USD conversion works correctly

- **TC-BUY-008: Payment Method Selection**
- Navigate to `/dashboard/buy`
- Verify payment method dropdown/selector is visible
- Select "FIAT" payment method
- Verify form updates for FIAT payment
- Select "CRYPTO" payment method
- Verify form updates for CRYPTO payment
- Expected: Payment method selection works correctly

- **TC-BUY-009: Invest Form Submission (FIAT)**
- Navigate to `/dashboard/buy`
- Select "FIAT" payment method
- Enter valid token amount (e.g., 1000 TILE)
- Verify USD amount is calculated correctly
- Click "Continue" or "Invest" button
- Verify navigation to transaction page (`/dashboard/buy/[tx]`)
- Expected: FIAT purchase flow initiates correctly

- **TC-BUY-010: Invest Form Submission (CRYPTO)**
- Navigate to `/dashboard/buy`
- Select "CRYPTO" payment method
- Enter valid token amount (e.g., 1000 TILE)
- Verify crypto amount is calculated correctly
- Click "Continue" or "Invest" button
- Verify navigation to transaction page (`/dashboard/buy/[tx]`)
- Expected: CRYPTO purchase flow initiates correctly

- **TC-BUY-011: Sale Cover Image Display**
- Navigate to `/dashboard/buy`
- Verify sale cover image is displayed
- Verify image loads correctly
- Verify image has proper alt text
- Expected: Cover image displays correctly

- **TC-BUY-012: Disabled State Handling**
- Navigate to `/dashboard/buy`
- If sale is not active or form is disabled:
- Verify input fields are disabled
- Verify submit button is disabled
- Verify appropriate message is displayed
- Expected: Disabled states are handled gracefully

### 3. Transaction Flow Tests

**Test Suite: Transaction Creation and Processing**

- **TC-TX-001: Transaction Page Load**
- Navigate to `/dashboard/buy/[tx]` (after creating transaction)
- Verify transaction page loads
- Verify transaction ID is displayed
- Verify transaction steps are visible
- Expected: Transaction page loads successfully

- **TC-TX-002: Transaction Steps Display**
- Navigate to `/dashboard/buy/[tx]`
- Verify step indicators are visible:
- KYC step (if required)
- SAFT step (if required)
- Payment step
- Confirmation step
- Verify current step is highlighted
- Verify completed steps are marked
- Verify pending steps are disabled
- Expected: Transaction steps are displayed correctly

- **TC-TX-003: KYC Document Upload**
- Navigate to `/dashboard/buy/[tx]` (KYC step)
- Verify KYC step is active
- Verify document upload area is visible
- Upload valid document (PDF, image)
- Verify file is accepted
- Verify upload progress is displayed
- Verify "Continue" button becomes enabled after upload
- Click "Continue"
- Verify navigation to next step
- Expected: KYC document upload works correctly

- **TC-TX-004: KYC Document Validation**
- Navigate to `/dashboard/buy/[tx]` (KYC step)
- Attempt to upload invalid file type
- Verify error message is displayed
- Attempt to upload file exceeding size limit
- Verify error message is displayed
- Expected: File validation works correctly

- **TC-TX-005: SAFT Signing**
- Navigate to `/dashboard/buy/[tx]` (SAFT step)
- Verify SAFT document is displayed
- Verify "Sign Document" button is visible
- Click "Sign Document"
- Verify signing interface opens (Documenso or similar)
- Complete signing process
- Verify "Continue" button becomes enabled
- Click "Continue"
- Verify navigation to payment step
- Expected: SAFT signing works correctly

- **TC-TX-006: Payment Step (FIAT)**
- Navigate to `/dashboard/buy/[tx]` (Payment step, FIAT)
- Verify payment amount is displayed
- Verify payment method is "FIAT"
- Verify payment instructions are displayed
- Verify payment reference/ID is displayed
- Verify "Mark as Paid" or "Submit Payment" button is visible
- Expected: FIAT payment step displays correctly

- **TC-TX-007: Payment Step (CRYPTO)**
- Navigate to `/dashboard/buy/[tx]` (Payment step, CRYPTO)
- Verify payment amount in crypto is displayed
- Verify wallet address is displayed
- Verify QR code is displayed (if applicable)
- Verify network/chain information is displayed
- Verify "I've Sent Payment" or "Confirm Payment" button is visible
- Expected: CRYPTO payment step displays correctly

- **TC-TX-008: Payment Submission**
- Navigate to `/dashboard/buy/[tx]` (Payment step)
- Click payment confirmation button
- Verify confirmation dialog appears (if applicable)
- Confirm payment submission
- Verify navigation to confirmation/status page
- Expected: Payment submission works correctly

- **TC-TX-009: Transaction Status Page (Success)**
- Navigate to `/dashboard/buy/[tx]/success`
- Verify success message is displayed
- Verify transaction details are displayed
- Verify "View Transaction" or "Back to Dashboard" button is visible
- Click "Back to Dashboard"
- Verify navigation to dashboard
- Expected: Success status page displays correctly

- **TC-TX-010: Transaction Status Page (Pending)**
- Navigate to `/dashboard/buy/[tx]/pending`
- Verify pending message is displayed
- Verify transaction details are displayed
- Verify estimated processing time is displayed (if applicable)
- Expected: Pending status page displays correctly

- **TC-TX-011: Transaction Status Page (Failure)**
- Navigate to `/dashboard/buy/[tx]/failure`
- Verify error message is displayed
- Verify transaction details are displayed
- Verify "Retry" or "Contact Support" button is visible
- Expected: Failure status page displays correctly

- **TC-TX-012: Transaction Cancellation**
- Navigate to `/dashboard/buy/[tx]`
- Verify "Cancel Transaction" button is visible (if applicable)
- Click "Cancel Transaction"
- Verify confirmation dialog appears
- Confirm cancellation
- Verify navigation to dashboard or transactions page
- Verify transaction status is "Cancelled"
- Expected: Transaction cancellation works correctly

### 4. Transactions List Tests

**Test Suite: Transaction History and Management**

- **TC-TXLIST-001: Transactions Page Load**
- Navigate to `/dashboard/transactions`
- Verify page title contains "$TILE"
- Verify "Transactions" heading is displayed
- Verify page description is displayed
- Verify main content area is visible
- Expected: Transactions page loads successfully

- **TC-TXLIST-002: Transactions Table Display**
- Navigate to `/dashboard/transactions`
- Verify table headers are displayed:
- Date
- Sale
- Purchased
- Amount
- Status
- Payment
- Actions
- Verify table is visible
- Expected: Transactions table structure is correct

- **TC-TXLIST-003: Empty State Display**
- Navigate to `/dashboard/transactions` (with no transactions)
- Verify "No results" message is displayed
- Verify table structure is still visible
- Expected: Empty state is handled gracefully

- **TC-TXLIST-004: Transactions Data Display**
- Navigate to `/dashboard/transactions` (with transactions)
- Verify transaction rows are displayed
- For each transaction, verify:
- Date is displayed in correct format
- Sale name is displayed
- Token amount purchased is displayed
- Payment amount is displayed
- Status badge is displayed with correct color
- Payment type (FIAT/CRYPTO) is displayed
- Expected: Transaction data displays correctly

- **TC-TXLIST-005: Search Functionality**
- Navigate to `/dashboard/transactions`
- Verify search input field is visible
- Enter search term (transaction ID, sale name)
- Verify table filters to matching transactions
- Clear search
- Verify all transactions are displayed again
- Expected: Search works correctly

- **TC-TXLIST-006: Status Filter**
- Navigate to `/dashboard/transactions`
- Verify "Status" filter dropdown is visible
- Select "Pending" status
- Verify only pending transactions are displayed
- Select "Completed" status
- Verify only completed transactions are displayed
- Select "All" or clear filter
- Verify all transactions are displayed
- Expected: Status filter works correctly

- **TC-TXLIST-007: Payment Type Filter**
- Navigate to `/dashboard/transactions`
- Verify "Payment Type" filter dropdown is visible
- Select "FIAT"
- Verify only FIAT transactions are displayed
- Select "CRYPTO"
- Verify only CRYPTO transactions are displayed
- Select "All" or clear filter
- Verify all transactions are displayed
- Expected: Payment type filter works correctly

- **TC-TXLIST-008: Transaction Actions**
- Navigate to `/dashboard/transactions`
- For a transaction with available actions:
- Verify action buttons/links are visible
- Click "View" or transaction row
- Verify navigation to transaction detail page
- Expected: Transaction actions work correctly

- **TC-TXLIST-009: Pagination**
- Navigate to `/dashboard/transactions` (with many transactions)
- Verify pagination controls are visible
- Verify "Previous" and "Next" buttons are displayed
- Verify page numbers are displayed (if applicable)
- Click "Next"
- Verify next page of transactions is displayed
- Click "Previous"
- Verify previous page is displayed
- Expected: Pagination works correctly

- **TC-TXLIST-010: Column Visibility Toggle**
- Navigate to `/dashboard/transactions`
- Click "Columns" button
- Verify column visibility menu is displayed
- Toggle a column visibility
- Verify column is hidden/shown in table
- Expected: Column visibility toggle works correctly

- **TC-TXLIST-011: Chain Selection**
- Navigate to `/dashboard/transactions`
- Verify chain selector is visible (e.g., "Chain 56")
- Select different chain
- Verify transactions filter to selected chain
- Expected: Chain selection works correctly

- **TC-TXLIST-012: Transaction Sorting**
- Navigate to `/dashboard/transactions`
- Click on "Date" column header
- Verify transactions sort by date (ascending)
- Click again
- Verify transactions sort by date (descending)
- Repeat for other sortable columns
- Expected: Column sorting works correctly

### 5. Admin Tests

**Test Suite: Admin Panel Functionality**

- **TC-ADMIN-001: Admin Dashboard Access**
- Navigate to `/admin`
- Verify redirect to `/admin/sales` (if applicable)
- Verify admin dashboard loads
- Verify admin navigation is visible
- Expected: Admin access works correctly

- **TC-ADMIN-002: Admin Sales List**
- Navigate to `/admin/sales`
- Verify sales list table is displayed
- Verify table headers: Name, Status, Dates, Price, Target, Actions
- Verify sales are listed
- Verify "Create Sale" button is visible
- Expected: Sales list displays correctly

- **TC-ADMIN-003: Create New Sale**
- Navigate to `/admin/sales/create`
- Verify create sale form is displayed
- Fill in required fields:
- Sale name
- Start date
- End date
- Token price
- Target amount
- Token supply
- Click "Create Sale"
- Verify sale is created
- Verify redirect to sales list
- Verify new sale appears in list
- Expected: Sale creation works correctly

- **TC-ADMIN-004: Edit Sale**
- Navigate to `/admin/sales`
- Click "Edit" on an existing sale
- Verify edit form is pre-filled with sale data
- Modify sale details
- Click "Save"
- Verify changes are saved
- Verify updated sale appears in list
- Expected: Sale editing works correctly

- **TC-ADMIN-005: Delete Sale**
- Navigate to `/admin/sales`
- Click "Delete" on an existing sale
- Verify confirmation dialog appears
- Confirm deletion
- Verify sale is removed from list
- Expected: Sale deletion works correctly

- **TC-ADMIN-006: Admin Transactions View**
- Navigate to `/admin/transactions`
- Verify transactions table is displayed
- Verify admin-specific columns are visible
- Verify transactions from all users are displayed
- Verify filter options are available
- Expected: Admin transactions view works correctly

- **TC-ADMIN-007: Admin Users View**
- Navigate to `/admin/users`
- Verify users table is displayed
- Verify user information columns: Name, Email, Wallet, Status, Actions
- Verify users are listed
- Verify search/filter functionality
- Expected: Admin users view works correctly

- **TC-ADMIN-008: User Management Actions**
- Navigate to `/admin/users`
- For a user, verify action buttons are visible:
- View details
- Edit user
- Suspend/Activate user (if applicable)
- Click "View" on a user
- Verify user details page is displayed
- Expected: User management actions work correctly

### 6. Cross-Page Integration Tests

**Test Suite: End-to-End User Flows**

- **TC-FLOW-001: Complete FIAT Purchase Flow**
- Navigate to `/dashboard`
- Navigate to `/dashboard/buy`
- Select "FIAT" payment method
- Enter token amount (1000 TILE)
- Submit purchase form
- Complete KYC document upload (if required)
- Complete SAFT signing (if required)
- Submit payment
- Verify transaction status page shows success
- Navigate to `/dashboard/transactions`
- Verify new transaction appears in list
- Expected: Complete FIAT purchase flow works end-to-end

- **TC-FLOW-002: Complete CRYPTO Purchase Flow**
- Navigate to `/dashboard`
- Navigate to `/dashboard/buy`
- Select "CRYPTO" payment method
- Enter token amount (1000 TILE)
- Submit purchase form
- Complete KYC document upload (if required)
- Complete SAFT signing (if required)
- Submit crypto payment
- Verify transaction status page shows pending/success
- Navigate to `/dashboard/transactions`
- Verify new transaction appears in list
- Expected: Complete CRYPTO purchase flow works end-to-end

- **TC-FLOW-003: Transaction Status Tracking**
- Create a transaction via buy flow
- Navigate to `/dashboard/transactions`
- Click on transaction to view details
- Verify transaction detail page shows current status
- Verify all transaction steps are displayed
- Verify transaction can be tracked through statuses
- Expected: Transaction tracking works correctly

- **TC-FLOW-004: Navigation Consistency**
- Start at `/dashboard`
- Navigate through: Dashboard → Buy → Transactions → Dashboard
- Verify navigation state is maintained
- Verify active link highlighting works correctly
- Verify breadcrumbs (if present) are accurate
- Expected: Navigation is consistent across pages

### 7. Error Handling Tests

**Test Suite: Error States and Edge Cases**

- **TC-ERROR-001: Network Error Handling**
- Navigate to `/dashboard`
- Simulate network failure
- Verify error message is displayed
- Verify retry option is available
- Restore network
- Verify page reloads successfully
- Expected: Network errors are handled gracefully

- **TC-ERROR-002: API Error Handling**
- Navigate to `/dashboard`
- Simulate API error (500, 404)
- Verify error message is displayed
- Verify user-friendly error message (not technical details)
- Expected: API errors are handled gracefully

- **TC-ERROR-003: Invalid Transaction ID**
- Navigate to `/dashboard/buy/invalid-tx-id`
- Verify error page or 404 is displayed
- Verify error message is user-friendly
- Verify navigation back to dashboard is available
- Expected: Invalid transaction IDs are handled correctly

- **TC-ERROR-004: Expired Sale Handling**
- Navigate to `/dashboard/buy` (with expired sale)
- Verify appropriate message is displayed
- Verify purchase form is disabled
- Verify "Sale has ended" message is visible
- Expected: Expired sales are handled correctly

- **TC-ERROR-005: Insufficient Funds Handling**
- Navigate to `/dashboard/buy`
- Enter amount exceeding available tokens
- Verify error message is displayed
- Verify form prevents submission
- Expected: Insufficient funds are handled correctly

- **TC-ERROR-006: Session Expiry Handling**
- Navigate to `/dashboard`
- Simulate session expiry
- Verify redirect to login page or auth error
- Verify session expiry message is displayed
- Expected: Session expiry is handled correctly

### 8. Performance Tests

**Test Suite: Page Load and Performance**

- **TC-PERF-001: Dashboard Load Time**
- Navigate to `/dashboard`
- Measure page load time
- Verify page loads within 3 seconds
- Verify no console errors
- Expected: Dashboard loads quickly

- **TC-PERF-002: Buy Page Load Time**
- Navigate to `/dashboard/buy`
- Measure page load time
- Verify page loads within 3 seconds
- Verify images load correctly
- Expected: Buy page loads quickly

- **TC-PERF-003: Transactions Page Load Time**
- Navigate to `/dashboard/transactions`
- Measure page load time
- Verify page loads within 3 seconds
- Verify table renders quickly
- Expected: Transactions page loads quickly

- **TC-PERF-004: Large Dataset Handling**
- Navigate to `/dashboard/transactions` (with 100+ transactions)
- Verify page loads within acceptable time
- Verify pagination works correctly
- Verify table performance is acceptable
- Expected: Large datasets are handled efficiently

### 9. Accessibility Tests

**Test Suite: Accessibility Compliance**

- **TC-A11Y-001: Keyboard Navigation**
- Navigate to `/dashboard`
- Use Tab key to navigate through interactive elements
- Verify all interactive elements are focusable
- Verify focus indicators are visible
- Verify logical tab order
- Expected: Keyboard navigation works correctly

- **TC-A11Y-002: Screen Reader Compatibility**
- Navigate to `/dashboard`
- Verify ARIA labels are present on interactive elements
- Verify headings hierarchy is correct (h1, h2, h3)
- Verify form inputs have proper labels
- Verify buttons have descriptive text
- Expected: Screen reader compatibility is maintained

- **TC-A11Y-003: Color Contrast**
- Navigate to `/dashboard`
- Verify text has sufficient contrast against background
- Verify button text is readable
- Verify status badges are readable
- Expected: Color contrast meets WCAG standards

- **TC-A11Y-004: Form Accessibility**
- Navigate to `/dashboard/buy`
- Verify form inputs have associated labels
- Verify error messages are associated with inputs
- Verify required fields are marked
- Expected: Forms are accessible

### 10. Browser Compatibility Tests

**Test Suite: Cross-Browser Testing**

- **TC-BROWSER-001: Chrome Compatibility**
- Run all critical tests in Chrome
- Verify all functionality works
- Expected: Application works in Chrome

- **TC-BROWSER-002: Firefox Compatibility**
- Run all critical tests in Firefox
- Verify all functionality works
- Expected: Application works in Firefox

- **TC-BROWSER-003: Safari Compatibility**
- Run all critical tests in Safari
- Verify all functionality works
- Expected: Application works in Safari

- **TC-BROWSER-004: Edge Compatibility**
- Run all critical tests in Edge
- Verify all functionality works
- Expected: Application works in Edge

## File Structure and Organization

Each test category has its own folder under `specs/`, and each test case is implemented as a separate module file. Each test file includes a top comment referencing the test plan specification with line numbers.

### Directory Structure

```
__tests__/e2e/specs/
├── dashboard/
│   ├── page-load.spec.ts                    # @test-plan.md (13-19)
│   ├── fundraising-progress.spec.ts          # @test-plan.md (20-29)
│   ├── token-cards.spec.ts                   # @test-plan.md (30-37)
│   ├── recent-transactions-table.spec.ts     # @test-plan.md (38-46)
│   ├── ico-phases.spec.ts                    # @test-plan.md (47-59)
│   ├── navigation-to-buy.spec.ts             # @test-plan.md (60-66)
│   ├── navigation-to-transactions.spec.ts    # @test-plan.md (67-73)
│   ├── header-buy-button.spec.ts             # @test-plan.md (74-79)
│   ├── sidebar-functionality.spec.ts         # @test-plan.md (80-89)
│   ├── theme-toggle.spec.ts                  # @test-plan.md (90-96)
│   ├── footer-links.spec.ts                  # @test-plan.md (97-104)
│   └── responsive-layout.spec.ts             # @test-plan.md (105-112)
├── buy/
│   ├── page-load.spec.ts                     # @test-plan.md (117-124)
│   ├── sale-information-tabs.spec.ts         # @test-plan.md (125-137)
│   ├── sale-information-content.spec.ts      # @test-plan.md (138-154)
│   ├── sale-overview.spec.ts                 # @test-plan.md (155-169)
│   ├── invest-form-display.spec.ts           # @test-plan.md (170-180)
│   ├── token-amount-validation.spec.ts       # @test-plan.md (181-191)
│   ├── usd-amount-validation.spec.ts         # @test-plan.md (192-199)
│   ├── payment-method-selection.spec.ts      # @test-plan.md (200-208)
│   ├── form-submission-fiat.spec.ts          # @test-plan.md (209-217)
│   ├── form-submission-crypto.spec.ts        # @test-plan.md (218-226)
│   ├── sale-cover-image.spec.ts              # @test-plan.md (227-233)
│   └── disabled-state-handling.spec.ts       # @test-plan.md (234-241)
├── transaction/
│   ├── page-load.spec.ts                     # @test-plan.md (246-252)
│   ├── steps-display.spec.ts                 # @test-plan.md (253-264)
│   ├── kyc-document-upload.spec.ts           # @test-plan.md (265-276)
│   ├── kyc-document-validation.spec.ts       # @test-plan.md (277-284)
│   ├── saft-signing.spec.ts                  # @test-plan.md (285-296)
│   ├── payment-step-fiat.spec.ts             # @test-plan.md (297-305)
│   ├── payment-step-crypto.spec.ts           # @test-plan.md (306-314)
│   ├── payment-submission.spec.ts            # @test-plan.md (315-322)
│   ├── status-success.spec.ts                # @test-plan.md (323-331)
│   ├── status-pending.spec.ts                # @test-plan.md (332-338)
│   ├── status-failure.spec.ts                # @test-plan.md (339-345)
│   └── cancellation.spec.ts                  # @test-plan.md (346-355)
├── transactions-list/
│   ├── page-load.spec.ts                     # @test-plan.md (360-367)
│   ├── table-display.spec.ts                 # @test-plan.md (368-380)
│   ├── empty-state.spec.ts                   # @test-plan.md (381-386)
│   ├── data-display.spec.ts                  # @test-plan.md (387-398)
│   ├── search.spec.ts                        # @test-plan.md (399-407)
│   ├── status-filter.spec.ts                 # @test-plan.md (408-418)
│   ├── payment-type-filter.spec.ts           # @test-plan.md (419-429)
│   ├── transaction-actions.spec.ts           # @test-plan.md (430-437)
│   ├── pagination.spec.ts                    # @test-plan.md (438-448)
│   ├── column-visibility.spec.ts             # @test-plan.md (449-456)
│   ├── chain-selection.spec.ts               # @test-plan.md (457-463)
│   └── sorting.spec.ts                       # @test-plan.md (464-472)
├── admin/
│   ├── dashboard-access.spec.ts              # @test-plan.md (477-483)
│   ├── sales-list.spec.ts                    # @test-plan.md (484-491)
│   ├── create-sale.spec.ts                   # @test-plan.md (492-507)
│   ├── edit-sale.spec.ts                     # @test-plan.md (508-517)
│   ├── delete-sale.spec.ts                    # @test-plan.md (518-525)
│   ├── transactions-view.spec.ts             # @test-plan.md (526-533)
│   ├── users-view.spec.ts                    # @test-plan.md (534-541)
│   └── user-management-actions.spec.ts       # @test-plan.md (542-551)
├── flow/
│   ├── complete-fiat-purchase.spec.ts        # @test-plan.md (556-569)
│   ├── complete-crypto-purchase.spec.ts      # @test-plan.md (570-583)
│   ├── transaction-status-tracking.spec.ts   # @test-plan.md (584-592)
│   └── navigation-consistency.spec.ts        # @test-plan.md (593-600)
├── error/
│   ├── network-error.spec.ts                 # @test-plan.md (605-613)
│   ├── api-error.spec.ts                     # @test-plan.md (614-620)
│   ├── invalid-transaction-id.spec.ts        # @test-plan.md (621-627)
│   ├── expired-sale.spec.ts                  # @test-plan.md (628-634)
│   ├── insufficient-funds.spec.ts           # @test-plan.md (635-641)
│   └── session-expiry.spec.ts                # @test-plan.md (642-648)
├── performance/
│   ├── dashboard-load-time.spec.ts           # @test-plan.md (653-659)
│   ├── buy-page-load-time.spec.ts            # @test-plan.md (660-666)
│   ├── transactions-load-time.spec.ts        # @test-plan.md (667-673)
│   └── large-dataset-handling.spec.ts        # @test-plan.md (674-680)
├── accessibility/
│   ├── keyboard-navigation.spec.ts           # @test-plan.md (685-692)
│   ├── screen-reader-compatibility.spec.ts   # @test-plan.md (693-700)
│   ├── color-contrast.spec.ts                # @test-plan.md (701-707)
│   └── form-accessibility.spec.ts            # @test-plan.md (708-714)
└── browser/
    ├── chrome-compatibility.spec.ts           # @test-plan.md (719-723)
    ├── firefox-compatibility.spec.ts         # @test-plan.md (724-728)
    ├── safari-compatibility.spec.ts          # @test-plan.md (729-733)
    └── edge-compatibility.spec.ts            # @test-plan.md (734-738)
```

### Test File Format

Each test file follows this structure:

```typescript
/**
 * @test-plan.md (13-19)
 * TC-DASH-001: Dashboard Page Load
 *
 * Navigate to `/dashboard`
 * Verify page title contains "$TILE"
 * Verify main content area is visible
 * Verify dashboard heading is displayed
 * Expected: Dashboard loads within 5 seconds
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/dashboard-page';

test('TC-DASH-001: Dashboard Page Load', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  // Test implementation using POM methods
});
```

### Page Object Model (POM) Guidelines

**Always favor using Page Object Models when possible:**

1. **Use Existing POMs**: Check if a POM already exists in `pages/` directory before writing direct page interactions

   - Existing POMs: `DashboardPage`, `BuyPage`, `TransactionPage`, `TransactionsListPage`, `LoginPage`
   - All POMs extend `BasePage` which provides common functionality

2. **Extend Existing POMs**: If a POM exists but lacks needed methods:

   - Add new methods to the existing POM class
   - Follow the existing naming conventions and patterns
   - Document methods with JSDoc comments
   - Keep methods focused and reusable

3. **Create New POMs**: When testing a new page that doesn't have a POM:

   - Create a new POM class in `pages/` directory
   - Extend `BasePage` for common functionality
   - Name the class following the pattern: `[PageName]Page` (e.g., `AdminSalesPage`)
   - Include methods for:
     - Navigation (`goto()`)
     - Element locators (as getter methods)
     - Actions (click, fill, verify)
     - Wait conditions

4. **POM Best Practices**:

   - **Never use raw selectors in test files** - always use POM methods
   - **Encapsulate page logic** - all page-specific logic belongs in POMs
   - **Reusable methods** - create methods that can be used across multiple tests
   - **Clear method names** - use descriptive names like `getFundraisingProgress()` instead of `getProgress()`
   - **Return Locators** - POM methods should return Playwright Locators for flexibility
   - **Wait strategies** - include appropriate waits in POM methods

5. **Example POM Extension**:

   ```typescript
   // In pages/dashboard-page.ts
   /**
    * Get dashboard heading
    */
   getDashboardHeading() {
     return this.page.getByRole("heading", { name: "Dashboard", level: 1 });
   }
   ```

6. **Test File Structure with POM**:

   ```typescript
   test('TC-DASH-001: Dashboard Page Load', async ({ page }) => {
     const dashboardPage = new DashboardPage(page);

     // Use POM methods instead of direct page interactions
     await dashboardPage.goto();
     await dashboardPage.waitForDashboardLoaded();

     // Use POM getters for locators
     const heading = dashboardPage.getDashboardHeading();
     await expect(heading).toBeVisible();
   });
   ```

### File Naming Convention

- Use kebab-case for file names
- File names should end with `.spec.ts` (e.g., `page-load.spec.ts`)
- File names should be descriptive and match the test case name
- Each test case gets its own file
- Group related tests in category folders

## Test Execution Strategy

### Priority Levels

- **P0 (Critical)**: Core user flows that must work (Dashboard load, Buy flow, Transaction creation)
- **P1 (High)**: Important features (Transactions list, Navigation, Error handling)
- **P2 (Medium)**: Secondary features (Admin panel, Advanced filters, Accessibility)
- **P3 (Low)**: Nice-to-have features (Performance optimizations, Edge cases)

### Test Execution Order

1. **Smoke Tests** (P0): Run first to verify basic functionality

- TC-DASH-001, TC-DASH-002, TC-BUY-001, TC-BUY-009, TC-FLOW-001

2. **Regression Tests** (P0-P1): Run on every commit

- All Dashboard tests
- All Buy page tests
- All Transaction flow tests
- All Transactions list tests

3. **Integration Tests** (P1): Run before releases

- All Cross-Page Integration tests
- All Error Handling tests

4. **Extended Tests** (P2-P3): Run on scheduled basis

- Admin tests
- Performance tests
- Accessibility tests
- Browser compatibility tests

### Test Data Requirements

- Authenticated user session (via `playwright/.auth/storage.json`)
- Active token sale
- Test transactions (created via test flow or seeded data)
- Admin user account (for admin tests)

### Environment Configuration

- Base URL: `https://mjs-token-env-tests-smat-sa.vercel.app`
- Authentication: Pre-loaded via storage state
- Test Mode: Use `E2E_TEST_MODE` environment variable if available
