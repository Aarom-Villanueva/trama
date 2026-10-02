import { randomBytes } from "node:crypto";
import { access, writeFile } from "node:fs/promises";
import { createServer } from "node:net";

async function portIsFree(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => error.code === "EADDRINUSE" || error.code === "EACCES" ? resolve(false) : reject(error));
    server.listen({ host: "127.0.0.1", port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

try {
  let exists = true;
  try { await access(".env.local"); } catch (error) {
    if (error.code !== "ENOENT") throw error;
    exists = false;
  }
  if (exists) {
    console.log(".env.local already exists; nothing was overwritten. See README for local settings.");
  } else {
    let port = 55432;
    while (port <= 55532 && !(await portIsFree(port))) port++;
    if (port > 55532) throw new Error("No free local port in the TRAMA range.");
    const password = randomBytes(32).toString("hex");
    const content = [
      "# Generated local-only TRAMA credentials. Do not commit or print this file.",
      "TRAMA_DB_PORT=" + port,
      "TRAMA_DB_PASSWORD=" + password,
      "DATABASE_URL=postgresql://trama_local:" + password + "@127.0.0.1:" + port + "/trama_local",
      "",
    ].join("\n");
    await writeFile(".env.local", content, { flag: "wx", mode: 0o600 });
    console.log("Created .env.local for TRAMA on loopback port " + port + ". Credentials are not displayed.");
  }
} catch {
  console.error("Could not prepare .env.local. Check file permissions and local ports; existing files are preserved.");
  process.exitCode = 1;
}
