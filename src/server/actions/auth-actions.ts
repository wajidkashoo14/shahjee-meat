"use server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/server/cart";

/** Called client-side right after a successful sign-in/sign-up to fold the guest cart into the account. */
export async function completeSignInAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) await mergeGuestCartIntoUser(session.user.id);
  return { ok: true };
}
