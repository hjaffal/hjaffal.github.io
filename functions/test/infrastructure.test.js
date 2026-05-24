/**
 * Sanity tests for the test infrastructure: mock helpers and generators.
 */
const fc = require("fast-check");
const { createMockResend } = require("./helpers/mock-resend");
const { createMockFirestore } = require("./helpers/mock-firestore");
const generators = require("./generators");

describe("Test Infrastructure", () => {
  describe("MockResend", () => {
    it("tracks sent emails", async () => {
      const resend = createMockResend();
      await resend.emails.send({ to: "test@example.com", subject: "Hello" });
      expect(resend.getSendCount()).toBe(1);
      expect(resend.getLastSentEmail()).toEqual({ to: "test@example.com", subject: "Hello" });
    });

    it("can simulate failures", async () => {
      const resend = createMockResend();
      resend.setFailure("Rate limited");
      await expect(resend.emails.send({ to: "test@example.com" })).rejects.toThrow("Rate limited");
    });

    it("resets state correctly", async () => {
      const resend = createMockResend();
      await resend.emails.send({ to: "test@example.com" });
      resend.reset();
      expect(resend.getSendCount()).toBe(0);
      expect(resend.getSentEmails()).toEqual([]);
    });
  });

  describe("MockFirestore", () => {
    let db;

    beforeEach(() => {
      db = createMockFirestore();
    });

    it("supports set and get", async () => {
      const docRef = db.collection("subscribers").doc("sub1");
      await docRef.set({ email: "test@example.com", status: "active" });
      const snap = await docRef.get();
      expect(snap.exists).toBe(true);
      expect(snap.data()).toEqual({ email: "test@example.com", status: "active" });
    });

    it("supports update", async () => {
      const docRef = db.collection("subscribers").doc("sub1");
      await docRef.set({ email: "test@example.com", status: "active" });
      await docRef.update({ status: "unsubscribed" });
      const snap = await docRef.get();
      expect(snap.data().status).toBe("unsubscribed");
    });

    it("supports delete", async () => {
      const docRef = db.collection("subscribers").doc("sub1");
      await docRef.set({ email: "test@example.com" });
      await docRef.delete();
      const snap = await docRef.get();
      expect(snap.exists).toBe(false);
    });

    it("supports where queries", async () => {
      db.seedDoc("subscribers", "s1", { email: "a@test.com", status: "active" });
      db.seedDoc("subscribers", "s2", { email: "b@test.com", status: "unsubscribed" });
      db.seedDoc("subscribers", "s3", { email: "c@test.com", status: "active" });

      const snap = await db.collection("subscribers").where("status", "==", "active").get();
      expect(snap.size).toBe(2);
    });

    it("supports array-contains queries", async () => {
      db.seedDoc("subscribers", "s1", { email: "a@test.com", segments: ["main_website", "sproochentest_prep"] });
      db.seedDoc("subscribers", "s2", { email: "b@test.com", segments: ["main_website"] });
      db.seedDoc("subscribers", "s3", { email: "c@test.com", segments: ["sproochentest_prep"] });

      const snap = await db.collection("subscribers").where("segments", "array-contains", "sproochentest_prep").get();
      expect(snap.size).toBe(2);
    });

    it("supports add with auto-generated ID", async () => {
      const docRef = await db.collection("subscribers").add({ email: "new@test.com" });
      expect(docRef.id).toBeDefined();
      expect(docRef.id.length).toBe(20);
      const snap = await docRef.get();
      expect(snap.data().email).toBe("new@test.com");
    });

    it("supports seedDoc and getDoc helpers", () => {
      db.seedDoc("events", "ev1", { type: "open", subscriberId: "s1" });
      expect(db.getDoc("events", "ev1")).toEqual({ type: "open", subscriberId: "s1" });
      expect(db.getDoc("events", "nonexistent")).toBeNull();
    });
  });

  describe("Generators", () => {
    it("generates valid emails that pass validation", () => {
      fc.assert(
        fc.property(generators.email.validEmail, (email) => {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }),
        { numRuns: 100 }
      );
    });

    it("generates invalid emails that fail validation", () => {
      fc.assert(
        fc.property(generators.email.invalidEmail, (email) => {
          return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }),
        { numRuns: 100 }
      );
    });

    it("generates valid subscriber documents", () => {
      fc.assert(
        fc.property(generators.subscriber.subscriberDoc, (doc) => {
          return (
            typeof doc.email === "string" &&
            ["active", "unsubscribed", "bounced", "complained"].includes(doc.status) &&
            Array.isArray(doc.segments) &&
            typeof doc.unsubscribeTokenHash === "string" &&
            doc.unsubscribeTokenHash.length === 64
          );
        }),
        { numRuns: 100 }
      );
    });

    it("generates valid post metadata", () => {
      fc.assert(
        fc.property(generators.post.postMetadata, (post) => {
          return (
            typeof post.filename === "string" &&
            post.filename.endsWith(".md") &&
            typeof post.title === "string" &&
            typeof post.url === "string" &&
            post.url.startsWith("https://hasanjaffal.com/")
          );
        }),
        { numRuns: 100 }
      );
    });

    it("generates valid webhook payloads", () => {
      fc.assert(
        fc.property(generators.webhook.anyWebhookPayload, (payload) => {
          return (
            typeof payload.type === "string" &&
            ["email.bounced", "email.complained", "email.delivery_delayed"].includes(payload.type) &&
            payload.data !== null &&
            Array.isArray(payload.data.to)
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
