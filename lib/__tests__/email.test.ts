/**
 * Unit tests for lib/email.ts
 *
 * These tests verify the email-generation functions produce the correct
 * structure and content without actually sending any emails.
 * Run with: npm test
 */

// Mock the email-sending SDKs so their module-level constructors don't throw
// when API keys are absent in the test environment.
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'mock-id' }) },
  })),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));
jest.mock('@getbrevo/brevo', () => ({
  TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
    setApiKey: jest.fn(),
    sendTransacEmail: jest.fn().mockResolvedValue({}),
  })),
  TransactionalEmailsApiApiKeys: { apiKey: 'apiKey' },
  SendSmtpEmail: jest.fn().mockImplementation(() => ({})),
}));

import {
  getEventRegistrationEmail,
  getOpenSeatEmail,
} from '../email';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_HOST = {
  user: {
    firstName: 'Tim',
    lastName: 'Hufler',
    email: 'tim@example.com',
    phoneNumber: '3608692538',
  } as any,
  address: '123 Poker Lane',
};

const MOCK_EVENT_DATE = new Date('2025-06-14T01:00:00.000Z'); // Sat 14 Jun 2025 18:00 PT

// ---------------------------------------------------------------------------
// getEventRegistrationEmail
// ---------------------------------------------------------------------------

describe('getEventRegistrationEmail', () => {
  it('returns an EmailData object with the correct shape', () => {
    const result = getEventRegistrationEmail(
      'Alice',
      'alice@example.com',
      'NLHE 10¢/25¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      MOCK_HOST,
      10,
      40,
      '10¢/25¢',
      'Bring snacks',
      'abc123'
    );

    expect(result.to).toBe('alice@example.com');
    expect(result.subject).toContain('Confirmed');
    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
  });

  it('includes the event title in the HTML', () => {
    const result = getEventRegistrationEmail(
      'Alice',
      'alice@example.com',
      'NLHE 10¢/25¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      MOCK_HOST,
      10,
      40,
      '10¢/25¢',
      '',
      'abc123'
    );

    expect(result.html).toContain('NLHE 10¢/25¢');
  });

  it('includes a calendarUrl link in the HTML when eventId is provided', () => {
    const result = getEventRegistrationEmail(
      'Alice',
      'alice@example.com',
      'NLHE 10¢/25¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      MOCK_HOST,
      10,
      40,
      '',
      '',
      'abc123'
    );

    expect(result.html).toContain('/api/events/abc123/ics');
    expect(result.html).toContain('Add to Calendar');
  });

  it('includes calendarUrl in the plain-text fallback', () => {
    const result = getEventRegistrationEmail(
      'Alice',
      'alice@example.com',
      'NLHE 10¢/25¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      MOCK_HOST,
      10,
      40,
      '',
      '',
      'abc123'
    );

    expect(result.text).toContain('/api/events/abc123/ics');
  });

  it('does not throw when eventId is omitted', () => {
    expect(() =>
      getEventRegistrationEmail(
        'Bob',
        'bob@example.com',
        'Mixed Games',
        MOCK_EVENT_DATE,
        'Al\'s Place',
        MOCK_HOST
      )
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getOpenSeatEmail  (the bug fix — duplicate `const baseUrl`)
// ---------------------------------------------------------------------------

describe('getOpenSeatEmail', () => {
  it('does not throw — confirms the duplicate baseUrl bug is fixed', () => {
    expect(() =>
      getOpenSeatEmail(
        'Bob',
        'bob@example.com',
        'NLHE 25¢/50¢',
        MOCK_EVENT_DATE,
        'Tim\'s Place',
        25,
        100,
        'def456',
        1,
        8
      )
    ).not.toThrow();
  });

  it('returns an EmailData object with the correct shape', () => {
    const result = getOpenSeatEmail(
      'Bob',
      'bob@example.com',
      'NLHE 25¢/50¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      25,
      100,
      'def456',
      1,
      8
    );

    expect(result.to).toBe('bob@example.com');
    expect(result.subject).toContain('Seat Available');
    expect(result.html).toBeTruthy();
    expect(result.text).toBeTruthy();
  });

  it('includes the event title in the HTML', () => {
    const result = getOpenSeatEmail(
      'Bob',
      'bob@example.com',
      'NLHE 25¢/50¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      25,
      100,
      'def456',
      1,
      8
    );

    expect(result.html).toContain('NLHE 25¢/50¢');
  });

  it('includes seatsAvailable and maxPlayers in the HTML', () => {
    const result = getOpenSeatEmail(
      'Bob',
      'bob@example.com',
      'NLHE 25¢/50¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      25,
      100,
      'def456',
      2,
      9
    );

    expect(result.html).toContain('2');
    expect(result.html).toContain('9');
  });

  it('renders the correct buy-in range when min !== max', () => {
    const result = getOpenSeatEmail(
      'Carol',
      'carol@example.com',
      'Mixed Games',
      MOCK_EVENT_DATE,
      'Al\'s Place',
      10,
      50,
      'ghi789',
      1,
      8
    );

    expect(result.html).toContain('$10 - $50');
    expect(result.text).toContain('$10 - $50');
  });

  it('renders a single buy-in when min === max', () => {
    const result = getOpenSeatEmail(
      'Carol',
      'carol@example.com',
      'Mixed Games',
      MOCK_EVENT_DATE,
      'Al\'s Place',
      20,
      20,
      'ghi789',
      1,
      8
    );

    expect(result.html).toContain('$20');
    expect(result.text).toContain('$20');
  });

  it('includes a REGISTER NOW link pointing to the event page', () => {
    const result = getOpenSeatEmail(
      'Bob',
      'bob@example.com',
      'NLHE 25¢/50¢',
      MOCK_EVENT_DATE,
      'Tim\'s Place',
      25,
      100,
      'def456',
      1,
      8
    );

    expect(result.html).toContain('/events/def456');
    expect(result.text).toContain('/events/def456');
  });
});
