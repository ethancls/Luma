"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { toastError } from '@/lib/toast-utils';
import { Eye, EyeSlash } from '@phosphor-icons/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, callbackURL: '/dashboard' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid credentials');
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toastError('Sign in failed', err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your Luma dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@luma.sh"
            required
            autoComplete="email"
          />
        </Field>

        <Field>
          <FieldLabel>Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <InputGroupAddon align="inline-end">
              <Button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                size="icon-xs"
                variant="ghost"
              >
                {showPassword ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      {process.env.NEXT_PUBLIC_ENABLE_REGISTRATION === 'true' && (
        <>
          <Separator />
          <p className="text-center text-sm text-muted-foreground">
            New to Luma?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
