"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
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

// Define route paths
const routePaths = {
  dashboard: "/dashboard",
  visits: "/visits",
  owners: "/owners",
  pets: "/pets",
  clinicProfile: "/clinic-profile",
  profile: "/profile",
  adminClinics: "/admin/clinics",
  adminUsers: "/admin/users",
  adminSettings: "/admin/settings",
  manageUsers: "/manage-users",
  dueVisits: "/due-visits",
};

// The main Sidebar component
export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const userRole = user?.role;
  const isAdmin = userRole === "ADMIN";
  const isClinicAdmin = userRole === "CLINIC_ADMIN";
  const { theme } = useTheme();

  // Logout handler
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      logout();
      router.push("/login");
    }
  };

  // Check if a path is active
  const isPathActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Define nav items
  const navItems = [
    {
      name: "Dashboard",
      href: routePaths.dashboard,
      icon: LayoutDashboard,
    },
    {
      name: "Visits",
      href: routePaths.visits,
      icon: Calendar,
    },
    {
      name: "Owners",
      href: routePaths.owners,
      icon: Users,
    },
    {
      name: "Pets",
      href: routePaths.pets,
      icon: PawPrint,
    },
    {
      name: "Clinic Profile",
      href: routePaths.clinicProfile,
      icon: Building2,
    },
    {
      name: "My Profile",
      href: routePaths.profile,
      icon: UserCog,
    },
  ];

  const adminNavItems = [
    {
      name: "Manage Clinics",
      href: routePaths.adminClinics,
      icon: Building2,
    },
    {
      name: "Manage Users",
      href: routePaths.adminUsers,
      icon: UserPlus,
    },
    {
      name: "System Settings",
      href: routePaths.adminSettings,
      icon: Settings,
    },
  ];

  const clinicAdminItems = [
    {
      name: "Manage Users",
      href: routePaths.manageUsers,
      icon: UserPlus,
    },
  ];

  return (
    <div className="h-full w-64 border-r border-border bg-white dark:bg-slate-950 flex flex-col">
      <div className="py-4 px-4 border-b flex items-center justify-center">
        <Link href={routePaths.dashboard} className="flex items-center">
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
        <Link href={routePaths.dashboard}>
          <Button
            variant={isPathActive(routePaths.dashboard) ? "secondary" : "ghost"}
            size="default"
            className={cn(
              "w-full justify-start gap-2 pl-2 mb-1",
              isPathActive(routePaths.dashboard) ? "bg-secondary" : ""
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>

        {/* Due Visits link - visible to all users */}
        <Link href={routePaths.dueVisits}>
          <Button
            variant={isPathActive(routePaths.dueVisits) ? "secondary" : "ghost"}
            size="default"
            className={cn(
              "w-full justify-start gap-2 pl-2 mb-1",
              isPathActive(routePaths.dueVisits) ? "bg-secondary" : ""
            )}
          >
            <CalendarCheck2 className="h-4 w-4" />
            Due Today
          </Button>
        </Link>

        {/* Common nav items for all users */}
        {navItems.slice(1).map((item) => {
          const isActive = isPathActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
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
                Administration
              </p>
            </div>
            {adminNavItems.map((item) => {
              const isActive = isPathActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
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
                Administration
              </p>
            </div>
            {clinicAdminItems.map((item) => {
              const isActive = isPathActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
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
          Logout
        </Button>
      </div>
    </div>
  );
}
