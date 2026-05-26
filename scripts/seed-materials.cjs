/**
 * Seed the downloadable_materials Firestore collection with all available files.
 * Run with: node scripts/seed-materials.js
 */
const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "hasanjaffal"
});

const db = admin.firestore();
const COLLECTION = "downloadable_materials";

const materials = [
  {
    file: "/assets/pdf/Sproochentest Adjective Guide.pdf",
    fileName: "Sproochentest Adjective Guide.pdf",
    title: "Adjective Declension Guide",
    category: "sproochentest",
    downloads: 0
  },
  {
    file: "/assets/pdf/Sproochentest Articles and Prepositions Guide.pdf",
    fileName: "Sproochentest Articles and Prepositions Guide.pdf",
    title: "Articles & Prepositions Guide",
    category: "sproochentest",
    downloads: 0
  },
  {
    file: "/assets/pdf/Sproochentest Picture Description Guide.pdf",
    fileName: "Sproochentest Picture Description Guide.pdf",
    title: "Picture Description Master Sheet",
    category: "sproochentest",
    downloads: 0
  },
  {
    file: "/assets/pdf/ai-dashboard-review-template.pdf",
    fileName: "ai-dashboard-review-template.pdf",
    title: "AI Dashboard Review Template",
    category: "templates",
    downloads: 0
  },
  {
    file: "/assets/pdf/ai-root-cause-analysis-template.pdf",
    fileName: "ai-root-cause-analysis-template.pdf",
    title: "AI Root Cause Analysis Template",
    category: "templates",
    downloads: 0
  },
  {
    file: "/assets/pdf/ai-weekly-business-review-template.pdf",
    fileName: "ai-weekly-business-review-template.pdf",
    title: "AI Weekly Business Review Template",
    category: "templates",
    downloads: 0
  },
  {
    file: "/assets/pdf/future-proof-skills-guide.pdf",
    fileName: "future-proof-skills-guide.pdf",
    title: "Future-Proof Skills Guide",
    category: "tools",
    downloads: 0
  }
];

async function seed() {
  for (const mat of materials) {
    // Use file path as document ID (sanitized)
    const docId = mat.file.replace(/[\/\s]/g, '_').replace(/^_/, '');
    await db.collection(COLLECTION).doc(docId).set(mat, { merge: true });
    console.log("Seeded:", mat.title);
  }
  console.log("Done. " + materials.length + " materials seeded.");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
