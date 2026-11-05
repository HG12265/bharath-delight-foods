import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in backend/.env");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.DATABASE_NAME || "mr_bharath_foods");
    const productsColl = db.collection("products");
    const inventoriesColl = db.collection("inventories");

    const products = await productsColl.find({ is_deleted: { $ne: true } }).toArray();
    console.log(`Found ${products.length} active products in database.`);

    let synced = 0;
    for (const prod of products) {
      for (const variant of prod.variants || []) {
        if (!variant.sku) continue;
        const existing = await inventoriesColl.findOne({ sku: variant.sku, is_deleted: { $ne: true } });
        if (!existing) {
          await inventoriesColl.insertOne({
            product_id: String(prod._id),
            variant_id: variant.variant_id,
            sku: variant.sku,
            warehouse_stock: [
              {
                warehouse_id: "WH-MAIN",
                on_hand: 50,
                reserved: 0,
                location_code: "A-01",
              },
            ],
            safety_stock_level: 5,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            node_version: 1,
          });
          console.log(`+ Created inventory for SKU: ${variant.sku} (${variant.title || variant.volume_weight}) with 50 units`);
          synced++;
        } else {
          console.log(`= Already exists: SKU ${variant.sku}`);
        }
      }
    }

    console.log(`\nInventory sync complete. Created ${synced} new inventory records.`);
  } catch (err) {
    console.error("Inventory sync failed:", err);
  } finally {
    await client.close();
  }
}

run();

