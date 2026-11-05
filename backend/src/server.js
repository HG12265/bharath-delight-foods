import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";
import { createApp, initializeIndexes, backgroundWork } from "./app.js";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI in backend/.env.");
if (!process.env.SECRET_KEY || process.env.SECRET_KEY.length < 32)
  throw new Error("Set SECRET_KEY to at least 32 characters.");
if (
  process.env.NODE_ENV === "production" &&
  /replace-with|example|generate_a_secure/i.test(process.env.SECRET_KEY)
)
  throw new Error("Configure a real production SECRET_KEY.");
const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 30,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
});
await client.connect();
const db = client.db(process.env.DATABASE_NAME || "mr_bharath_foods");
const topology = await db.admin().command({ hello: 1 });
if (!topology.setName && topology.msg !== "isdbgrid")
  throw new Error(
    "MongoDB transactions require Atlas or a replica set. See README.md for local replica-set setup.",
  );
await initializeIndexes(db);
const context = { client, db };
const app = createApp(context);
const server = app.listen(
  Number(process.env.PORT || 8000),
  process.env.HOST || "0.0.0.0",
  () =>
    console.info(
      `Bharath Delight Node API listening on port ${process.env.PORT || 8000}`,
    ),
);
let working = false;
const timer = setInterval(async () => {
  if (working) return;
  working = true;
  try {
    await backgroundWork(context);
  } catch (error) {
    console.error("Background worker failed:", error.message);
  } finally {
    working = false;
  }
}, 30000);
timer.unref();
async function shutdown() {
  clearInterval(timer);
  server.close(async () => {
    await client.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
