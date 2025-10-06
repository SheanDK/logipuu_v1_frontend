// src/utils/i18nKeys.ts

/** Normalize any label to a stable key: "Ajat & Tarkastukset" -> "ajat_tarkastukset" */
export const normalizeKey = (s: string): string =>
  s.toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** FI/EN role aliases -> single canonical role key */
export const ROLE_ALIASES: Record<string, string> = {
  superuser: 'superuser',
  admin: 'admin',
  toimisto: 'office',
  office: 'office',
  dispatch: 'dispatch',
  kuljettaja: 'driver',
  driver: 'driver',
  alihankkija: 'subcontractor',
  subcontractor: 'subcontractor',
};

export const roleKeyOf = (raw: string): string =>
  ROLE_ALIASES[normalizeKey(raw)] ?? normalizeKey(raw);

/** Get localized display name for a role, fallback to raw if missing */
export const roleDisplayName = (
  raw: string,
  t: (key: string, options?: any) => string
): string => t(`roleLabels.${roleKeyOf(raw)}`, { defaultValue: raw });
