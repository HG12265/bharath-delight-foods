import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@bharathdelight.com";
const password = process.argv[3] || process.env.ADMIN_PASSWORD || "admin12345";
const phone = process.argv[4] || process.env.ADMIN_PHONE || "9999999999";

if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in backend/.env");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

async function run() {
  try {
    await client.connect();
    const db = client.db(process.env.DATABASE_NAME || "mr_bharath_foods");
    const collection = db.collection("customers");

    const existing = await collection.findOne({
      $or: [
        { "auth.email": email.toLowerCase().trim() },
        { "auth.phone": phone },
      ],
      is_deleted: { $ne: true },
    });

    const password_hash = await bcrypt.hash(password, 12);

    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            "auth.role": "admin",
            "auth.status": "active",
            "auth.password_hash": password_hash,
            updated_at: new Date(),
          },
        }
      );
      console.log(`\n✅ Existing user updated to ADMIN successfully!`);
    } else {
      await collection.insertOne({
        auth: {
          email: email.toLowerCase().trim(),
          phone: phone,
          password_hash,
          status: "active",
          refresh_token_hash: null,
          role: "admin",
        },
        personal_details: {
          first_name: "Admin",
          last_name: "Bharath",
        },
        addresses: [],
        b2b_profile: null,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
        node_version: 1,
      });
      console.log(`\n✅ New ADMIN account created successfully!`);
    }

    console.log(`-----------------------------------------------`);
    console.log(`📧 Email    : ${email}`);
    console.log(`🔑 Password : ${password}`);
    console.log(`📱 Phone    : ${phone}`);
    console.log(`👑 Role     : admin`);
    console.log(`-----------------------------------------------`);
    console.log(`You can now log in at http://127.0.0.1:3000/login and visit /admin !\n`);
  } catch (err) {
    console.error("Failed to create admin:", err);
  } finally {
    await client.close();
  }
}

run();

