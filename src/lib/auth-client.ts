import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient } from "better-auth/client/plugins";

/**
 * In the browser, always talk to the origin the page was served from, so auth
 * works on any domain (localhost, *.vercel.app previews, custom domains)
 * without depending on a build-time NEXT_PUBLIC_APP_URL.
 */
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient(), magicLinkClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
