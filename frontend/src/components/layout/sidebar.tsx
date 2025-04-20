"use client";

import Link from "next/link";
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
  Shield,
  UserCog,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Visits", href: "/visits", icon: Calendar },
  { name: "Owners", href: "/owners", icon: Users },
  { name: "Pets", href: "/pets", icon: PawPrint },
  {
    name: "Clinic Profile",
    href: "/clinic-profile",
    icon: Building2,
  },
  {
    name: "My Profile",
    href: "/profile",
    icon: UserCog,
  },
];

const adminNavItems = [
  { name: "Manage Clinics", href: "/admin/clinics", icon: Building2 },
  { name: "Manage Users", href: "/admin/users", icon: UserPlus },
  { name: "Admin Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="h-full w-64 border-r border-border bg-white dark:bg-slate-950 flex flex-col">
      <div className="py-6 px-4 border-b">
        <h1 className="text-xl font-bold">Vet Clinic</h1>
      </div>

      <nav className="space-y-1 flex-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
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

        {/* Admin Section - only visible for admin users */}
        {isAdmin && (
          <>
            <div className="pt-6 mt-4 border-t">
              <div className="flex items-center gap-2 px-2 py-3 mb-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4" />
                Platform Admin
              </div>

              {adminNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);
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
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-start gap-2 pl-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
