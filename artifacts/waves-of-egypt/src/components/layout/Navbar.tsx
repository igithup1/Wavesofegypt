import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useGetWishlist } from '@workspace/api-client-react';
import { Menu, X, Heart, User as UserIcon, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isHome = location === '/';
  
  const { data: wishlistItems } = useGetWishlist({ 
    query: { enabled: !!user } 
  });

  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Destinations', path: '/destinations' },
    { label: 'Tours', path: '/tours' },
    { label: 'About', path: '/about' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'vendor') return '/vendor';
    return '/dashboard';
  };

  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled || !isHome 
      ? 'bg-background/95 backdrop-blur-md border-b shadow-sm py-4' 
      : 'bg-transparent py-6 dark:bg-black/20 dark:backdrop-blur-sm'
  }`;

  const textClasses = isScrolled || !isHome 
    ? 'text-foreground hover:text-primary' 
    : 'text-white hover:text-white/80';

  const logoClasses = isScrolled || !isHome 
    ? 'text-primary' 
    : 'text-white';

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className={`text-2xl font-serif font-bold tracking-tight transition-colors ${logoClasses}`}>
          WavesOf<span className={isScrolled || !isHome ? "text-accent" : "text-white/90"}>Egypt</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path} className={`font-medium transition-colors ${textClasses}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user && (
            <Link href="/wishlist" className={`relative p-2 transition-colors ${textClasses}`}>
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-accent-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isScrolled || !isHome ? "outline" : "secondary"} className={`gap-2 ${!isScrolled && isHome ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' : ''}`}>
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden lg:inline-block">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardPath()} className="cursor-pointer w-full">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="cursor-pointer w-full">Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={`font-medium transition-colors ${textClasses}`}>
              Log in
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className={isScrolled || !isHome ? "text-foreground" : "text-white"} />
          ) : (
            <Menu className={isScrolled || !isHome ? "text-foreground" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg py-4 px-4 flex flex-col space-y-4">
          {navLinks.map((link) => (
            <Link key={link.path} href={link.path} className="text-lg font-medium text-foreground py-2 border-b border-border/50">
              {link.label}
            </Link>
          ))}
          <Link href="/wishlist" className="text-lg font-medium text-foreground py-2 border-b border-border/50 flex items-center justify-between">
            Wishlist
            {wishlistCount > 0 && <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs">{wishlistCount}</span>}
          </Link>
          
          {user ? (
            <>
              <Link href={getDashboardPath()} className="text-lg font-medium text-foreground py-2 border-b border-border/50">
                Dashboard
              </Link>
              <button onClick={() => logout()} className="text-lg font-medium text-destructive text-left py-2">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-lg font-medium text-foreground py-2">
              Log in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
