import { ThemeSwitch } from '@/components/shared/theme-switch';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      {/* Left — branding + image */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1538947151057-dfe933d688d1?q=100&w=2400&auto=format&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-[#0a0e14]/75" />
        <div className="relative flex w-full flex-col justify-between p-10">
          <Image
            src="/logo-white.svg"
            alt="Luma"
            width={140}
            height={35}
            style={{ width: 140, height: 'auto' }}
            priority
          />
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="font-heading text-3xl font-semibold leading-tight text-white">
                Manage your infrastructure
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
                Discover, document, and monitor every service running on your network automatically.
              </p>
            </div>
            <a
              href="https://github.com/ethancls/luma"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="underline-offset-4 group-hover:underline">See project on GitHub</span>
              <svg className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-zinc-600">
            Photo by{' '}
            <a
              href="https://unsplash.com/@antoine_rault"
              className="underline hover:text-zinc-500"
              target="_blank"
              rel="noreferrer"
            >
              Antoine Rault
            </a>
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="relative flex flex-1 items-center justify-center bg-background px-6">
        <div className="absolute right-4 top-4">
          <ThemeSwitch showShortcut />
        </div>
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
