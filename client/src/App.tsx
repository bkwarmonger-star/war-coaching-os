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
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/clients"} component={ClientsPage} />
      <Route path={"/programs"} component={ProgramsPage} />
      <Route path={"/meals"} component={MealsPage} />
      <Route path={"/check-ins"} component={CheckInsPage} />
      <Route path={"/messaging"} component={MessagingPage} />
      <Route path={"/progress"} component={ProgressPage} />
      <Route path={"/consultations"} component={ConsultationsPage} />
      <Route path={"/scheduling"} component={SchedulingPage} />
      <Route path={"/revenue"} component={RevenuePage} />
      <Route path={"/leads"} component={LeadsPage} />
      <Route path={"/brand"} component={BrandPage} />
      <Route path={"/video"} component={VideoCallPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <div style={{ backgroundColor: "var(--black)", color: "var(--white)" }} className="min-h-screen">
          <Navigation />
          <Router />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
