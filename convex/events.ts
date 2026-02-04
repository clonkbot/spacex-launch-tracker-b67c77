import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByLaunch = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_launch", (q) => q.eq("launchId", args.launchId))
      .collect();
    return events.sort((a, b) => b.timestamp - a.timestamp);
  },
});

export const addEvent = mutation({
  args: {
    launchId: v.id("launches"),
    title: v.string(),
    description: v.string(),
    eventType: v.union(v.literal("milestone"), v.literal("update"), v.literal("alert"), v.literal("success"), v.literal("anomaly")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("events", {
      launchId: args.launchId,
      timestamp: Date.now(),
      title: args.title,
      description: args.description,
      eventType: args.eventType,
      isLive: true,
    });
  },
});
