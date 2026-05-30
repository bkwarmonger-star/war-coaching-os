# W.A.R. Coaching OS — Implementation Summary

## Project Overview

W.A.R. Coaching OS is a full-featured personal training business platform built with React 19, Express 4, tRPC 11, and MySQL. The platform enables trainers to manage 100+ clients, generate AI-powered workout and meal plans, track revenue, schedule sessions, and communicate with clients—all within a bold, premium dark gold/black aesthetic.

## Architecture

### Technology Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Database:** MySQL with Drizzle ORM
- **Authentication:** Manus OAuth 2.0
- **AI Integration:** Built-in LLM service for exercise and meal plan generation
- **Fonts:** Bebas Neue (headings), Oswald (labels), Rajdhani (body)
- **Design System:** Dark gold/black color palette with semantic tokens

### Project Structure

```
/home/ubuntu/war-coaching-os/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Trainer dashboard hub
│   │   │   ├── Home.tsx               # Landing page
│   │   │   └── NotFound.tsx           # 404 page
│   │   ├── components/                # Reusable UI components
│   │   ├── contexts/                  # React contexts (theme, auth)
│   │   ├── lib/trpc.ts                # tRPC client setup
│   │   ├── App.tsx                    # Main router
│   │   ├── main.tsx                   # React entry point
│   │   └── index.css                  # Global styles with custom variables
│   ├── public/                        # Static assets (favicon, robots.txt only)
│   └── index.html                     # HTML template
├── server/
│   ├── db.ts                          # Database query helpers
│   ├── routers.ts                     # tRPC procedure definitions
│   ├── storage.ts                     # S3 file storage helpers
│   ├── _core/                         # Framework infrastructure
│   │   ├── index.ts                   # Express server setup
│   │   ├── context.ts                 # tRPC context (auth, user)
│   │   ├── trpc.ts                    # tRPC router and procedures
│   │   ├── llm.ts                     # LLM integration (AI)
│   │   ├── oauth.ts                   # Manus OAuth flow
│   │   └── ...other core files
│   └── auth.logout.test.ts            # Example vitest test
├── drizzle/
│   ├── schema.ts                      # Database table definitions
│   ├── migrations/                    # SQL migration files
│   └── 0001_boring_iceman.sql         # Initial schema migration
├── shared/
│   ├── const.ts                       # Shared constants
│   └── types.ts                       # Shared TypeScript types
├── todo.md                            # Feature tracking
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite build configuration
└── README.md                          # Template documentation
```

## Database Schema

### Core Tables

**users** — Authentication and user identity
- id, openId (unique), name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn

**trainers** — Trainer profiles extending users
- id, userId (unique), bio, qualifications, specialties, profileImageUrl, socialLinks, monthlyIncomeGoal, createdAt, updatedAt

**clients** — Client profiles (supports 100+ users)
- id, trainerId, name, email, phone, age, sex, weight, height, fitnessLevel, trainingType, goals, injuries, allergies, dietaryRestrictions, dailyCalorieTarget, profileImageUrl, status, createdAt, updatedAt
- Indexed on trainerId for fast queries

**programs** — Workout and meal plans
- id, trainerId, clientId, name, description, programType (exercise|nutrition|hybrid), duration, content (JSON), isTemplate, createdAt, updatedAt

**checkIns** — Weekly client submissions
- id, clientId, trainerId, weight, energyLevel, notes, photoUrls (JSON), trainerFeedback, status (pending|reviewed|responded), createdAt, respondedAt

**messages** — Direct messaging between trainer and clients
- id, trainerId, clientId, senderId, content, isRead, createdAt
- Indexed on trainerId, clientId, senderId for fast thread retrieval

**sessions** — Scheduled training sessions
- id, trainerId, clientId, sessionType (in-person|online|adaptive), startTime, endTime, notes, status (scheduled|completed|cancelled), createdAt, updatedAt

**packages** — Training packages (pricing)
- id, trainerId, name, description, price, sessions, duration, createdAt, updatedAt

**subscriptions** — Client subscriptions to packages
- id, clientId, packageId, trainerId, startDate, endDate, status (active|expired|cancelled), totalAmount, createdAt

**leads** — Lead tracking for client acquisition
- id, trainerId, name, email, phone, source, status (new|contacted|qualified|converted|lost), notes, createdAt, updatedAt

**referrals** — Referral tracking and rewards
- id, trainerId, referrerClientId, referredClientId, referralCode (unique), rewardAmount, status (pending|completed|expired), createdAt, completedAt

## tRPC Routers & Procedures

### Authentication (`auth`)
- `me` — Get current authenticated user
- `logout` — Clear session and log out

### Trainer Profile (`trainer`)
- `getProfile` — Fetch trainer profile with income goal
- `updateProfile` — Update bio, qualifications, specialties, income goal

### Clients (`clients`)
- `list` — Paginated list of trainer's clients (supports 100+)
- `search` — Search clients by name
- `get` — Fetch single client by ID
- `create` — Create new client with full profile
- `update` — Update client profile fields

### Programs (`programs`)
- `list` — List all programs for trainer
- `getByClient` — Get programs assigned to specific client
- `get` — Fetch single program
- `create` — Create new program (exercise, nutrition, or hybrid)

### AI Generators (`ai`)
- `generateExerciseProgram` — AI-powered workout program generator
  - Input: age, sex, weight, goals, injuries, fitness level, duration
  - Output: Structured weekly workout with exercises, sets, reps, rest periods, coaching notes
- `generateMealPlan` — AI-powered meal plan generator
  - Input: daily calories, allergies, restrictions, preferences, goals, duration
  - Output: Daily meals with macros, recipes, weekly shopping list

### Check-Ins (`checkIns`)
- `getByClient` — Fetch check-in history for client
- `getPending` — Get all pending check-ins for trainer review
- `create` — Submit new check-in (weight, energy level, photos, notes)
- `respond` — Trainer responds with feedback to check-in

### Messages (`messages`)
- `getThread` — Fetch message thread between trainer and client
- `getUnreadCount` — Count unread messages in conversation
- `send` — Send message from trainer to client

### Sessions (`sessions`)
- `getUpcoming` — Get upcoming scheduled sessions
- `getByDateRange` — Fetch sessions within date range
- `create` — Schedule new session (in-person, online, adaptive)

### Revenue (`revenue`)
- `getMonthlyRevenue` — Calculate monthly revenue and progress toward goal
- `getActiveSubscriptions` — Get all active client subscriptions

### Leads (`leads`)
- `list` — Paginated list of leads
- `get` — Fetch single lead
- `create` — Create new lead
- `updateStatus` — Update lead status (new → contacted → qualified → converted/lost)

### Referrals (`referrals`)
- `list` — Get all referrals for trainer

## Design System

### Color Palette

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `--black` | #0a0a0a | Primary background |
| `--surface` | #111111 | Card backgrounds |
| `--surface2` | #181818 | Input backgrounds |
| `--surface3` | #222222 | Hover states, dividers |
| `--gold` | #c9a84c | Primary accent, highlights |
| `--gold-dim` | #8a6e2f | Muted gold |
| `--gold-bright` | #e8c86a | Bright gold hover |
| `--red` | #b92b27 | Destructive, alerts |
| `--success` | #2db36d | Success states |
| `--warn` | #e8943a | Warning states |
| `--white` | #f5f5f5 | Text, foreground |
| `--muted` | #888 | Disabled, secondary text |
| `--border` | #2a2a2a | Border color |

### Typography

- **Bebas Neue** — Headings (h1-h6), large titles, stat values
- **Oswald** — Labels, buttons, navigation, secondary headings
- **Rajdhani** — Body text, descriptions, data

### Component Styles

- **Stat Cards** — Gold/red/green/warn top border, dark surface background
- **Tags** — Colored borders and backgrounds with matching text
- **Progress Bars** — Gold fill on dark background
- **Alerts** — Left border with colored background tint
- **Buttons** — Gold primary, transparent outline with gold hover

## Key Features Implemented

### Phase 1: Database & Backend ✅
- [x] Complete database schema with 11 tables
- [x] Database migrations applied
- [x] All tRPC routers and procedures
- [x] Query helpers for 100+ client support
- [x] LLM integration scaffolding

### Phase 2: Trainer Dashboard (In Progress)
- [ ] Dashboard overview with stats (active clients, revenue, check-ins, sessions)
- [ ] Client list table with search and filter
- [ ] Today's schedule widget
- [ ] Income goal progress ring
- [ ] Quick action buttons
- [ ] Alerts and notifications

### Phase 3: Client Profile System (Planned)
- [ ] Client creation form with all profile fields
- [ ] Client list with pagination and search
- [ ] Client detail page with edit capability
- [ ] Client status management
- [ ] Bulk client import

### Phase 4: AI Exercise Generator (Planned)
- [ ] Exercise program form
- [ ] AI generation with structured output
- [ ] Program preview and editing
- [ ] Save to library
- [ ] Assign to client

### Phase 5: AI Meal Plan Generator (Planned)
- [ ] Meal plan form with dietary preferences
- [ ] AI generation with recipes and macros
- [ ] Weekly shopping list generation
- [ ] Save to library
- [ ] Assign to client

### Phase 6: Programs Library (Planned)
- [ ] Programs list with search
- [ ] Program templates
- [ ] Version history
- [ ] Assign to multiple clients

### Phase 7: Check-Ins (Planned)
- [ ] Check-in submission form
- [ ] Pending check-ins list
- [ ] Trainer feedback response
- [ ] Check-in history and trends

### Phase 8: Messaging (Planned)
- [ ] Message thread view
- [ ] Real-time messaging
- [ ] Unread badges
- [ ] Message history

### Phase 9: Scheduling (Planned)
- [ ] Weekly calendar view
- [ ] Add/edit sessions
- [ ] Session reminders
- [ ] Upcoming sessions widget

### Phase 10: Revenue & Payments (Planned)
- [ ] Package management
- [ ] Monthly revenue tracking
- [ ] Income goal progress ring
- [ ] Revenue breakdown

### Phase 11: Leads & Referrals (Planned)
- [ ] Lead tracking system
- [ ] Lead status management
- [ ] Referral tracking
- [ ] Referral rewards

### Phase 12: Brand/Bio Pages (Planned)
- [ ] Trainer profile customization
- [ ] Public trainer profile page
- [ ] Social links integration

## Environment Variables

The following environment variables are automatically injected by Manus:

- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` — Session cookie signing secret
- `VITE_APP_ID` — Manus OAuth application ID
- `OAUTH_SERVER_URL` — Manus OAuth backend URL
- `VITE_OAUTH_PORTAL_URL` — Manus login portal URL
- `OWNER_OPEN_ID`, `OWNER_NAME` — Owner information
- `BUILT_IN_FORGE_API_URL` — Manus built-in API base URL
- `BUILT_IN_FORGE_API_KEY` — Manus built-in API key (server-side)
- `VITE_FRONTEND_FORGE_API_KEY` — Manus built-in API key (frontend)
- `VITE_FRONTEND_FORGE_API_URL` — Manus built-in API URL (frontend)

## Development Workflow

### Running the Development Server

```bash
cd /home/ubuntu/war-coaching-os
pnpm dev
```

The dev server runs on `http://localhost:3000` and is exposed at the Manus preview URL.

### Database Migrations

When updating the schema:

```bash
# 1. Edit drizzle/schema.ts
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review generated SQL in drizzle/migrations/
# 4. Apply migration via webdev_execute_sql tool
```

### Adding New Features

1. Define database tables in `drizzle/schema.ts`
2. Generate and apply migrations
3. Add query helpers in `server/db.ts`
4. Create tRPC procedures in `server/routers.ts`
5. Build UI components in `client/src/pages/` or `client/src/components/`
6. Write vitest tests in `server/*.test.ts`
7. Test with `pnpm test`

### Building for Production

```bash
pnpm build
```

This creates optimized client and server bundles in the `dist/` directory.

## Testing

Unit tests are written with Vitest and located in `server/*.test.ts`:

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

Example test file: `server/auth.logout.test.ts`

## Deployment

The application is deployed to Manus Cloud Run with:
- 1 vCPU, 512 MiB RAM
- 180s request timeout
- Auto-scaling (min-instances=0)
- Node.js only runtime (no Python/Go/native binaries)

To deploy:
1. Create a checkpoint via `webdev_save_checkpoint`
2. Click the "Publish" button in the Management UI
3. Application will be built and deployed automatically

## Next Steps

1. **Complete Dashboard UI** — Finish dashboard with all widgets and styling
2. **Client Management** — Build client creation, list, and detail pages
3. **AI Generators** — Implement exercise and meal plan generators with LLM
4. **Programs Library** — Create program management interface
5. **Check-Ins** — Build check-in submission and review system
6. **Messaging** — Implement real-time messaging
7. **Scheduling** — Build calendar and session management
8. **Revenue Tracking** — Complete revenue dashboard and analytics
9. **Leads & Referrals** — Build lead and referral management
10. **Testing & Optimization** — Write comprehensive tests and optimize performance

## Support & Resources

- **Manus Documentation** — https://docs.manus.im
- **tRPC Documentation** — https://trpc.io
- **Drizzle ORM Documentation** — https://orm.drizzle.team
- **Tailwind CSS Documentation** — https://tailwindcss.com
- **React Documentation** — https://react.dev

## Notes

- All file uploads use S3 storage via `storagePut()` and `storageGet()` helpers
- The database uses MySQL with Drizzle ORM for type-safe queries
- Authentication is handled by Manus OAuth with automatic session management
- The LLM integration uses the built-in Manus service (no manual API key needed)
- The application supports 100+ clients with optimized database indexes
- All timestamps are stored as UTC and converted to local timezone on display
