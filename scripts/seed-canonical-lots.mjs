import mongoose from "mongoose";
import { randomBytes } from "crypto";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "carbon_market";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const canonicalProjects = [
  {
    projectName: "Katingan Mentaya Peatland Restoration",
    standard: "Verra",
    geography: "Indonesia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
    askPricePerTon: 12.6,
    quantityTons: 120,
  },
  {
    projectName: "Southern Cardamom REDD+",
    standard: "Verra",
    geography: "Cambodia",
    minVintageYear: 2018,
    maxVintageYear: 2024,
    askPricePerTon: 11.9,
    quantityTons: 100,
  },
  {
    projectName: "Kasigau Corridor REDD+",
    standard: "Verra",
    geography: "Kenya",
    minVintageYear: 2016,
    maxVintageYear: 2024,
    askPricePerTon: 12.2,
    quantityTons: 90,
  },
  {
    projectName: "Bagepalli Clean Cookstoves",
    standard: "Gold Standard",
    geography: "India",
    minVintageYear: 2015,
    maxVintageYear: 2024,
    askPricePerTon: 10.8,
    quantityTons: 110,
  },
  {
    projectName: "Guanaré Forest Conservation",
    standard: "ACR",
    geography: "Colombia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
    askPricePerTon: 11.4,
    quantityTons: 95,
  },
];

function randomToken(prefix) {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

async function ensureSellerAgent(db) {
  const agents = db.collection("agents");

  let seller = await agents.findOne({ role: "seller" });
  if (seller) return seller;

  seller = await agents.findOne({ name: { $in: ["Nilson", "Zack"] } });
  if (seller) {
    await agents.updateOne({ _id: seller._id }, { $set: { role: "seller", lastActive: new Date() } });
    return { ...seller, role: "seller" };
  }

  seller = await agents.findOne({});
  if (seller) {
    await agents.updateOne({ _id: seller._id }, { $set: { role: "seller", lastActive: new Date() } });
    return { ...seller, role: "seller" };
  }

  const now = new Date();
  const newSeller = {
    name: "Nilson",
    description: "Seller-side agent for canonical carbon lots",
    role: "seller",
    apiKey: randomToken("api"),
    claimToken: randomToken("claim"),
    claimStatus: "pending_claim",
    lastActive: now,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await agents.insertOne(newSeller);
  return { ...newSeller, _id: insertResult.insertedId };
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName });
  const db = mongoose.connection.db;
  const lots = db.collection("creditlots");

  const seller = await ensureSellerAgent(db);

  let inserted = 0;
  let skipped = 0;

  for (const project of canonicalProjects) {
    const existing = await lots.findOne({
      sellerAgentId: seller._id,
      projectName: project.projectName,
      status: "open",
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const now = new Date();
    const vintageYear = Math.max(
      project.minVintageYear,
      Math.min(project.maxVintageYear, new Date().getFullYear() - 1)
    );

    await lots.insertOne({
      sellerAgentId: seller._id,
      projectName: project.projectName,
      standard: project.standard,
      vintageYear,
      geography: project.geography,
      quantityTons: project.quantityTons,
      askPricePerTon: project.askPricePerTon,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    inserted += 1;
  }

  console.log(`Seller: ${seller.name}`);
  console.log(`Canonical lots inserted: ${inserted}`);
  console.log(`Canonical lots skipped (already open): ${skipped}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
