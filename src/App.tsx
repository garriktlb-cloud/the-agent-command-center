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
import Auth from "@/pages/Auth";
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
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/vendors" element={<PlaceholderPage title="Vendors" />} />
              <Route path="/tasks" element={<PlaceholderPage title="Tasks" />} />
              <Route path="/contacts" element={<PlaceholderPage title="Contacts" />} />
              <Route path="/marketing" element={<PlaceholderPage title="Marketing Center" />} />
              <Route path="/coaching" element={<PlaceholderPage title="Coaching" />} />
              <Route path="/performance" element={<PlaceholderPage title="Performance" />} />
              <Route path="/business-tracker" element={<PlaceholderPage title="Business Tracker" />} />
              <Route path="/billing" element={<PlaceholderPage title="Billing" />} />
              <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
