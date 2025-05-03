"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter, useParams } from "next/navigation";
import { Menu, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar } from "./sidebar";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import axiosInstance from "@/lib/axios";
import { useTranslations } from "next-intl";

// Translation fallback for header translations
const getHeaderTranslation = (key: string): string => {
  const fallbacks: Record<string, string> = {
    myAccount: "My Account",
    clinicProfile: "Clinic Profile",
    logout: "Logout",
  };
  return fallbacks[key] || key;
};

export function Header() {
  // Use individual selectors to avoid unnecessary rerenders
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();

  // Get locale from params
  const locale = (params?.locale as string) || "en";

  // Initialize with fallback translation function to avoid conditional hook usage
  let t = getHeaderTranslation;

  try {
    // This might throw if context is missing
    const translationHook = useTranslations("Navigation");
    // If no error, use the real hook
    t = translationHook;
  } catch {
    console.warn(
      "Translation context not available in Header, using fallbacks"
    );
  }

  const handleLogout = async () => {
    try {
      // Call the logout endpoint to invalidate the refresh token
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      logout();
      // Redirect to the login page without locale prefix
      router.push("/login");
    }
  };

  const handleClinicProfileClick = () => {
    router.push(`/${locale}/clinic-profile`);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || (!user.firstName && !user.lastName)) {
      return "U";
    }
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  return (
    <header className="h-16 border-b border-border bg-white dark:bg-background flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-lg flex justify-center">
                <Image
                  src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
                  alt="VetSync"
                  width={120}
                  height={32}
                  priority
                />
              </SheetTitle>
            </SheetHeader>
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="md:hidden ml-2">
          <Image
            src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="VetSync"
            width={100}
            height={28}
            priority
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggleButton />
        <LanguageSwitcher />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            forceMount
            sideOffset={8}
            collisionPadding={8}
          >
            <DropdownMenuLabel className="font-normal" inset={false}>
              {user ? `${user.firstName} ${user.lastName}` : t("myAccount")}
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              inset={false}
              onClick={(e) => {
                e.stopPropagation();
                handleClinicProfileClick();
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              {t("clinicProfile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="cursor-pointer text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              inset={false}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
