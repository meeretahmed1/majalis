import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const book = await prisma.book.upsert({
    where: {
      slug: "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب",
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

      slug: "كتاب-فتح-القريب-المجيب-في-شرح-ألفاظ-التقريب",

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
