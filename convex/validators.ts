import { v } from "convex/values";

export const emailStatusValidator = v.union(
  v.literal("none"),
  v.literal("sent"),
  v.literal("opened"),
  v.literal("read"),
);
