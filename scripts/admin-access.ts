import { and, eq } from "drizzle-orm";
import { adminAccess, account, session, user } from "../db/schema/auth";
import { permittedIdentity } from "../lib/admin-policy";
import { openLocalDatabase, runLocalCommand, LocalConfigurationError } from "./lib/local-db";

await runLocalCommand(async () => {
  const mode = process.argv[2];
  if (mode !== "revoke" && mode !== "grant") throw new LocalConfigurationError("Usa npm run admin:access -- revoke o grant.");
  const { db, pool } = await openLocalDatabase();
  try {
    const email = process.env.TRAMA_ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) throw new LocalConfigurationError("Configura TRAMA_ADMIN_EMAIL en .env.local.");
    const [identity] = await db.select({ id: user.id, email: user.email, emailVerified: user.emailVerified }).from(user)
      .innerJoin(account, and(eq(account.userId, user.id), eq(account.providerId, "google"))).where(eq(user.email, email)).limit(1);
    if (!identity || (mode === "grant" && !permittedIdentity(identity, email))) throw new LocalConfigurationError("No existe una identidad Google verificada para la cuenta configurada.");
    await db.transaction(async (tx) => {
      await tx.insert(adminAccess).values({ userId: identity.id, active: mode === "grant" }).onConflictDoUpdate({ target: adminAccess.userId, set: { active: mode === "grant", updatedAt: new Date() } });
      await tx.delete(session).where(eq(session.userId, identity.id));
    });
    console.log(mode === "revoke" ? "Permiso revocado y sesiones eliminadas." : "Permiso habilitado. Se requiere iniciar sesión de nuevo.");
  } finally { await pool.end(); }
});
