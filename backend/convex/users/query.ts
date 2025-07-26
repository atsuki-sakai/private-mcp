import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    const user = await ctx.db.get(userId);
    return user;
  },
});