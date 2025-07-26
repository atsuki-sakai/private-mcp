import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { roomId, userId, content } = args;
    const messageId = await ctx.db.insert("messages", {
      roomId,
      userId,
      content,
      createdAt: Date.now(),
    });
    return messageId;
  },
});
