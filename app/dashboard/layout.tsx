import type { Metadata } from 'next';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppTopbar } from '@/components/layout/app-topbar';
import { SidebarContextProvider } from '@/components/layout/sidebar-context';
import { auth } from '@/lib/auth';
import { gravatarUrl } from '@/lib/gravatar';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s' },
  description: 'Manage your homelab services with Luma.',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}

  const user = session?.user ?? null;
  const avatarUrl = user?.email ? gravatarUrl(user.email) : undefined;

  return (
    <SidebarContextProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <AppTopbar
          user={user ? { name: user.name, email: user.email, image: avatarUrl } : null}
        />

        <div className="flex flex-1 pt-16">
          <AppSidebar hideOnMobile />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarContextProvider>
  );
}
