const { verifyAdminToken } = require("./auth");

// Mock firebase-admin
jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));

const admin = require("firebase-admin");

describe("verifyAdminToken", () => {
  let mockVerifyIdToken;

  beforeEach(() => {
    mockVerifyIdToken = jest.fn();
    admin.auth.mockReturnValue({ verifyIdToken: mockVerifyIdToken });
  });

  it("returns decoded token for valid Bearer token", async () => {
    const decodedToken = { uid: "user123", email: "admin@example.com" };
    mockVerifyIdToken.mockResolvedValue(decodedToken);

    const req = { headers: { authorization: "Bearer valid-token-123" } };
    const result = await verifyAdminToken(req);

    expect(result).toEqual(decodedToken);
    expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token-123");
  });

  it("throws 401 when Authorization header is missing", async () => {
    const req = { headers: {} };

    await expect(verifyAdminToken(req)).rejects.toMatchObject({
      message: "Missing or malformed Authorization header",
      statusCode: 401
    });
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("throws 401 when Authorization header has no Bearer prefix", async () => {
    const req = { headers: { authorization: "Basic some-token" } };

    await expect(verifyAdminToken(req)).rejects.toMatchObject({
      message: "Missing or malformed Authorization header",
      statusCode: 401
    });
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("throws 401 when headers object is undefined", async () => {
    const req = {};

    await expect(verifyAdminToken(req)).rejects.toMatchObject({
      message: "Missing or malformed Authorization header",
      statusCode: 401
    });
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("throws 401 when token is invalid or expired", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Firebase ID token has expired"));

    const req = { headers: { authorization: "Bearer expired-token" } };

    await expect(verifyAdminToken(req)).rejects.toMatchObject({
      message: "Invalid or expired token",
      statusCode: 401
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith("expired-token");
  });

  it("throws 401 when Bearer prefix is present but token is empty", async () => {
    const req = { headers: { authorization: "Bearer " } };

    await expect(verifyAdminToken(req)).rejects.toMatchObject({
      statusCode: 401
    });
  });
});
