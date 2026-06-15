import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/Toast';
import { dashboardAPI } from './services/api';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vegetables from './pages/Vegetables';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import SettingsPage from './pages/Settings';
import { toast } from './components/Toast';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [isShopOpen, setIsShopOpen] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchShopStatus();
    }
  }, [isAuthenticated]);

  async function fetchShopStatus() {
    try {
      const { data } = await dashboardAPI.getSettings();
      setIsShopOpen(data.isShopOpen);
    } catch (error) {
      console.error('Failed to fetch shop status');
    }
  }

  async function handleToggleShop() {
    try {
      const { data } = await dashboardAPI.toggleShop();
      setIsShopOpen(data.isShopOpen);
      toast(data.isShopOpen ? 'Shop is now OPEN! 🟢' : 'Shop is now CLOSED 🔴');
    } catch (error) {
      toast('Failed to toggle shop status', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl mb-4 animate-pulse">
            <span className="text-3xl">🥬</span>
          </div>
          <p className="text-gray-500 font-medium">Loading VegBot...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8faf9] flex flex-col">
      <Sidebar isShopOpen={isShopOpen} onToggleShop={handleToggleShop} />

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="lg:ml-72 flex-1 relative pb-24 lg:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 pt-6 lg:pt-8">
          {/* Shop status bar */}
          {!isShopOpen && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in shadow-sm">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />
              <p className="text-sm text-red-700 font-medium">
                Shop is currently CLOSED — Bot will reply "dukaan band hai"
              </p>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vegetables" element={<Vegetables />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Login />;
}

export default App;
