import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "node:path";
import dns from "node:dns";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME || "mr_bharath_foods";

async function cleanDatabase() {
  console.log("Connecting to MongoDB Atlas:", dbName);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    console.log("\n=================== STARTING DATABASE CLEANUP ===================");

    // 1. Delete Orders & Related Commerce
    const ordersResult = await db.collection("orders").deleteMany({});
    console.log(`✓ Deleted ${ordersResult.deletedCount} orders`);

    const checkoutsResult = await db.collection("checkouts").deleteMany({});
    console.log(`✓ Deleted ${checkoutsResult.deletedCount} checkouts`);

    const paymentsResult = await db.collection("payments").deleteMany({});
    console.log(`✓ Deleted ${paymentsResult.deletedCount} payments`);

    const shipmentsResult = await db.collection("shipments").deleteMany({});
    console.log(`✓ Deleted ${shipmentsResult.deletedCount} shipments`);

    const cartsResult = await db.collection("carts").deleteMany({});
    console.log(`✓ Deleted ${cartsResult.deletedCount} carts`);

    const wishlistsResult = await db.collection("wishlists").deleteMany({});
    console.log(`✓ Deleted ${wishlistsResult.deletedCount} wishlists`);

    const reviewsResult = await db.collection("reviews").deleteMany({});
    console.log(`✓ Deleted ${reviewsResult.deletedCount} reviews`);

    const notificationsResult = await db.collection("notifications").deleteMany({});
    console.log(`✓ Deleted ${notificationsResult.deletedCount} notifications`);

    const ticketsResult = await db.collection("support_tickets").deleteMany({});
    console.log(`✓ Deleted ${ticketsResult.deletedCount} support tickets`);

    const emailOutboxResult = await db.collection("email_outbox").deleteMany({});
    console.log(`✓ Deleted ${emailOutboxResult.deletedCount} pending email records`);

    const auditLogsResult = await db.collection("audit_logs").deleteMany({});
    console.log(`✓ Deleted ${auditLogsResult.deletedCount} audit logs`);

    const movementsResult = await db.collection("inventory_movements").deleteMany({});
    console.log(`✓ Deleted ${movementsResult.deletedCount} inventory movements`);

    const blacklistResult = await db.collection("token_blacklist").deleteMany({});
    console.log(`✓ Deleted ${blacklistResult.deletedCount} token blacklists`);

    const otpResult = await db.collection("otp_sessions").deleteMany({});
    console.log(`✓ Deleted ${otpResult.deletedCount} otp sessions`);

    // 2. Delete Payment Proof Media Assets ONLY (Keep product/category images!)
    const proofMediaResult = await db.collection("media_assets").deleteMany({
      $or: [
        { asset_type: "payment_proof" },
        { storage_key: { $regex: "payment_proof", $options: "i" } }
      ]
    });
    console.log(`✓ Deleted ${proofMediaResult.deletedCount} payment proof media records from DB`);

    // 3. Delete Non-Admin Customer Accounts (Keep admin/staff!)
    const customerResult = await db.collection("customers").deleteMany({
      "auth.role": { $nin: ["admin", "warehouse"] }
    });
    console.log(`✓ Deleted ${customerResult.deletedCount} test customer accounts (Admin account PRESERVED)`);

    // 4. Reset Order Counter Sequence
    await db.collection("counters").updateOne(
      { _id: "node_order_number" },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    console.log(`✓ Reset order sequence counter to 0 (Next order starts from #1)`);

    // 5. Release any reserved stock in inventories so available stock is 100% on hand
    const inventories = await db.collection("inventories").find({}).toArray();
    for (const inv of inventories) {
      if (inv.warehouse_stock?.length) {
        const updatedStocks = inv.warehouse_stock.map(ws => ({
          ...ws,
          reserved: 0
        }));
        await db.collection("inventories").updateOne(
          { _id: inv._id },
          { $set: { warehouse_stock: updatedStocks } }
        );
      }
    }
    console.log(`✓ Reset reserved stock in ${inventories.length} inventories (All stock is healthy and available)`);

    // 6. Clean local payment proof directory if files exist
    const localProofDir = path.join(__dirname, "../static/media/payment_proof");
    try {
      const files = await fs.readdir(localProofDir);
      for (const file of files) {
        if (file !== ".gitkeep") {
          await fs.unlink(path.join(localProofDir, file)).catch(() => {});
        }
      }
      console.log(`✓ Cleaned local payment_proof folder`);
    } catch (e) {
      // Ignore if dir doesn't exist
    }

    // 7. Verify preserved collections
    console.log("\n=================== VERIFYING PRESERVED DATA ===================");
    const collectionsToVerify = [
      "customers",
      "categories",
      "products",
      "inventories",
      "settings",
      "offers",
      "media_assets"
    ];

    for (const colName of collectionsToVerify) {
      const count = await db.collection(colName).countDocuments();
      console.log(`  -> ${colName}: ${count} documents preserved`);
    }

    const admins = await db.collection("customers").find({}).toArray();
    console.log(`\nPreserved Admin Login(s):`);
    admins.forEach(a => {
      console.log(`  • Email: ${a.auth?.email} | Role: ${a.auth?.role} | Phone: ${a.auth?.phone}`);
    });

    console.log("\n=================== CLEANUP COMPLETED SUCCESSFULLY ===================");
  } finally {
    await client.close();
  }
}

cleanDatabase().catch(console.error);
