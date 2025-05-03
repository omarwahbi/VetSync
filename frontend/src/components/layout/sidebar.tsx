"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  LogOut,
  Calendar,
  Building2,
  Settings,
  UserCog,
  UserPlus,
  CalendarCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/axios";
import React from "react";
import { defaultLocale } from "@/i18n";
import { useTranslations } from "next-intl";

// Translation fallback for when context is not available
const getTranslationFallback = (key: string) => {
  const fallbacks: Record<string, string> = {
    dashboard: "Dashboard",
    visits: "Visits",
    owners: "Owners",
    pets: "Pets",
    clinicProfile: "Clinic Profile",
    myProfile: "My Profile",
    administration: "Administration",
    manageClinics: "Manage Clinics",
    manageUsers: "Manage Users",
    systemSettings: "System Settings",
    logout: "Logout",
    dueToday: "Due Today",
  };
  return fallbacks[key] || key;
};

// The main Sidebar component
export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const userRole = user?.role;
  const isAdmin = userRole === "ADMIN";
  const isClinicAdmin = userRole === "CLINIC_ADMIN";
  const { theme } = useTheme();

  // Extract locale from params or pathname
  const localeFromParams = params?.locale as string;
  const localeFromPathname =
    pathname?.split("/")[1] === "en" || pathname?.split("/")[1] === "ar"
      ? pathname.split("/")[1]
      : defaultLocale;
  const locale = localeFromParams || localeFromPathname;

  // Initialize t with fallback first, then try to use the hook
  // This avoids conditional hook calls which cause lint warnings
  let t = getTranslationFallback;

  try {
    // This might throw if the context is not available
    const translationHook = useTranslations("Navigation");
    // If it doesn't throw, override t with the real hook
    t = translationHook;
  } catch {
    console.warn(
      "Translation context not available in Sidebar, using fallbacks"
    );
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      logout();
      // Redirect to the login page without locale prefix
      router.push("/login");
    }
  };

  // Check if a path is active
  const isPathActive = (path: string) => {
    // Check both localized and non-localized paths
    const localizedPath = `/${locale}${path}`;
    return (
      pathname === path ||
      pathname?.startsWith(`${path}/`) ||
      pathname === localizedPath ||
      pathname?.startsWith(`${localizedPath}/`)
    );
  };

  // Get localized href
  const getLocalizedHref = (path: string) => {
    // If path already starts with locale, return as is
    if (path.startsWith(`/${locale}/`)) return path;
    // Otherwise prepend locale
    return `/${locale}${path}`;
  };

  // Define nav items
  const navItems = [
    {
      name: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("visits"),
      href: "/visits",
      icon: Calendar,
    },
    {
      name: t("owners"),
      href: "/owners",
      icon: Users,
    },
    {
      name: t("pets"),
      href: "/pets",
      icon: PawPrint,
    },
    {
      name: t("clinicProfile"),
      href: "/clinic-profile",
      icon: Building2,
    },
    {
      name: t("myProfile"),
      href: "/profile",
      icon: UserCog,
    },
  ];

  const adminNavItems = [
    {
      name: t("manageClinics"),
      href: "/admin/clinics",
      icon: Building2,
    },
    {
      name: t("manageUsers"),
      href: "/admin/users",
      icon: UserPlus,
    },
    {
      name: t("systemSettings"),
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const clinicAdminItems = [
    {
      name: t("manageUsers"),
      href: "/manage-users",
      icon: UserPlus,
    },
  ];

  return (
    <div className="h-full w-64 border-r border-border bg-white dark:bg-slate-950 flex flex-col">
      <div className="py-[10.5px] px-4 border-b flex items-center justify-center">
        <Link
          href={getLocalizedHref("/dashboard")}
          className="flex items-center"
        >
          <Image
            src={theme === "dark" ? "/logo-dark.svg" : "/logo.svg"}
            alt="VetSync"
            width={150}
            height={40}
            priority
          />
        </Link>
      </div>

      <nav className="space-y-1 flex-1 p-4">
        {/* Dashboard link */}
        <Link href={getLocalizedHref("/dashboard")}>
          <Button
            variant={isPathActive("/dashboard") ? "secondary" : "ghost"}
            size="default"
            className={cn(
              "w-full justify-start gap-2 pl-2 mb-1",
              isPathActive("/dashboard") ? "bg-secondary" : ""
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("dashboard")}
          </Button>
        </Link>

        {/* Due Visits link - visible to all users */}
        <Link href={getLocalizedHref("/due-visits")}>
          <Button
            variant={isPathActive("/due-visits") ? "secondary" : "ghost"}
            size="default"
            className={cn(
              "w-full justify-start gap-2 pl-2 mb-1",
              isPathActive("/due-visits") ? "bg-secondary" : ""
            )}
          >
            <CalendarCheck2 className="h-4 w-4" />
            {t("dueToday")}
          </Button>
        </Link>

        {/* Common nav items for all users */}
        {navItems.slice(1).map((item) => {
          const isActive = isPathActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={getLocalizedHref(item.href)}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="default"
                className={cn(
                  "w-full justify-start gap-2 pl-2 mb-1",
                  isActive ? "bg-secondary" : ""
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}

        {/* Admin specific nav items */}
        {isAdmin && (
          <>
            <div className="pt-2 pb-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                {t("administration")}
              </p>
            </div>
            {adminNavItems.map((item) => {
              const isActive = isPathActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={getLocalizedHref(item.href)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="default"
                    className={cn(
                      "w-full justify-start gap-2 pl-2 mb-1",
                      isActive ? "bg-secondary" : ""
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </>
        )}

        {/* Clinic Admin specific nav items */}
        {isClinicAdmin && (
          <>
            <div className="pt-2 pb-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                {t("administration")}
              </p>
            </div>
            {clinicAdminItems.map((item) => {
              const isActive = isPathActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={getLocalizedHref(item.href)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="default"
                    className={cn(
                      "w-full justify-start gap-2 pl-2 mb-1",
                      isActive ? "bg-secondary" : ""
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-start gap-2 pl-2 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>
      </div>
    </div>
  );
}
