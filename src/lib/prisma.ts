import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeBookSlug } from "./book-slugs";
import prodData from "./prod_data.json";

// Global in-memory database store for fallback when external DB is offline or not configured
interface MockStore {
  users: any[];
  categories: any[];
  authors: any[];
  books: any[];
  bookSections: any[];
  sessions: any[];
  sessionSummaries: any[];
  mindMaps: any[];
  flashcards: any[];
  quizQuestions: any[];
  lifeApplications: any[];
  sessionLinks: any[];
  notes: any[];
  reflections: any[];
  questions: any[];
  userSessionProgresses: any[];
  userBookProgresses: any[];
  flashcardReviews: any[];
  quizAttempts: any[];
  userApplicationCommitments: any[];
  auditLogs: any[];
}

function initMockStore(): MockStore {
  const adminHash = bcrypt.hashSync("Admin@12345", 8);
  const studentHash = bcrypt.hashSync("Student@12345", 8);

  const users = [
    {
      id: "usr_admin",
      name: "مدير المنصة",
      email: "admin@majalis.local",
      passwordHash: adminHash,
      role: "ADMIN",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      id: "usr_student",
      name: "طالب تجريبي",
      email: "student@majalis.local",
      passwordHash: studentHash,
      role: "STUDENT",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
  ];

  const categories = prodData.categories || [];
  const authors = prodData.authors || [];
  const books = (prodData.books || []).map((b: any) => ({
    ...b,
    publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
    createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
  }));
  const bookSections = prodData.bookSections || [];
  const sessions = (prodData.sessions || []).map((s: any) => ({
    ...s,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
  }));
  const sessionSummaries = prodData.sessionSummaries || [];
  const mindMaps = prodData.mindMaps || [];
  const flashcards = prodData.flashcards || [];
  const quizQuestions = prodData.quizQuestions || [];
  const lifeApplications = prodData.lifeApplications || [];
  const sessionLinks = (prodData as any).sessionLinks || [];

  return {
    users,
    categories,
    authors,
    books,
    bookSections,
    sessions,
    sessionSummaries,
    mindMaps,
    flashcards,
    quizQuestions,
    lifeApplications,
    sessionLinks,
    notes: [],
    reflections: [],
    questions: [],
    userSessionProgresses: [],
    userBookProgresses: [],
    flashcardReviews: [],
    quizAttempts: [],
    userApplicationCommitments: [],
    auditLogs: [],
  };
}

const globalStore = globalThis as unknown as { __majalisStore?: MockStore; prisma?: any };
if (!globalStore.__majalisStore) {
  globalStore.__majalisStore = initMockStore();
}
const store = globalStore.__majalisStore;

// Helper to resolve relationships based on include
function populateRelations(model: string, item: any, include?: any): any {
  if (!item || !include) return item;
  const res = { ...item };

  if (model === "book") {
    if (include.category) res.category = store.categories.find((c) => c.id === item.categoryId) || null;
    if (include.author) res.author = store.authors.find((a) => a.id === item.authorId) || null;
    if (include.teacher) res.teacher = store.authors.find((a) => a.id === item.teacherId) || null;
    if (include.sections) {
      let secs = store.bookSections.filter((s) => s.bookId === item.id);
      if (include.sections.orderBy?.order === "asc") secs.sort((a, b) => a.order - b.order);
      if (include.sections.include) {
        secs = secs.map((s) => populateRelations("bookSection", s, include.sections.include));
      }
      res.sections = secs;
    }
  }

  if (model === "bookSection") {
    if (include.book) res.book = populateRelations("book", store.books.find((b) => b.id === item.bookId) || null, include.book.include);
    if (include.sessions) {
      let sess = store.sessions.filter((s) => s.bookSectionId === item.id);
      if (include.sessions.where?.status) {
        sess = sess.filter((s) => s.status === include.sessions.where.status);
      }
      if (include.sessions.orderBy?.orderInBook === "asc") sess.sort((a, b) => a.orderInBook - b.orderInBook);
      if (include.sessions.include) {
        sess = sess.map((s) => populateRelations("session", s, include.sessions.include));
      }
      res.sessions = sess;
    }
  }

  if (model === "session") {
    if (include.summary) res.summary = store.sessionSummaries.find((s) => s.sessionId === item.id) || null;
    if (include.mindMap) res.mindMap = store.mindMaps.find((m) => m.sessionId === item.id) || null;
    if (include.flashcards) res.flashcards = store.flashcards.filter((f) => f.sessionId === item.id);
    if (include.quizQuestions) {
      const qs = store.quizQuestions.filter((q) => q.sessionId === item.id);
      if (include.quizQuestions.select) {
        res.quizQuestions = qs.map((q) => {
          const ret: any = {};
          for (const key of Object.keys(include.quizQuestions.select)) {
            if (include.quizQuestions.select[key]) ret[key] = q[key];
          }
          return ret;
        });
      } else {
        res.quizQuestions = qs;
      }
    }
    if (include.lifeApplications) res.lifeApplications = store.lifeApplications.filter((l) => l.sessionId === item.id);
    if (include.linksFrom) {
      const links = store.sessionLinks.filter((l) => l.sessionId === item.id);
      res.linksFrom = links.map((l) => {
        const linkedSession = store.sessions.find((s) => s.id === l.linkedSessionId);
        return {
          ...l,
          linkedSession: linkedSession
            ? { id: linkedSession.id, title: linkedSession.title, slug: linkedSession.slug }
            : null,
        };
      });
    }
    if (include.bookSection) {
      res.bookSection = populateRelations("bookSection", store.bookSections.find((s) => s.id === item.bookSectionId) || null, include.bookSection.include);
    }
  }

  if (model === "userApplicationCommitment") {
    if (include.lifeApplication) {
      const la = store.lifeApplications.find((l) => l.id === item.lifeApplicationId);
      res.lifeApplication = la ? populateRelations("lifeApplication", la, include.lifeApplication.include) : null;
    }
  }

  if (model === "lifeApplication") {
    if (include.session) {
      const s = store.sessions.find((sess) => sess.id === item.sessionId);
      res.session = s ? populateRelations("session", s, include.session.include) : null;
    }
  }

  return res;
}

function matchWhere(model: string, item: any, where?: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const val = where[key];
    if (val === undefined) continue;

    if (key === "session") {
      const sess = store.sessions.find((s) => s.id === item.sessionId);
      if (!sess) return false;
      if (val.bookSection?.bookId) {
        const sec = store.bookSections.find((s) => s.id === sess.bookSectionId);
        if (sec?.bookId !== val.bookSection.bookId) return false;
      }
      continue;
    }

    if (key === "bookSection") {
      const sec = store.bookSections.find((s) => s.id === item.bookSectionId);
      if (!sec) return false;
      if (val.bookId && sec.bookId !== val.bookId) return false;
      continue;
    }

    if (key === "nextReviewAt" && val?.lte) {
      const d = item.nextReviewAt ? new Date(item.nextReviewAt) : null;
      if (!d || d.getTime() > new Date(val.lte).getTime()) return false;
      continue;
    }

    if (typeof val === "object" && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
      if (val.in && Array.isArray(val.in)) {
        if (!val.in.includes(item[key])) return false;
        continue;
      }
    }

    if (model === "book" && key === "slug") {
      const q = normalizeBookSlug(String(val));
      const target = normalizeBookSlug(String(item.slug));
      if (item.slug === val || item.slug === q || target === q) {
        continue;
      }
      return false;
    }

    if (item[key] !== val) return false;
  }
  return true;
}

function getTable(model: string): any[] {
  switch (model) {
    case "user": return store.users;
    case "category": return store.categories;
    case "author": return store.authors;
    case "book": return store.books;
    case "bookSection": return store.bookSections;
    case "session": return store.sessions;
    case "sessionSummary": return store.sessionSummaries;
    case "mindMap": return store.mindMaps;
    case "flashcard": return store.flashcards;
    case "quizQuestion": return store.quizQuestions;
    case "lifeApplication": return store.lifeApplications;
    case "sessionLink": return store.sessionLinks;
    case "note": return store.notes;
    case "reflection": return store.reflections;
    case "question": return store.questions;
    case "userSessionProgress": return store.userSessionProgresses;
    case "userBookProgress": return store.userBookProgresses;
    case "flashcardReview": return store.flashcardReviews;
    case "quizAttempt": return store.quizAttempts;
    case "userApplicationCommitment": return store.userApplicationCommitments;
    case "auditLog": return store.auditLogs;
    default: return [];
  }
}

function createMockHandler(model: string) {
  return {
    async findMany(args?: any) {
      const table = getTable(model);
      let results = table.filter((item) => matchWhere(model, item, args?.where));
      if (args?.orderBy) {
        const orderArr = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
        for (const order of orderArr) {
          const field = Object.keys(order)[0];
          const dir = order[field];
          results.sort((a, b) => {
            if (a[field] < b[field]) return dir === "desc" ? 1 : -1;
            if (a[field] > b[field]) return dir === "desc" ? -1 : 1;
            return 0;
          });
        }
      }
      if (typeof args?.take === "number") {
        results = results.slice(0, args.take);
      }
      return results.map((r) => populateRelations(model, r, args?.include));
    },

    async findFirst(args?: any) {
      const table = getTable(model);
      const item = table.find((it) => matchWhere(model, it, args?.where));
      return item ? populateRelations(model, item, args?.include) : null;
    },

    async findUnique(args?: any) {
      const table = getTable(model);
      const item = table.find((it) => matchWhere(model, it, args?.where));
      return item ? populateRelations(model, item, args?.include) : null;
    },

    async count(args?: any) {
      const table = getTable(model);
      return table.filter((it) => matchWhere(model, it, args?.where)).length;
    },

    async create(args?: any) {
      const table = getTable(model);
      const data = { ...args?.data };
      const id = data.id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      data.id = id;
      data.createdAt = data.createdAt || new Date();

      // Handle nested creates
      if (model === "book") {
        if (data.sections?.create) {
          const secItems = Array.isArray(data.sections.create) ? data.sections.create : [data.sections.create];
          delete data.sections;
          for (const s of secItems) {
            store.bookSections.push({
              id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              ...s,
              bookId: id,
            });
          }
        }
      }

      if (model === "session") {
        if (data.summary?.create) {
          store.sessionSummaries.push({ id: `sum_${id}`, ...data.summary.create, sessionId: id });
          delete data.summary;
        }
        if (data.mindMap?.create) {
          store.mindMaps.push({ id: `mm_${id}`, ...data.mindMap.create, sessionId: id });
          delete data.mindMap;
        }
        if (data.flashcards?.create) {
          for (const f of data.flashcards.create) {
            store.flashcards.push({ id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...f, sessionId: id });
          }
          delete data.flashcards;
        }
        if (data.quizQuestions?.create) {
          for (const q of data.quizQuestions.create) {
            store.quizQuestions.push({ id: `qq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...q, sessionId: id });
          }
          delete data.quizQuestions;
        }
        if (data.lifeApplications?.create) {
          for (const l of data.lifeApplications.create) {
            store.lifeApplications.push({ id: `la_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...l, sessionId: id });
          }
          delete data.lifeApplications;
        }
      }

      table.push(data);
      return populateRelations(model, data, args?.include);
    },

    async update(args?: any) {
      const table = getTable(model);
      const idx = table.findIndex((it) => matchWhere(model, it, args?.where));
      if (idx === -1) return null;
      table[idx] = { ...table[idx], ...args?.data, updatedAt: new Date() };
      return populateRelations(model, table[idx], args?.include);
    },

    async upsert(args?: any) {
      const table = getTable(model);
      const idx = table.findIndex((it) => matchWhere(model, it, args?.where));
      if (idx !== -1) {
        table[idx] = { ...table[idx], ...(args?.update ?? {}), updatedAt: new Date() };
        return populateRelations(model, table[idx], args?.include);
      } else {
        const id = args?.create?.id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newItem = { id, ...args?.create, createdAt: new Date() };
        table.push(newItem);
        return populateRelations(model, newItem, args?.include);
      }
    },

    async delete(args?: any) {
      const table = getTable(model);
      const idx = table.findIndex((it) => matchWhere(model, it, args?.where));
      if (idx === -1) return null;
      const [removed] = table.splice(idx, 1);
      return removed;
    },
  };
}

let realPrismaInstance: PrismaClient | null = null;
let realPrismaFailed = false;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  try {
    realPrismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    realPrismaFailed = true;
  }
} else {
  realPrismaFailed = true;
}

export const prisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop: string) {
    if (prop === "$disconnect") return async () => {};
    if (prop === "$connect") return async () => {};
    if (prop === "$transaction") {
      return async (arg: any) => {
        if (realPrismaInstance && !realPrismaFailed) {
          try {
            return await (realPrismaInstance as any).$transaction(arg);
          } catch (err: any) {
            const msg = err?.message || "";
            if (
              msg.includes("Can't reach database server") ||
              msg.includes("P1001") ||
              msg.includes("P1017") ||
              msg.includes("Environment variable not found: DATABASE_URL")
            ) {
              if (!realPrismaFailed) {
                console.warn("[AI Studio] Database offline or unreachable — falling back to mock store");
                realPrismaFailed = true;
              }
            } else {
              throw err;
            }
          }
        }
        if (typeof arg === "function") {
          return await arg(prisma);
        }
        if (Array.isArray(arg)) {
          return await Promise.all(arg);
        }
        return null;
      };
    }

    const mockModel = createMockHandler(prop);

    return new Proxy(mockModel, {
      get(targetModel, action: string) {
        return async (...methodArgs: any[]) => {
          if (realPrismaInstance && !realPrismaFailed) {
            try {
              const modelObj = (realPrismaInstance as any)[prop];
              if (modelObj && typeof modelObj[action] === "function") {
                return await modelObj[action](...methodArgs);
              }
            } catch (err: any) {
              const msg = err?.message || "";
              if (
                msg.includes("Can't reach database server") ||
                msg.includes("P1001") ||
                msg.includes("P1017") ||
                msg.includes("Environment variable not found: DATABASE_URL")
              ) {
                if (!realPrismaFailed) {
                  console.warn("[AI Studio] Database offline or unreachable — falling back to mock store");
                  realPrismaFailed = true;
                }
              } else {
                throw err;
              }
            }
          }

          const mockFn = (targetModel as any)[action];
          if (typeof mockFn === "function") {
            return await mockFn(...methodArgs);
          }
          return null;
        };
      },
    });
  },
});
