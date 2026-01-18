import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));

// Lazy loaded pages - split into separate chunks
const Login = lazy(() => import("./pages/Login"));
const InstructorLogin = lazy(() => import("./pages/InstructorLogin"));

// Lazy loaded pages
const Instructors = lazy(() => import("./pages/Instructors"));
const InstructorProfile = lazy(() => import("./pages/InstructorProfile"));
const InstructorRegister = lazy(() => import("./pages/InstructorRegister"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const InstructorSchedule = lazy(() => import("./pages/InstructorSchedule"));
const UsageHistory = lazy(() => import("./pages/UsageHistory"));
const InstructorPlans = lazy(() => import("./pages/InstructorPlans"));
const PasswordRecovery = lazy(() => import("./pages/PasswordRecovery"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminFinanceiro = lazy(() => import("./pages/AdminFinanceiro"));
const Messages = lazy(() => import("./pages/Messages"));
const FAQ = lazy(() => import("./pages/FAQ"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));

const CNH2025Landing = lazy(() => import("./pages/CNH2025Landing"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));
const Install = lazy(() => import("./pages/Install"));

const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Suspense fallback={<PageLoader />}><Index /></Suspense>} />
              <Route path="/instrutores" element={<Suspense fallback={<PageLoader />}><Instructors /></Suspense>} />
              <Route path="/instrutor/:id" element={<Suspense fallback={<PageLoader />}><InstructorProfile /></Suspense>} />
              <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
              <Route path="/instrutor/login" element={<Suspense fallback={<PageLoader />}><InstructorLogin /></Suspense>} />
              <Route path="/instrutor/cadastro" element={<Suspense fallback={<PageLoader />}><InstructorRegister /></Suspense>} />
              <Route path="/instrutor/dashboard" element={<Suspense fallback={<PageLoader />}><InstructorDashboard /></Suspense>} />
              <Route path="/como-funciona" element={<Suspense fallback={<PageLoader />}><HowItWorks /></Suspense>} />
              <Route path="/instrutor/agenda" element={<Suspense fallback={<PageLoader />}><InstructorSchedule /></Suspense>} />
              <Route path="/historico" element={<Suspense fallback={<PageLoader />}><UsageHistory /></Suspense>} />
              <Route path="/instrutor/planos" element={<Suspense fallback={<PageLoader />}><InstructorPlans /></Suspense>} />
              <Route path="/recuperar-senha" element={<Suspense fallback={<PageLoader />}><PasswordRecovery /></Suspense>} />
              <Route path="/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
              <Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
              <Route path="/admin/financeiro" element={<Suspense fallback={<PageLoader />}><AdminFinanceiro /></Suspense>} />
              <Route path="/mensagens" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
              <Route path="/pagamento-sucesso" element={<Suspense fallback={<PageLoader />}><PaymentSuccess /></Suspense>} />
              <Route path="/pagamento-cancelado" element={<Suspense fallback={<PageLoader />}><PaymentCanceled /></Suspense>} />
              <Route path="/cnh-2025" element={<Suspense fallback={<PageLoader />}><CNH2025Landing /></Suspense>} />
              <Route path="/faq" element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
              <Route path="/aluno/dashboard" element={<Suspense fallback={<PageLoader />}><StudentDashboard /></Suspense>} />
              <Route path="/aluno/perfil" element={<Suspense fallback={<PageLoader />}><StudentProfile /></Suspense>} />
              <Route path="/instalar" element={<Suspense fallback={<PageLoader />}><Install /></Suspense>} />
              
              {/* Legal Pages */}
              <Route path="/termos" element={<Suspense fallback={<PageLoader />}><TermsOfUse /></Suspense>} />
              <Route path="/privacidade" element={<Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;