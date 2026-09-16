import "dotenv/config";
import { execSync } from "child_process";

try {
  const output = execSync("npx drizzle-kit push", {
    env: { ...process.env },
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (error) {
  console.error("Drizzle push gagal:", error);
  process.exit(1);
}
