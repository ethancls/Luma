import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in - Luma',
  description: 'Sign in to your Luma dashboard.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
