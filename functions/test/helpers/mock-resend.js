/**
 * Mock Resend API for testing.
 * Tracks all email send calls for assertions without making real API requests.
 */

class MockResend {
  constructor() {
    this.emails = {
      send: jest.fn().mockImplementation(async (params) => {
        this._calls.push(params);
        if (this._shouldFail) {
          throw new Error(this._failMessage || "Resend API error");
        }
        return { id: `mock_email_${this._calls.length}` };
      }),
    };
    this._calls = [];
    this._shouldFail = false;
    this._failMessage = null;
  }

  /**
   * Returns all recorded send calls.
   */
  getSentEmails() {
    return this._calls;
  }

  /**
   * Returns the last sent email params, or null if none sent.
   */
  getLastSentEmail() {
    return this._calls.length > 0 ? this._calls[this._calls.length - 1] : null;
  }

  /**
   * Returns the number of emails sent.
   */
  getSendCount() {
    return this._calls.length;
  }

  /**
   * Configure the mock to fail on the next send call(s).
   */
  setFailure(message = "Resend API error") {
    this._shouldFail = true;
    this._failMessage = message;
  }

  /**
   * Configure the mock to succeed on send calls.
   */
  clearFailure() {
    this._shouldFail = false;
    this._failMessage = null;
  }

  /**
   * Reset all recorded calls and state.
   */
  reset() {
    this._calls = [];
    this._shouldFail = false;
    this._failMessage = null;
    this.emails.send.mockClear();
  }
}

/**
 * Creates a fresh MockResend instance.
 */
function createMockResend() {
  return new MockResend();
}

module.exports = { MockResend, createMockResend };
