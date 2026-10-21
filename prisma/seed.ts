import { prisma } from "../src/config/prisma-cllient.config";

const categories = [
  // Parent categories
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Running",
    slug: "running",
    parentId: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Football",
    slug: "football",
    parentId: null,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Esports",
    slug: "esports",
    parentId: null,
  },

  // Running subcategories
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "3K",
    slug: "3k",
    parentId: "10000000-0000-4000-8000-000000000001",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "5K",
    slug: "5k",
    parentId: "10000000-0000-4000-8000-000000000001",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "10K",
    slug: "10k",
    parentId: "10000000-0000-4000-8000-000000000001",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    name: "Half Marathon",
    slug: "half-marathon",
    parentId: "10000000-0000-4000-8000-000000000001",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    name: "Full Marathon",
    slug: "full-marathon",
    parentId: "10000000-0000-4000-8000-000000000001",
  },

  // Football subcategories
  {
    id: "20000000-0000-4000-8000-000000000006",
    name: "Mini Soccer",
    slug: "mini-soccer",
    parentId: "10000000-0000-4000-8000-000000000002",
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    name: "Futsal",
    slug: "futsal",
    parentId: "10000000-0000-4000-8000-000000000002",
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    name: "Sepak Bola",
    slug: "sepak-bola",
    parentId: "10000000-0000-4000-8000-000000000002",
  },

  // Esports subcategories
  {
    id: "20000000-0000-4000-8000-000000000009",
    name: "Mobile Legends",
    slug: "mobile-legends",
    parentId: "10000000-0000-4000-8000-000000000003",
  },
  {
    id: "20000000-0000-4000-8000-000000000010",
    name: "Valorant",
    slug: "valorant",
    parentId: "10000000-0000-4000-8000-000000000003",
  },
  {
    id: "20000000-0000-4000-8000-000000000011",
    name: "PUBG",
    slug: "pubg",
    parentId: "10000000-0000-4000-8000-000000000003",
  },
  {
    id: "20000000-0000-4000-8000-000000000012",
    name: "eFootball",
    slug: "efootball",
    parentId: "10000000-0000-4000-8000-000000000003",
  },
];




async function main() {
  await prisma.categories.createMany({
    data: categories,
    skipDuplicates: true,
  });

  console.log("Category seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
