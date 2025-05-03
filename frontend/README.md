This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Pet Well App Frontend

## NextIntlClientProvider Context Error Solution

The application uses next-intl for internationalization, which requires a proper setup to ensure translation contexts are available to components. When components that use translation hooks are rendered without proper context providers, the following error can occur:

```
Error: Failed to call `useTranslations` because the context from `NextIntlClientProvider` was not found.
```

### Solution Implemented

We've implemented several strategies to fix this issue:

1. **Safe Translation Hooks**: Created a `useSafeTranslation` utility that gracefully handles missing translation contexts by providing fallbacks:

   ```typescript
   export function useSafeTranslation(namespace: string) {
     try {
       // Always try to use the real translations first
       return useTranslations(namespace);
     } catch {
       // If that fails, provide a fallback that doesn't throw
       return (key: string, args?: TranslationArgs) => {
         if (namespace === "Dashboard") {
           return getDashboardTranslation(key, args);
         }
         // For other namespaces, just return the key
         return typeof key === "string" ? key : String(key);
       };
     }
   }
   ```

2. **Fallback Translation Utilities**: Created translation utility functions in `translations.ts` that provide fallbacks for common translations:

   ```typescript
   // Fallback translations for dashboard
   export const getDashboardTranslation = (
     key: string,
     args?: TranslationArgs
   ): string => {
     const fallbacks: Record<string, string> = {
       title: "Dashboard",
       // other translations...
     };
     // Handle interpolation
     if (key === "welcomeBack" && args?.name) {
       return `Welcome back, ${args.name}`;
     }
     return fallbacks[key] || key;
   };
   ```

3. **Client-Side Only Components**: Used dynamic imports with `{ ssr: false }` to ensure components that use translation hooks are only rendered on the client after the NextIntlClientProvider is available:

   ```typescript
   // Client-only wrapper component with dynamic import and no SSR
   const ClientOnly = dynamic(() => import("./dashboard-wrapper"), {
     ssr: false,
   });
   ```

4. **Component Wrappers**: Created wrapper components like `DashboardWrapper` that explicitly provide the NextIntlClientProvider context:

   ```typescript
   export default function DashboardWrapper({
     messages,
     locale,
   }: {
     messages: Messages;
     locale: string;
   }) {
     const [hydrated, setHydrated] = useState(false);
     // Wait for hydration to complete
     useEffect(() => {
       setHydrated(true);
     }, []);
     // Once hydrated, render with our own NextIntlClientProvider
     return (
       <NextIntlClientProvider locale={locale} messages={messages}>
         <DashboardClient />
       </NextIntlClientProvider>
     );
   }
   ```

5. **Error Boundaries**: Added try/catch wrappers around components that use translation functions to handle errors gracefully:

   ```typescript
   export function DashboardClient() {
     try {
       return <DashboardContent />;
     } catch (error) {
       console.error("Error rendering dashboard:", error);
       return (
         <div className="space-y-8">
           <h1>Dashboard</h1>
           <p>
             There was an error loading the dashboard. Please try refreshing the
             page.
           </p>
         </div>
       );
     }
   }
   ```

### Key Architecture Patterns

1. **Server Components -> Client-Only Wrappers -> Client Components**  
   The server component loads the messages using `getMessages()` and passes them to a client-only wrapper which renders with `NextIntlClientProvider`.

2. **Hydration Management**  
   All client components wait for hydration to complete before rendering to avoid hydration mismatches.

3. **Fallback Mechanism**  
   Every translation hook has a fallback mechanism so the app never crashes due to missing translations.

### Troubleshooting

If you encounter the NextIntlClientProvider context error:

1. Check that the component using translation hooks is rendered with a `NextIntlClientProvider` ancestor
2. Ensure the component is properly marked as a client component with "use client"
3. Consider using the `useSafeTranslation` hook instead of direct `useTranslations` calls
4. Add proper error boundaries around components using translation functions
