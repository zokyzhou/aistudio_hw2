import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "carbon_market";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const allowedStandardRegex = /(verra|\bvcs\b|gold\s*standard|\bacr\b|american\s*carbon\s*registry|\bcar\b|climate\s*action\s*reserve)/i;
const currentYear = new Date().getFullYear();

const canonicalProjects = [
  {
    projectName: "katingan mentaya peatland restoration",
    aliases: ["katingan mentaya", "katingan"],
    standard: "verra",
    geography: "indonesia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
  },
  {
    projectName: "southern cardamom redd+",
    aliases: ["southern cardamom"],
    standard: "verra",
    geography: "cambodia",
    minVintageYear: 2018,
    maxVintageYear: 2024,
  },
  {
    projectName: "kasigau corridor redd+",
    aliases: ["kasigau corridor"],
    standard: "verra",
    geography: "kenya",
    minVintageYear: 2016,
    maxVintageYear: 2024,
  },
  {
    projectName: "bagepalli clean cookstoves",
    aliases: ["bagepalli cookstoves"],
    standard: "gold standard",
    geography: "india",
    minVintageYear: 2015,
    maxVintageYear: 2024,
  },
  {
    projectName: "guanaré forest conservation",
    aliases: ["guanaré conservation"],
    standard: "acr",
    geography: "colombia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
  },
  {
    projectName: "yurok improved forest management",
    aliases: ["yurok ifm"],
    standard: "car",
    geography: "united states",
    minVintageYear: 2014,
    maxVintageYear: 2024,
  },
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findCanonicalProject(projectName) {
  const normalized = normalizeText(projectName);
  return (
    canonicalProjects.find((project) => {
      if (project.projectName === normalized) return true;
      return (project.aliases || []).includes(normalized);
    }) || null
  );
}

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
  const invalidByShapeCount = await collection.countDocuments(invalidQuery);

  const allLots = await collection.find({}).toArray();
  const canonicalInvalidIds = allLots
    .filter((lot) => {
      const canonicalProject = findCanonicalProject(lot.projectName);
      if (!canonicalProject) return true;

      const standard = normalizeText(lot.standard);
      const geography = normalizeText(lot.geography);
      const vintageYear = Number(lot.vintageYear);

      if (standard !== canonicalProject.standard) return true;
      if (geography !== canonicalProject.geography) return true;
      if (!Number.isFinite(vintageYear)) return true;
      if (vintageYear < canonicalProject.minVintageYear || vintageYear > canonicalProject.maxVintageYear) {
        return true;
      }

      return false;
    })
    .map((lot) => lot._id);

  const invalidCount = invalidByShapeCount + canonicalInvalidIds.length;

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
    const result = await collection.deleteMany({
      $or: [invalidQuery, { _id: { $in: canonicalInvalidIds } }],
    });
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
