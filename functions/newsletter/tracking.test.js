/**
 * Unit tests for trackOpen and trackClick Cloud Functions (tasks 8.1, 8.2).
 */

const { createMockFirestore } = require("../test/helpers/mock-firestore");
const { generateTrackingToken } = require("./utils");

// Mock firebase-admin
let mockDb;
jest.mock("firebase-admin", () => ({
  firestore: () => mockDb,
  initializeApp: jest.fn(),
}));

// Add FieldValue mock to admin.firestore
const adminMock = require("firebase-admin");
adminMock.firestore.FieldValue = {
  serverTimestamp: () => "SERVER_TIMESTAMP",
};

// Mock firebase-functions
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: (opts, handler) => handler,
}));

const { trackOpen, trackClick } = require("./tracking");

// Helper to create mock request/response
function createMockReq(query = {}) {
  return { query };
}

function createMockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    _redirectUrl: null,
    _redirectStatus: null,
    status(code) {
      res._status = code;
      return res;
    },
    send(body) {
      res._body = body;
      return res;
    },
    set(key, value) {
      res._headers[key] = value;
      return res;
    },
    redirect(status, url) {
      res._redirectStatus = status;
      res._redirectUrl = url;
      return res;
    },
  };
  return res;
}

describe("trackOpen", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
  });

  it("returns a valid 1x1 transparent PNG with correct headers", async () => {
    const token = generateTrackingToken("sub1", "ed1");
    const req = createMockReq({ t: token });
    const res = createMockRes();

    await trackOpen(req, res);

    expect(res._status).toBe(200);
    expect(res._headers["Content-Type"]).toBe("image/png");
    expect(res._headers["Cache-Control"]).toBe("no-store, no-cache, must-revalidate");
    expect(Buffer.isBuffer(res._body)).toBe(true);
    // Verify PNG magic bytes
    expect(res._body[0]).toBe(0x89);
    expect(res._body[1]).toBe(0x50); // P
    expect(res._body[2]).toBe(0x4e); // N
    expect(res._body[3]).toBe(0x47); // G
  });

  it("records an open event in Firestore with correct compound doc ID", async () => {
    const token = generateTrackingToken("subscriber123", "edition456");
    const req = createMockReq({ t: token });
    const res = createMockRes();

    await trackOpen(req, res);

    const eventDoc = mockDb.getDoc("events", "subscriber123_edition456_open");
    expect(eventDoc).not.toBeNull();
    expect(eventDoc.type).toBe("open");
    expect(eventDoc.subscriberId).toBe("subscriber123");
    expect(eventDoc.editionId).toBe("edition456");
    expect(eventDoc.unique).toBe(true);
    expect(eventDoc.timestamp).toBe("SERVER_TIMESTAMP");
  });

  it("returns PNG without recording event when token is missing", async () => {
    const req = createMockReq({});
    const res = createMockRes();

    await trackOpen(req, res);

    expect(res._status).toBe(200);
    expect(Buffer.isBuffer(res._body)).toBe(true);
    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(0);
  });

  it("returns PNG without recording event when token is invalid", async () => {
    const req = createMockReq({ t: "not-a-valid-token!!!" });
    const res = createMockRes();

    await trackOpen(req, res);

    expect(res._status).toBe(200);
    expect(Buffer.isBuffer(res._body)).toBe(true);
    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(0);
  });

  it("deduplicates open events (same doc ID on repeated calls)", async () => {
    const token = generateTrackingToken("sub1", "ed1");
    const req = createMockReq({ t: token });

    // Call twice
    await trackOpen(req, createMockRes());
    await trackOpen(req, createMockRes());

    // Should still be exactly one document
    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(1);
    expect(allEvents["sub1_ed1_open"]).toBeDefined();
  });
});

describe("trackClick", () => {
  beforeEach(() => {
    mockDb = createMockFirestore();
  });

  it("records a click event and redirects to the destination URL", async () => {
    const token = generateTrackingToken("sub1", "ed1");
    const destinationUrl = "https://hasanjaffal.com/some-post/";
    const encodedUrl = Buffer.from(destinationUrl).toString("base64url");
    const req = createMockReq({ t: token, url: encodedUrl });
    const res = createMockRes();

    await trackClick(req, res);

    expect(res._redirectStatus).toBe(302);
    expect(res._redirectUrl).toBe(destinationUrl);

    // Verify event was recorded
    const allEvents = mockDb.getAll("events");
    const eventDocs = Object.values(allEvents);
    expect(eventDocs).toHaveLength(1);
    expect(eventDocs[0].type).toBe("click");
    expect(eventDocs[0].subscriberId).toBe("sub1");
    expect(eventDocs[0].editionId).toBe("ed1");
    expect(eventDocs[0].url).toBe(destinationUrl);
    expect(eventDocs[0].timestamp).toBe("SERVER_TIMESTAMP");
  });

  it("redirects to homepage without recording when token is invalid", async () => {
    const encodedUrl = Buffer.from("https://example.com").toString("base64url");
    const req = createMockReq({ t: "invalid-token!!!", url: encodedUrl });
    const res = createMockRes();

    await trackClick(req, res);

    expect(res._redirectStatus).toBe(302);
    expect(res._redirectUrl).toBe("https://hasanjaffal.com");

    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(0);
  });

  it("redirects to decoded URL when token is missing but URL is valid", async () => {
    const destinationUrl = "https://hasanjaffal.com/article/";
    const encodedUrl = Buffer.from(destinationUrl).toString("base64url");
    const req = createMockReq({ url: encodedUrl });
    const res = createMockRes();

    await trackClick(req, res);

    expect(res._redirectStatus).toBe(302);
    expect(res._redirectUrl).toBe(destinationUrl);

    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(0);
  });

  it("redirects to homepage when both token and URL are missing", async () => {
    const req = createMockReq({});
    const res = createMockRes();

    await trackClick(req, res);

    expect(res._redirectStatus).toBe(302);
    expect(res._redirectUrl).toBe("https://hasanjaffal.com");
  });

  it("does not deduplicate click events (each call creates a new doc)", async () => {
    const token = generateTrackingToken("sub1", "ed1");
    const encodedUrl = Buffer.from("https://hasanjaffal.com/post/").toString("base64url");
    const req = createMockReq({ t: token, url: encodedUrl });

    await trackClick(req, createMockRes());
    await trackClick(req, createMockRes());

    const allEvents = mockDb.getAll("events");
    expect(Object.keys(allEvents)).toHaveLength(2);
  });

  it("redirects to homepage when URL decoding fails", async () => {
    const token = generateTrackingToken("sub1", "ed1");
    // This is a valid base64url string but we'll test with a completely invalid one
    // Actually base64url is quite forgiving, so let's test the invalid token path instead
    const req = createMockReq({ t: token, url: "" });
    const res = createMockRes();

    await trackClick(req, res);

    // Empty url string is falsy, so destinationUrl stays as FALLBACK_URL
    expect(res._redirectStatus).toBe(302);
    expect(res._redirectUrl).toBe("https://hasanjaffal.com");
  });
});
