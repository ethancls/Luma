"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toastSuccess, toastError } from '@/lib/toast-utils';
import { Separator } from '@/components/ui/separator';
import { getGravatarUrl } from '@/lib/gravatar-action';

interface User {
  name: string;
  email: string;
  image?: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [gravatar, setGravatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/auth/session');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
        setName(data.user.name || '');
        setEmail(data.user.email || '');
        if (data.user.email) {
          getGravatarUrl(data.user.email, 80).then(setGravatar).catch(() => {});
        }
      }
    }
    load();
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || null;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setUser(prev => prev ? { ...prev, name, email } : null);
      toastSuccess('Profile updated', 'Your information has been saved.');
    } catch (err) {
      toastError('Failed', err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError('Password too short', 'Must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match', '');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error('Failed');
      toastSuccess('Password changed', 'Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError('Failed', err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Account" description="Manage your profile and security settings" />

      {/* Profile */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your personal information</p>
        <Separator className="my-4" />

        {!user ? (
          <div className="flex items-center gap-4">
            <div className="size-16 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user.image || gravatar || undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="max-w-md space-y-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Button type="submit" loading={saving} size="sm">Save changes</Button>
            </form>
          </>
        )}
      </div>

      {/* Password */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Change your password</p>
        <Separator className="my-4" />
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          <Field>
            <FieldLabel>New password</FieldLabel>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </Field>
          <Field>
            <FieldLabel>Confirm password</FieldLabel>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </Field>
          <Button type="submit" loading={passwordLoading} size="sm">Change password</Button>
        </form>
      </div>
    </div>
  );
}
