import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByLaunch = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personnel")
      .withIndex("by_launch", (q) => q.eq("launchId", args.launchId))
      .collect();
  },
});
