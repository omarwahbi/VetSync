"use client";

import { AdminGuard } from "@/components/auth/admin-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen">
        {/* Sidebar - hidden on mobile, visible on md and up */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">
                Platform Administration
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage clinics and platform-wide settings
              </p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
