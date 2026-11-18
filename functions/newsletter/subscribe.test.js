/**
 * Unit tests for the welcome email sending functionality (task 2.2).
 * Tests the sendWelcomeEmail helper function in isolation.
 */

const { createMockResend } = require("../test/helpers/mock-resend");

// Mock the resend module before requiring subscribe
let mockResendInstance;
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => {
    return mockResendInstance;
  }),
}));

const { sendWelcomeEmail } = require("./subscribe");

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    mockResendInstance = createMockResend();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("sends email from 'Hasan Jaffal <hasan@hasanjaffal.com>'", async () => {
    await sendWelcomeEmail("test@example.com", "abc123token", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.from).toBe("Hasan Jaffal <hasan@hasanjaffal.com>");
  });

  it("sends to the correct recipient email", async () => {
    await sendWelcomeEmail("subscriber@test.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.to).toBe("subscriber@test.com");
  });

  it("includes 'The Second Mind' branding in the HTML body", async () => {
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.html).toContain("THE SECOND MIND");
  });

  it("introduces the four current writing topics", async () => {
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    for (const topic of ["Opportunities", "Investment decisions", "People &amp; adoption", "Outcomes &amp; evidence"]) {
      expect(sentEmail.html).toContain(topic);
    }
  });

  it("explains the purpose of the writing without promising a publishing schedule", async () => {
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.html).toContain("examine the evidence");
    expect(sentEmail.html).not.toContain("weekly");
  });

  it("includes personalized unsubscribe link with raw token", async () => {
    const rawToken = "a1b2c3d4e5f6";
    await sendWelcomeEmail("test@example.com", rawToken, "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.html).toContain(
      `https://hasanjaffal.com/newsletter/preferences/?token=${rawToken}`
    );
  });

  it("includes List-Unsubscribe header with correct URL", async () => {
    const rawToken = "mytoken123";
    await sendWelcomeEmail("test@example.com", rawToken, "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.headers["List-Unsubscribe"]).toBe(
      `<https://hasanjaffal.com/newsletter/preferences/?token=${rawToken}>`
    );
  });

  it("includes List-Unsubscribe-Post header for RFC 8058 compliance", async () => {
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("sets welcomeEmailFailed flag on subscriber doc when send fails", async () => {
    mockResendInstance.setFailure("Network error");

    const mockRef = { update: jest.fn().mockResolvedValue(undefined) };
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", mockRef);

    expect(mockRef.update).toHaveBeenCalledWith({ welcomeEmailFailed: true });
  });

  it("does not throw when send fails (graceful failure)", async () => {
    mockResendInstance.setFailure("API timeout");

    await expect(
      sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null)
    ).resolves.toBeUndefined();
  });

  it("does not throw when both send and flag update fail", async () => {
    mockResendInstance.setFailure("API error");

    const mockRef = { update: jest.fn().mockRejectedValue(new Error("Firestore error")) };
    await expect(
      sendWelcomeEmail("test@example.com", "token123", "fake-api-key", mockRef)
    ).resolves.toBeUndefined();
  });

  it("has subject 'Welcome to The Second Mind'", async () => {
    await sendWelcomeEmail("test@example.com", "token123", "fake-api-key", null);

    const sentEmail = mockResendInstance.getLastSentEmail();
    expect(sentEmail.subject).toBe("Welcome to The Second Mind");
  });
});
