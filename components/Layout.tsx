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
  const roleColor = currentUser.role === Role.ADMIN ? 'rose' : currentUser.role === Role.MENTOR ? 'emerald' : 'cyan';
  const roleTextClass = `text-${roleColor}-600`;
  const roleBgClass = `bg-${roleColor}-50`;
  const roleBorderClass = `border-${roleColor}-200`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#EDE9E6] font-outfit relative overflow-hidden">
      {/* Dynamic Background Elements for depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-200/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-[30%] h-[30%] bg-purple-200/20 rounded-full blur-[100px]" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-40 border-b border-slate-200">
        <h1 className="font-bold text-lg text-slate-900">Mentoring Log</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="text-slate-600" />
        </button>
      </div>

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed md:sticky top-4 h-[calc(100vh-2rem)] w-80 bg-black/40 backdrop-blur-[120px] saturate-150 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform transition-transform duration-500 ease-in-out z-50 flex flex-col border border-white/10 rounded-[1.5rem] ml-4 my-4
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'} md:translate-x-0
      `}>
        <div className="p-8 border-b border-white/10">
          <h2 className="text-2xl font-black bg-gradient-to-br from-white via-slate-200 to-[#454040] bg-clip-text text-transparent tracking-tighter">RAISE</h2>
          <p className="text-[9px] text-white/40 mt-0.5 uppercase tracking-[0.3em] font-bold">Mentoring Platform</p>
        </div>

        <div className="p-4 border-b border-white/10">
          {/* User Profile */}
          <div 
            onClick={() => {
                navigate(`/${currentUser.role.toLowerCase()}/profile`);
                setIsSidebarOpen(false);
            }}
            className="w-full flex items-center space-x-3 p-3 rounded-[1.5rem] bg-white/[0.08] border border-white/10 shadow-2xl group hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.98] backdrop-blur-2xl"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-md group-hover:bg-white/20 transition-all"></div>
              <img src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=1e293b&color=ffffff`} alt="Avatar" className="relative w-10 h-10 rounded-full border border-white/20 group-hover:border-white/40 transition-colors shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-slate-900 rounded-full shadow-sm animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-white transition-colors">{currentUser.fullName}</p>
              <div className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full bg-white/10 border-white/10 border backdrop-blur-md`}>
                <span className={`text-[8px] font-black uppercase tracking-widest text-white/80`}>{currentUser.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar relative z-10">
          {navItems.length > 0 && (
            <nav className="space-y-1.5">
              <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-4 px-3">Main Menu</div>
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
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[1.5rem] transition-all duration-300 group relative overflow-hidden ${
                        active
                          ? 'bg-[#454040] text-white shadow-xl border border-white/10' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                      )}
                      
                      <div className={`${active ? 'text-white' : 'text-white/40 group-hover:text-white'} transition-colors duration-300`}>
                          {React.cloneElement(item.icon as React.ReactElement, { size: 18, strokeWidth: active ? 2.5 : 2 })}
                      </div>
                      <span className={`text-[13px] flex-1 text-left ${active ? 'font-bold tracking-wide' : 'font-medium'}`}>{item.label}</span>
                      
                      {item.badge !== undefined && item.badge > 0 && !hasSubItems && (
                        <span className={`
                          flex items-center justify-center min-w-[20px] h-5 px-1.5 
                          rounded-[1.5rem] text-[9px] font-black 
                          ${active ? 'bg-[#454040] text-white' : 'bg-white/10 text-white/40'} 
                          shadow-sm animate-pulse
                        `}>
                          {item.badge}
                        </span>
                      )}

                      {hasSubItems && (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-500 ${isOpen ? 'rotate-180 text-white' : 'text-white/20 group-hover:text-white'}`} 
                        />
                      )}
                    </button>

                    {/* Sub-items */}
                    {hasSubItems && isOpen && (
                      <div className="ml-5 pl-4 border-l border-white/10 space-y-1 mt-1.5 animate-in slide-in-from-top-2 duration-500">
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
                              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-[1.5rem] transition-all duration-300 group ${
                                subActive
                                  ? 'bg-[#454040]/50 text-white font-bold' 
                                  : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                              }`}
                            >
                              <div className={`${subActive ? 'text-white' : 'text-white/20 group-hover:text-white'} transition-colors`}>
                                {React.cloneElement(subItem.icon as React.ReactElement, { size: 14 })}
                              </div>
                              <span className="text-[12px] flex-1 text-left">{subItem.label}</span>
                              
                              {subItem.badge !== undefined && subItem.badge > 0 && (
                                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-md text-[8px] font-black bg-white/10 text-white border border-white/20">
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
        
        <div className="p-6 border-t border-white/10 relative z-10">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex items-center space-x-3 text-white/40 hover:text-rose-400 transition-all duration-300 px-4 py-3 w-full rounded-[1.5rem] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:scale-95 backdrop-blur-md"
          >
            <div className="bg-white/5 p-2 rounded-[1.5rem] group-hover:bg-rose-500/20 transition-colors border border-white/10">
                <LogOut size={16} />
            </div>
            <span className="text-[13px] font-bold tracking-wider">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050508]/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0a0a0f]/80 border border-white/10 rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full p-10 transform animate-in zoom-in-95 duration-500 backdrop-blur-2xl relative overflow-hidden">
            {/* Modal Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px]"></div>
            
            <div className="relative z-10">
              <div className="bg-rose-500/10 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 border border-rose-500/20 mx-auto shadow-inner">
                <LogOut className="text-rose-500" size={36} />
              </div>
              <h3 className="text-2xl font-black text-white text-center mb-3 tracking-tight">Sign Out?</h3>
              <p className="text-white/40 text-center text-sm mb-10 leading-relaxed font-medium">Are you sure you want to end your active session? You'll need to log in again to access your dashboard.</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-white/60 font-bold text-sm hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                >
                  No, Stay
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white font-bold text-sm hover:from-rose-500 hover:to-rose-600 transition-all shadow-xl shadow-rose-900/20 active:scale-95 border border-rose-500/20"
                >
                  Yes, Logout
                </button>
              </div>
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