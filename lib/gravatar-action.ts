"use server";

import { gravatarUrl } from '@/lib/gravatar';

export async function getGravatarUrl(email: string, size?: number): Promise<string> {
  return gravatarUrl(email, size);
}
