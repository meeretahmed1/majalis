import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء زراعة البيانات التجريبية...");

  // 1) حساب المدير
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@majalis.local" },
    update: {},
    create: {
      name: "مدير المنصة",
      email: "admin@majalis.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log(`✔ حساب الأدمن: admin@majalis.local / Admin@12345`);

  // 2) طالب تجريبي (اختياري لتجربة الواجهة الطلابية بسرعة)
  const studentPasswordHash = await bcrypt.hash("Student@12345", 12);
  await prisma.user.upsert({
    where: { email: "student@majalis.local" },
    update: {},
    create: {
      name: "طالب تجريبي",
      email: "student@majalis.local",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
    },
  });
  console.log(`✔ حساب طالب تجريبي: student@majalis.local / Student@12345`);

  // 3) تصنيف ومؤلف
  const category = await prisma.category.upsert({
    where: { slug: "aqeedah-tarbiyah" },
    update: {},
    create: { name: "العقيدة والتربية", slug: "aqeedah-tarbiyah", order: 1 },
  });

  const author = await prisma.author.create({
    data: { name: "الشيخ عبد الله المُدرِّس", bio: "مدرّس ومؤلف في العلوم الشرعية" },
  });

  // 4) الكتاب + الباب
  const book = await prisma.book.create({
    data: {
      title: "فضل العلم وآداب طلبه",
      slug: "fadl-al-ilm",
      cover: "📗",
      description: "كتاب مختصر يؤسس لطالب العلم فهماً صحيحاً لمكانة العلم الشرعي وآدابه ومراتبه.",
      goals: ["فهم مكانة العلم الشرعي وفضله", "معرفة الترتيب الصحيح في طلب العلم", "التعرف على أبرز آفات الطريق"],
      level: "مبتدئ",
      estimatedDuration: "8 أسابيع",
      status: "PUBLISHED",
      publishedAt: new Date(),
      categoryId: category.id,
      authorId: author.id,
      teacherId: author.id,
      sections: { create: { title: "الباب الأول: أسس طلب العلم", order: 1 } },
    },
    include: { sections: true },
  });

  const sectionId = book.sections[0].id;

  // 5) المجلس الأول
  const s1 = await prisma.session.create({
    data: {
      bookSectionId: sectionId,
      title: "المجلس الأول: تعريف العلم وفضله",
      slug: "session-1",
      orderInBook: 1,
      date: "1447-01-05",
      duration: "35 دقيقة",
      status: "PUBLISHED",
      textContent:
        "يبدأ هذا المجلس بتعريف العلم الشرعي وبيان مكانته، ثم يذكر جملة من الأدلة على فضل طلب العلم وأثره في حياة المسلم، ويختم بالحديث عن آداب طالب العلم الأولى: الإخلاص، والصبر، والتدرج.",
      summary: {
        create: {
          keyIdeas: ["العلم النافع هو الطريق إلى معرفة الله وعبادته على بصيرة", "طلب العلم عبادة قبل أن يكون مهارة"],
          terms: ["العلم الشرعي: المعرفة المبنية على الوحي وفهم السلف", "البصيرة: الفهم الواضح المبني على دليل"],
          evidences: ["﴿ قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ ﴾"],
          benefits: ["العلم يورث الخشية والعمل، لا الفخر بالمعلومة"],
          reviewPoints: ["الفرق بين العلم النافع والعلم الذي لا يورث عملاً"],
        },
      },
      mindMap: {
        create: {
          nodesJson: {
            outline:
              "العلم وفضله\n  تعريف العلم\n    العلم الشرعي\n    مصادره: القرآن والسنة\n  فضل طلب العلم\n    آيات في الفضل\n    آثاره على القلب والعمل\n  آداب الطالب\n    الإخلاص\n    الصبر\n    التدرج في الطلب",
          },
        },
      },
      flashcards: {
        create: [
          { front: "ما تعريف العلم الشرعي؟", back: "المعرفة المبنية على الوحي وفهم السلف الصالح." },
          { front: "ما أول أدب من آداب طالب العلم؟", back: "الإخلاص لله تعالى في الطلب." },
        ],
      },
      quizQuestions: {
        create: [
          {
            type: "MCQ",
            question: "أي مما يلي أول آداب طالب العلم؟",
            options: ["الحفظ السريع", "الإخلاص", "كثرة القراءة", "المناظرة"],
            correctAnswer: 1,
            explanation: "يبدأ العلماء دائماً بالإخلاص لأنه أساس قبول العمل عند الله.",
          },
          {
            type: "TRUE_FALSE",
            question: "العلم النافع هو الذي يزيد صاحبه فخراً بمعلوماته.",
            options: ["صح", "خطأ"],
            correctAnswer: 1,
            explanation: "العلم النافع يورث الخشية والعمل، لا الفخر والتعالي.",
          },
        ],
      },
      lifeApplications: {
        create: [
          { title: "نية التعلم", description: "جدد نيتك قبل بدء أي مجلس علمي بأنك تطلب العلم لوجه الله." },
          { title: "خطوة عملية صغيرة", description: "اختر فائدة واحدة من هذا المجلس وطبّقها اليوم قبل انتهاء اليوم." },
        ],
      },
    },
  });

  // 6) المجلس الثاني
  const s2 = await prisma.session.create({
    data: {
      bookSectionId: sectionId,
      title: "المجلس الثاني: مراتب طلب العلم",
      slug: "session-2",
      orderInBook: 2,
      date: "1447-01-12",
      duration: "40 دقيقة",
      status: "PUBLISHED",
      textContent:
        "يتناول هذا المجلس المراتب التي ينبغي أن يسلكها طالب العلم: البدء بالأصول قبل الفروع، وحفظ المتون قبل الشروح، والتدرج مع شيخ متقن قبل الاستقلال بالقراءة.",
      summary: {
        create: {
          keyIdeas: ["الترتيب في الطلب أهم من كثرة القراءة العشوائية"],
          terms: ["المتن: النص الأصلي المختصر الذي يُحفظ", "الشرح: بيان معاني المتن وتفصيله"],
          evidences: [],
          benefits: ["التدرج يحفظ طالب العلم من التشتت والانقطاع"],
          reviewPoints: ["ترتيب: متن ثم شرح ثم مطولات"],
        },
      },
      mindMap: {
        create: {
          nodesJson: {
            outline:
              "مراتب الطلب\n  الأصول قبل الفروع\n  حفظ المتون\n    فائدة الحفظ\n    كيفية الحفظ المتدرج\n  المدارسة مع شيخ\n    فائدة الصحبة العلمية",
          },
        },
      },
      flashcards: { create: [{ front: "ما هو المتن؟", back: "النص الأصلي المختصر الذي يحفظه طالب العلم أولاً." }] },
      quizQuestions: {
        create: [
          {
            type: "MCQ",
            question: "ما الترتيب الصحيح في طلب العلم؟",
            options: ["الشرح ثم المتن", "المتن ثم الشرح ثم المطولات", "المطولات مباشرة", "لا ترتيب مطلوب"],
            correctAnswer: 1,
            explanation: "يبدأ طالب العلم بحفظ المتن المختصر، ثم ينتقل لفهمه عبر الشرح، ثم يوسّع اطلاعه بالمطولات.",
          },
        ],
      },
      lifeApplications: { create: [{ title: "رتّب قراءتك", description: "اختر كتاباً واحداً هذا الأسبوع وابدأ بأصوله قبل تفرعاته." }] },
    },
  });

  // 7) المجلس الثالث
  const s3 = await prisma.session.create({
    data: {
      bookSectionId: sectionId,
      title: "المجلس الثالث: آفات طريق العلم",
      slug: "session-3",
      orderInBook: 3,
      date: "1447-01-19",
      duration: "38 دقيقة",
      status: "PUBLISHED",
      textContent:
        "يحذر هذا المجلس من آفات تصيب طالب العلم فتقطعه عن الاستمرار أو تفسد ثمرة علمه، مثل: الغرور بالمعلومة، وترك العمل بالعلم، والانشغال بالجدل عن التأصيل.",
      summary: {
        create: {
          keyIdeas: ["أعظم آفة على طالب العلم هي علمٌ بلا عمل"],
          terms: ["الغرور العلمي: شعور المتعلم بالاستغناء عن المزيد"],
          evidences: [],
          benefits: ["مراجعة النية بين الحين والآخر تقي من هذه الآفات"],
          reviewPoints: ["كيف تفرّق بين النقاش المفيد والجدل العقيم"],
        },
      },
      mindMap: {
        create: {
          nodesJson: {
            outline:
              "آفات الطريق\n  الغرور بالعلم\n  ترك العمل بالعلم\n  الانشغال بالجدل\n    متى يكون النقاش مفيداً\n    متى يتحول لجدل عقيم",
          },
        },
      },
      flashcards: { create: [{ front: "ما أعظم آفة على طالب العلم؟", back: "أن يكون عنده علم بلا عمل به." }] },
      quizQuestions: {
        create: [
          {
            type: "TRUE_FALSE",
            question: "الجدل العلمي مذموم في كل صوره.",
            options: ["صح", "خطأ"],
            correctAnswer: 1,
            explanation: "النقاش المبني على إنصاف وطلب الحق محمود، والمذموم هو الجدل لإثبات الذات.",
          },
        ],
      },
      lifeApplications: { create: [{ title: "محاسبة أسبوعية", description: "اسأل نفسك كل أسبوع: هل عملت بما تعلمته أم اكتفيت بالحفظ؟" }] },
    },
  });

  // 8) روابط بين المجالس
  await prisma.sessionLink.create({
    data: { sessionId: s1.id, linkedSessionId: s2.id, linkType: "PREREQUISITE", label: "أساس لفهم مراتب الطلب" },
  });
  await prisma.sessionLink.create({
    data: { sessionId: s2.id, linkedSessionId: s3.id, linkType: "COMPLEMENTARY", label: "يكمل الحديث عن منهج الطلب" },
  });

  // 9) كتاب الحكم العطائية
  const tazkiyahCat = await prisma.category.upsert({
    where: { slug: "tazkiyah-suluk" },
    update: {},
    create: { name: "التزكية والسلوك", slug: "tazkiyah-suluk", order: 3 },
  });

  const ibnAtaa = await prisma.author.create({
    data: {
      name: "ابن عطاء الله السكندري",
      bio: "الإمام تاج الدين أحمد بن عطاء الله السكندري (ت 709هـ)، إمام السلوك والوعظ والتزكية ومؤلف الحكم الشهيرة.",
    },
  });

  await prisma.book.create({
    data: {
      title: "الحكم العطائية",
      slug: "al-hikam-al-ataiyyah",
      cover: "/covers/al-hikam.png",
      description: "من أنفس ما صُنّف في تزكية القلوب ومقامات السلوك إلى الله تعالى؛ تجمع بين فقه الشريعة ورقائق الحقيقة، وتضبط بوصلة العبد في التوكل والرجاء والخوف والافتقار.",
      goals: [
        "تصحيح الاعتماد على فضل الله تعالى ورحمته دون الركون للعمل",
        "فهم حقيقة التجريد والأسباب ومقتضيات العبودية في كل مقام",
        "تطهير الباطن والسرائر من آفات العجب والرياء وتشتت الهموم",
      ],
      level: "متوسط",
      estimatedDuration: "12 أسبوع",
      status: "PUBLISHED",
      publishedAt: new Date(),
      categoryId: tazkiyahCat.id,
      authorId: ibnAtaa.id,
      teacherId: author.id,
      sections: {
        create: [
          {
            title: "الباب الأول: في الرجاء والاعتماد على فضل الله ومقامات السالكين",
            order: 1,
            sessions: {
              create: {
                title: "المجلس الأول: علامة الاعتماد على العمل وفقه التجريد والأسباب",
                slug: "session-1",
                orderInBook: 1,
                date: "1447-02-10",
                duration: "42 دقيقة",
                status: "PUBLISHED",
                textContent:
                  "يشرح هذا المجلس الحكمة الأولى والثانية من الحكم العطائية: «من علامة الاعتماد على العمل، نقصان الرجاء عند وجود الزلل»، و«إرادتك التجريد مع إقامة الله إياك في الأسباب من الشهوة الخفية، وإرادتك الأسباب مع إقامة الله إياك في التجريد حطٌّ عن الهمة العلية».",
              },
            },
          },
          {
            title: "الباب الثاني: في سوابق الهمم وراحة القلب من هموم التدبير",
            order: 2,
          },
        ],
      },
    },
  });

  console.log("✅ تمت الزراعة بنجاح: تم إضافة الكتب (فضل العلم، فتح القريب، الحكم العطائية)، مع حساب أدمن وطالب تجريبي.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
