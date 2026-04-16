import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { Role } from '../types';
import { LogOut, Menu, ChevronDown } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: number;
  subItems?: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
}

export const Layout: React.FC<LayoutProps> = ({ children, navItems = [] }) => {
  const { currentUser, logout } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to check if a nav item is active based on the URL
  const isActive = (path?: string, subItems?: NavItem[]) => {
    if (path && (location.pathname === path || location.pathname.startsWith(`${path}/`))) {
      return true;
    }
    if (subItems) {
      return subItems.some(sub => sub.path && (location.pathname === sub.path || location.pathname.startsWith(`${sub.path}/`)));
    }
    return false;
  };

  // Auto-open menus that contain the active path
  React.useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems && isActive(undefined, item.subItems)) {
        if (!openMenus.includes(item.id)) {
          setOpenMenus(prev => [...prev, item.id]);
        }
      }
    });
  }, [location.pathname, navItems]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleLogout = async () => {
    try {
      const role = currentUser?.role;
      await logout();
      
      // Navigate to the respective portal based on the role we just logged out from
      if (role === Role.ADMIN) {
        navigate('/auth/portal-secure-v8821-admin');
      } else if (role === Role.MENTOR) {
        navigate('/welcome/mentor');
      } else {
        navigate('/welcome/students');
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!currentUser) return null;

  // Role-based accent colors
  const roleColor = currentUser.role === Role.ADMIN ? 'rose' : currentUser.role === Role.MENTOR ? 'emerald' : 'indigo';
  const roleTextClass = `text-${roleColor}-400`;
  const roleBgClass = `bg-${roleColor}-500/10`;
  const roleBorderClass = `border-${roleColor}-500/20`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-outfit relative">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 shadow-sm p-4 flex justify-between items-center sticky top-0 z-20 border-b border-white/5">
        <h1 className="font-bold text-lg text-white">Mentoring Log</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="text-white/70" />
        </button>
      </div>

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-72 bg-[#131010] shadow-2xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col border-r border-white/5
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-5 border-b border-white/5">
          <h2 className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">RAISE</h2>
          <p className="text-[10px] text-[#AAB2C8] mt-0.5 uppercase tracking-[0.15em] font-bold opacity-60">Mentoring Platform</p>
        </div>

        <div className="p-4 border-b border-white/5">
          {/* User Profile */}
          <div 
            onClick={() => {
                navigate(`/${currentUser.role.toLowerCase()}/profile`);
                setIsSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner group hover:border-[#B8CFCE]/50 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="relative">
              <img src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random`} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#B8CFCE]/30 group-hover:border-[#B8CFCE] transition-colors shadow-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#B8CFCE] transition-colors">{currentUser.fullName}</p>
              <div className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full ${roleBgClass} ${roleBorderClass} border`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${roleTextClass}`}>{currentUser.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
          {navItems.length > 0 && (
            <nav className="space-y-1">
              <div className="text-[10px] font-bold text-[#AAB2C8] uppercase tracking-[0.2em] mb-2 px-2 opacity-60">Main Menu</div>
              {navItems.map((item) => {
                const active = isActive(item.path, item.subItems);
                const isOpen = openMenus.includes(item.id);
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          toggleMenu(item.id);
                        } else if (item.path) {
                          navigate(item.path);
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group ${
                        active
                          ? 'bg-[#B8CFCE] text-slate-900 shadow-lg shadow-[#B8CFCE]/20 font-bold translate-x-1' 
                          : 'text-[#AAB2C8] hover:bg-white/5 hover:text-white font-medium hover:translate-x-1'
                      }`}
                    >
                      <div className={`${active ? 'text-slate-900' : 'text-[#AAB2C8] group-hover:text-[#B8CFCE]'} transition-colors`}>
                          {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                      </div>
                      <span className="text-[13px] flex-1 text-left">{item.label}</span>
                      
                      {item.badge !== undefined && item.badge > 0 && !hasSubItems && (
                        <span className={`
                          flex items-center justify-center min-w-[18px] h-4.5 px-1.5 
                          rounded-full text-[9px] font-black 
                          ${active ? 'bg-slate-900 text-[#B8CFCE]' : 'bg-[#B8CFCE] text-slate-900'} 
                          shadow-md animate-pulse
                        `}>
                          {item.badge}
                        </span>
                      )}

                      {hasSubItems && (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-slate-900' : 'text-[#AAB2C8] group-hover:text-[#B8CFCE]'}`} 
                        />
                      )}
                    </button>

                    {/* Sub-items */}
                    {hasSubItems && isOpen && (
                      <div className="ml-4 pl-4 border-l border-white/10 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                        {item.subItems?.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                if (subItem.path) {
                                  navigate(subItem.path);
                                  setIsSidebarOpen(false);
                                }
                              }}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all group ${
                                subActive
                                  ? 'bg-white/5 text-[#B8CFCE] font-bold border-r-2 border-[#B8CFCE]' 
                                  : 'text-[#AAB2C8] hover:bg-white/5 hover:text-white font-medium'
                              }`}
                            >
                              <div className={`${subActive ? 'text-[#B8CFCE]' : 'text-[#AAB2C8] group-hover:text-[#B8CFCE]'} transition-colors`}>
                                {React.cloneElement(subItem.icon as React.ReactElement, { size: 14 })}
                              </div>
                              <span className="text-xs flex-1 text-left">{subItem.label}</span>
                              
                              {subItem.badge !== undefined && subItem.badge > 0 && (
                                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[8px] font-black bg-[#B8CFCE] text-slate-900">
                                  {subItem.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex items-center space-x-3 text-[#7F8CAA] hover:text-rose-400 transition-all px-3 py-2 w-full rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:scale-95"
          >
            <div className="bg-slate-800 p-1.5 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                <LogOut size={16} />
            </div>
            <span className="text-xs font-bold tracking-wide">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#131010] border border-white/5 rounded-3xl shadow-2xl max-w-sm w-full p-8 transform animate-in zoom-in-95 duration-300">
            <div className="bg-rose-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20 mx-auto">
              <LogOut className="text-rose-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Sign Out?</h3>
            <p className="text-[#AAB2C8] text-center text-sm mb-8">Are you sure you want to end your active session? You'll need to log in again to access your dashboard.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-3 rounded-xl bg-white/5 text-[#AAB2C8] font-bold text-sm hover:bg-white/10 transition-colors border border-white/10"
              >
                No, Stay
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};