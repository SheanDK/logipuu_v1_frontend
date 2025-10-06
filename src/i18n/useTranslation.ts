// src/i18n/useTranslation.ts
'use client';

import './i18n'; 
import { useTranslation as useTranslationOrg } from 'react-i18next';
import { useParams } from 'next/navigation';
import { defaultNS } from './settings';


/*
Tiny wrapper around react-i18next's useTranslation that:
- reads the [lng] segment from the current route
- normalizes it to a string
- passes it to react-i18next so the correct language is used on the client
*/

export function useTranslation(ns: string | string[] = defaultNS) {
  const params = useParams() as Record<string, string | string[] | undefined>;
  const raw = Array.isArray(params.lng) ? params.lng[0] : params.lng;
  const lng = (raw ?? '').toString();
  
  return useTranslationOrg(ns, { lng }); // Passing { lng } here ensures the hook provides translations for the current route language.
}
