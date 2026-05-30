# W.A.R. Coaching OS — Setup & Deployment Guide

## Quick Start

The W.A.R. Coaching OS project is fully initialized and ready for development. Follow these steps to get started.

### Prerequisites

- Node.js 22.13.0 (pre-installed)
- pnpm 10.4.1 (pre-installed)
- MySQL database (provided by Manus)
- Manus OAuth credentials (pre-configured)

### Installation & Development

```bash
# Navigate to project directory
cd /home/ubuntu/war-coaching-os

# Install dependencies (if needed)
pnpm install

# Start development server
pnpm dev
```

The development server will start on `http://localhost:3000` and be accessible via the Manus preview URL.

## Project Status

### ✅ Completed

- **Database Schema** — 11 tables with optimized indexes for 100+ clients
- **tRPC Routers** — 50+ procedures covering all features
- **Authentication** — Manus OAuth 2.0 integration
- **Design System** — Dark gold/black theme with Bebas Neue, Oswald, Rajdhani fonts
- **Query Helpers** — Optimized database queries for performance
- **LLM Integration** — AI service scaffolding for exercise and meal plan generation

### 🚀 Ready for Development

All backend infrastructure is in place. The frontend is ready for UI development using the established design system.

## Feature Implementation Checklist

### Dashboard & Navigation
- [ ] Trainer dashboard with stat cards
- [ ] Client list table with search
- [ ] Today's schedule widget
- [ ] Income goal progress ring
- [ ] Quick action buttons
- [ ] Alert notifications

### Client Management
- [ ] Client creation form
- [ ] Client profile page
- [ ] Client list with pagination
- [ ] Client search and filter
- [ ] Client status management
- [ ] Bulk import/export

### AI Exercise Generator
- [ ] Exercise program form
- [ ] AI generation endpoint
- [ ] Program preview
- [ ] Save to library
- [ ] Assign to client

### AI Meal Plan Generator
- [ ] Meal plan form
- [ ] AI generation endpoint
- [ ] Recipe details
- [ ] Shopping list generation
- [ ] Save to library
- [ ] Assign to client

### Programs Library
- [ ] Programs list view
- [ ] Program templates
- [ ] Version history
- [ ] Assign to multiple clients
- [ ] Program performance metrics

### Check-Ins
- [ ] Check-in form
- [ ] Pending check-ins list
- [ ] Trainer feedback system
- [ ] Check-in history
- [ ] Progress tracking

### Messaging
- [ ] Message thread view
- [ ] Real-time messaging
- [ ] Unread badges
- [ ] Message search
- [ ] Notification alerts

### Scheduling
- [ ] Weekly calendar view
- [ ] Add/edit sessions
- [ ] Session reminders
- [ ] Upcoming sessions widget
- [ ] Session history

### Revenue & Payments
- [ ] Package management
- [ ] Monthly revenue tracking
- [ ] Income goal progress
- [ ] Revenue breakdown
- [ ] Payment history

### Leads & Referrals
- [ ] Lead tracking
- [ ] Lead status management
- [ ] Referral tracking
- [ ] Referral rewards
- [ ] Lead conversion metrics

### Brand/Bio Pages
- [ ] Trainer profile customization
- [ ] Public profile page
- [ ] Social links
- [ ] Qualifications display

## Database Management

### Viewing Database

Access the database through the Manus Management UI:
1. Open the project in Manus
2. Click "Database" in the left panel
3. View tables, run queries, manage data

### Running Migrations

When updating the database schema:

```bash
# 1. Edit drizzle/schema.ts with new tables/columns
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review the generated SQL file in drizzle/migrations/
# 4. Use webdev_execute_sql tool to apply migration
```

### Example: Adding a New Table

```typescript
// drizzle/schema.ts
export const customTable = mysqlTable("customTable", {
  id: int("id").autoincrement().primaryKey(),
  trainerId: int("trainerId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Then run:
// pnpm drizzle-kit generate
// Use webdev_execute_sql to apply the migration
```

## API Development

### Adding New tRPC Procedures

```typescript
// server/routers.ts
export const appRouter = router({
  myFeature: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        // Your logic here
      }),
    create: protectedProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Your logic here
      }),
  }),
});
```

### Using tRPC in React

```typescript
// client/src/pages/MyPage.tsx
import { trpc } from "@/lib/trpc";

export default function MyPage() {
  const { data, isLoading } = trpc.myFeature.list.useQuery({ limit: 50 });
  const createMutation = trpc.myFeature.create.useMutation();

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

## UI Development

### Using the Design System

All components should use the custom CSS variables defined in `client/src/index.css`:

```tsx
// Example component using design system
<div style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
  <h1 style={{ color: "var(--gold)" }} className="font-bebas text-4xl">
    Title
  </h1>
  <p style={{ color: "var(--white)" }} className="font-rajdhani">
    Body text
  </p>
</div>
```

### Color Tokens

- `--black` — Primary background
- `--surface` — Card backgrounds
- `--surface2` — Input backgrounds
- `--surface3` — Hover states
- `--gold` — Primary accent
- `--gold-dim` — Muted gold
- `--gold-bright` — Bright gold
- `--red` — Destructive/alerts
- `--success` — Success states
- `--warn` — Warning states
- `--white` — Text/foreground
- `--muted` — Disabled/secondary
- `--border` — Border color

### Font Classes

- `.font-bebas` — Bebas Neue (headings)
- `.font-oswald` — Oswald (labels, buttons)
- `.font-rajdhani` — Rajdhani (body)

## Testing

### Writing Tests

Tests are written with Vitest and located in `server/*.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("myFeature", () => {
  it("should do something", async () => {
    const caller = appRouter.createCaller(context);
    const result = await caller.myFeature.list({ limit: 10 });
    expect(result).toBeDefined();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Deployment

### Creating a Checkpoint

Before deploying, create a checkpoint to save your work:

```bash
# Via Manus CLI (if available)
manus checkpoint create "Feature X implementation"

# Or use the Management UI
# Click "Save Checkpoint" button
```

### Publishing to Production

1. Create a checkpoint (see above)
2. Open the project in Manus Management UI
3. Click the "Publish" button in the top-right
4. Wait for build and deployment to complete
5. Your app will be live at the assigned domain

### Environment Variables

All environment variables are automatically managed by Manus:
- `DATABASE_URL` — MySQL connection
- `JWT_SECRET` — Session signing
- `VITE_APP_ID` — OAuth app ID
- `BUILT_IN_FORGE_API_KEY` — LLM service key
- And more...

No manual `.env` file needed.

## Troubleshooting

### Dev Server Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Database Connection Error

1. Check `DATABASE_URL` is set (visible in Manus Management UI)
2. Verify database migrations were applied
3. Check database credentials in Management UI

### TypeScript Errors

```bash
# Check for type errors
pnpm check

# Fix formatting
pnpm format
```

### Build Fails

```bash
# Clear build artifacts
rm -rf dist .vite

# Rebuild
pnpm build
```

## Performance Optimization

### Database Queries

- All client queries are indexed on `trainerId` for fast lookups
- Use pagination for large result sets (limit 50-100)
- Leverage query helpers in `server/db.ts` for optimized queries

### Frontend

- Use React Query caching (built into tRPC)
- Implement code splitting for large pages
- Optimize images and assets via S3 storage

### Deployment

- Cold starts are minimized with pre-warmed instances
- Database connections are pooled
- Static assets are cached and served via CDN

## Support & Resources

- **Manus Docs** — https://docs.manus.im
- **tRPC Docs** — https://trpc.io
- **Drizzle Docs** — https://orm.drizzle.team
- **Tailwind Docs** — https://tailwindcss.com
- **React Docs** — https://react.dev

## Project Configuration

### Key Files

- `package.json` — Dependencies and scripts
- `tsconfig.json` — TypeScript configuration
- `vite.config.ts` — Vite build configuration
- `drizzle.config.ts` — Drizzle ORM configuration
- `.prettierrc` — Code formatting rules
- `vitest.config.ts` — Test configuration

### Important Directories

- `/client/src/pages/` — Page components
- `/client/src/components/` — Reusable components
- `/server/` — Backend logic
- `/drizzle/` — Database schema and migrations
- `/shared/` — Shared types and constants

## Next Steps

1. **Start Development** — Run `pnpm dev` and open the preview URL
2. **Build Dashboard** — Implement trainer dashboard UI
3. **Add Client Management** — Create client creation and list pages
4. **Integrate AI** — Connect exercise and meal plan generators
5. **Test Features** — Write vitest tests for all procedures
6. **Deploy** — Create checkpoint and publish to production

Good luck building W.A.R. Coaching OS! 🚀
