import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTripPlanner } from '@/hooks/useTripPlanner';
import { Menu, X, Heart, User as UserIcon, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const WA_URL = 'https://wa.me/201001234567?text=' + encodeURIComponent('Hello! I would like to book a tour in Hurghada. Can you help me?');

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isHome = location === '/';
  const { count: tripCount } = useTripPlanner();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'All Tours', path: '/tours' },
    { label: 'About', path: '/about' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'vendor') return '/vendor';
    return '/dashboard';
  };

  const isTransparent = !isScrolled && isHome;

  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isTransparent
      ? 'bg-transparent py-5'
      : 'bg-background/97 backdrop-blur-md border-b border-border/60 shadow-sm py-3'
  }`;

  const textClasses = isTransparent
    ? 'text-white/90 hover:text-white'
    : 'text-foreground hover:text-primary';

  const logoAccent = isTransparent ? 'text-white/80' : 'text-accent';

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className={`text-2xl font-serif font-bold tracking-tight transition-colors ${isTransparent ? 'text-white' : 'text-primary'}`}>
          WavesOf<span className={logoAccent}>Egypt</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`font-medium transition-colors text-sm ${textClasses} ${location === link.path ? (isTransparent ? 'text-white font-semibold' : 'text-primary font-semibold') : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Book via WhatsApp
          </a>

          {/* My Trip — always visible */}
          <Link
            href="/my-trip"
            className={`relative flex items-center gap-1.5 text-sm font-medium py-2 px-3 rounded-xl transition-colors ${
              location === '/my-trip'
                ? (isTransparent ? 'bg-white/15 text-white' : 'bg-primary/8 text-primary')
                : (isTransparent ? 'text-white/90 hover:bg-white/10' : 'text-foreground hover:bg-muted')
            }`}
          >
            <Heart className={`w-4 h-4 ${tripCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            <span>My Trip</span>
            {tripCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {tripCount > 9 ? '9+' : tripCount}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isTransparent ? 'ghost' : 'outline'}
                  size="sm"
                  className={`gap-2 ${isTransparent ? 'text-white hover:bg-white/10 border-white/20' : ''}`}
                >
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
                  <Link href="/my-trip" className="cursor-pointer w-full">My Trip</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={`text-sm font-medium transition-colors ${textClasses}`}>
              Log in
            </Link>
          )}
        </div>

        {/* Mobile: My Trip icon + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/my-trip" className={`relative p-2 rounded-lg transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'}`}>
            <Heart className={`w-5 h-5 ${tripCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {tripCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {tripCount > 9 ? '9+' : tripCount}
              </span>
            )}
          </Link>
          <button
            className={`p-2 rounded-lg transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden bg-background border-b border-border shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-3 pb-5 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`text-base font-medium py-3 px-3 rounded-xl transition-colors ${location === link.path ? 'bg-primary/8 text-primary' : 'text-foreground hover:bg-muted'}`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/my-trip"
            className={`text-base font-medium py-3 px-3 rounded-xl transition-colors flex items-center justify-between ${location === '/my-trip' ? 'bg-primary/8 text-primary' : 'text-foreground hover:bg-muted'}`}
          >
            <span className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${tripCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              My Trip
            </span>
            {tripCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{tripCount}</span>
            )}
          </Link>

          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-4 py-3 rounded-xl transition-colors mt-2"
          >
            <MessageCircle className="w-5 h-5" />
            Book via WhatsApp
          </a>

          {user ? (
            <>
              <Link href={getDashboardPath()} className="text-base font-medium py-3 px-3 rounded-xl text-foreground hover:bg-muted">
                Dashboard
              </Link>
              <button onClick={() => logout()} className="text-base font-medium text-destructive text-left py-3 px-3 rounded-xl hover:bg-muted/60">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-base font-medium py-3 px-3 rounded-xl text-foreground hover:bg-muted">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
