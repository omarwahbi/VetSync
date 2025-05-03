/**
 * Translations utility to provide fallbacks when the NextIntlClientProvider context is unavailable
 */

interface TranslationArgs {
  name?: string;
  [key: string]: string | number | boolean | undefined;
}

// Fallback translations for dashboard
export const getDashboardTranslation = (key: string, args?: TranslationArgs): string => {
  const fallbacks: Record<string, string> = {
    title: "Dashboard",
    welcome: "Welcome to the dashboard",
    welcomeBack: "Welcome back, {name}",
    user: "User",
    totalOwners: "Total Owners", 
    totalPets: "Total Pets",
    upcomingVaccinations: "Upcoming Vaccinations",
    visitsDueToday: "Visits Due Today",
    errorLoadingStats: "Error loading stats",
    upcomingVisits: "Upcoming Visits",
    pet: "Pet",
    owner: "Owner",
    date: "Date",
    type: "Type",
    actions: "Actions",
    noUpcomingVisits: "No upcoming visits",
    addReminderOrVisit: "Add a reminder or schedule a visit",
    viewAll: "View All",
    registerClient: "Register Client",
    newVisit: "New Visit",
    visitTypeCheckup: "Checkup",
    visitTypeVaccination: "Vaccination",
    visitTypeEmergency: "Emergency", 
    visitTypeSurgery: "Surgery",
    visitTypeDental: "Dental",
    visitTypeGrooming: "Grooming",
    visitTypeOther: "Other",
  };

  // Handle interpolation for welcomeBack
  if (key === "welcomeBack" && args?.name) {
    return `Welcome back, ${args.name}`;
  }

  return fallbacks[key] || key;
}; 