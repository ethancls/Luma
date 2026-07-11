import { describe, it, expect } from 'vitest';
import { buildGuacdHandshake } from '../guacd-handshake';

const NUL = '\0';

describe('buildGuacdHandshake', () => {
  it('builds a null-delimited handshake string for guacd', () => {
    const result = buildGuacdHandshake('ssh', '10.0.0.1', 22, 'root', 'secret');

    const expected = `ssh${NUL}10.0.0.1${NUL}22${NUL}root${NUL}secret${NUL}${NUL}${NUL};`;
    expect(result).toBe(expected);
  });

  it('handles special characters in password', () => {
    const result = buildGuacdHandshake('rdp', '192.168.1.5', 3389, 'admin', 'p@ss!');

    expect(result).toContain('admin');
    expect(result).toContain('p@ss!');
    expect(result).toContain('3389');
    expect(result.endsWith(';')).toBe(true);
  });

  it('always ends with the required double-null terminator and semicolon', () => {
    const result = buildGuacdHandshake('vnc', 'host', 5900, 'user', 'pass');

    expect(result.endsWith(`${NUL}${NUL}${NUL};`)).toBe(true);
  });

  it('starts with the protocol', () => {
    const result = buildGuacdHandshake('telnet', 'host', 23, 'user', 'pass');
    expect(result.startsWith(`telnet${NUL}`)).toBe(true);
  });
});
