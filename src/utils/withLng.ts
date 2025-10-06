// src/utils/withLng.ts
import { languages, fallbackLng } from '@/i18n/settings';

export function withLng(lng: string | undefined, path: string) {
  const safeLng = (lng && languages.includes(lng)) ? lng : fallbackLng;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (languages.some(l => clean === `/${l}` || clean.startsWith(`/${l}/`))) return clean;
  return `/${safeLng}${clean}`;
}
