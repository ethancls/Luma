import crypto from 'node:crypto';

export function gravatarUrl(email: string, size = 80): string {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${size}`;
}
