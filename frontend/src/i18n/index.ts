import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

const saved = localStorage.getItem('erp_lang') || 'zh';

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: saved,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('erp_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
