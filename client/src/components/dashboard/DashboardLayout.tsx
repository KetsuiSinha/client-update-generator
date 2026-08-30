"use client";

import React, { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Drafts", href: "/dashboard/drafts", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className={cn("transition-all duration-200", collapsed ? "w-16" : "w-64")}>
          <SidebarContent>
            <SidebarHeader className={cn("flex items-center justify-between p-4", collapsed && "justify-center")}>
              {!collapsed && (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-semibold text-lg text-ink">Pulse</span>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="text-muted-foreground hover:text-foreground"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </SidebarHeader>

            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    className={cn(
                      "gap-3 data-[state=active]:bg-terracotta/10 data-[state=active]:text-terracotta",
                      collapsed && "justify-center px-2"
                    )}
                    tooltip={collapsed ? item.name : undefined}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className={cn("mt-auto p-4 border-t", collapsed && "justify-center")}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      className={cn("w-full justify-center px-2")}
                      onClick={logout}
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    Sign out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={logout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign out</span>
                </Button>
              )}
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex h-full items-center justify-between px-6">
              <h1 className="font-display text-xl font-semibold text-ink">
                {navigation.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"))?.name || "Dashboard"}
              </h1>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </Button>
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <span className="text-terracotta font-medium text-sm">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}