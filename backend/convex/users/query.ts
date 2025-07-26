import { query } from "../_generated/server";
import { v } from "convex/values";

// 全ユーザーを取得する関数
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

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