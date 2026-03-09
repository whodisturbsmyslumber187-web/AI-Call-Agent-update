import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import LiveDemo from "./pages/LiveDemo";
import Conversations from "./pages/Conversations";
import Reservations from "./pages/Reservations";
import Settings from "./pages/Settings";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import LiveMonitoring from "./pages/LiveMonitoring";
import Analytics from "./pages/Analytics";
import AgentHub from "./pages/AgentHub";
import Approvals from "./pages/Approvals";
import CommandCenter from "./pages/CommandCenter";
import Auth from "./pages/Auth";
import ActivityPage from "./pages/ActivityPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Businesses />} />
                <Route path="business/:id" element={<BusinessDetail />} />
                <Route path="live-demo" element={<LiveDemo />} />
                <Route path="conversations" element={<Conversations />} />
                <Route path="reservations" element={<Reservations />} />
                <Route path="monitoring" element={<LiveMonitoring />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="agent-hub" element={<AgentHub />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
