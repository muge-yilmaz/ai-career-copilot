import { auth0 } from "@/lib/auth0";
import prisma from "@/lib/prisma";
import { syncUserWithDatabase } from "@/lib/user-sync";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  // Veritabanındaki kullanıcı kaydını çekiyoruz
  let dbUser = null;
 if (user?.sub && user?.email) {
    // 1. Önce veritabanını kontrol et
    dbUser = await prisma.user.findUnique({
      where: { auth0Id: user.sub },
    });

    // 2. Eğer Auth0 oturumu var ama veritabanında yoksa anında senkronize et
    if (!dbUser) {
      try {
        dbUser = await syncUserWithDatabase({
          sub: user.sub,
          email: user.email,
          name: user.name,
        });
      } catch (error) {
        console.error("Auto sync error on homepage:", error);
      }
    }
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="max-w-md w-full space-y-6 text-center border p-6 rounded-xl shadow-sm bg-card">
        <h1 className="text-2xl font-bold">AI Career Copilot</h1>

        {user ? (
          <div className="space-y-4 text-left">
            {/* Auth0 Profil Bilgileri */}
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Auth0 Profile</p>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            {/* MongoDB Senkronizasyon Durumu */}
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">MongoDB Sync Status</p>
              {dbUser ? (
                <p className="text-xs text-green-600 font-medium">Synced (ID: {dbUser.id})</p>
              ) : (
                <p className="text-xs text-amber-600 font-medium">Not Synced Yet</p>
              )}
            </div>

            <a
              href="/auth/logout"
              className="block w-full text-center py-2 px-4 bg-destructive text-destructive-foreground rounded-md text-sm font-medium"
            >
              Log Out
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Welcome! Please log in to start analyzing your CV and practicing interviews.
            </p>
            <a
              href="/auth/login"
              className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              Log In / Sign Up
            </a>
          </div>
        )}
      </div>
    </main>
  );
}