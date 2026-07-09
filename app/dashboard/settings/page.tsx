"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toastSuccess, toastError } from '@/lib/toast-utils';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setUser(d.user);
    }).catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toastError('Password too short', 'New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with Better Auth change-password endpoint once available.
      // Better Auth's built-in password change may be at /api/auth/change-password
      // or exposed via auth.api as a server action.
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to change password');
      }

      toastSuccess('Password changed', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError(
        'Failed to change password',
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Account Settings" description="Manage your account and security settings" />

      {/* Profile card */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your profile information</p>
        <Separator className="my-4" />
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user?.image || ''} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.name || 'Account'}</p>
            <p className="text-sm text-muted-foreground">{user?.email || 'Signed in'}</p>
          </div>
        </div>
      </div>

      {/* Password card */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Update your password to keep your account secure</p>
        <Separator className="my-4" />
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Field>
            <FieldLabel>New password</FieldLabel>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </Field>
          <Field>
            <FieldLabel>Confirm new password</FieldLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </Field>
          <Button type="submit" loading={loading}>
            Change password
          </Button>
        </form>
      </div>
    </div>
  );
}
