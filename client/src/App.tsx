import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import ClientsPage from "@/pages/ClientsPage";
import ProgramsPage from "@/pages/ProgramsPage";
import MealsPage from "@/pages/MealsPage";
import CheckInsPage from "@/pages/CheckInsPage";
import MessagingPage from "@/pages/MessagingPage";
import SchedulingPage from "@/pages/SchedulingPage";
import RevenuePage from "@/pages/RevenuePage";
import LeadsPage from "@/pages/LeadsPage";
import BrandPage from "@/pages/BrandPage";
import ProgressPage from "@/pages/ProgressPage";
import ConsultationsPage from "@/pages/ConsultationsPage";
import VideoCallPage from "@/pages/VideoCallPage";
import PhotoProgressPage from "@/pages/PhotoProgressPage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ProgramDetailPage from "@/pages/ProgramDetailPage";
import PublicClientProfilePage from "@/pages/PublicClientProfilePage";
import ClientDashboard from "@/pages/ClientDashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SignupPage from "@/pages/SignupPage";
import TrainerFormsPage from "@/pages/TrainerFormsPage";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import AiCoachPage from "@/pages/AiCoachPage";
import SessionsPage from "@/pages/SessionsPage";
import HabitTemplatesPage from "@/pages/HabitTemplatesPage";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";

const BARE_ROUTES = ["/login", "/register", "/signup", "/forgot-password", "/reset-password", "/ai-coach"];

function Router() {
  return (
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
