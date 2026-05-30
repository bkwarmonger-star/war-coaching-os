# W.A.R. Coaching OS — Project TODO

## Core Infrastructure
- [ ] Database schema: users, trainers, clients, programs, check-ins, messages, schedules, packages, leads
- [ ] tRPC routers: auth, clients, programs, exercises, meals, check-ins, messages, schedules, revenue, leads
- [ ] Authentication and role-based access (trainer vs client)
- [ ] Global styling: Bebas Neue, Oswald, Rajdhani fonts, dark gold/black theme

## Phase 1: Trainer Dashboard & Layout
- [ ] DashboardLayout with sidebar navigation matching design
- [ ] Topbar with search, settings, new client button
- [ ] Dashboard view with stat cards (active clients, revenue, check-ins, sessions)
- [ ] Today's schedule widget
- [ ] Alerts and action items widget
- [ ] AI Coach chat widget placeholder
- [ ] Quick actions grid

## Phase 2: Client Profile System
- [ ] Client table with search, filter, and sort
- [ ] Client creation form (age, sex, weight, height, goals, injuries, fitness level, training type)
- [ ] Client detail page with full profile
- [ ] Client list pagination and performance optimization for 100+ users
- [ ] Client progress tracking view
- [ ] Bulk client import/export

## Phase 3: AI Exercise Program Generator
- [ ] Exercise generator form (collects age, sex, weight, goals, injuries, fitness level)
- [ ] AI integration to generate structured weekly workout plans
- [ ] Exercise details: name, sets, reps, rest periods, coaching notes
- [ ] Program preview and editing
- [ ] Save program to library
- [ ] Assign program to client

## Phase 4: AI Meal Plan Generator
- [ ] Meal plan form (dietary preferences, allergies, restrictions, daily caloric output, goals)
- [ ] AI integration to generate daily meal plans with macros
- [ ] Recipe generation and details
- [ ] Weekly grocery shopping list generation
- [ ] Save meal plan to library
- [ ] Assign meal plan to client

## Phase 5: Programs Library
- [ ] Programs list view with search and filter
- [ ] Create/edit program interface
- [ ] Program history and version tracking
- [ ] Assign program to multiple clients
- [ ] Program performance metrics

## Phase 6: Client Check-In System
- [ ] Check-in submission form (weight, photos, energy level, notes)
- [ ] Check-in list for trainer review
- [ ] Check-in detail view with client data
- [ ] Trainer feedback/response system
- [ ] Check-in history and trends

## Phase 7: Revenue & Payments
- [ ] Package management (create, edit, delete packages)
- [ ] Monthly revenue tracking
- [ ] Session count tracking
- [ ] Income goal progress ring visualization
- [ ] Revenue breakdown by package type
- [ ] Payment history

## Phase 8: Scheduling System
- [ ] Weekly calendar view
- [ ] Add/edit session appointments
- [ ] Session type selection (in-person, online, adaptive)
- [ ] Session reminders
- [ ] Dashboard schedule widget integration

## Phase 9: Messaging System
- [ ] Direct messaging between trainer and clients
- [ ] Message list with unread badges
- [ ] Message thread view
- [ ] Real-time message notifications
- [ ] Message history

## Phase 10: Leads & Referrals
- [ ] Lead tracking system
- [ ] Lead status management
- [ ] Referral tracking
- [ ] Referral rewards tracking
- [ ] Lead conversion metrics

## Phase 11: Brand/Bio Pages
- [ ] Trainer brand/bio customization
- [ ] Public trainer profile page
- [ ] Social links integration
- [ ] Trainer qualifications display

## Phase 12: Testing & Optimization
- [ ] Vitest unit tests for core features
- [ ] Performance testing for 100+ clients
- [ ] UI/UX testing across browsers
- [ ] Database query optimization
- [ ] Loading state and error handling

## Phase 13: Deployment
- [ ] Environment variables setup
- [ ] Database migrations
- [ ] Production build and testing
- [ ] Deployment to Manus hosting
