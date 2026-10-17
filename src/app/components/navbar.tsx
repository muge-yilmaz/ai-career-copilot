"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

interface UserProfile {
  name?: string;
  email?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Auth0 oturum durumunu kontrol etmek için lightweight me isteği
    async function checkAuth() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          // Dashboard verisi dönebiliyorsa oturum açıktır
          const data = await res.json();
          setUser({ name: "User" });
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    setMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Resume Tailor", href: "/" },
    { name: "AI Interviewer", href: "/interview" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  const renderAuthAction = (fullWidth = false) => {
    if (isLoading) {
      return <div className={`${fullWidth ? "w-full" : "w-16"} h-9 bg-muted animate-pulse rounded-md`} />;
    }

    if (user) {
      return (
        <a href="/auth/logout" className={fullWidth ? "block" : undefined}>
          <Button variant="secondary" size="sm" className={`text-xs h-9 px-3 cursor-pointer ${fullWidth ? "w-full" : ""}`}>
            Log Out
          </Button>
        </a>
      );
    }

    return (
      <a href="/auth/login" className={fullWidth ? "block" : undefined}>
        <Button variant="default" size="sm" className={`text-xs h-9 px-3 cursor-pointer ${fullWidth ? "w-full" : ""}`}>
          Log In
        </Button>
      </a>
    );
  };

  return (
    <header className="border-b bg-card/60 backdrop-blur-md sticky top-0 z-50 shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2 group min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight truncate bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
             CareerCopilot
            </span>
          </Link>

          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-medium px-3 py-2 rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <div className="hidden md:block h-4 w-px bg-border mx-1" />
          <div className="hidden md:block">{renderAuthAction()}</div>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9 cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t bg-card/95 backdrop-blur-md animate-in fade-in-0 slide-in-from-top-2 duration-200"
        >
          <div className="container max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium px-3 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 mt-1 border-t">{renderAuthAction(true)}</div>
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;