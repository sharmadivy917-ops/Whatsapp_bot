import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Carrot, ShoppingCart, Settings } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/vegetables', label: 'Stock', icon: Carrot },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 px-4 pb-safe pt-2 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${
                isActive ? 'text-primary-600 scale-110' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative p-2 rounded-full transition-colors ${isActive ? 'bg-primary-50' : ''}`}>
                  <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                  {/* Subtle active indicator dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600 shadow-sm" />
                  )}
                </div>
                <span className={`text-[10px] font-medium mt-0.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
