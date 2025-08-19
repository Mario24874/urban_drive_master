import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, MessageSquare, LogIn, UserPlus, LogOut, User, LayoutDashboard, Menu, X, Share } from './Icons';
import UrbanDriveLogo from '/assets/UrbanDrive.png';
import ShareAPK from './ShareAPK';

interface NavbarProps {
  isAuthenticated: boolean;
  handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, handleLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = isAuthenticated ? [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/map', icon: MapPin, label: 'Map' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ] : [
    { to: '/login', icon: LogIn, label: 'Login' },
    { to: '/register', icon: UserPlus, label: 'Register' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="mobile-header hidden sm:block">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src={UrbanDriveLogo} 
                alt="Urban Drive Logo" 
                className="h-10 w-10 rounded-lg object-cover" 
              />
              <Link 
                to="/" 
                className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Urban Drive
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Compartir Urban Drive"
                  >
                    <Share size={18} />
                    <span>Compartir App</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img 
                  src={UrbanDriveLogo} 
                  alt="Urban Drive Logo" 
                  className="h-8 w-8 rounded object-cover" 
                />
                <span className="text-lg font-bold text-gray-900">Urban Drive</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={toggleMobileMenu}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive(to)
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
              
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => {
                      setIsShareModalOpen(true);
                      toggleMobileMenu();
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Share size={20} />
                    <span className="font-medium">Compartir App</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (for authenticated users) */}
      {isAuthenticated && (
        <nav className="mobile-nav sm:hidden">
          <div className="flex items-center justify-around py-2 safe-bottom">
            {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors ${
                  isActive(to)
                    ? 'text-black'
                    : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
      
      {/* Share APK Modal */}
      <ShareAPK 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        apkUrl="http://localhost:3001/download-apk" 
      />
    </>
  );
};

export default Navbar;