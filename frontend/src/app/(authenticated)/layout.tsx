"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        {/* Sidebar - hidden on mobile, visible on md and up */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
