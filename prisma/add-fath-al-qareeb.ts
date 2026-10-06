import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CANONICAL_SLUG = "fath-al-qareeb";
const LEGACY_SLUG = "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب";

async function main() {
  console.log("📚 Adding فتح القريب المجيب...");

  const category = await prisma.category.upsert({
    where: { slug: "fiqh-shafii" },
    update: {},
    create: {
      name: "الفقه الشافعي",
      slug: "fiqh-shafii",
      order: 2,
    },
  });

  let author = await prisma.author.findFirst({
    where: {
      name: "ابن قاسم الغزي",
    },
  });

  if (!author) {
    author = await prisma.author.create({
      data: {
        name: "ابن قاسم الغزي",
        bio: "صاحب شرح فتح القريب المجيب على متن أبي شجاع.",
      },
    });
  }

  // Migrate the old Arabic slug first so existing sections/sessions keep the same book ID.
  const legacyBook = await prisma.book.findUnique({ where: { slug: LEGACY_SLUG } });
  const canonicalBook = await prisma.book.findUnique({ where: { slug: CANONICAL_SLUG } });

  if (legacyBook && !canonicalBook) {
    await prisma.book.update({
      where: { id: legacyBook.id },
      data: { slug: CANONICAL_SLUG },
    });
    console.log("🔁 Migrated legacy Arabic slug to:", CANONICAL_SLUG);
  }

  const book = await prisma.book.upsert({
    where: {
      slug: CANONICAL_SLUG,
    },

    update: {
      title: "فتح القريب المجيب في شرح ألفاظ التقريب",
      description:
        "شرح فقهي على متن أبي شجاع في الفقه الشافعي، مرتب وفق أبواب الفقه.",
      status: "PUBLISHED",
      categoryId: category.id,
      authorId: author.id,
      teacherId: author.id,
    },

    create: {
      title: "فتح القريب المجيب في شرح ألفاظ التقريب",

      slug: CANONICAL_SLUG,

      cover: "📖",

      description:
        "شرح فقهي على متن أبي شجاع في الفقه الشافعي، مرتب وفق أبواب الفقه.",

      goals: [
        "فهم المسائل الأساسية في الفقه الشافعي",
        "دراسة متن أبي شجاع بصورة منظمة",
        "ربط المتن بشرحه وتوضيح ألفاظه",
      ],

      level: "مبتدئ",

      estimatedDuration: "16 أسبوع",

      status: "PUBLISHED",

      publishedAt: new Date(),

      categoryId: category.id,

      authorId: author.id,

      teacherId: author.id,

      sections: {
        create: [
          {
            title: "مقدمة الكتاب",
            order: 1,
          },
          {
            title: "كتاب الطهارة",
            order: 2,
          },
          {
            title: "كتاب الصلاة",
            order: 3,
          },
        ],
      },
    },
  });

  console.log("✅ Book added successfully.");
  console.log("Book ID:", book.id);
  console.log("Slug:", book.slug);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
