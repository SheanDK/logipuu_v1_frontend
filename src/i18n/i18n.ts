// src/i18n/i18n.ts
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

if (!i18next.isInitialized) {
  void i18next
    .use(initReactI18next)
    .use(
      resourcesToBackend((language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
      )
    )
    .init(getOptions());
}

export default i18next;
