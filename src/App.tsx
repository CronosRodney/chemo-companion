import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DoctorProtectedRoute } from "./components/doctor/DoctorProtectedRoute";
import { OfflineBanner } from "./components/OfflineBanner";
import Home from "./pages/Home";
import QRScanner from "./pages/QRScanner";
import ScanMed from "./pages/ScanMed";
import ScanClinic from "./pages/ScanClinic";
import MedicationDetails from "./pages/MedicationDetails";
import ManualMedicationEntry from "./pages/ManualMedicationEntry";
import Medications from "./pages/Medications";
import Timeline from "./pages/Timeline";
import Profile from "./pages/Profile";
import EditableProfile from "./pages/EditableProfile";
import Share from "./pages/Share";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import ImportMeds from "./pages/ImportMeds";
import Treatment from "./pages/Treatment";
import Labs from "./pages/Labs";
import Health from "./pages/Health";
import Vaccination from "./pages/Vaccination";
import Teleconsultation from "./pages/Teleconsultation";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorRegistration from "./pages/doctor/DoctorRegistration";
import PatientsList from "./pages/doctor/PatientsList";
import PatientDetails from "./pages/doctor/PatientDetails";
import InvitePatient from "./pages/doctor/InvitePatient";
import DoctorAlerts from "./pages/doctor/DoctorAlerts";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import AcceptInvite from "./pages/AcceptInvite";
import ChooseRole from "./pages/ChooseRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
          <div className="relative">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              {/* Rota de escolha de papel (obrigatória para OAuth sem role) */}
              <Route path="/choose-role" element={
                <ProtectedRoute skipRoleCheck>
                  <ChooseRole />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/scanner" element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
              } />
              <Route path="/scan/med" element={
                <ProtectedRoute>
                  <ScanMed />
                </ProtectedRoute>
              } />
              <Route path="/scan/clinic" element={
                <ProtectedRoute>
                  <ScanClinic />
                </ProtectedRoute>
              } />
              <Route path="/medication-details" element={
                <ProtectedRoute>
                  <MedicationDetails />
                </ProtectedRoute>
              } />
              <Route path="/manual-medication-entry" element={
                <ProtectedRoute>
                  <ManualMedicationEntry />
                </ProtectedRoute>
              } />
              <Route path="/medications" element={
                <ProtectedRoute>
                  <Medications />
                </ProtectedRoute>
              } />
              <Route path="/treatment" element={
                <ProtectedRoute>
                  <Treatment />
                </ProtectedRoute>
              } />
              <Route path="/labs" element={
                <ProtectedRoute>
                  <Labs />
                </ProtectedRoute>
              } />
              <Route path="/health" element={
                <ProtectedRoute>
                  <Health />
                </ProtectedRoute>
              } />
              <Route path="/vaccination/*" element={
                <ProtectedRoute>
                  <Vaccination />
                </ProtectedRoute>
              } />
              <Route path="/timeline" element={
                <ProtectedRoute>
                  <Timeline />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/profile/edit" element={
                <ProtectedRoute>
                  <EditableProfile />
                </ProtectedRoute>
              } />
              <Route path="/share" element={
                <ProtectedRoute>
                  <Share />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/import-meds" element={
                <ProtectedRoute>
                  <ImportMeds />
                </ProtectedRoute>
              } />
              <Route path="/teleconsultation" element={
                <ProtectedRoute>
                  <Teleconsultation />
                </ProtectedRoute>
              } />
              {/* Doctor Routes */}
              <Route path="/doctor/register" element={
                <ProtectedRoute skipRoleCheck>
                  <DoctorRegistration />
                </ProtectedRoute>
              } />
              <Route path="/doctor" element={
                <DoctorProtectedRoute>
                  <DoctorDashboard />
                </DoctorProtectedRoute>
              } />
              <Route path="/doctor/patients" element={
                <DoctorProtectedRoute>
                  <PatientsList />
                </DoctorProtectedRoute>
              } />
              <Route path="/doctor/patients/:patientId" element={
                <DoctorProtectedRoute>
                  <PatientDetails />
                </DoctorProtectedRoute>
              } />
              <Route path="/doctor/invite" element={
                <DoctorProtectedRoute>
                  <InvitePatient />
                </DoctorProtectedRoute>
              } />
              <Route path="/doctor/alerts" element={
                <DoctorProtectedRoute>
                  <DoctorAlerts />
                </DoctorProtectedRoute>
              } />
              <Route path="/doctor/profile" element={
                <DoctorProtectedRoute>
                  <DoctorProfile />
                </DoctorProtectedRoute>
              } />
              {/* Accept invite route (public) */}
              <Route path="/accept-invite/:inviteCode" element={<AcceptInvite />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Navigation />
            <OfflineBanner />
          </div>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
