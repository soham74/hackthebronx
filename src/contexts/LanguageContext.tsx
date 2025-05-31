'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'zh' | 'ar' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.map': 'Map',
    'nav.reports': 'Reports',
    'nav.about': 'About',
    'nav.getStarted': 'Get Started',
    'nav.safePath': 'SafePath Bronx',
    'nav.tagline': 'Intelligent Safety Navigation',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': 'Find your safest route',
    'main.origin': 'Enter starting location',
    'main.destination': 'Enter destination',
    'main.findRoutes': 'Find Safe Routes',
    'main.reportIssue': 'Report Safety Issue',
    
    // Crime Layer
    'crime.title': 'Crime Data Layer',
    'crime.subtitle': 'Show recent safety incidents',
    
    // Footer
    'footer.poweredBy': 'Powered by NYC Open Data',
    'footer.realTime': 'Real-time safety analysis',
    'footer.lastUpdated': 'Last updated: Just now',
    'footer.live': 'Live',
    
    // Report Modal
    'report.title': 'Report Safety Issue',
    'report.poorLighting': 'Poor Lighting',
    'report.generalSafety': 'General Safety Concern',
    'report.suspiciousActivity': 'Suspicious Activity',
    'report.harassment': 'Harassment Incident',
    'report.other': 'Other Safety Issue',
    'report.additionalDetails': 'Additional details for',
    'report.optional': '(optional):',
    
    // Route Information
    'route.safest': 'Safest Route',
    'route.balanced': 'Balanced Route',
    'route.fastest': 'Fastest Route',
    'route.openInMaps': 'Open in Google Maps',
    'route.safetyScore': 'Safety Score',
    'route.efficiency': 'Efficiency',
    'route.composite': 'Overall',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
  es: {
    // Navigation
    'nav.map': 'Mapa',
    'nav.reports': 'Reportes',
    'nav.about': 'Acerca de',
    'nav.getStarted': 'Comenzar',
    'nav.safePath': 'SafePath Bronx',
    'nav.tagline': 'Navegación Inteligente de Seguridad',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': 'Encuentra tu ruta más segura',
    'main.origin': 'Ingresa ubicación de inicio',
    'main.destination': 'Ingresa destino',
    'main.findRoutes': 'Encontrar Rutas Seguras',
    'main.reportIssue': 'Reportar Problema de Seguridad',
    
    // Crime Layer
    'crime.title': 'Capa de Datos de Crimen',
    'crime.subtitle': 'Mostrar incidentes de seguridad recientes',
    
    // Footer
    'footer.poweredBy': 'Impulsado por NYC Open Data',
    'footer.realTime': 'Análisis de seguridad en tiempo real',
    'footer.lastUpdated': 'Última actualización: Ahora mismo',
    'footer.live': 'En vivo',
    
    // Report Modal
    'report.title': 'Reportar Problema de Seguridad',
    'report.poorLighting': 'Iluminación Deficiente',
    'report.generalSafety': 'Preocupación General de Seguridad',
    'report.suspiciousActivity': 'Actividad Sospechosa',
    'report.harassment': 'Incidente de Acoso',
    'report.other': 'Otro Problema de Seguridad',
    'report.additionalDetails': 'Detalles adicionales para',
    'report.optional': '(opcional):',
    
    // Route Information
    'route.safest': 'Ruta Más Segura',
    'route.balanced': 'Ruta Balanceada',
    'route.fastest': 'Ruta Más Rápida',
    'route.openInMaps': 'Abrir en Google Maps',
    'route.safetyScore': 'Puntuación de Seguridad',
    'route.efficiency': 'Eficiencia',
    'route.composite': 'General',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
  fr: {
    // Navigation
    'nav.map': 'Carte',
    'nav.reports': 'Rapports',
    'nav.about': 'À propos',
    'nav.getStarted': 'Commencer',
    'nav.safePath': 'SafePath Bronx',
    'nav.tagline': 'Navigation Intelligente de Sécurité',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': 'Trouvez votre itinéraire le plus sûr',
    'main.origin': 'Entrez le lieu de départ',
    'main.destination': 'Entrez la destination',
    'main.findRoutes': 'Trouver des Itinéraires Sûrs',
    'main.reportIssue': 'Signaler un Problème de Sécurité',
    
    // Crime Layer
    'crime.title': 'Couche de Données Criminelles',
    'crime.subtitle': 'Afficher les incidents de sécurité récents',
    
    // Footer
    'footer.poweredBy': 'Alimenté par NYC Open Data',
    'footer.realTime': 'Analyse de sécurité en temps réel',
    'footer.lastUpdated': 'Dernière mise à jour: À l\'instant',
    'footer.live': 'En direct',
    
    // Report Modal
    'report.title': 'Signaler un Problème de Sécurité',
    'report.poorLighting': 'Éclairage Défaillant',
    'report.generalSafety': 'Préoccupation Générale de Sécurité',
    'report.suspiciousActivity': 'Activité Suspecte',
    'report.harassment': 'Incident de Harcèlement',
    'report.other': 'Autre Problème de Sécurité',
    'report.additionalDetails': 'Détails supplémentaires pour',
    'report.optional': '(optionnel):',
    
    // Route Information
    'route.safest': 'Itinéraire le Plus Sûr',
    'route.balanced': 'Itinéraire Équilibré',
    'route.fastest': 'Itinéraire le Plus Rapide',
    'route.openInMaps': 'Ouvrir dans Google Maps',
    'route.safetyScore': 'Score de Sécurité',
    'route.efficiency': 'Efficacité',
    'route.composite': 'Global',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
  zh: {
    // Navigation
    'nav.map': '地图',
    'nav.reports': '报告',
    'nav.about': '关于',
    'nav.getStarted': '开始使用',
    'nav.safePath': 'SafePath 布朗克斯',
    'nav.tagline': '智能安全导航',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': '找到您最安全的路线',
    'main.origin': '输入起始位置',
    'main.destination': '输入目的地',
    'main.findRoutes': '查找安全路线',
    'main.reportIssue': '报告安全问题',
    
    // Crime Layer
    'crime.title': '犯罪数据层',
    'crime.subtitle': '显示最近的安全事件',
    
    // Footer
    'footer.poweredBy': '由纽约市开放数据提供支持',
    'footer.realTime': '实时安全分析',
    'footer.lastUpdated': '最后更新：刚刚',
    'footer.live': '实时',
    
    // Report Modal
    'report.title': '报告安全问题',
    'report.poorLighting': '照明不足',
    'report.generalSafety': '一般安全问题',
    'report.suspiciousActivity': '可疑活动',
    'report.harassment': '骚扰事件',
    'report.other': '其他安全问题',
    'report.additionalDetails': '额外详情',
    'report.optional': '（可选）：',
    
    // Route Information
    'route.safest': '最安全路线',
    'route.balanced': '平衡路线',
    'route.fastest': '最快路线',
    'route.openInMaps': '在谷歌地图中打开',
    'route.safetyScore': '安全评分',
    'route.efficiency': '效率',
    'route.composite': '综合',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
  ar: {
    // Navigation
    'nav.map': 'خريطة',
    'nav.reports': 'تقارير',
    'nav.about': 'حول',
    'nav.getStarted': 'ابدأ',
    'nav.safePath': 'SafePath برونكس',
    'nav.tagline': 'ملاحة ذكية للسلامة',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': 'ابحث عن أكثر طريق آمن',
    'main.origin': 'أدخل موقع البداية',
    'main.destination': 'أدخل الوجهة',
    'main.findRoutes': 'العثور على طرق آمنة',
    'main.reportIssue': 'الإبلاغ عن مشكلة أمان',
    
    // Crime Layer
    'crime.title': 'طبقة بيانات الجريمة',
    'crime.subtitle': 'إظهار حوادث الأمان الأخيرة',
    
    // Footer
    'footer.poweredBy': 'مدعوم من بيانات نيويورك المفتوحة',
    'footer.realTime': 'تحليل الأمان في الوقت الفعلي',
    'footer.lastUpdated': 'آخر تحديث: الآن',
    'footer.live': 'مباشر',
    
    // Report Modal
    'report.title': 'الإبلاغ عن مشكلة أمان',
    'report.poorLighting': 'إضاءة ضعيفة',
    'report.generalSafety': 'قلق أمان عام',
    'report.suspiciousActivity': 'نشاط مشبوه',
    'report.harassment': 'حادثة مضايقة',
    'report.other': 'مشكلة أمان أخرى',
    'report.additionalDetails': 'تفاصيل إضافية لـ',
    'report.optional': '(اختياري):',
    
    // Route Information
    'route.safest': 'الطريق الأكثر أمانًا',
    'route.balanced': 'طريق متوازن',
    'route.fastest': 'الطريق الأسرع',
    'route.openInMaps': 'فتح في خرائط جوجل',
    'route.safetyScore': 'نقاط الأمان',
    'route.efficiency': 'الكفاءة',
    'route.composite': 'الإجمالي',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
  ru: {
    // Navigation
    'nav.map': 'Карта',
    'nav.reports': 'Отчёты',
    'nav.about': 'О нас',
    'nav.getStarted': 'Начать',
    'nav.safePath': 'SafePath Бронкс',
    'nav.tagline': 'Интеллектуальная навигация безопасности',
    
    // Main Interface
    'main.title': 'SafePath',
    'main.subtitle': 'Найдите самый безопасный маршрут',
    'main.origin': 'Введите начальное местоположение',
    'main.destination': 'Введите пункт назначения',
    'main.findRoutes': 'Найти безопасные маршруты',
    'main.reportIssue': 'Сообщить о проблеме безопасности',
    
    // Crime Layer
    'crime.title': 'Слой данных о преступлениях',
    'crime.subtitle': 'Показать недавние инциденты безопасности',
    
    // Footer
    'footer.poweredBy': 'На основе открытых данных Нью-Йорка',
    'footer.realTime': 'Анализ безопасности в реальном времени',
    'footer.lastUpdated': 'Последнее обновление: Сейчас',
    'footer.live': 'В прямом эфире',
    
    // Report Modal
    'report.title': 'Сообщить о проблеме безопасности',
    'report.poorLighting': 'Плохое освещение',
    'report.generalSafety': 'Общая проблема безопасности',
    'report.suspiciousActivity': 'Подозрительная активность',
    'report.harassment': 'Инцидент преследования',
    'report.other': 'Другая проблема безопасности',
    'report.additionalDetails': 'Дополнительные детали для',
    'report.optional': '(необязательно):',
    
    // Route Information
    'route.safest': 'Самый безопасный маршрут',
    'route.balanced': 'Сбалансированный маршрут',
    'route.fastest': 'Самый быстрый маршрут',
    'route.openInMaps': 'Открыть в Google Maps',
    'route.safetyScore': 'Оценка безопасности',
    'route.efficiency': 'Эффективность',
    'route.composite': 'Общая',
    
    // Languages
    'lang.english': 'English',
    'lang.spanish': 'Español',
    'lang.french': 'Français',
    'lang.chinese': '中文',
    'lang.arabic': 'العربية',
    'lang.russian': 'Русский',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 