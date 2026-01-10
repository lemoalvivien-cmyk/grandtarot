import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Sparkles, Heart, Users, Briefcase, Menu, X, Globe, Crown, User, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CookieBanner from '@/components/legal/CookieBanner';
import ErrorBoundary from '@/components/error/ErrorBoundary';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setLang(profiles[0].language_pref || 'fr');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const changeLang = async (newLang) => {
    setLang(newLang);
    if (profile) {
      try {
        await base44.entities.UserProfile.update(profile.id, { language_pref: newLang });
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const isPublicPage = ['Landing', 'CardOfDay', 'Encyclopedia', 'CardDetail', 'Blog', 'BlogPost', 'Pricing'].includes(currentPageName);
  const isAuthPage = ['Login', 'Signup'].includes(currentPageName);
  const isAdminPage = currentPageName?.startsWith('Admin');
  const showFooter = true; // Footer visible on all pages (with legal links)

  const modes = {
    love: { icon: Heart, label: lang === 'fr' ? 'Amour' : 'Love', color: 'from-rose-500 to-pink-600' },
    friendship: { icon: Users, label: lang === 'fr' ? 'Amitié' : 'Friendship', color: 'from-blue-500 to-cyan-600' },
    professional: { icon: Briefcase, label: lang === 'fr' ? 'Pro' : 'Pro', color: 'from-amber-500 to-orange-600' }
  };

  const currentMode = modes[profile?.mode_active] || modes.love;
  const ModeIcon = currentMode.icon;

  const content = {
    fr: {
      home: 'Accueil',
      cards: 'Cartes',
      blog: 'Blog',
      pricing: 'Tarifs',
      app: 'Mon Espace',
      ritual: 'Rituel',
      synchros: 'Synchros',
      intentions: 'Intentions',
      settings: 'Paramètres',
      admin: 'Admin',
      subscribe: 'S\'abonner',
      login: 'Connexion'
    },
    en: {
      home: 'Home',
      cards: 'Cards',
      blog: 'Blog',
      pricing: 'Pricing',
      app: 'My Space',
      ritual: 'Ritual',
      synchros: 'Synchros',
      intentions: 'Intentions',
      settings: 'Settings',
      admin: 'Admin',
      subscribe: 'Subscribe',
      login: 'Login'
    }
  };

  const t = content[lang];

  if (isAuthPage) return children;

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-500/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={createPageUrl('Landing')} className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <div className="absolute inset-0 blur-lg bg-amber-400/20 group-hover:bg-amber-400/30 transition-all" />
            </div>
            <span className="text-xl font-serif font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text text-transparent">
              GRANDTAROT
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {isPublicPage ? (
              <>
                <Link to={createPageUrl('Landing')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.home}
                </Link>
                <Link to={createPageUrl('CardOfDay')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.cards}
                </Link>
                <Link to={createPageUrl('Blog')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.blog}
                </Link>
                <Link to={createPageUrl('Pricing')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.pricing}
                </Link>
              </>
            ) : (
              <>
                <Link to={createPageUrl('App')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.app}
                </Link>
                <Link to={createPageUrl('AppRitual')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.ritual}
                </Link>
                <Link to={createPageUrl('AppSynchros')} className="text-sm text-slate-300 hover:text-amber-200 transition-colors">
                  {t.synchros}
                </Link>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/50 rounded-full p-1">
              <button
                onClick={() => changeLang('fr')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  lang === 'fr' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => changeLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  lang === 'en' ? 'bg-amber-500/20 text-amber-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Mode (if logged in) */}
            {profile && !isPublicPage && (
              <Link to={createPageUrl('AppSettings')}>
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentMode.color} bg-opacity-20 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer`}>
                  <ModeIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">{currentMode.label}</span>
                </div>
              </Link>
            )}

            {/* CTA */}
            {user ? (
              <>
                {!profile?.is_subscribed && !isAdminPage && (
                  <Link to={createPageUrl('Subscribe')}>
                    <Button size="sm" className="hidden sm:flex bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white border-0">
                      <Crown className="w-4 h-4 mr-1" />
                      {t.subscribe}
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/30 transition-all">
                      {profile?.photo_url ? (
                        <img src={profile.photo_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-amber-500/20">
                    <div className="px-3 py-2 border-b border-amber-500/10">
                      <p className="text-sm font-medium text-amber-100">{user.full_name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>

                    {(user.role === 'admin' || user.role === 'moderator') && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-2 cursor-pointer">
                          <Shield className="w-4 h-4 text-violet-400" />
                          <span>{t.admin}</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('AppSettings')} className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        <span>{t.settings}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => base44.auth.logout()} className="flex items-center gap-2 cursor-pointer text-red-400">
                      <LogOut className="w-4 h-4" />
                      <span>{lang === 'fr' ? 'Déconnexion' : 'Logout'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to={createPageUrl('Landing')}>
                <Button size="sm" onClick={() => base44.auth.redirectToLogin(createPageUrl('App'))} className="hidden sm:flex bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white border-0">
                  {t.login}
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-amber-200 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-amber-500/10 bg-slate-900/95 backdrop-blur-xl">
            <nav className="flex flex-col p-4 gap-2">
              {isPublicPage ? (
                <>
                  <Link to={createPageUrl('Landing')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.home}
                  </Link>
                  <Link to={createPageUrl('CardOfDay')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.cards}
                  </Link>
                  <Link to={createPageUrl('Blog')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.blog}
                  </Link>
                  <Link to={createPageUrl('Pricing')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.pricing}
                  </Link>
                </>
              ) : (
                <>
                  <Link to={createPageUrl('App')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.app}
                  </Link>
                  <Link to={createPageUrl('AppRitual')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.ritual}
                  </Link>
                  <Link to={createPageUrl('AppSynchros')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.synchros}
                  </Link>
                  <Link to={createPageUrl('AppSettings')} onClick={() => setMenuOpen(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-amber-200 hover:bg-slate-800/50 rounded-lg transition-all">
                    {t.settings}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Cookie Banner (public pages only) */}
      {isPublicPage && <CookieBanner lang={lang} />}

      {/* Footer (all pages — legal links visible everywhere) */}
      {showFooter && (
        <footer className="border-t border-amber-500/10 bg-slate-950/50 backdrop-blur-xl py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Public pages have full footer grid */}
            {isPublicPage && (
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="font-serif font-bold text-lg bg-gradient-to-r from-amber-200 to-violet-200 bg-clip-text text-transparent">
                      GRANDTAROT
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {lang === 'fr' 
                      ? 'Connexions guidées par les astres' 
                      : 'Star-guided connections'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-3">{t.cards}</h4>
                  <div className="space-y-2">
                    <Link to={createPageUrl('CardOfDay')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {lang === 'fr' ? 'Carte du jour' : 'Card of the day'}
                    </Link>
                    <Link to={createPageUrl('Encyclopedia')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {lang === 'fr' ? 'Encyclopédie' : 'Encyclopedia'}
                    </Link>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-3">{lang === 'fr' ? 'Ressources' : 'Resources'}</h4>
                  <div className="space-y-2">
                    <Link to={createPageUrl('Blog')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {t.blog}
                    </Link>
                    <Link to={createPageUrl('Pricing')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {t.pricing}
                    </Link>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-3">{lang === 'fr' ? 'Légal' : 'Legal'}</h4>
                  <div className="space-y-2">
                    <Link to={createPageUrl('Terms')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {lang === 'fr' ? 'CGU' : 'Terms'}
                    </Link>
                    <Link to={createPageUrl('Privacy')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {lang === 'fr' ? 'Confidentialité' : 'Privacy'}
                    </Link>
                    <Link to={createPageUrl('Cookies')} className="block text-sm text-slate-400 hover:text-amber-200 transition-colors">
                      {lang === 'fr' ? 'Cookies' : 'Cookies'}
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Minimal footer for app pages (legal links always visible) */}
            {!isPublicPage && (
              <div className="mb-6 flex flex-wrap gap-4 justify-center">
                <Link to={createPageUrl('Terms')} className="text-xs text-slate-400 hover:text-amber-200 transition-colors">
                  {lang === 'fr' ? 'CGU' : 'Terms'}
                </Link>
                <span className="text-xs text-slate-600">•</span>
                <Link to={createPageUrl('Privacy')} className="text-xs text-slate-400 hover:text-amber-200 transition-colors">
                  {lang === 'fr' ? 'Confidentialité' : 'Privacy'}
                </Link>
                <span className="text-xs text-slate-600">•</span>
                <Link to={createPageUrl('Cookies')} className="text-xs text-slate-400 hover:text-amber-200 transition-colors">
                  {lang === 'fr' ? 'Cookies' : 'Cookies'}
                </Link>
              </div>
            )}

            {/* Copyright */}
            <div className="border-t border-amber-500/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <p>© {new Date().getFullYear()} GRANDTAROT. {lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>{lang === 'fr' ? 'FR & EN' : 'FR & EN'}</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
    </ErrorBoundary>
  );
}