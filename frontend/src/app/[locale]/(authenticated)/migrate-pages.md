# Page Migration Guide for Internationalization

This guide outlines the process to migrate application pages from the original non-localized structure to the internationalized (i18n) structure.

## Directory Structure

- Original: `/src/app/(authenticated)/[page]/page.tsx`
- New: `/src/app/[locale]/(authenticated)/[page]/page.tsx`

## Migration Steps for Each Page

### 1. Create the directory in the localized structure

```bash
mkdir -p "./src/app/[locale]/(authenticated)/[page-name]"
```

### 2. Create a server component page.tsx file

Create a server component that imports a client component:

```tsx
import { PageNameClient } from "./page-name-client";

export default function PageNamePage() {
  return <PageNameClient />;
}

// Tell Next.js about all the possible locale values
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
```

### 3. Create a client component page-name-client.tsx file

Copy the content from the original page, but make the following changes:

1. Export as a named function `export function PageNameClient() { ... }` instead of `export default function PageName() { ... }`
2. Add the import for internationalization: `import { useTranslations } from "next-intl";`
3. Add the hooks for getting locale:
   ```tsx
   const params = useParams();
   const locale = params.locale as string;
   const t = useTranslations("PageName"); // Use appropriate namespace
   ```
4. Make sure all links use the locale prefix:
   - Change `href="/path"` to `href={\`/${locale}/path\`}`
   - Or modify your Link component to handle localization

### 4. Pages to Migrate

The following pages need to be migrated:

1. ✅ dashboard (already migrated)
2. ✅ owners (already migrated)
3. ✅ visits (in progress)
4. pets
5. due-visits
6. profile
7. manage-users
8. clinic-profile

### 5. Prepare Translation Files

Make sure translation keys exist in both `en.json` and `ar.json` files for each page:

```json
{
  "PageName": {
    "title": "Page Title",
    "subtitle": "Page Subtitle"
    // ... other keys
  }
}
```

### 6. Test Each Page After Migration

After migrating each page, test it by:

1. Loading directly via URL (e.g., `/en/page-name` and `/ar/page-name`)
2. Navigating from other pages
3. Switching languages with the language switcher

## Note on Middleware and Routing

The middleware.ts file should already handle:

- Redirecting root paths to localized versions
- Managing localized vs. non-localized routes
- Language detection and redirection

## Common Issues to Watch For

1. Make sure all links use the locale prefix
2. Check that all forms and API calls properly handle the locale
3. Text direction (RTL/LTR) should be managed by the locale layout
4. Date and number formatting should respect the locale
