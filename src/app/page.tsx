'use client';

import GoogleMap from '@/components/GoogleMap';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useState } from 'react';

const languages: { code: Language; flag: string; name: string }[] = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
];

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Modern Navigation Header */}
      <nav className="dark-glass-morphism border-b border-slate-700/50 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-2.5 rounded-xl shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {t('nav.safePath')}
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">{t('nav.tagline')}</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-300 hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-800">
                {t('nav.map')}
              </a>
              <a href="#" className="text-slate-300 hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-800">
                {t('nav.reports')}
              </a>
              <a href="#" className="text-slate-300 hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-800">
                {t('nav.about')}
              </a>
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600"
                >
                  <span className="text-lg">{currentLanguage.flag}</span>
                  <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-48 dark-glass-morphism rounded-xl shadow-xl border border-slate-600 overflow-hidden z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center space-x-3 ${
                          language === lang.code ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="font-medium">{
                          lang.code === 'en' ? 'English' :
                          lang.code === 'es' ? 'Español' :
                          lang.code === 'fr' ? 'Français' :
                          lang.code === 'zh' ? '中文' :
                          lang.code === 'ar' ? 'العربية' :
                          lang.code === 'ru' ? 'Русский' : lang.name
                        }</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all">
                {t('nav.getStarted')}
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Mobile Language Selector */}
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <span className="text-lg">{currentLanguage.flag}</span>
              </button>
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Language Menu */}
          {showLanguageMenu && (
            <div className="md:hidden absolute right-4 mt-2 w-48 dark-glass-morphism rounded-xl shadow-xl border border-slate-600 overflow-hidden z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center space-x-3 ${
                    language === lang.code ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{
                    lang.code === 'en' ? 'English' :
                    lang.code === 'es' ? 'Español' :
                    lang.code === 'fr' ? 'Français' :
                    lang.code === 'zh' ? '中文' :
                    lang.code === 'ar' ? 'العربية' :
                    lang.code === 'ru' ? 'Русский' : lang.name
                  }</span>
                </button>
              ))}
            </div>
          )}
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/50 backdrop-blur-sm rounded-lg mt-2 border border-slate-700">
                <a href="#" className="block px-3 py-2 text-slate-300 hover:text-blue-400 font-medium">
                  {t('nav.map')}
                </a>
                <a href="#" className="block px-3 py-2 text-slate-300 hover:text-blue-400 font-medium">
                  {t('nav.reports')}
                </a>
                <a href="#" className="block px-3 py-2 text-slate-300 hover:text-blue-400 font-medium">
                  {t('nav.about')}
                </a>
                <button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium">
                  {t('nav.getStarted')}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative flex-1">
        {/* Map Container with improved height calculation */}
        <div className="h-[calc(100vh-4rem)] relative overflow-hidden">
          <GoogleMap className="w-full h-full" />
          
          {/* Gradient overlays for better visual hierarchy */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 via-transparent to-slate-900/5 pointer-events-none" />
        </div>
        
        {/* Enhanced Footer Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 dark-glass-morphism border-t border-slate-700/50 p-3 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">{t('footer.poweredBy')}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{t('footer.realTime')}</span>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-slate-400">{t('footer.lastUpdated')}</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-emerald-400 font-medium">{t('footer.live')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
