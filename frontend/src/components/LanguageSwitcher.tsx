"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultLocale } from "@/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale =
    pathname?.split("/")[1] === "en" || pathname?.split("/")[1] === "ar"
      ? pathname.split("/")[1]
      : defaultLocale;

  const switchLocale = (newLocale: string) => {
    // Only proceed if the locale is different
    if (newLocale === locale) return;

    // Get the path without the locale prefix by properly splitting and joining path segments
    let pathWithoutLocale = pathname;
    const segments = pathname.split("/");

    if (segments[1] === "en" || segments[1] === "ar") {
      // Remove the locale segment and re-join the remaining segments
      segments.splice(1, 1);
      pathWithoutLocale = segments.join("/");
      if (pathWithoutLocale === "") pathWithoutLocale = "/";
    }

    // Construct the new path with the new locale
    const newPath = `/${newLocale}${
      pathWithoutLocale === "/" ? "" : pathWithoutLocale
    }`;
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          {locale === "en" ? "English" : "العربية"}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => switchLocale("en")}
          className="cursor-pointer"
          inset={false}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale("ar")}
          className="cursor-pointer"
          inset={false}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
