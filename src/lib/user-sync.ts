import prisma from "@/lib/prisma";

export interface Auth0UserPayload {
  sub: string;
  email: string;
  name?: string;
}

export async function syncUserWithDatabase(user: Auth0UserPayload) {
  if (!user.sub || !user.email) {
    throw new Error("Invalid user payload: missing sub or email");
  }

  // Upsert: Kullanıcı varsa güncelle, yoksa yeni kayıt oluştur
  const dbUser = await prisma.user.upsert({
    where: { auth0Id: user.sub },
    update: {
      email: user.email,
      name: user.name ?? null,
    },
    create: {
      auth0Id: user.sub,
      email: user.email,
      name: user.name ?? null,
    },
  });

  return dbUser;
}