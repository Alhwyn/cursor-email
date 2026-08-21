import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { emailStatusValidator } from "./validators";

export type EmailStatus = "none" | "sent" | "opened" | "read";

const STATUS_RANK: Record<EmailStatus, number> = {
  none: 0,
  sent: 1,
  opened: 2,
  read: 3,
};

export function canAdvance(
  current: EmailStatus,
  next: EmailStatus,
): boolean {
  return STATUS_RANK[next] > STATUS_RANK[current];
}

const guestInput = v.object({
  email: v.string(),
  name: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  ticketName: v.string(),
  city: v.string(),
  company: v.string(),
  building: v.string(),
  linkedin: v.optional(v.string()),
  twitter: v.optional(v.string()),
  github: v.optional(v.string()),
  passportUrl: v.optional(v.string()),
  passportId: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  photoStorageId: v.optional(v.id("_storage")),
  lumaGuestId: v.optional(v.string()),
  emailStatus: v.optional(emailStatusValidator),
  sentAt: v.optional(v.number()),
  openedAt: v.optional(v.number()),
  readAt: v.optional(v.number()),
});

const guestPublic = v.object({
  _id: v.id("guests"),
  _creationTime: v.number(),
  email: v.string(),
  name: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  ticketName: v.string(),
  city: v.string(),
  company: v.string(),
  building: v.string(),
  linkedin: v.optional(v.string()),
  twitter: v.optional(v.string()),
  github: v.optional(v.string()),
  passportUrl: v.optional(v.string()),
  passportId: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  photoStorageId: v.optional(v.id("_storage")),
  resolvedPhotoUrl: v.union(v.string(), v.null()),
  lumaGuestId: v.optional(v.string()),
  emailStatus: emailStatusValidator,
  sentAt: v.optional(v.number()),
  openedAt: v.optional(v.number()),
  readAt: v.optional(v.number()),
});

function toPublicGuest(
  guest: Doc<"guests">,
  resolvedPhotoUrl: string | null,
) {
  return {
    _id: guest._id,
    _creationTime: guest._creationTime,
    email: guest.email,
    name: guest.name,
    firstName: guest.firstName,
    lastName: guest.lastName,
    ticketName: guest.ticketName,
    city: guest.city,
    company: guest.company,
    building: guest.building,
    linkedin: guest.linkedin,
    twitter: guest.twitter,
    github: guest.github,
    passportUrl: guest.passportUrl,
    passportId: guest.passportId,
    photoUrl: guest.photoUrl,
    photoStorageId: guest.photoStorageId,
    resolvedPhotoUrl,
    lumaGuestId: guest.lumaGuestId,
    emailStatus: guest.emailStatus ?? "none",
    sentAt: guest.sentAt,
    openedAt: guest.openedAt,
    readAt: guest.readAt,
  };
}

async function resolvePhotoUrl(
  ctx: QueryCtx,
  photoUrl: string | undefined,
  photoStorageId: Id<"_storage"> | undefined,
): Promise<string | null> {
  if (photoUrl) return photoUrl;
  if (photoStorageId) {
    return await ctx.storage.getUrl(photoStorageId);
  }
  return null;
}

function newEmailToken(): string {
  return (
    crypto.randomUUID().replaceAll("-", "") +
    crypto.randomUUID().replaceAll("-", "")
  );
}

/**
 * Public guest directory listing. Auth not required for the event directory.
 * emailToken is intentionally omitted.
 */
export const listGuests = query({
  args: {},
  returns: v.array(guestPublic),
  handler: async ctx => {
    const guests = await ctx.db.query("guests").collect();

    const withPhotos = await Promise.all(
      guests.map(async guest => {
        const resolvedPhotoUrl = await resolvePhotoUrl(
          ctx,
          guest.photoUrl,
          guest.photoStorageId,
        );
        return toPublicGuest(guest, resolvedPhotoUrl);
      }),
    );

    withPhotos.sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;
      return b._creationTime - a._creationTime;
    });

    return withPhotos;
  },
});

export const getGuestByEmail = query({
  args: { email: v.string() },
  returns: v.union(guestPublic, v.null()),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const guest = await ctx.db
      .query("guests")
      .withIndex("by_email", q => q.eq("email", email))
      .unique();

    if (!guest) return null;

    const resolvedPhotoUrl = await resolvePhotoUrl(
      ctx,
      guest.photoUrl,
      guest.photoStorageId,
    );
    return toPublicGuest(guest, resolvedPhotoUrl);
  },
});

export const getGuestByPassportId = query({
  args: { passportId: v.string() },
  returns: v.union(guestPublic, v.null()),
  handler: async (ctx, args) => {
    const passportId = args.passportId.trim();
    if (!passportId) return null;

    const guest = await ctx.db
      .query("guests")
      .withIndex("by_passport_id", q => q.eq("passportId", passportId))
      .unique();

    if (!guest) return null;

    const resolvedPhotoUrl = await resolvePhotoUrl(
      ctx,
      guest.photoUrl,
      guest.photoStorageId,
    );
    return toPublicGuest(guest, resolvedPhotoUrl);
  },
});

async function upsertGuestList(
  ctx: MutationCtx,
  guests: Array<{
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    ticketName: string;
    city: string;
    company: string;
    building: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    passportUrl?: string;
    passportId?: string;
    photoUrl?: string;
    photoStorageId?: Id<"_storage">;
    lumaGuestId?: string;
    emailStatus?: EmailStatus;
    sentAt?: number;
    openedAt?: number;
    readAt?: number;
  }>,
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const guest of guests) {
    const email = guest.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Guest email is required");
    }

    const baseFields = {
      email,
      name: guest.name.trim(),
      firstName: guest.firstName.trim(),
      lastName: guest.lastName.trim(),
      ticketName: guest.ticketName.trim(),
      city: guest.city.trim(),
      company: guest.company.trim(),
      building: guest.building.trim(),
      linkedin: guest.linkedin,
      twitter: guest.twitter,
      github: guest.github,
      passportUrl: guest.passportUrl,
      passportId: guest.passportId,
      photoUrl: guest.photoUrl,
      photoStorageId: guest.photoStorageId,
      lumaGuestId: guest.lumaGuestId,
    };

    const existing = await ctx.db
      .query("guests")
      .withIndex("by_email", q => q.eq("email", email))
      .unique();

    if (existing) {
      const patch: Record<string, unknown> = { ...baseFields };
      if (guest.emailStatus !== undefined) {
        patch.emailStatus = guest.emailStatus;
      }
      if (guest.sentAt !== undefined) patch.sentAt = guest.sentAt;
      if (guest.openedAt !== undefined) patch.openedAt = guest.openedAt;
      if (guest.readAt !== undefined) patch.readAt = guest.readAt;
      if (!existing.emailToken) {
        patch.emailToken = newEmailToken();
      }
      await ctx.db.patch(existing._id, patch);
      updated += 1;
    } else {
      await ctx.db.insert("guests", {
        ...baseFields,
        emailStatus: guest.emailStatus ?? "none",
        sentAt: guest.sentAt,
        openedAt: guest.openedAt,
        readAt: guest.readAt,
        emailToken: newEmailToken(),
      });
      inserted += 1;
    }
  }

  return { inserted, updated };
}

function assertAdminSecret(adminSecret: string): void {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    throw new Error(
      "ADMIN_SECRET is not configured on the Convex deployment. Set it with `npx convex env set ADMIN_SECRET …`.",
    );
  }
  if (adminSecret !== expected) {
    throw new Error("Unauthorized");
  }
}

/**
 * Upsert guests by email (CLI seed). Email is the unique key.
 * WARNING: Public so the seed script can call it — use importGuests from the CRM.
 */
export const upsertGuests = mutation({
  args: { guests: v.array(guestInput) },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    return await upsertGuestList(ctx, args.guests);
  },
});

/**
 * Admin-only upsert for CSV upload from /guests.
 * Requires ADMIN_SECRET (same secret as Send).
 */
export const importGuests = mutation({
  args: {
    adminSecret: v.string(),
    guests: v.array(guestInput),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    assertAdminSecret(args.adminSecret);
    return await upsertGuestList(ctx, args.guests);
  },
});

/** Generate a short-lived upload URL for Convex file storage photos. */
export const generatePhotoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async ctx => {
    return await ctx.storage.generateUploadUrl();
  },
});

const sendPayload = v.object({
  guestId: v.id("guests"),
  email: v.string(),
  name: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  passportUrl: v.optional(v.string()),
  emailToken: v.string(),
  emailStatus: emailStatusValidator,
});

/** Ensure a tracking token exists and return fields needed to send mail. */
export const prepareGuestSend = internalMutation({
  args: { guestId: v.id("guests") },
  returns: sendPayload,
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId);
    if (!guest) {
      throw new Error("Guest not found");
    }

    let emailToken = guest.emailToken;
    if (!emailToken) {
      emailToken = newEmailToken();
      await ctx.db.patch(guest._id, { emailToken });
    }

    return {
      guestId: guest._id,
      email: guest.email,
      name: guest.name,
      firstName: guest.firstName,
      lastName: guest.lastName,
      passportUrl: guest.passportUrl,
      emailToken,
      emailStatus: guest.emailStatus ?? "none",
    };
  },
});

export const listUnsentGuestIds = internalQuery({
  args: {},
  returns: v.array(v.id("guests")),
  handler: async ctx => {
    const guests = await ctx.db.query("guests").collect();
    return guests
      .filter(g => (g.emailStatus ?? "none") === "none")
      .map(g => g._id);
  },
});

export const markEmailSent = internalMutation({
  args: { guestId: v.id("guests") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await advanceEmailStatus(ctx, args.guestId, "sent");
    return null;
  },
});

export const markOpenedByToken = internalMutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guest = await findByToken(ctx, args.token);
    if (!guest) return null;
    await advanceEmailStatus(ctx, guest._id, "opened");
    return null;
  },
});

export const markReadByToken = internalMutation({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      passportUrl: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const guest = await findByToken(ctx, args.token);
    if (!guest) return null;
    await advanceEmailStatus(ctx, guest._id, "read");
    return { passportUrl: guest.passportUrl };
  },
});

async function findByToken(ctx: MutationCtx, token: string) {
  if (!token) return null;
  return await ctx.db
    .query("guests")
    .withIndex("by_email_token", q => q.eq("emailToken", token))
    .unique();
}

async function advanceEmailStatus(
  ctx: MutationCtx,
  guestId: Id<"guests">,
  next: EmailStatus,
) {
  const guest = await ctx.db.get(guestId);
  if (!guest) return;

  const current = (guest.emailStatus ?? "none") as EmailStatus;
  if (!canAdvance(current, next)) {
    return;
  }

  const now = Date.now();
  const patch: Partial<Doc<"guests">> = { emailStatus: next };

  switch (next) {
    case "sent":
      patch.sentAt = guest.sentAt ?? now;
      break;
    case "opened":
      patch.openedAt = guest.openedAt ?? now;
      if (guest.sentAt === undefined) patch.sentAt = now;
      break;
    case "read":
      patch.readAt = guest.readAt ?? now;
      if (guest.openedAt === undefined) patch.openedAt = now;
      if (guest.sentAt === undefined) patch.sentAt = now;
      break;
    case "none":
      break;
    default: {
      const _exhaustive: never = next;
      void _exhaustive;
      break;
    }
  }

  await ctx.db.patch(guestId, patch);
}
