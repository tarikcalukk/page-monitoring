import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          enter_url: "🌐 Enter URL to Track",
          start_tracking: "Start Tracking",
          invalid_url: "❌ Invalid URL",
          toggle_language: "Bosnian",
        },
      },
      bs: {
        translation: {
          enter_url: "🌐 Unesite URL za praćenje",
          start_tracking: "Započni praćenje",
          invalid_url: "❌ Neispravan URL",
          toggle_language: "Engleski",
        },
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;