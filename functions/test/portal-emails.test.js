const { renderNewsletter } = require('../newsletter/template');
const { buildMainWebsiteWelcome, buildSproochentestWelcome } = require('../email/welcome');
const mail = require('../email/portal');
const report = require('../../scripts/fixtures/report-preview.json');

const privateUrl = 'https://hasanjaffal.com/tools/ai-job-risk-report/?token=' + 'a'.repeat(64);
const preferences = 'https://hasanjaffal.com/newsletter/preferences/?token=private-test-token';

describe('Portal email content and destinations', () => {
  test('personal report preserves the real score, task names and private report destination', () => {
    const html = mail.renderJobRiskReport({ ...report, analysis: report.result, reportUrl: privateUrl, email: 'sample@example.com' });
    expect(html).toContain(`href="${privateUrl}"`);
    expect(html).toContain('62');
    expect(html).toContain('Prepare the weekly business review');
    expect(html).toContain('AI workflow evaluation');
    expect(html).toContain('anyone with the link');
  });
  test('a zero assessment score is retained and the PDF URL stays unchanged', () => {
    const html = mail.renderSkillsGuide({ score: 0, band: 'Exposed', strongest: 'judgment', weakest: 'ai literacy' });
    expect(html).toContain('0 / 36');
    expect(html).toContain('href="https://hasanjaffal.com/assets/pdf/future-proof-skills-guide.pdf"');
  });
  test('contact values cannot inject markup and line breaks in the message remain available', () => {
    const html = mail.renderContactNotification({ name: '<img src=x onerror=alert(1)>', email: 'sample@example.com', subject: 'A & B', message: 'First line\nSecond line <script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('First line\nSecond line');
  });
  test('model-generated report content is escaped as text', () => {
    const html = mail.renderJobRiskReport({ analysis: { risk_score: 0, risk_level: 'Low', summary: '<script>bad()</script>', exposed_tasks: ['<b>task</b>'], recommended_skills: ['A & B'] }, reportUrl: privateUrl });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;task&lt;/b&gt;');
    expect(html).toContain('A &amp; B');
  });
  test('welcome keeps personalized opt-out links and sends readers to all four topics', () => {
    const html = buildMainWebsiteWelcome(preferences);
    for (const topic of ['opportunities', 'investment-decisions', 'people-and-adoption', 'outcomes-and-evidence']) expect(html).toContain(`/topics/${topic}/`);
    expect(html).toContain(`href="${preferences}"`);
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('Manage preferences');
    expect(buildSproochentestWelcome(preferences)).toContain(`href="${preferences}"`);
  });
  test('article links and tracking URLs pass through unchanged; images are never guessed', () => {
    const html = renderNewsletter({ subject: 'A decision', posts: [{ title: 'An article', excerpt: 'A useful question.', url: 'https://click.example/?id=42&post=7' }], unsubscribeUrl: preferences, trackingPixelUrl: 'https://pixel.example/?id=9&edition=1' });
    expect(html).toContain('href="https://click.example/?id=42&amp;post=7"');
    expect(html).toContain('src="https://pixel.example/?id=9&amp;edition=1"');
    expect(html).not.toContain('/assets/img/posts/');
  });
  test('download, referral, notification and reminder keep their destinations and escape names', () => {
    expect(mail.renderReportDownload({ firstName: 'Sam <b>' })).toContain('/report/2028-AI-Workforce-Disruption-Report.pdf');
    const invitation = mail.renderToolInvitation({ firstName: 'Sam', sender: '<script>bad()</script>' });
    expect(invitation).not.toContain('<script>');
    expect(invitation).toContain('/ai-job-risk-analyzer/');
    expect(invitation).toContain('does not subscribe you');
    expect(mail.renderTestimonialNotification({ adminUrl: 'https://hasanjaffal.com/newsletter/admin/#testimonials', experience: '<b>experience</b>' })).toContain('&lt;b&gt;experience&lt;/b&gt;');
    expect(mail.renderVocabReminder({ name: 'Sam', xp: 0, wordsLearned: 0 })).toContain('/sproochentest/vocab/');
  });
});
