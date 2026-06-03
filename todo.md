# W.A.R. Coaching OS — Project TODO

## Core Infrastructure
- [x] Database schema: users, trainers, clients, programs, check-ins, messages, schedules, packages, leads
- [x] tRPC routers: auth, clients, programs, exercises, meals, check-ins, messages, schedules, revenue, leads
- [x] Authentication and role-based access (trainer vs client)
- [x] Global styling: Bebas Neue, Oswald, Rajdhani fonts, dark gold/black theme

## Phase 1: Trainer Dashboard & Layout
- [x] DashboardLayout with sidebar navigation matching design
- [x] Topbar with search, settings, new client button
- [x] Dashboard view with stat cards (active clients, revenue, check-ins, sessions)
- [x] Today's schedule widget
- [x] Alerts and action items widget
- [x] AI Coach chat widget placeholder
- [x] Quick actions grid

## Phase 2: Client Profile System
- [x] Client table with search, filter, and sort
- [x] Client creation form (age, sex, weight, height, goals, injuries, fitness level, training type)
- [x] Client detail page with full profile
- [x] Client list pagination and performance optimization for 100+ users
- [x] Client progress tracking view
- [x] Bulk client import/export

## Phase 3: AI Exercise Program Generator
- [x] Exercise generator form (collects age, sex, weight, goals, injuries, fitness level)
- [x] AI integration to generate structured weekly workout plans
- [x] Exercise details: name, sets, reps, rest periods, coaching notes
- [x] Program preview and editing
- [x] Save program to library
- [x] Assign program to client

## Phase 4: AI Meal Plan Generator
- [x] Meal plan form (dietary preferences, allergies, restrictions, daily caloric output, goals)
- [x] AI integration to generate daily meal plans with macros
- [x] Recipe generation and details
- [x] Weekly grocery shopping list generation
- [x] Save meal plan to library
- [x] Assign meal plan to client

## Phase 5: Programs Library
- [x] Programs list view with search and filter
- [x] Create/edit program interface
- [x] Program history and version tracking
- [x] Assign program to multiple clients
- [x] Program performance metrics

## Phase 6: Client Check-In System
- [x] Check-in submission form (weight, photos, energy level, notes)
- [x] Check-in list for trainer review
- [x] Check-in detail view with client data
- [x] Trainer feedback/response system
- [x] Check-in history and trends

## Phase 7: Revenue & Payments
- [x] Package management (create, edit, delete packages)
- [x] Monthly revenue tracking
- [x] Session count tracking
- [x] Income goal progress ring visualization
- [x] Revenue breakdown by package type
- [x] Payment history

## Phase 8: Scheduling System
- [x] Weekly calendar view
- [x] Add/edit session appointments
- [x] Session type selection (in-person, online, adaptive)
- [x] Session reminders
- [x] Dashboard schedule widget integration

## Phase 9: Messaging System
- [x] Direct messaging between trainer and clients
- [x] Message list with unread badges
- [x] Message thread view
- [x] Real-time message notifications
- [x] Message history

## Phase 10: Leads & Referrals
- [x] Lead tracking system
- [x] Lead status management
- [x] Referral tracking
- [x] Referral rewards tracking
- [x] Lead conversion metrics

## Phase 11: Brand/Bio Pages
- [x] Trainer brand/bio customization
- [x] Public trainer profile page
- [x] Social links integration
- [x] Trainer qualifications display

## Phase 12: Testing & Optimization
- [x] Vitest unit tests for core features
- [x] Performance testing for 100+ clients
- [x] UI/UX testing across browsers
- [x] Database query optimization
- [x] Loading state and error handling

## Phase 13: Deployment
- [x] Environment variables setup
- [x] Database migrations
- [x] Production build and testing
- [x] Deployment to Manus hosting


## Phase 14: Enhanced Features - Messaging, Progress Tracking & Payments
- [x] Trainer-client real-time messaging system
- [x] Client progress tracking dashboard
- [x] Metrics upload system (weight, measurements, bloodwork)
- [x] Guided body measurement form with calculations
- [x] Body composition calculator (BMI, fat %, hydration %)
- [x] Photo upload system with positioning guides
- [x] Monthly progress comparison view
- [x] Consultation booking system
- [x] Pre-consultation questionnaires
- [x] Stripe payment integration for bookings and packages
- [x] Premium trainer profile page with pricing
- [x] Document upload system for customization forms
- [x] Services & pricing management
- [x] Admin account setup for Justin Watson (Bkwarmonger@gmail.com)
- [x] Video call page with Jitsi Meet embed (create/join rooms, client-specific rooms, call UI)

## Phase 15: Guided Photo Upload System
- [x] SVG silhouette overlays for front, back, and side poses
- [x] Photo upload interface with alignment guides and instructions
- [x] Camera capture support (mobile-friendly)
- [x] Photo set management (minimum 1 per month)
- [x] Monthly comparison view (side-by-side progress photos)
- [x] Photo history timeline
- [x] Client-specific photo gallery
- [x] Monthly photo-set compliance: detect missing months, flag incomplete sets in UI
- [x] Pose completion status indicator (show which poses are captured per set)

## Phase 16: Client-Facing Portal
- [x] Client portal page with personalized dashboard
- [x] View assigned training programs (exercises, sets, reps, rest, coaching notes)
- [x] View custom meal plans (daily meals, macros, recipes, shopping list)
- [x] Submit weekly check-ins (weight, energy, notes)
- [x] Check-in history and progress timeline
- [x] Upload progress photos from client side
- [x] Message trainer directly from portal
- [x] Client-specific navigation (separate from trainer nav)
- [x] Unit tests for all portal router procedures (13 tests passing)

## Phase 17: Progress Photo Upload in Check-Ins
- [x] Server endpoint for photo upload to S3 storage
- [x] Photo upload UI with front/back/side pose selectors
- [x] Preview thumbnails before submission
- [x] Attach photo URLs to check-in submission
- [x] Display uploaded photos in check-in history
- [x] Unit tests for photo upload procedure (16 tests passing)

## Bug Fixes
- [x] Client creation form button now shows loading state and error messages
- [x] Fixed sex enum values (M/F/Other → male/female/other) to match server validation


## Critical Bugs Fixed
- [x] Client profile access - built ClientDetailPage with full profile view and edit capability
- [x] Top menu bar rendering - fixed Navigation styling with active route indicators (gold underline)
- [x] Quick actions - added Message and Assign buttons to client table rows with proper click handling


## Phase 18: Program Library Management
- [x] Program detail page with exercise/meal management
- [x] Add exercises to programs (name, sets, reps, rest, notes)
- [x] Add meal plans to programs (meals, macros, recipes)
- [x] Edit/delete exercises and meals
- [x] Program templates for quick reuse


## Phase 19: Program Assignment Flow
- [x] Server mutation to assign program to client (programs.assign)
- [x] Program assignment modal UI (ProgramAssignmentModal component)
- [x] Display assigned programs on client profile with unassign button
- [x] Wire Assign quick-action button to modal in ClientsPage
- [x] Unassign/remove program functionality (programs.unassign)


## Phase 20: Public Client Profile View
- [x] Server query to fetch client data for public view (portal.getPublicProfile)
- [x] PublicClientProfilePage component with program, meals, check-ins
- [x] Share Profile button on ClientDetailPage
- [x] Copy-to-clipboard functionality for profile link
- [x] Route registered at /public-profile/:clientId


## Phase 21: Critical MVP - Client Dashboard & Generators
- [x] Client dashboard (authenticated view with current program, meals, check-ins, progress)
- [x] Exercise generator using LLM (AI-powered exercise creation with sets/reps/rest)
- [x] Nutrition generator using LLM (AI-powered meal plan creation with macros)
- [x] Wire generators to program creation flow
- [ ] Test end-to-end with real client onboarding


## Phase 22: Static HTML Client Profiles (Server-Side Rendering)
- [ ] Server endpoint that generates static HTML for client profiles
- [ ] Test endpoint with real data
- [ ] Update Share Profile button to link to static HTML
- [ ] End-to-end test: create client → assign program → share → verify link works
