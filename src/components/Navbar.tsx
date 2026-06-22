import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, MessageSquare, LogIn, UserPlus, LogOut, User, LayoutDashboard, Menu } from './Icons';
import UrbanDriveLogo from '/assets/UrbanDrive.png';

// Shadcn UI Components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  isAuthenticated: boolean;
  handleLogout: () => void;
  user?: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, handleLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = isAuthenticated
    ? [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/map', icon: MapPin, label: 'Map' },
        { to: '/messages', icon: MessageSquare, label: 'Messages' },
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/profile', icon: User, label: 'Profile' },
      ]
    : [
        { to: '/login', icon: LogIn, label: 'Login' },
        { to: '/register', icon: UserPlus, label: 'Register' },
      ];

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="mobile-header hidden sm:block border-b">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
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

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center space-x-2">
              {!isAuthenticated ? (
                navItems.map(({ to, icon: Icon, label }) => (
                  <Button
                    key={to}
                    asChild
                    variant={isActive(to) ? 'default' : 'ghost'}
                    size="sm"
                  >
                    <Link to={to}>
                      <Icon size={18} className="mr-2" />
                      {label}
                    </Link>
                  </Button>
                ))
              ) : (
                <>
                  {navItems.map(({ to, icon: Icon, label }) => (
                    <Button
                      key={to}
                      asChild
                      variant={isActive(to) ? 'default' : 'ghost'}
                      size="sm"
                    >
                      <Link to={to}>
                        <Icon size={18} className="mr-2" />
                        {label}
                      </Link>
                    </Button>
                  ))}

                  {/* User Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                          <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {user?.displayName && (
                            <p className="font-medium">{user.displayName}</p>
                          )}
                          {user?.email && (
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={24} />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center space-x-3">
                      <img
                        src={UrbanDriveLogo}
                        alt="Urban Drive Logo"
                        className="h-8 w-8 rounded object-cover"
                      />
                      <span className="text-lg font-bold">Urban Drive</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-2">
                  {navItems.map(({ to, icon: Icon, label }) => (
                    <Button
                      key={to}
                      asChild
                      variant={isActive(to) ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to={to}>
                        <Icon size={20} className="mr-3" />
                        {label}
                      </Link>
                    </Button>
                  ))}

                  {isAuthenticated && (
                    <>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut size={20} className="mr-3" />
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (authenticated users only) */}
      {isAuthenticated && (
        <nav className="mobile-nav sm:hidden border-t">
          <div className="flex items-center justify-around py-2 safe-bottom">
            {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                  isActive(to) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

    </>
  );
};

export default Navbar;
