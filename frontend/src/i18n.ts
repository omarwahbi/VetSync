import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Define available locales
export const locales = ['en', 'ar'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate the locale and ensure it's a string
  const resolvedLocale = locale || defaultLocale;
  
  if (!locales.includes(resolvedLocale as Locale)) {
    notFound();
  }

  // Load messages for the requested locale
  try {
    return {
      locale: resolvedLocale,
      messages: (await import(`./messages/${resolvedLocale}.json`)).default
    };
  } catch (error) {
    console.error(`Could not load messages for locale: ${resolvedLocale}`, error);
    
    // Fallback to default locale if messages couldn't be loaded
    if (resolvedLocale !== defaultLocale) {
      try {
        return {
          locale: defaultLocale,
          messages: (await import(`./messages/${defaultLocale}.json`)).default
        };
      } catch (fallbackError) {
        console.error('Failed to load fallback locale messages', fallbackError);
      }
    }
    
    return { locale: defaultLocale, messages: {} };
  }
}); 