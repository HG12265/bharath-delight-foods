import dotenv from "dotenv";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const rootDir = path.resolve(__dirname, "../..");

const client = new MongoClient(process.env.MONGODB_URI);

async function clean() {
  console.log("==================================================");
  console.log("🧹 BHARATH DELIGHT FOODS - CLEANUP OPERATION");
  console.log("==================================================\n");

  try {
    await client.connect();
    const db = client.db(process.env.DATABASE_NAME || "mr_bharath_foods");

    // 1. Identify Admin
    const adminCustomer = await db.collection("customers").findOne({
      $or: [
        { "auth.role": "admin" },
        { "auth.email": (process.env.ADMIN_EMAIL || "bharathdelightfoods@gmail.com").toLowerCase().trim() },
      ],
      is_deleted: { $ne: true },
    });

    if (!adminCustomer) {
      console.warn("⚠️ Warning: No existing admin customer found! Preserving admin filter anyway.");
    } else {
      console.log(`✅ Preserving Admin Account: ${adminCustomer.auth?.email} (ID: ${adminCustomer._id})`);
    }

    // 2. Collections to completely wipe
    const collectionsToWipe = [
      "orders",
      "payments",
      "checkouts",
      "carts",
      "products",
      "categories",
      "inventories",
      "inventory_movements",
      "media_assets",
      "reviews",
      "wishlists",
      "notifications",
      "email_outbox",
      "token_blacklist",
      "audit_logs",
      "otp_sessions",
      "shipments",
    ];

    console.log("\n📦 Cleaning database collections...");
    for (const colName of collectionsToWipe) {
      try {
        const countBefore = await db.collection(colName).countDocuments();
        const res = await db.collection(colName).deleteMany({});
        console.log(`  - ${colName}: deleted ${res.deletedCount} of ${countBefore} documents`);
      } catch (e) {
        console.log(`  - ${colName}: skipped/error: ${e.message}`);
      }
    }

    // 3. Customers collection: delete all non-admin customers
    const nonAdminFilter = adminCustomer
      ? { _id: { $ne: adminCustomer._id } }
      : { "auth.role": { $ne: "admin" } };
    const deletedCust = await db.collection("customers").deleteMany(nonAdminFilter);
    console.log(`  - customers: deleted ${deletedCust.deletedCount} non-admin customer(s)`);

    // 4. Reset order counter back to 0
    await db.collection("counters").updateOne(
      { _id: "node_order_number" },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    console.log("  - counters: reset 'node_order_number' sequence to 0");

    // 5. Check settings
    const settings = await db.collection("settings").findOne();
    console.log(`  - settings: preserved store settings (Brand: ${settings?.brand_name || "Bharath Delight Foods"}, UPI: ${settings?.upi_id || "N/A"})`);

    // 6. Delete uploaded media files in backend/static/media
    console.log("\n🖼️ Cleaning backend uploaded media assets...");
    const staticMediaDir = path.resolve(__dirname, "../static/media");
    const subDirs = ["payment_proof", "product_image"];

    for (const sub of subDirs) {
      const targetDir = path.join(staticMediaDir, sub);
      if (fs.existsSync(targetDir)) {
        const entries = fs.readdirSync(targetDir);
        for (const entry of entries) {
          const fullPath = path.join(targetDir, entry);
          try {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`  - Removed ${sub}/${entry}`);
          } catch (err) {
            console.error(`  - Failed to remove ${fullPath}:`, err.message);
          }
        }
      }
    }

    // 7. Remove unused test images from frontend/public/images
    console.log("\n🗑️ Cleaning unused files from frontend/public/images...");
    const frontendImagesDir = path.resolve(rootDir, "frontend/public/images");
    const unusedImages = ["check_region_A.png", "about-founder.png"];

    for (const imgName of unusedImages) {
      const imgPath = path.join(frontendImagesDir, imgName);
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
          console.log(`  - Removed unused image: ${imgName}`);
        } catch (err) {
          console.error(`  - Failed to delete ${imgName}:`, err.message);
        }
      } else {
        console.log(`  - Already absent: ${imgName}`);
      }
    }

    console.log("\n==================================================");
    console.log("✨ CLEANUP COMPLETED SUCCESSFULLY!");
    console.log("==================================================");

  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    await client.close();
  }
}

clean();
