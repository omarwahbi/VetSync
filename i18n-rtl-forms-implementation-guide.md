# Guide for Implementing Internationalization and RTL Support in React Forms

This guide provides step-by-step instructions for adding proper internationalization (i18n) support and Right-to-Left (RTL) text direction handling to React form components in the pet-well-app.

## Prerequisites

- All necessary translation keys should be defined in both `src/messages/en.json` and `src/messages/ar.json` files
- The app should be using Next.js with next-intl for translation management

## Key Steps for Each Form Component

### 1. Add Locale Detection and RTL Check

At the top of your form component, add:

```typescript
import { useParams } from "next/navigation";

// Inside your component function
const params = useParams();
const locale = params.locale as string;
const isRTL = locale === "ar";
```

### 2. Apply RTL Direction to the Form Element

```tsx
<form
  onSubmit={form.handleSubmit(handleSubmit)}
  className="space-y-4"
  dir={isRTL ? "rtl" : "ltr"}
>
  {/* Form content */}
</form>
```

### 3. Update Text Alignment for Input Components

Apply conditional classes based on the RTL check:

```tsx
<Input
  placeholder={t("placeholder")}
  {...field}
  className={`w-full ${isRTL ? "text-right" : "text-left"}`}
/>

<Textarea
  placeholder={t("placeholder")}
  {...field}
  className={`resize-none min-h-[80px] ${isRTL ? "text-right" : "text-left"}`}
/>
```

### 4. Update Select Components

```tsx
<SelectTrigger className={`w-full ${isRTL ? "text-right" : "text-left"}`}>
  <SelectValue placeholder={t("selectPlaceholder")} />
</SelectTrigger>

<SelectItem className={isRTL ? "text-right" : "text-left"} value="option">
  {t("optionLabel")}
</SelectItem>
```

### 5. Update Icon Positioning in Buttons and Labels

Use conditional classes to control spacing:

```tsx
<Button>
  <Icon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
  {t("buttonText")}
</Button>
```

### 6. Update Popover Alignment

For popover components like date pickers or dropdowns:

```tsx
<PopoverContent align={isRTL ? "end" : "start"}>
  {/* Popover content */}
</PopoverContent>
```

### 7. Update Calendar Components

```tsx
<Calendar
  selected={field.value || undefined}
  onSelect={field.onChange}
  disabled={(date) => date > new Date()}
  initialFocus
/>
```

### 8. Ensure Loading States Are Properly Translated

```tsx
{
  isLoading ? (
    <>
      <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
      {t("loading")}
    </>
  ) : (
    <>
      <SaveIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
      {t("save")}
    </>
  );
}
```

### 9. Update Label and Message Components

Form labels and messages should be properly aligned:

```tsx
<FormLabel className="flex items-center gap-2">
  <Icon className="h-4 w-4" />
  {t("label")}
</FormLabel>

<FormMessage />  // Uses system default text direction from parent
```

### 10. Updating Complex Components

For components with internal state or complex layouts:

- Ensure each nested component considers RTL direction
- Use CSS flexbox with `flex-direction` and spacing classes that respect RTL
- Use the `space-x-reverse` utility class when needed

```tsx
<div
  className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-2`}
>
  {/* Content */}
</div>
```

## Handling Nested Translations

For nested translations like gender or species options:

```tsx
// Define translated options
const options = [
  { value: "option1", label: t("options.option1"), icon: Icon1 },
  { value: "option2", label: t("options.option2"), icon: Icon2 },
  // ...
];

// Use them in components
{
  options.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      <div className="flex items-center gap-2">
        <option.icon className="h-4 w-4" />
        {option.label}
      </div>
    </SelectItem>
  ));
}
```

## Testing

After implementing these changes, you should test your forms:

1. Test in English (LTR) to ensure normal functionality
2. Test in Arabic (RTL) to verify:
   - Text is right-aligned
   - Fields display correctly
   - Icons are on the appropriate side
   - Form submission works correctly
3. Verify that all translations appear correctly
4. Check form validation messages display in the proper language

## Common Issues and Solutions

- **Issue**: Text not aligning properly in RTL mode
  **Solution**: Ensure all text containers have the proper directional classes

- **Issue**: Icons appearing on the wrong side
  **Solution**: Use conditional classes to control margins and spacing

- **Issue**: Form validation messages not translated
  **Solution**: Ensure validation schemas use translatable error messages

- **Issue**: Date formatting not respecting locale
  **Solution**: Use date-fns with locale support or Intl API
