import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { StaffDepartmentProvider } from './context/StaffDepartmentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import { CustomerRoute, OwnerRoute, AdminRoute, StaffRoute, DepartmentRouteGuard } from './routes';

import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Profile from './pages/Profile';
import HotelSearch from './pages/HotelSearch';
import HotelDetails from './pages/HotelDetails';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Wishlist from './pages/Wishlist';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddEditHotel from './pages/owner/AddEditHotel';
import ManageRooms from './pages/owner/ManageRooms';
import AddEditRoom from './pages/owner/AddEditRoom';

// Admin & Staff & Support Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ReservationPortal from './pages/staff/departments/ReservationPortal';
import CustomerSupportPortal from './pages/staff/departments/CustomerSupportPortal';
import RefundsClaimsPortal from './pages/staff/departments/RefundsClaimsPortal';
import PayoutsEscrowPortal from './pages/staff/departments/PayoutsEscrowPortal';
import HotelVerificationPortal from './pages/staff/departments/HotelVerificationPortal';
import SupportTickets from './pages/SupportTickets';

import BecomeHost from './pages/BecomeHost';
import PartnerBenefits from './pages/PartnerBenefits';
import RealTimeInventory from './pages/RealTimeInventory';
import Offers from './pages/Offers';

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <StaffDepartmentProvider>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
            <Navbar />
            <main className="flex-grow">
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/search" element={<HotelSearch />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/become-host" element={<BecomeHost />} />
              <Route path="/partner-benefits" element={<PartnerBenefits />} />
              <Route path="/real-time-inventory" element={<RealTimeInventory />} />
              <Route path="/offers" element={<Offers />} />

              
              {/* Protected Guest Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <CustomerRoute>
                    <BookingPage />
                  </CustomerRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <CustomerRoute>
                    <PaymentPage />
                  </CustomerRoute>
                }
              />
              <Route
                path="/booking-confirmation/:id"
                element={
                  <CustomerRoute>
                    <BookingConfirmation />
                  </CustomerRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />

              {/* Protected Hotel Owner Routes */}
              <Route
                path="/owner/dashboard"
                element={
                  <OwnerRoute>
                    <OwnerDashboard />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/dashboard/:subTab"
                element={
                  <OwnerRoute>
                    <OwnerDashboard />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/hotels/new"
                element={
                  <OwnerRoute>
                    <AddEditHotel />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/hotels/:id/edit"
                element={
                  <OwnerRoute>
                    <AddEditHotel />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms"
                element={
                  <OwnerRoute>
                    <ManageRooms />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms/new"
                element={
                  <OwnerRoute>
                    <AddEditRoom />
                  </OwnerRoute>
                }
              />
              <Route
                path="/owner/hotels/:hotelId/rooms/:roomId/edit"
                element={
                  <OwnerRoute>
                    <AddEditRoom />
                  </OwnerRoute>
                }
              />

              {/* Strict Department-Isolated Staff Portals */}
              <Route
                path="/staff"
                element={
                  <StaffRoute>
                    <StaffDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/dashboard"
                element={
                  <StaffRoute>
                    <StaffDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/staff/reservation"
                element={
                  <DepartmentRouteGuard targetDepartment="RESERVATION">
                    <ReservationPortal />
                  </DepartmentRouteGuard>
                }
              />
              <Route
                path="/staff/support"
                element={
                  <DepartmentRouteGuard targetDepartment="CUSTOMER_SUPPORT">
                    <CustomerSupportPortal />
                  </DepartmentRouteGuard>
                }
              />
              <Route
                path="/staff/refunds"
                element={
                  <DepartmentRouteGuard targetDepartment="REFUNDS_AND_CLAIMS">
                    <RefundsClaimsPortal />
                  </DepartmentRouteGuard>
                }
              />
              <Route
                path="/staff/payouts"
                element={
                  <DepartmentRouteGuard targetDepartment="PAYOUT_AND_ESCROW">
                    <PayoutsEscrowPortal />
                  </DepartmentRouteGuard>
                }
              />
              <Route
                path="/staff/verification"
                element={
                  <DepartmentRouteGuard targetDepartment="HOTEL_VERIFICATION">
                    <HotelVerificationPortal />
                  </DepartmentRouteGuard>
                }
              />

              {/* Support Tickets Route */}
              <Route
                path="/support/tickets"
                element={
                  <ProtectedRoute>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Catch all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toast />
        </div>
        </StaffDepartmentProvider>
      </Router>
    </LanguageProvider>
  </AuthProvider>
  );
};

export default App;
