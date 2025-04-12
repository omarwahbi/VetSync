"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function Header() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || (!user.firstName && !user.lastName)) {
      return "U";
    }
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  };

  return (
    <header className="h-16 border-b flex items-center justify-between px-4">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-lg">Vet Clinic</SheetTitle>
            </SheetHeader>
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="md:hidden ml-2 font-bold">Vet Clinic</div>
      </div>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal" inset={false}>
              {user ? `${user.firstName} ${user.lastName}` : "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer" inset={false}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="cursor-pointer text-red-500"
              onClick={handleLogout}
              inset={false}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
