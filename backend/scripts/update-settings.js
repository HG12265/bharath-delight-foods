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
    const collection = db.collection("settings");

    const updateData = {
      brand_name: "Bharath Delight Foods",
      support_email: "bharathdelightfoods@gmail.com",
      public_support_email: "bharathdelightfoods@gmail.com",
      support_contact: "bharathdelightfoods@gmail.com",
      support_phone: "+91 91501 41007",
      public_support_phone: "+91 91501 41007",
      business_address: "Bharath Delight Foods, Adiannamalai, Tiruvannamalai, 606604, Tamil Nadu, India",
      upi_id: process.env.UPI_ID || "bharaththambidurai@oksbi",
      payment_display_name: "Bharath Delight Foods",
      fssai_number: "12424999000123",
      updated_at: new Date(),
    };

    const result = await collection.updateMany(
      { is_deleted: { $ne: true } },
      { $set: updateData }
    );

    console.log(`\n✅ Settings updated successfully in MongoDB Atlas!`);
    console.log(`Matched documents: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    console.log(`-----------------------------------------------------------------`);
    console.log(`📞 Phone   : ${updateData.public_support_phone}`);
    console.log(`📧 Email   : ${updateData.public_support_email}`);
    console.log(`📍 Address : ${updateData.business_address}`);
    console.log(`💳 UPI ID  : ${updateData.upi_id}`);
    console.log(`-----------------------------------------------------------------\n`);
  } catch (err) {
    console.error("Failed to update settings:", err);
  } finally {
    await client.close();
  }
}

run();

