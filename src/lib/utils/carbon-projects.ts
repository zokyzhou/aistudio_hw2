export type CanonicalCarbonProject = {
  projectName: string;
  aliases?: string[];
  standard: "Verra" | "Gold Standard" | "ACR" | "CAR";
  geography: string;
  minVintageYear: number;
  maxVintageYear: number;
};

export const CANONICAL_CARBON_PROJECTS: CanonicalCarbonProject[] = [
  {
    projectName: "Katingan Mentaya Peatland Restoration",
    aliases: ["Katingan Mentaya", "Katingan"],
    standard: "Verra",
    geography: "Indonesia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
  },
  {
    projectName: "Southern Cardamom REDD+",
    aliases: ["Southern Cardamom"],
    standard: "Verra",
    geography: "Cambodia",
    minVintageYear: 2018,
    maxVintageYear: 2024,
  },
  {
    projectName: "Kasigau Corridor REDD+",
    aliases: ["Kasigau Corridor"],
    standard: "Verra",
    geography: "Kenya",
    minVintageYear: 2016,
    maxVintageYear: 2024,
  },
  {
    projectName: "Bagepalli Clean Cookstoves",
    aliases: ["Bagepalli Cookstoves"],
    standard: "Gold Standard",
    geography: "India",
    minVintageYear: 2015,
    maxVintageYear: 2024,
  },
  {
    projectName: "Guanaré Forest Conservation",
    aliases: ["Guanaré Conservation"],
    standard: "ACR",
    geography: "Colombia",
    minVintageYear: 2017,
    maxVintageYear: 2024,
  },
  {
    projectName: "Yurok Improved Forest Management",
    aliases: ["Yurok IFM"],
    standard: "CAR",
    geography: "United States",
    minVintageYear: 2014,
    maxVintageYear: 2024,
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findCanonicalProject(projectName: string) {
  const normalized = normalizeText(projectName);

  return (
    CANONICAL_CARBON_PROJECTS.find((project) => {
      if (normalizeText(project.projectName) === normalized) return true;
      return (project.aliases || []).some((alias) => normalizeText(alias) === normalized);
    }) || null
  );
}

export function isProjectMetadataConsistent(input: {
  projectName: string;
  standard: string;
  geography: string;
  vintageYear: number;
}) {
  const project = findCanonicalProject(input.projectName);
  if (!project) return false;

  const sameStandard = normalizeText(project.standard) === normalizeText(input.standard);
  const sameGeography = normalizeText(project.geography) === normalizeText(input.geography);
  const inVintageRange =
    Number.isFinite(input.vintageYear) &&
    input.vintageYear >= project.minVintageYear &&
    input.vintageYear <= project.maxVintageYear;

  return sameStandard && sameGeography && inVintageRange;
}
