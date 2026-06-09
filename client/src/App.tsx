import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";

// Auth pages load eagerly — they're the first thing new users hit
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/NotFound";

// All other pages are lazy-loaded to split the bundle
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClientsPage = lazy(() => import("@/pages/ClientsPage"));
const ClientDetailPage = lazy(() => import("@/pages/ClientDetailPage"));
const PublicClientProfilePage = lazy(() => import("@/pages/PublicClientProfilePage"));
const ProgramsPage = lazy(() => import("@/pages/ProgramsPage"));
const ProgramDetailPage = lazy(() => import("@/pages/ProgramDetailPage"));
const MealsPage = lazy(() => import("@/pages/MealsPage"));
const CheckInsPage = lazy(() => import("@/pages/CheckInsPage"));
const MessagingPage = lazy(() => import("@/pages/MessagingPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const ConsultationsPage = lazy(() => import("@/pages/ConsultationsPage"));
const SchedulingPage = lazy(() => import("@/pages/SchedulingPage"));
const RevenuePage = lazy(() => import("@/pages/RevenuePage"));
const LeadsPage = lazy(() => import("@/pages/LeadsPage"));
const BrandPage = lazy(() => import("@/pages/BrandPage"));
const VideoCallPage = lazy(() => import("@/pages/VideoCallPage"));
const PhotoProgressPage = lazy(() => import("@/pages/PhotoProgressPage"));
const ClientPortalPage = lazy(() => import("@/pages/ClientPortalPage"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const TrainerFormsPage = lazy(() => import("@/pages/TrainerFormsPage"));
const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
const AiCoachPage = lazy(() => import("@/pages/AiCoachPage"));
const SessionsPage = lazy(() => import("@/pages/SessionsPage"));
const HabitTemplatesPage = lazy(() => import("@/pages/HabitTemplatesPage"));

const BARE_ROUTES = ["/login", "/register", "/signup", "/forgot-password", "/reset-password", "/ai-coach"];

function Router() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "var(--black)" }} className="min-h-screen" />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientDetailPage} />
        <Route path="/public-profile/:clientId" component={PublicClientProfilePage} />
        <Route path="/programs" component={ProgramsPage} />
        <Route path="/programs/:id" component={ProgramDetailPage} />
        <Route path="/meals" component={MealsPage} />
        <Route path="/check-ins" component={CheckInsPage} />
        <Route path="/messaging" component={MessagingPage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/consultations" component={ConsultationsPage} />
        <Route path="/scheduling" component={SchedulingPage} />
        <Route path="/revenue" component={RevenuePage} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/brand" component={BrandPage} />
        <Route path="/video" component={VideoCallPage} />
        <Route path="/photos" component={PhotoProgressPage} />
        <Route path="/portal" component={ClientPortalPage} />
        <Route path="/client-dashboard" component={ClientDashboard} />
        <Route path="/trainer/forms" component={TrainerFormsPage} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/ai-coach" component={AiCoachPage} />
        <Route path="/sessions" component={SessionsPage} />
        <Route path="/habit-templates" component={HabitTemplatesPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppShell() {
  const [location] = useLocation();
  const isBare = BARE_ROUTES.some(r => location === r || location.startsWith(r));
  if (isBare) return <Router />;
  return (
    <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen">
      <Navigation />
      <Router />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
