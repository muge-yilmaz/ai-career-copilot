import { auth0 } from "@/lib/auth0";
import { syncUserWithDatabase } from "@/lib/user-sync";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 1. Auth0 oturumunu doğrudan istek üzerinden alıyoruz
    const session = await auth0.getSession(request);
    
    // 2. Eğer kullanıcı başarıyla oturum açtıysa MongoDB ile eşliyoruz
   if (session?.user?.sub && session?.user?.email) {
      await syncUserWithDatabase({
        sub: session.user.sub,
        email: session.user.email,
        name: session.user.name,
      });
    }
  } catch (error) {
    // 3. Veritabanı eşleme hatası olsa bile kullanıcının Auth0 oturumu bozulmasın diye hatayı yakalıyoruz
    console.error("User sync error during callback:", error);
  }

  // 4. Giriş başarılı olunca kullanıcıyı ana sayfaya yönlendiriyoruz
  return NextResponse.redirect(new URL("/", request.url));
}