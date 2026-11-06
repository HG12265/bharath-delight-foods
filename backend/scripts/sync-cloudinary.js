import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

cloudinary.config({
  cloud_name: "g8cdkkj6",
  api_key: "365267442955668",
  api_secret: "5r56jMIbxOnuw5RPT03pansb_70",
  secure: true,
});

const uri = "mongodb+srv://bharathdelightfoods_db_user:0TwuMm1wm4DumBSM@cluster0.w5ewuzt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function uploadFile(filePath, publicId) {
  const buffer = await fs.readFile(filePath);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bharath_delight/catalog",
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await client.connect();
  const db = client.db("mr_bharath_foods");

  console.log("Uploading Category Ghee image...");
  const catRes = await uploadFile("frontend/public/images/category-ghee.png", "category-ghee");
  console.log("Uploaded category-ghee:", catRes.secure_url);

  console.log("Uploading Rasipuram Ghee image...");
  const rasiRes = await uploadFile("frontend/public/images/rasipuram-ghee.jpg", "rasipuram-ghee");
  console.log("Uploaded rasipuram-ghee:", rasiRes.secure_url);

  console.log("Uploading Uthukuli Ghee image...");
  const uthuRes = await uploadFile("frontend/public/images/uthukuli-ghee.jpg", "uthukuli-ghee");
  console.log("Uploaded uthukuli-ghee:", uthuRes.secure_url);

  // Update media_assets for all matching records
  await db.collection("media_assets").updateMany(
    { original_filename: { $regex: /category-ghee/i } },
    { $set: { public_url: catRes.secure_url, storage_provider: "cloudinary", status: "completed" } }
  );

  await db.collection("media_assets").updateMany(
    { original_filename: { $regex: /rasipuram/i } },
    { $set: { public_url: rasiRes.secure_url, storage_provider: "cloudinary", status: "completed" } }
  );

  await db.collection("media_assets").updateMany(
    { original_filename: { $regex: /uthukuli/i } },
    { $set: { public_url: uthuRes.secure_url, storage_provider: "cloudinary", status: "completed" } }
  );

  // Also update category and products collections directly if any image_url or media_urls exist
  await db.collection("categories").updateMany(
    { slug: "pure-ghee" },
    { $set: { image_url: catRes.secure_url } }
  );

  await db.collection("products").updateOne(
    { slug: { $regex: /rasipuram/i } },
    { $set: { media_urls: [rasiRes.secure_url] } }
  );

  await db.collection("products").updateOne(
    { slug: { $regex: /uthukuli/i } },
    { $set: { media_urls: [uthuRes.secure_url] } }
  );

  console.log("Successfully synced all catalog images to Cloudinary and updated database!");
  await client.close();
}

main().catch(console.error);
