# Kumbra Capital Client Portal - Implementation Guide

## Project Overview

A production-ready, role-based investment management portal for Kumbra Capital built with Next.js, TypeScript, Supabase, and shadcn/ui.

## What's Been Implemented

### ✅ Core Infrastructure

#### Database Schema (Supabase PostgreSQL)
- **Complete data model** with 15+ tables covering all major entities:
  - User management (profiles, advisors, clients)
  - Financial data (cash_balances, holdings, transactions, cashflows)
  - Documents and messaging
  - Notifications and audit logs
- **Seeded instruments** including:
  - Fixed Income: Barclays, CBA, NAB, Apple bonds
  - Managed Funds: Secure Income, Adventurous Fixed Income, Crypto, IPO funds
  - Gold Contracts: Forward and Leveraged contracts
- **FX rates** for AUD, USD, EUR, GBP, CAD
- **System configuration** for bank instructions, crypto addresses, email templates

#### Row-Level Security (RLS)
- **Comprehensive policies** ensuring data isolation:
  - Clients see only their own data
  - Advisors see only assigned clients
  - Admins have full access
  - Auditors have read-only access
- **Helper functions** for role checking and client access validation
- **Secure by default**: All tables locked down with explicit access grants

### ✅ Authentication System
- **Supabase Auth** integration with email/password
- **Auth Context** with React hooks for global state management
- **Role-based routing**: Automatic redirection based on user role
- **Profile management**: Extended user data beyond core auth

### ✅ UI/UX

#### Branding
- **Kumbra Capital theme**: Custom cyan/blue colour scheme
- **Dark mode support** with beautiful dark background
- **Responsive design** with mobile-first approach
- **Professional typography** using Inter font

#### Client Portal Pages
1. **Overview Dashboard** ✅
   - Multi-currency cash balance cards
   - Total invested and current value metrics
   - Unrealised P/L with percentage change
   - Alert system for KYC status and pending documents
   - Getting started guidance

2. **Current Holdings** ✅
   - Interactive table with all active positions
   - Issuer logos via Clearbit API with fallback monograms
   - Asset class badges (Fixed Income, Managed Funds, Gold Contracts)
   - Cost basis, current value, and unrealised P/L
   - Currency and units/face display

3. **Portal Layout** ✅
   - Left sidebar navigation with icons
   - Top header with theme toggle and user menu
   - Responsive design that works on all devices
   - Protected routes with auth checking

4. **Placeholder Pages** (Structure Ready)
   - Payment Calendar
   - Documents
   - Messages
   - Add Money (with tabs for Bank/Crypto/Card)
   - Withdraw
   - Asset Classes
   - Settings

### ✅ Type Safety
- **Full TypeScript** implementation
- **Supabase types** generated for all database entities
- **Type-safe API calls** throughout the application

## What Remains To Be Built

### High Priority Features

#### 1. Payment Calendar (FullCalendar Integration)
**Complexity: Medium | Effort: 2-3 days**
- Install and integrate FullCalendar library
- Query cashflows table for upcoming events
- Display coupons, dividends, maturities
- Month and agenda views
- .ics export functionality

#### 2. Documents Management
**Complexity: High | Effort: 4-5 days**
- Supabase Storage integration for file uploads
- Document listing with folders (Agreements, Contract Notes, Statements, KYC)
- E-signature provider integration (DocuSign/Dropbox Sign)
- Document status tracking
- File type validation and virus scanning

#### 3. Secure Messaging System
**Complexity: High | Effort: 5-6 days**
- Real-time chat with Supabase Realtime
- Threaded conversations
- File attachments via Supabase Storage
- Read receipts functionality
- Quick actions (request callback, report problem)
- Admin/Advisor can join client threads

#### 4. Add Money Flow
**Complexity: Medium | Effort: 3-4 days**
- Bank transfer instructions with dynamic reference codes
- Crypto QR code generation for BTC/ETH/USDT
- Transaction creation on deposit
- Cash balance update mechanism
- Admin approval workflow
- Card payment provider integration (Stripe/Adyen)

#### 5. Withdraw Flow
**Complexity: High | Effort: 4-5 days**
- Bank account verification system
- Name-matching validation (same-name rule)
- Withdrawal request creation
- Admin approval queue
- Status tracking and notifications
- Cash balance checks and deductions

#### 6. Settings Pages
**Complexity: Medium | Effort: 3-4 days**
- Profile editing (name, email, phone)
- Password change functionality
- 2FA/TOTP setup
- Bank account management (IBAN/Account validation)
- KYC document upload with status tracking
- Joint account handling

### Admin Console

#### 7. Admin Dashboard
**Complexity: Medium | Effort: 3-4 days**
- Global statistics tiles
- Pending KYC queue
- Pending signatures list
- Deposit/withdrawal notifications
- Failed webhooks monitor
- Recent errors log

#### 8. Client Management
**Complexity: High | Effort: 5-6 days**
- Client list with search and filters
- Client profile view with all data
- "View as client" impersonation (read-only)
- Add Holding wizard:
  - Asset class selection
  - Instrument dropdown
  - Payment schedule configuration
  - Auto-generate cashflows
- Add Transaction interface
- Document upload for clients
- KYC approval workflow

#### 9. Admin Configuration
**Complexity: Medium | Effort: 3-4 days**
- Instruments catalog (CRUD for bonds, funds, gold contracts)
- FX rates management (manual entry or API sync)
- Bank instructions per currency
- Crypto addresses configuration
- Card processor settings
- Email template editor
- Notification toggles

### Nice-to-Have Features

#### 10. Charts and Visualizations
**Complexity: Medium | Effort: 2-3 days**
- Allocation pie charts (by asset class and currency)
- P/L performance line charts
- Holdings performance over time
- Animated gauges for P/L meter

#### 11. Public Sign-up Application
**Complexity: High | Effort: 4-5 days**
- Multi-step form (Individual/Joint/Corporate)
- Conditional field validation with Zod
- Risk tolerance questionnaire
- Product knowledge assessment
- T&Cs versioning and acceptance
- KYC upload (optional at signup)
- Bank details capture
- Admin approval queue

#### 12. Demo Account
**Complexity: Medium | Effort: 2-3 days**
- Demo data seeding script
- Public demo account toggle on login
- Read-only mode enforcement
- Banner indicating demo status
- Complete sample data across all asset classes

#### 13. Notifications System
**Complexity: Medium | Effort: 2-3 days**
- In-app notification centre
- Email notifications via Edge Function
- Notification types:
  - KYC approved/rejected
  - Document signed
  - Deposit credited
  - Coupon/maturity upcoming
  - Withdrawal paid

#### 14. Audit Log Viewer
**Complexity: Low | Effort: 1-2 days**
- Admin-only audit log interface
- Filter by entity, action, date
- View before/after JSON diffs
- Export to CSV

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 13 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **UI**: TailwindCSS + shadcn/ui + Lucide icons
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (when implemented)
- **Calendar**: FullCalendar (when implemented)

### File Structure
```
app/
├── auth/
│   └── signin/              # Sign in page
├── portal/                  # Client portal
│   ├── layout.tsx          # Portal layout with sidebar
│   ├── page.tsx            # Dashboard
│   ├── holdings/           # Holdings page
│   ├── calendar/           # Payment calendar
│   ├── documents/          # Documents
│   ├── messages/           # Secure chat
│   ├── add-money/          # Deposit flows
│   ├── withdraw/           # Withdrawal requests
│   ├── assets/             # Asset classes
│   └── settings/           # User settings
components/
├── portal/
│   ├── sidebar.tsx         # Navigation sidebar
│   └── header.tsx          # Top header with user menu
├── ui/                     # shadcn/ui components
└── theme-provider.tsx      # Theme context
lib/
├── supabase/
│   ├── client.ts           # Supabase client
│   └── types.ts            # Database types
└── auth/
    └── auth-context.tsx    # Auth context provider
```

### Database Migrations
Three migrations have been created:
1. `create_core_schema` - All tables, enums, indexes
2. `create_rls_policies` - Comprehensive RLS policies
3. `seed_initial_data` - Sample instruments, FX rates, system config

## Environment Variables Required

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional Third-Party Services
CLEARBIT_DOMAIN=logo.clearbit.com
ESIGN_PROVIDER_API_KEY=your_docusign_or_dropbox_key
FX_API_KEY=your_fx_api_key (optional)
CRYPTO_WALLET_XPUB=your_xpub (optional)
```

## Getting Started

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

## Security Considerations

1. **RLS is mandatory** - Never bypass RLS policies
2. **Encrypt sensitive data** - Bank accounts, national IDs (use pgcrypto)
3. **Name-matching** - Withdrawal bank accounts must match client name
4. **File validation** - Check file types and sizes before upload
5. **Rate limiting** - Implement on money movement endpoints
6. **Audit everything** - All admin actions logged to audit_logs table

## Deployment Checklist

- [ ] Set up Supabase project
- [ ] Run all three migrations
- [ ] Configure environment variables
- [ ] Set up Supabase Storage buckets for documents
- [ ] Enable Supabase Realtime for messaging
- [ ] Configure email templates in Supabase Auth
- [ ] Set up custom domain
- [ ] Configure SSL certificates
- [ ] Test RLS policies thoroughly
- [ ] Create admin user manually
- [ ] Create demo account (optional)
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy

## Next Steps

To complete this portal to production readiness:

1. **Week 1-2**: Implement core financial features (Calendar, Add Money, Withdraw)
2. **Week 3-4**: Build document management and e-signature integration
3. **Week 5**: Develop messaging system
4. **Week 6**: Create admin console (dashboard, client management)
5. **Week 7**: Implement admin configuration pages
6. **Week 8**: Build sign-up application flow
7. **Week 9**: Add charts, visualizations, and demo account
8. **Week 10**: Testing, polish, and production deployment

**Estimated Total Development Time**: 10-12 weeks for full feature completion

## Support

For questions or issues:
- Check database schema in Supabase dashboard
- Review RLS policies for access issues
- Inspect browser console for client-side errors
- Check Supabase logs for server-side errors

---

Built with care for Kumbra Capital
