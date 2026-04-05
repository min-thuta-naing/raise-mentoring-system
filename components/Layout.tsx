import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { LogOut, Menu } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface LayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
}

export const Layout: React.FC<LayoutProps> = ({ children, navItems = [] }) => {
  const { currentUser } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to check if a nav item is active based on the URL
  const isActive = (path: string) => {
    // Exact match or partial match for sub-routes
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="font-bold text-lg text-indigo-700">Mentoring Log</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-10 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-indigo-600">Gen-Next</h2>
          <p className="text-xs text-gray-500 mt-1">Mentoring System v2.0</p>
        </div>

        <div className="p-4 border-b border-gray-100">
          {/* User Profile (Static Display) */}
          <div className="w-full flex items-center space-x-3 p-2">
            <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.fullName}</p>
              <p className="text-xs text-indigo-600 font-medium capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          {navItems.length > 0 && (
            <nav className="space-y-1">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Main Menu</div>
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                        navigate(item.path);
                        setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-bold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center space-x-3 text-gray-500 hover:text-red-500 transition-colors px-2 py-2 w-full rounded-lg hover:bg-red-50">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};