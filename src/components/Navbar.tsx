import React, { useState } from 'react';
import { Camera, Sparkles, Heart, Scale, User, Shield, Menu, X, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  user: UserProfile;
  favoritesCount: number;
  compareCount: number;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  user,
  favoritesCount,
  compareCount,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'Catalog' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'compare', label: 'Compare', count: compareCount },
    { id: 'favorites', label: 'Favorites', count: favoritesCount },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  const handleLinkClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Wordmark */}
          <button
            onClick={() => handleLinkClick('home')}
            className="text-left group cursor-pointer flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900" />
            <span className="text-xl font-serif-display font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
              AI MakeupMatch
            </span>
          </button>

          {/* Text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`relative py-1 text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive ? 'text-stone-950 font-bold' : 'hover:text-stone-950 font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="text-[10px] font-mono-nums bg-stone-200 text-stone-800 px-1.5 py-0.2 rounded-full">
                      {link.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Primary actions & User status */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Favorites Button */}
            <button
              onClick={() => handleLinkClick('favorites')}
              title={`View My Favorites (${favoritesCount} saved)`}
              className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                currentPage === 'favorites'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs'
                  : 'text-stone-600 hover:text-rose-600 hover:bg-rose-50/60 border border-stone-200 bg-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white font-mono-nums">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleLinkClick('analyze-selfie')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Analyze My Skin</span>
            </button>

            {(user.email === 'admin@gmail.com' || user.role === 'admin') && (
              <button
                onClick={() => handleLinkClick('admin')}
                title="Admin Management Console (admin@gmail.com)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden lg:inline text-[11px] uppercase tracking-wider">Admin</span>
              </button>
            )}

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <button
                onClick={() => handleLinkClick('dashboard')}
                className="flex items-center gap-2 text-xs text-stone-700 hover:text-stone-950 cursor-pointer"
                title="View My Profile"
              >
                <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[11px]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="font-semibold text-stone-900 leading-tight truncate max-w-[100px]">{user.name}</div>
                  <div className="text-[10px] text-stone-500">{user.skinTone} · {user.undertone}</div>
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => handleLinkClick('favorites')}
              title={`View My Favorites (${favoritesCount} saved)`}
              className={`relative p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                currentPage === 'favorites'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-stone-600 hover:text-rose-600 border border-stone-200 bg-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-bold px-1 rounded-full leading-none py-0.5">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleLinkClick('analyze-selfie')}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-stone-900 rounded-lg"
            >
              Analyze
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-950"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-[#FAF8F5] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg ${
                  currentPage === link.id
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.label} {link.count !== undefined && link.count > 0 ? `(${link.count})` : ''}
              </button>
            ))}
            
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              {(user.email === 'admin@gmail.com' || user.role === 'admin') && (
                <button
                  onClick={() => handleLinkClick('admin')}
                  className="text-left px-3 py-2 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-2 font-semibold"
                >
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>Admin Console (admin@gmail.com)</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({user.name})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
