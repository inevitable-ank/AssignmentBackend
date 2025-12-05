import { extractDeviceInfo } from '../../utils/deviceInfo';

const makeReq = (ua?: string, ip?: string, forwardedFor?: string) =>
  ({
    headers: {
      'user-agent': ua,
      ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
    },
    ip,
  } as any);

describe('extractDeviceInfo', () => {
  it('detects Edge on Windows with forwarded IP', () => {
    const info = extractDeviceInfo(
      makeReq('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/110.0', undefined, '203.0.113.10')
    );
    expect(info.browser).toBe('Edge');
    expect(info.os).toBe('Windows');
    expect(info.ipAddress).toBe('203.0.113.10');
    expect(info.device).toContain('Edge on Windows');
  });

  it('detects Safari on iOS Mobile', () => {
    const info = extractDeviceInfo(
      makeReq('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1 Mobile', '10.0.0.1')
    );
    expect(info.browser).toBe('Safari');
    expect(info.os).toBe('iOS');
    expect(info.device).toContain('(Mobile)');
    expect(info.ipAddress).toBe('10.0.0.1');
  });

  it('falls back to Unknown when user-agent missing', () => {
    const info = extractDeviceInfo(makeReq(undefined, undefined));
    expect(info.browser).toBe('Unknown Browser');
    expect(info.os).toBe('Unknown OS');
    expect(info.device).toBe('Unknown Browser on Unknown OS');
  });
});

