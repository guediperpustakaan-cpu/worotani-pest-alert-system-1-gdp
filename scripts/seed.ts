import "dotenv/config";
import { seedDatabase } from "../src/db/seed";
import { pool } from "../src/db/index";

seedDatabase()
  .then((result) => {
    console.log("Seed WoroTani selesai:", result);
  })
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
