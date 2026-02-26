import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "carbon_market";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const allowedStandardRegex = /(verra|\bvcs\b|gold\s*standard|\bacr\b|american\s*carbon\s*registry|\bcar\b|climate\s*action\s*reserve)/i;
const currentYear = new Date().getFullYear();

const invalidQuery = {
  $or: [
    { projectName: { $exists: false } },
    { projectName: null },
    { projectName: "" },
    { $expr: { $lt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$projectName", ""] } } } }, 3] } },
    { standard: { $exists: false } },
    { standard: null },
    { standard: "" },
    { standard: { $not: allowedStandardRegex } },
    { vintageYear: { $exists: false } },
    { vintageYear: { $lt: 2005 } },
    { vintageYear: { $gt: currentYear } },
    { geography: { $exists: false } },
    { geography: null },
    { geography: "" },
    { $expr: { $lt: [{ $strLenCP: { $trim: { input: { $ifNull: ["$geography", ""] } } } }, 2] } },
    { quantityTons: { $exists: false } },
    { quantityTons: { $lte: 0 } },
    { askPricePerTon: { $exists: false } },
    { askPricePerTon: { $lte: 0 } },
  ],
};

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName });
  const collection = mongoose.connection.db.collection("creditlots");

  const total = await collection.countDocuments({});
  const invalidCount = await collection.countDocuments(invalidQuery);

  console.log(`Total lots: ${total}`);
  console.log(`Invalid lots to delete: ${invalidCount}`);

  const sample = await collection
    .find(invalidQuery)
    .project({ projectName: 1, standard: 1, vintageYear: 1, geography: 1, quantityTons: 1, askPricePerTon: 1 })
    .limit(5)
    .toArray();

  if (sample.length) {
    console.log("Sample invalid lots:");
    console.log(JSON.stringify(sample, null, 2));
  }

  if (invalidCount > 0) {
    const result = await collection.deleteMany(invalidQuery);
    console.log(`Deleted lots: ${result.deletedCount}`);
  } else {
    console.log("No invalid lots found; nothing deleted.");
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
