"use client";

import { useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { toastError, toastSuccess } from '@/lib/toast-utils';
import { Check, Eye, EyeSlash, X } from '@phosphor-icons/react';
import Link from 'next/link';

const requirements = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
] as const;

export default function RegisterPage() {
  const id = useId();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = requirements.map((req) => ({
    met: req.regex.test(password),
    text: req.text,
  }));

  const strengthScore = useMemo(() => strength.filter((req) => req.met).length, [strength]);

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-border';
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score === 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return 'Enter a password';
    if (score <= 2) return 'Weak password';
    if (score === 3) return 'Medium password';
    return 'Strong password';
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }
      toastSuccess('Account created', 'You can now sign in.');
      router.push('/login');
    } catch (err) {
      toastError('Registration failed', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign up</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Get started with Luma</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </Field>

        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@luma.sh" required autoComplete="email" />
        </Field>

        <Field>
          <FieldLabel>Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={id}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password"
              required
              autoComplete="new-password"
              aria-describedby={`${id}-description`}
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

          {password.length > 0 && (
            <>
              <div
                aria-label="Password strength"
                aria-valuemax={4}
                aria-valuemin={0}
                aria-valuenow={strengthScore}
                className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border"
                role="progressbar"
                tabIndex={-1}
              >
                <div
                  className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
                  style={{ width: `${(strengthScore / 4) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground" id={`${id}-description`}>
                {getStrengthText(strengthScore)}
              </p>
            </>
          )}
        </Field>

        <Field>
          <FieldLabel>Confirm Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
            />
            <InputGroupAddon align="inline-end">
              {passwordsDontMatch && <X aria-hidden="true" className="size-3.5 text-red-400" />}
              {passwordsMatch && <Check aria-hidden="true" className="size-3.5 text-emerald-500" />}
              <Button
                type="button"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm(!showConfirm)}
                size="icon-xs"
                variant="ghost"
              >
                {showConfirm ? <EyeSlash aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign up
        </Button>
      </form>

      <Separator />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
