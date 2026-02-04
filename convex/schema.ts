import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  launches: defineTable({
    name: v.string(),
    missionPatch: v.optional(v.string()),
    rocketName: v.string(),
    rocketType: v.string(),
    launchSite: v.string(),
    launchDate: v.number(),
    status: v.union(v.literal("upcoming"), v.literal("live"), v.literal("completed"), v.literal("scrubbed")),
    description: v.string(),
    payloadType: v.string(),
    payloadMass: v.optional(v.number()),
    orbitType: v.string(),
    livestreamUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_launch_date", ["launchDate"]),

  personnel: defineTable({
    launchId: v.id("launches"),
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isAstronaut: v.boolean(),
  }).index("by_launch", ["launchId"]),

  events: defineTable({
    launchId: v.id("launches"),
    timestamp: v.number(),
    title: v.string(),
    description: v.string(),
    eventType: v.union(v.literal("milestone"), v.literal("update"), v.literal("alert"), v.literal("success"), v.literal("anomaly")),
    isLive: v.boolean(),
  }).index("by_launch", ["launchId"])
    .index("by_timestamp", ["timestamp"]),

  comments: defineTable({
    launchId: v.id("launches"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_launch", ["launchId"])
    .index("by_user", ["userId"]),
});
