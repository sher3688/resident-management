import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import ResidentsPage from "./pages/Residents";
import DashboardHome from "./pages/DashboardHome";
import ImportResidentsPage from "./pages/ImportResidents";
import AdminSettingsPage from "./pages/AdminSettings";
import LoginPage from "./pages/Login";
import AccountManagementPage from "./pages/AccountManagement";
import ResidentRegulationsPage from "./pages/ResidentRegulationsPage";
import PrintFormsPage from "./pages/PrintForms";
import RepairRequestsPage from "./pages/RepairRequests";
import RenovationApplicationsPage from "./pages/RenovationApplications";
import ResourceLibraryPage from "./pages/ResourceLibrary";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={DashboardHome} />
            <Route path="/residents" component={ResidentsPage} />
            <Route path="/regulations" component={ResidentRegulationsPage} />
            <Route path="/import" component={ImportResidentsPage} />
            <Route path="/admin" component={AdminSettingsPage} />
            <Route path="/admin/settings" component={AdminSettingsPage} />
            <Route path="/admin/accounts" component={AccountManagementPage} />
            <Route path="/print-forms" component={PrintFormsPage} />
            <Route path="/repair-requests" component={RepairRequestsPage} />
            <Route path="/renovation-applications" component={RenovationApplicationsPage} />
            <Route path="/resource-library" component={ResourceLibraryPage} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
