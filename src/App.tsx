import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BottomNav } from "@/components/BottomNav";
import { PaywallSheet } from "@/components/PaywallSheet";
import { useDirection } from "@/hooks/useDirection";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ProfileDetail from "./pages/ProfileDetail";
import AddProfile from "./pages/AddProfile";
import AnalyzingProfile from "./pages/AnalyzingProfile";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import LegalImpressum from "./pages/legal/Impressum";
import LegalDatenschutz from "./pages/legal/Datenschutz";
import LegalAGB from "./pages/legal/AGB";
import LegalWiderruf from "./pages/legal/Widerruf";
import VerifyEmail from "./pages/VerifyEmail";
import SpyDetail from "./pages/SpyDetail";
import FeedPage from "./pages/FeedPage";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NativeCallback from "./pages/NativeCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useDirection();
  return (
    <>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/legal/impressum" element={<LegalImpressum />} />
        <Route path="/legal/datenschutz" element={<LegalDatenschutz />} />
        <Route path="/legal/agb" element={<LegalAGB />} />
        <Route path="/legal/widerruf" element={<LegalWiderruf />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
        <Route path="/add-profile" element={<ProtectedRoute><AddProfile /></ProtectedRoute>} />
        <Route path="/analyzing/:profileId/:username" element={<ProtectedRoute><AnalyzingProfile /></ProtectedRoute>} />
        <Route path="/spy" element={<ProtectedRoute><SpyDetail /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <PaywallSheet />
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <AppContent />
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
