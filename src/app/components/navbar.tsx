"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
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
  }, [pathname]);

  const navItems = [
    { name: "Resume Tailor", href: "/" },
    { name: "AI Interviewer", href: "/interview" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <header className="border-b bg-card/60 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text">
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
                  className={`text-xs font-medium px-3 py-2 rounded-md transition-all ${
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

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-4 w-[1px] bg-border mx-1" />

          {isLoading ? (
            <div className="w-16 h-8 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <a href="/auth/logout">
              <Button variant="secondary" size="sm" className="text-xs h-8 px-3 cursor-pointer">
                Log Out
              </Button>
            </a>
          ) : (
            <a href="/auth/login">
              <Button variant="default" size="sm" className="text-xs h-8 px-3 cursor-pointer">
                Log In
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;