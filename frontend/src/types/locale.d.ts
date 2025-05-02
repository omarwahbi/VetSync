import 'international-types';

declare module 'international-types' {
  interface TranslationKeys {
    loginPage: {
      title: string;
      description: string;
      emailLabel: string;
      passwordLabel: string;
      submitButton: string;
      forgotPasswordLink: string;
      toastSuccess: string;
      toastErrorCredentials: string;
      toastErrorGeneral: string;
    };
    common: {
      appName: string;
    };
  }
} 