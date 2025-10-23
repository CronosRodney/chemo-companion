import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <div className="relative">
            <Routes>
              <Route path="/auth" element={<Auth />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Navigation />
          </div>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
