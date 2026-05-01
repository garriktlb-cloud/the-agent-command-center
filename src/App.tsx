import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import Transactions from "@/pages/Transactions";
import TransactionDetail from "@/pages/TransactionDetail";
import Orders from "@/pages/Orders";
import Tasks from "@/pages/Tasks";
import Auth from "@/pages/Auth";
import Seed from "@/pages/Seed";
import Contacts from "@/pages/Contacts";
import Coaching from "@/pages/Coaching";
import CoachingTopic from "@/pages/CoachingTopic";
import Marketing from "@/pages/Marketing";
import MarketingInsightDetail from "@/pages/MarketingInsightDetail";
import ChecklistTemplates from "@/pages/ChecklistTemplates";
import PlatformChecklist from "@/pages/admin/PlatformChecklist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-heading font-bold">{title}</h1>
    <p className="text-sm text-muted-foreground mt-1">Coming soon.</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/seed" element={<Seed />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/vendors" element={<PlaceholderPage title="Vendors" />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/marketing/:id" element={<MarketingInsightDetail />} />
              <Route path="/coaching" element={<Coaching />} />
              <Route path="/coaching/:topicId" element={<CoachingTopic />} />
              <Route path="/performance" element={<PlaceholderPage title="Performance" />} />
              <Route path="/business-tracker" element={<PlaceholderPage title="Business Tracker" />} />
              <Route path="/billing" element={<PlaceholderPage title="Billing" />} />
              <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="/settings/checklist-templates" element={<ChecklistTemplates />} />
              <Route path="/admin/platform-checklist" element={<PlatformChecklist />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
