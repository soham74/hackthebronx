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
  const [activeView, setActiveView] = useState<'map' | 'reports' | 'about'>('map');

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <nav className="dark-glass-morphism border-b border-slate-700/50 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
            
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setActiveView('map')}
                className={`font-medium transition-colors px-3 py-2 rounded-lg ${
                  activeView === 'map' 
                    ? 'text-blue-400 bg-slate-800' 
                    : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800'
                }`}
              >
                {t('nav.map')}
              </button>
              <button 
                onClick={() => setActiveView('reports')}
                className={`font-medium transition-colors px-3 py-2 rounded-lg ${
                  activeView === 'reports' 
                    ? 'text-blue-400 bg-slate-800' 
                    : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800'
                }`}
              >
                {t('nav.reports')}
              </button>
              <button 
                onClick={() => setActiveView('about')}
                className={`font-medium transition-colors px-3 py-2 rounded-lg ${
                  activeView === 'about' 
                    ? 'text-blue-400 bg-slate-800' 
                    : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800'
                }`}
              >
                {t('nav.about')}
              </button>
              
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
              
              <button 
                onClick={() => setActiveView('map')}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all"
              >
                {t('nav.getStarted')}
              </button>
            </div>
            
            <div className="md:hidden flex items-center space-x-3">
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
          
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/50 backdrop-blur-sm rounded-lg mt-2 border border-slate-700">
                <button 
                  onClick={() => {setActiveView('map'); setMobileMenuOpen(false);}}
                  className={`block w-full text-left px-3 py-2 font-medium ${
                    activeView === 'map' ? 'text-blue-400' : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  {t('nav.map')}
                </button>
                <button 
                  onClick={() => {setActiveView('reports'); setMobileMenuOpen(false);}}
                  className={`block w-full text-left px-3 py-2 font-medium ${
                    activeView === 'reports' ? 'text-blue-400' : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  {t('nav.reports')}
                </button>
                <button 
                  onClick={() => {setActiveView('about'); setMobileMenuOpen(false);}}
                  className={`block w-full text-left px-3 py-2 font-medium ${
                    activeView === 'about' ? 'text-blue-400' : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  {t('nav.about')}
                </button>
                <button 
                  onClick={() => {setActiveView('map'); setMobileMenuOpen(false);}}
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  {t('nav.getStarted')}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="relative flex-1">
        {activeView === 'map' && (
          <div className="h-[calc(100vh-4rem)] relative overflow-hidden">
            <GoogleMap className="w-full h-full" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/5 via-transparent to-slate-900/5 pointer-events-none" />
          </div>
        )}

        {activeView === 'reports' && (
          <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 mb-4">{t('nav.reports')}</h2>
                <p className="text-slate-400 text-lg">{t('reports.description')}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-xl mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-100">{t('reports.crimeData')}</h3>
                      <p className="text-slate-400">{t('reports.crimeDataDesc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{t('reports.totalCrimes')}</span>
                      <span className="text-emerald-400 font-semibold">Mar 2025</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{t('reports.dataSource')}</span>
                      <span className="text-blue-400 font-semibold">NYC Open Data</span>
                    </div>
                  </div>
                </div>

                <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                  <div className="flex items-center mb-4">
                    <div className="bg-amber-600 p-3 rounded-xl mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-100">{t('reports.communityReports')}</h3>
                      <p className="text-slate-400">{t('reports.communityDesc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{t('reports.howToReport')}</span>
                      <span className="text-amber-400 font-semibold">{t('reports.rightClick')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">{t('reports.reportTypes')}</span>
                      <span className="text-emerald-400 font-semibold">5 {t('reports.types')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">{t('reports.howItWorks')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-slate-200 mb-2">{t('reports.step1')}</h4>
                    <p className="text-slate-400 text-sm">{t('reports.step1Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-slate-200 mb-2">{t('reports.step2')}</h4>
                    <p className="text-slate-400 text-sm">{t('reports.step2Desc')}</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-slate-200 mb-2">{t('reports.step3')}</h4>
                    <p className="text-slate-400 text-sm">{t('reports.step3Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'about' && (
          <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-100 mb-4">{t('nav.about')}</h2>
                <p className="text-slate-400 text-lg">{t('about.description')}</p>
              </div>

              <div className="space-y-8">
                <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-slate-100 mb-4">{t('about.mission')}</h3>
                  <p className="text-slate-300 leading-relaxed">{t('about.missionDesc')}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-600 p-3 rounded-xl mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100">{t('about.safety')}</h4>
                        <p className="text-slate-400">{t('about.safetyDesc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                    <div className="flex items-center mb-4">
                      <div className="bg-emerald-600 p-3 rounded-xl mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100">{t('about.community')}</h4>
                        <p className="text-slate-400">{t('about.communityDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-slate-100 mb-4">{t('about.features')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-600 w-2 h-2 rounded-full"></div>
                      <span className="text-slate-300">{t('about.feature1')}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-600 w-2 h-2 rounded-full"></div>
                      <span className="text-slate-300">{t('about.feature2')}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-600 w-2 h-2 rounded-full"></div>
                      <span className="text-slate-300">{t('about.feature3')}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-amber-600 w-2 h-2 rounded-full"></div>
                      <span className="text-slate-300">{t('about.feature4')}</span>
                    </div>
                  </div>
                </div>

                <div className="dark-glass-morphism rounded-2xl p-6 border border-slate-600">
                  <h3 className="text-xl font-semibold text-slate-100 mb-4">{t('about.contact')}</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-slate-200">{t('about.email')}</h4>
                      <p className="text-slate-400 text-sm">contact@safepath.bronx</p>
                    </div>
                    <div>
                      <div className="bg-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-slate-200">{t('about.data')}</h4>
                      <p className="text-slate-400 text-sm">NYC Open Data Portal</p>
                    </div>
                    <div>
                      <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-slate-200">{t('about.support')}</h4>
                      <p className="text-slate-400 text-sm">{t('about.supportDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
