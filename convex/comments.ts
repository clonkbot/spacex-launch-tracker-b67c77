import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByLaunch = query({
  args: { launchId: v.id("launches") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_launch", (q) => q.eq("launchId", args.launchId))
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          userName: user?.email?.split("@")[0] || "Anonymous",
        };
      })
    );

    return commentsWithUsers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const add = mutation({
  args: {
    launchId: v.id("launches"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("comments", {
      launchId: args.launchId,
      userId,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.id);
    if (!comment || comment.userId !== userId) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
  },
});
