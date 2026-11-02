import { test, expect } from '@playwright/test';

test('security headers are sent on public and protected routes', async ({ request }) => {
  for (const path of ['/auth/login', '/']) {
    const response = await request.get(path, { maxRedirects: 0 });
    const headers = response.headers();

    const csp = headers['content-security-policy'];
    expect(csp, `CSP on ${path}`).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");

    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
  }
});
