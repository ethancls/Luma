import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign up - Luma',
  description: 'Sign up for Luma to start documenting your infrastructure.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
