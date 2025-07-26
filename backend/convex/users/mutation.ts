import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const { name, email, passwordHash } = args;
    const userId = await ctx.db.insert("users", {
      name,
      email,
      passwordHash,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return userId;
  },
});

export const deleteUser = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    await ctx.db.delete(id);
  },
});