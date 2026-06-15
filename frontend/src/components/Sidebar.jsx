import { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Carrot,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: LayoutDashboard },
  { path: '/vegetables', label: 'Vegetables', labelHi: 'सब्ज़ियाँ', icon: Carrot },
  { path: '/orders', label: 'Orders', labelHi: 'ऑर्डर', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', labelHi: 'ग्राहक', icon: Users },
  { path: '/payments', label: 'Payments', labelHi: 'पेमेंट', icon: CreditCard },
  { path: '/settings', label: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
];

export default function Sidebar({ isShopOpen, onToggleShop }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-gray-100/50 z-40 flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                <span className="text-xl">🥬</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-lg leading-tight">VegBot</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    className={`transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{item.label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{item.labelHi}</span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Shop toggle + Logout */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Shop Open/Closed Toggle */}
          <button
            id="shop-toggle-btn"
            onClick={onToggleShop}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
              isShopOpen
                ? 'bg-primary-50 border border-primary-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Store size={18} className={isShopOpen ? 'text-primary-600' : 'text-red-500'} />
              <span className={`text-sm font-medium ${isShopOpen ? 'text-primary-700' : 'text-red-600'}`}>
                {isShopOpen ? 'Shop Open' : 'Shop Closed'}
              </span>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${
                isShopOpen ? 'bg-primary-500' : 'bg-red-400'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isShopOpen ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>

          {/* Logout */}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 
                       hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
