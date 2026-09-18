"use server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { wishlists, stockAlerts, reviews, questions, inquiries, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uuidv7 } from "@/lib/id";
import { sendEmail } from "@/lib/email";

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function toggleWishlistAction(productId: string) {
  const user = await getSessionUser();
  if (!user) return { requiresAuth: true as const, active: false };

  const existing = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)),
  });
  if (existing) {
    await db.delete(wishlists).where(eq(wishlists.id, existing.id));
    revalidatePath("/account/wishlist");
    return { requiresAuth: false as const, active: false };
  }
  await db.insert(wishlists).values({ id: uuidv7(), userId: user.id, productId });
  revalidatePath("/account/wishlist");
  return { requiresAuth: false as const, active: true };
}

export async function isWishlistedAction(productId: string) {
  const user = await getSessionUser();
  if (!user) return false;
  const existing = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)),
  });
  return !!existing;
}

const stockAlertSchema = z.object({ variantId: z.string(), productId: z.string(), email: z.email() });

export async function subscribeStockAlertAction(input: z.infer<typeof stockAlertSchema>) {
  const parsed = stockAlertSchema.parse(input);
  const user = await getSessionUser();
  await db.insert(stockAlerts).values({
    id: uuidv7(),
    userId: user?.id ?? null,
    email: parsed.email,
    variantId: parsed.variantId,
    productId: parsed.productId,
  });
  return { ok: true };
}

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
  authorName: z.string().min(1).max(80),
});

export async function submitReviewAction(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.parse(input);
  const user = await getSessionUser();
  await db.insert(reviews).values({
    id: uuidv7(),
    productId: parsed.productId,
    userId: user?.id ?? null,
    authorName: parsed.authorName,
    rating: parsed.rating,
    title: parsed.title ?? "",
    body: parsed.body,
    verifiedPurchase: false,
    status: "pending",
  });
  revalidatePath("/products");
  return { ok: true };
}

const questionSchema = z.object({ productId: z.string(), body: z.string().min(5).max(500), authorName: z.string().min(1).max(80) });

export async function submitQuestionAction(input: z.infer<typeof questionSchema>) {
  const parsed = questionSchema.parse(input);
  const user = await getSessionUser();
  await db.insert(questions).values({
    id: uuidv7(),
    productId: parsed.productId,
    userId: user?.id ?? null,
    authorName: parsed.authorName,
    body: parsed.body,
    status: "pending",
  });
  return { ok: true };
}

const inquirySchema = z.object({
  kind: z.enum(["general", "wholesale", "product"]).default("general"),
  productId: z.string().optional(),
  name: z.string().min(1).max(120),
  email: z.email(),
  company: z.string().max(200).optional(),
  message: z.string().min(10).max(4000),
});

export async function submitInquiryAction(input: z.infer<typeof inquirySchema>) {
  const parsed = inquirySchema.parse(input);
  await db.insert(inquiries).values({
    id: uuidv7(),
    kind: parsed.kind,
    productId: parsed.productId,
    name: parsed.name,
    email: parsed.email,
    company: parsed.company ?? "",
    message: parsed.message,
  });

  let productName = "";
  if (parsed.productId) {
    const p = await db.query.products.findFirst({ where: eq(products.id, parsed.productId) });
    productName = p?.nameEn ?? "";
  }

  await sendEmail({
    to: "staff@wholecuts.example",
    subject: `New ${parsed.kind} inquiry from ${parsed.name}`,
    html: `<p><b>From:</b> ${parsed.name} (${parsed.email})</p><p><b>Company:</b> ${parsed.company ?? "—"}</p><p><b>Product:</b> ${productName || "—"}</p><p>${parsed.message}</p>`,
  });

  return { ok: true };
}
