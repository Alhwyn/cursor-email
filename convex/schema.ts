import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { emailStatusValidator } from "./validators";

export default defineSchema({
  guests: defineTable({
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
    /** Delivery funnel: none → sent → opened → read (monotonic). */
    emailStatus: v.optional(emailStatusValidator),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    /** Opaque token for open/click tracking links. Not exposed in public queries. */
    emailToken: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_email_token", ["emailToken"])
    .index("by_email_status", ["emailStatus"])
    .index("by_passport_id", ["passportId"]),
});
