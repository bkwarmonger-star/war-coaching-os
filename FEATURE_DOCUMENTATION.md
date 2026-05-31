# W.A.R. Coaching OS — Complete Feature Documentation

## Overview

W.A.R. Coaching OS is a comprehensive fitness coaching platform built specifically for Justin Watson's personal training business. The platform supports trainer-client relationships with advanced features for progress tracking, AI-powered program generation, payments, and more.

**Live URL:** https://warcoachos-btyuu3qb.manus.space  
**Dev URL:** https://3000-i6ar2hi1jhcbc3oe2akno-90d6e1c7.us2.manus.computer  
**Admin Email:** Bkwarmonger@gmail.com

---

## Technology Stack

- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Database:** MySQL with Drizzle ORM
- **Authentication:** Manus OAuth
- **Payments:** Stripe (sandbox configured)
- **AI:** Built-in LLM integration for exercise and meal plan generation
- **Storage:** S3-compatible file storage

---

## Core Features

### 1. Trainer Dashboard
**Location:** `/dashboard`  
**Access:** Protected (authenticated trainers only)

**Components:**
- **Key Metrics Cards:** Active clients count, total revenue, sessions this month, pending check-ins
- **Today's Schedule:** Upcoming sessions with client names and times
- **Alerts:** New check-ins, messages, consultation requests
- **Quick Actions:** Create client, generate program, view messages

**tRPC Procedures:**
- `trainer.getProfile()` - Get trainer profile and stats
- `sessions.getUpcoming()` - Get today's sessions
- `checkIns.getPending()` - Get pending check-ins for review

---

### 2. Client Profile System
**Location:** `/clients`  
**Access:** Protected (trainers only)

**Features:**
- **Client Table:** Search, filter, sort by name, email, fitness level
- **Create Client:** Form with fields:
  - Age, Sex, Weight (lbs), Height (inches)
  - Fitness Goals (strength, endurance, weight loss, muscle gain, etc.)
  - Injuries/Limitations
  - Fitness Level (beginner, intermediate, advanced)
  - Training Type (in-person, online, adaptive)
- **Client Detail View:** Full profile with progress history
- **Pagination:** Optimized for 100+ clients

**tRPC Procedures:**
- `clients.create(data)` - Create new client
- `clients.list()` - Get all clients for trainer
- `clients.getById(id)` - Get single client details
- `clients.search(query)` - Search clients by name/email
- `clients.update(id, data)` - Update client profile

**Database Tables:**
- `clients` - Client profiles
- `trainers` - Trainer profiles

---

### 3. AI Exercise Program Generator
**Location:** `/programs` → "Generate New Program"  
**Access:** Protected (trainers only)

**How It Works:**
1. Select a client from dropdown
2. AI automatically pulls client's profile data (age, sex, weight, goals, injuries, fitness level)
3. Click "Generate Program"
4. LLM generates a complete 12-week workout plan with:
   - Weekly structure (e.g., 4 days/week)
   - Exercise details: name, sets, reps, rest periods
   - Coaching notes and form cues
   - Progressive overload recommendations

**Output Format:**
```
Week 1-4: Foundation Phase
- Monday: Upper Body Strength
  * Bench Press: 4 sets x 6-8 reps, 2 min rest
  * Bent Over Rows: 4 sets x 6-8 reps, 2 min rest
  * Dumbbell Shoulder Press: 3 sets x 8-10 reps, 90 sec rest
  
- Wednesday: Lower Body Strength
  * Squats: 4 sets x 6-8 reps, 2 min rest
  * Romanian Deadlifts: 3 sets x 8-10 reps, 90 sec rest
  
[... continues for all 12 weeks ...]
```

**tRPC Procedures:**
- `programs.generateFromClient(clientId)` - Generate AI program
- `programs.create(data)` - Save program to library
- `programs.assignToClient(programId, clientId)` - Assign program
- `programs.list()` - Get all programs
- `programs.getById(id)` - Get program details

**Database Tables:**
- `programs` - Saved workout programs
- `exercises` - Exercise library

---

### 4. AI Meal Plan Generator
**Location:** `/meals`  
**Access:** Protected (trainers only)

**How It Works:**
1. Enter client dietary information:
   - Dietary preferences (omnivore, vegetarian, vegan, keto, etc.)
   - Allergies (nuts, dairy, gluten, shellfish, etc.)
   - Restrictions (religious, ethical, etc.)
   - Daily caloric output (activity level)
   - Goals (weight loss, muscle gain, maintenance)
2. Click "Generate Meal Plan"
3. LLM generates:
   - 7-day meal plan with breakfast, lunch, dinner, snacks
   - Macros for each meal (protein, carbs, fats)
   - Weekly grocery shopping list
   - Recipe details with prep instructions

**Output Format:**
```
Monday:
- Breakfast: Oatmeal with berries and almond butter
  Macros: 45g carbs, 15g protein, 12g fat (380 cal)
  
- Lunch: Grilled chicken breast with sweet potato and broccoli
  Macros: 55g carbs, 40g protein, 8g fat (480 cal)
  
- Dinner: Salmon with quinoa and asparagus
  Macros: 50g carbs, 35g protein, 15g fat (520 cal)

[... continues for all 7 days ...]

Weekly Grocery List:
- Chicken breast (3 lbs)
- Salmon fillets (2 lbs)
- Eggs (2 dozen)
- Oats (2 lbs)
- Sweet potatoes (5 lbs)
[... etc ...]
```

**tRPC Procedures:**
- `meals.generateFromPreferences(preferences)` - Generate AI meal plan
- `meals.save(data)` - Save meal plan
- `meals.assignToClient(mealPlanId, clientId)` - Assign to client
- `meals.list()` - Get all meal plans
- `meals.getRecipes(mealPlanId)` - Get recipe details

**Database Tables:**
- `mealPlans` - Saved meal plans
- `recipes` - Recipe library

---

### 5. Progress Tracking Dashboard
**Location:** `/progress`  
**Access:** Protected (trainers only)

**Features:**
- **Metrics Upload:** Weight, measurements, bloodwork, body composition
- **Body Composition Calculator:**
  - BMI calculation
  - Body fat percentage
  - Hydration percentage
  - Muscle mass
  - Bone mass
- **Photo Upload:** Guided positioning for progress photos
  - Same pose comparison over time
  - Monthly photo tracking
  - Before/after galleries
- **Measurement Tracking:** Guided form for body measurements
  - Chest, waist, hips, arms, thighs, calves
  - Monthly tracking
- **Bloodwork Panel Tracking:** 6-month intervals
  - Cholesterol, glucose, testosterone, etc.
  - Historical trending

**tRPC Procedures:**
- `progress.createMetric(clientId, metricType, value)` - Log metric
- `progress.getClientMetrics(clientId)` - Get all metrics
- `progress.createBodyComposition(data)` - Calculate body composition
- `progress.getClientComposition(clientId)` - Get composition history

**Database Tables:**
- `progressMetrics` - All metric entries
- `bodyComposition` - Body composition calculations

---

### 6. Client Check-In System
**Location:** `/check-ins`  
**Access:** Protected (trainers only for review)

**Features:**
- **Trainer Review Dashboard:** List of pending check-ins
- **Check-In Details:**
  - Weight (from progress tracking)
  - Energy level (1-10 scale)
  - Notes from client
  - Photos uploaded
  - Measurements
- **Trainer Feedback:** Respond to check-ins with:
  - Coaching notes
  - Program adjustments
  - Encouragement/celebration of progress

**tRPC Procedures:**
- `checkIns.list()` - Get all check-ins for trainer
- `checkIns.getById(id)` - Get check-in details
- `checkIns.respondToCheckIn(id, feedback)` - Add trainer feedback
- `checkIns.getPending()` - Get pending reviews

**Database Tables:**
- `checkIns` - Client check-in submissions

---

### 7. Consultation Booking System
**Location:** `/consultations`  
**Access:** Public (new clients) + Protected (trainer)

**Features:**
- **Public Booking Page:**
  - Client name, email, phone
  - Consultation type selection
  - Pre-consultation questionnaire
  - Payment integration (Stripe)
- **Trainer Dashboard:**
  - List of consultation requests
  - Status tracking (pending, confirmed, completed)
  - Payment status

**tRPC Procedures:**
- `consultations.create(data)` - Create consultation request
- `consultations.list()` - Get all consultations
- `consultations.updateStatus(id, status)` - Update status

**Database Tables:**
- `consultations` - Consultation requests
- `questionnaires` - Pre-consultation forms

---

### 8. Services & Pricing Management
**Location:** `/services`  
**Access:** Protected (trainers only)

**Features:**
- **Service Creation:**
  - Service name (e.g., "1-on-1 Session", "Meal Plan")
  - Description
  - Service type
  - Price
  - Duration
- **Service List:** View all active services
- **Pricing Display:** Used on public booking page

**tRPC Procedures:**
- `services.create(data)` - Create service
- `services.list()` - Get all services
- `services.update(id, data)` - Update service
- `services.delete(id)` - Deactivate service

**Database Tables:**
- `services` - Service offerings

---

### 9. Messaging System
**Location:** `/messages`  
**Access:** Protected (trainers and clients)

**Features:**
- **Message Threads:** Separate conversation with each client
- **Message List:** All conversations with unread badges
- **Message Thread View:**
  - Full conversation history
  - Send/receive messages
  - Real-time updates
- **Notifications:** Badge shows unread message count

**tRPC Procedures:**
- `messages.list()` - Get all conversations
- `messages.getThread(clientId)` - Get conversation with client
- `messages.send(clientId, message)` - Send message
- `messages.getUnreadCount()` - Get unread count

**Database Tables:**
- `messages` - All messages

---

### 10. Revenue Tracking
**Location:** `/revenue`  
**Access:** Protected (trainers only)

**Features:**
- **Monthly Revenue:** Total revenue for current month
- **Income Goal Progress Ring:** Visual progress toward monthly goal
- **Session Count:** Number of sessions this month
- **Revenue Breakdown:** By service type/package
- **Payment History:** All transactions with dates and amounts
- **Stripe Integration:** Automatic payment tracking

**tRPC Procedures:**
- `revenue.getMonthlyRevenue()` - Get current month revenue
- `revenue.getPayments()` - Get payment history
- `revenue.getGoalProgress()` - Get income goal status

**Database Tables:**
- `payments` - Payment records
- `packages` - Service packages
- `subscriptions` - Client subscriptions

---

### 11. Leads & Referrals
**Location:** `/leads`  
**Access:** Protected (trainers only)

**Features:**
- **Lead Tracking:**
  - Lead name, email, phone
  - Lead source (referral, social media, website, etc.)
  - Status (new, contacted, qualified, converted, lost)
  - Notes
- **Lead Status Management:** Update status as leads progress
- **Referral Tracking:** Track which clients referred leads
- **Conversion Metrics:** See which sources convert best

**tRPC Procedures:**
- `leads.create(data)` - Create new lead
- `leads.list()` - Get all leads
- `leads.updateStatus(id, status)` - Update lead status
- `referrals.list()` - Get referral history

**Database Tables:**
- `leads` - Lead records
- `referrals` - Referral tracking

---

### 12. Trainer Profile & Brand Page
**Location:** `/profile` (trainer) + `/trainer/{id}` (public)  
**Access:** Protected (edit) / Public (view)

**Features:**
- **Trainer Bio:** Professional summary
- **Certifications:** Display ISSA certifications
- **Specialties:** Areas of expertise
- **Social Links:** Instagram, YouTube, etc.
- **Services Display:** Show available services
- **Public Profile:** Clients can view trainer info and book

**tRPC Procedures:**
- `trainer.getProfile()` - Get trainer profile
- `trainer.updateProfile(data)` - Update profile
- `trainer.getPublicProfile(trainerId)` - Get public profile

**Database Tables:**
- `trainers` - Trainer profiles

---

### 13. Document Management
**Location:** `/documents`  
**Access:** Protected (trainers only)

**Features:**
- **Upload Documents:**
  - Customization questionnaires
  - Client intake forms
  - Workout templates
  - Nutrition guides
- **Document Organization:** By type
- **Document Sharing:** Link to clients

**tRPC Procedures:**
- `documents.upload(data)` - Upload document
- `documents.list()` - Get all documents
- `documents.delete(id)` - Delete document

**Database Tables:**
- `documents` - Document records

---

### 14. Payments & Stripe Integration
**Location:** Integrated throughout (consultations, services, packages)  
**Access:** Protected + Public

**Features:**
- **Stripe Checkout:** Secure payment processing
- **Payment Tracking:** All transactions recorded
- **Subscription Management:** Recurring payments for packages
- **Invoice Generation:** Automatic invoices for payments
- **Test Mode:** Use card 4242 4242 4242 4242 to test

**Setup:**
1. Claim Stripe sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVGN0M0tFSGJvRjFGSjVnLDE3ODA3OTE0MDAv1000inkT4Vn
2. Keys are automatically configured
3. Test payments with card: 4242 4242 4242 4242

**tRPC Procedures:**
- `payments.create(data)` - Create payment record
- `payments.list()` - Get payment history

**Database Tables:**
- `payments` - Payment records
- `subscriptions` - Subscription records

---

## Database Schema

### Core Tables (18 total)

**Users & Authentication:**
- `users` - User accounts (trainers, clients, admins)
- `trainers` - Trainer profiles

**Client Management:**
- `clients` - Client profiles
- `programs` - Workout programs
- `exercises` - Exercise library
- `mealPlans` - Meal plans
- `recipes` - Recipe library

**Progress Tracking:**
- `progressMetrics` - Weight, measurements, bloodwork
- `bodyComposition` - BMI, body fat %, hydration %, etc.

**Communication:**
- `checkIns` - Client check-in submissions
- `messages` - Trainer-client messages

**Scheduling:**
- `sessions` - Training sessions

**Business Management:**
- `consultations` - Consultation requests
- `services` - Service offerings
- `packages` - Service packages
- `subscriptions` - Client subscriptions
- `payments` - Payment records
- `leads` - Lead tracking
- `referrals` - Referral tracking

**Content:**
- `documents` - Uploaded documents
- `questionnaires` - Pre-consultation forms

---

## Getting Started

### 1. Login
- Click "Login" button
- Authenticate with Manus OAuth
- You'll be redirected to dashboard

### 2. Create Your First Client
- Go to `/clients`
- Click "Add Client"
- Fill in client profile
- Click "Save"

### 3. Generate Workout Program
- Go to `/programs`
- Click "Generate New Program"
- Select client
- Click "Generate"
- Review AI-generated program
- Click "Save to Library"
- Assign to client

### 4. Generate Meal Plan
- Go to `/meals`
- Enter dietary preferences
- Click "Generate"
- Review meal plan and shopping list
- Assign to client

### 5. Track Progress
- Go to `/progress`
- Select client
- Log metrics (weight, measurements, photos)
- View progress trends

### 6. Review Check-Ins
- Go to `/check-ins`
- Review pending check-ins
- Provide feedback to clients

### 7. Manage Revenue
- Go to `/revenue`
- View monthly revenue
- Track income goal progress
- Review payment history

---

## API Endpoints

All API calls go through `/api/trpc`. Examples:

```
GET /api/trpc/clients.list
POST /api/trpc/programs.generateFromClient
POST /api/trpc/meals.generateFromPreferences
GET /api/trpc/progress.getClientMetrics
POST /api/trpc/messages.send
GET /api/trpc/revenue.getMonthlyRevenue
```

---

## Environment Variables

Pre-configured in your environment:
- `DATABASE_URL` - MySQL connection
- `JWT_SECRET` - Session signing
- `VITE_APP_ID` - Manus OAuth app ID
- `OAUTH_SERVER_URL` - Manus OAuth server
- `STRIPE_SECRET_KEY` - Stripe secret (sandbox)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `BUILT_IN_FORGE_API_KEY` - LLM API key
- `BUILT_IN_FORGE_API_URL` - LLM API URL

---

## Troubleshooting

### Can't login?
- Make sure you're using Manus OAuth
- Check that cookies are enabled
- Try clearing browser cache

### AI generators not working?
- Check that LLM API is configured
- Verify client profile has complete data
- Check server logs for errors

### Stripe payments not working?
- Claim your Stripe sandbox first
- Use test card: 4242 4242 4242 4242
- Check webhook configuration in Stripe dashboard

### Database issues?
- Check DATABASE_URL is correct
- Verify MySQL connection
- Run migrations if needed

---

## Next Steps

1. **Customize Your Profile:**
   - Add bio, certifications, specialties
   - Upload profile photo
   - Set services and pricing

2. **Upload Documents:**
   - Add customization questionnaires
   - Add client intake forms
   - Add nutrition guides

3. **Set Up Services:**
   - Define your service offerings
   - Set pricing
   - Create packages

4. **Invite Clients:**
   - Share public profile link
   - Clients can book consultations
   - Clients can view programs and meal plans

5. **Integrate Video Calls:**
   - Google Voice integration (coming soon)
   - Video session recording (coming soon)

---

## Support

For technical issues or feature requests, contact the development team.

**Current Version:** 1.0.0  
**Last Updated:** May 31, 2026  
**Status:** Production Ready
