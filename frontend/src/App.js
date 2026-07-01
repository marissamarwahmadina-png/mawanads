import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminContacts from "./pages/AdminContacts";
import AffiliateLanding from "./pages/AffiliateLanding";
import AffiliateThankYou from "./pages/AffiliateThankYou";
import KetentuanLayanan from "./pages/KetentuanLayanan";
import KebijakanPrivasi from "./pages/KebijakanPrivasi";
import WebinarLanding from "./pages/WebinarLanding";
import WebinarPayment from "./pages/WebinarPayment";
import WebinarConfirmation from "./pages/WebinarConfirmation";
import AdminWebinar from "./pages/AdminWebinar";
import AdminWhitelist from "./pages/AdminWhitelist";
import AdminSpending from "./pages/AdminSpending";
import TeamPage from "./pages/TeamPage";
import AdminAccount from "./pages/AdminAccount";
import WorkBoard from "./pages/WorkBoard";
import MyTasks from "./pages/MyTasks";
import ClientsPage from "./pages/ClientsPage";
import AdminLayout from "./components/AdminLayout";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLogin />} />

            {/* Admin workspace — sidebar layout, protected */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/board" element={<WorkBoard />} />
              <Route path="/admin/tugas" element={<MyTasks />} />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/contact" element={<AdminContacts />} />
              <Route path="/admin/webinar" element={<AdminWebinar />} />
              <Route path="/admin/whitelist" element={<AdminWhitelist />} />
              <Route path="/admin/whitelist/spends" element={<AdminSpending />} />
              <Route path="/admin/team" element={<TeamPage />} />
              <Route path="/admin/akun" element={<AdminAccount />} />
            </Route>

            <Route path="/affiliate/:affiliator" element={<AffiliateLanding />} />
            <Route path="/affiliate/:affiliator/thankyou" element={<AffiliateThankYou />} />
            <Route path="/ketentuan-layanan" element={<KetentuanLayanan />} />
            <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
            <Route path="/webinar/psikologi-sedekah" element={<WebinarLanding />} />
            <Route path="/webinar/psikologi-sedekah/pembayaran" element={<WebinarPayment />} />
            <Route path="/webinar/psikologi-sedekah/konfirmasi" element={<WebinarConfirmation />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;
