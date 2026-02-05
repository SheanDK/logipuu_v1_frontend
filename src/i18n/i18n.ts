// src/i18n/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';
import dayjs from 'dayjs';
import 'dayjs/locale/fi';
import 'dayjs/locale/en';

if (!i18next.isInitialized) {
  void i18next
    .use(initReactI18next)
    .use(
      resourcesToBackend((language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
      )
    )
    .init(getOptions());

  // Set initial dayjs locale
  const initialLng = i18next.language || 'fi';
  dayjs.locale(initialLng);

  // Sync dayjs with language changes
  i18next.on('languageChanged', (lng) => {
    dayjs.locale(lng);
  });
}

export default i18next;
