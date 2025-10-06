export const fallbackLng = 'fi'; // Default language if none is resolved
export const languages = ['fi', 'en']; // Supported languages in your app

export const defaultNS = 'common'; // Default namespace

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  const base = {
    
    supportedLngs: languages,   // Which languages are allowed to be used
    fallbackLng,                // If current language can't be found, i18n will fall back to this
    lng,                        // Explicitly set initial language (can be overridden later via changeLanguage)
    fallbackNS: defaultNS,      // Default/primary namespace
    defaultNS,
    ns,                         // Namespaces to load (string or array). We pass the one requested by components.
  } as const;

    // add lng only if user has selected one
  return lng ? { ...base, lng } : base;

}
