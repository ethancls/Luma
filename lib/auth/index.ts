import { betterAuth } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { users, sessions, accounts } from '@/db/schema';

const plugins = [];

// OIDC / OAuth — configured via environment variables
if (env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET && env.OIDC_ISSUER) {
  plugins.push(
    genericOAuth({
      config: [
        {
          providerId: env.OIDC_NAME || 'oidc',
          clientId: env.OIDC_CLIENT_ID,
          clientSecret: env.OIDC_CLIENT_SECRET,
          issuer: env.OIDC_ISSUER,
          discoveryUrl: `${env.OIDC_ISSUER}/.well-known/openid-configuration`,
          scopes: ['openid', 'email', 'profile'],
        },
      ],
    }),
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { user: users, session: sessions, account: accounts },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins,
});

export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}
