import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, genericOAuth } from "better-auth/plugins";
import { line } from "better-auth/plugins/generic-oauth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/email";

const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasLine = !!(process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-insecure-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Whole Cuts password",
        html: `<p>Click to reset your password: <a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
    },
  },
  socialProviders: hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  user: {
    additionalFields: {
      locale: { type: "string", defaultValue: "en", input: true },
      pointsBalance: { type: "number", defaultValue: 0, input: false },
      phone: { type: "string", required: false, input: true },
    },
  },
  plugins: [
    admin({
      defaultRole: "customer",
      // Only "admin" gets the plugin's own ban/impersonate/setRole powers.
      // "staff" is a plain custom role value checked in our own /admin
      // layout for a restricted subset of pages — see src/app/[locale]/admin/layout.tsx.
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Your Whole Cuts sign-in link",
          html: `<p>Click to sign in: <a href="${url}">${url}</a></p><p>This link expires in 5 minutes.</p>`,
        });
      },
    }),
    ...(hasLine
      ? [
          genericOAuth({
            config: [
              line({
                clientId: process.env.LINE_CLIENT_ID!,
                clientSecret: process.env.LINE_CLIENT_SECRET!,
              }),
            ],
          }),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
});

export type Session = typeof auth.$Infer.Session;
