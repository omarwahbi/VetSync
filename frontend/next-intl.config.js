// next-intl.config.js
module.exports = {
  // These are the locales you want to support in your application
  locales: ['en', 'ar'],
  
  // The default locale you want to be used when visiting a non-locale prefixed path
  defaultLocale: 'en',
  
  // Optional: Control how the URLs for specific locales are generated
  localePrefix: 'always', // Options: 'as-needed' | 'always' | 'never'
  
  // Optional: Domain configuration for locale-based routing
  domains: undefined
};