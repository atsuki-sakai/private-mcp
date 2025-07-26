import { query } from "../_generated/server";
import { v } from "convex/values";

export const getRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const { roomId } = args;
    const room = await ctx.db.get(roomId);
    return room;
  },
});

export const getRoomsByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    const rooms = await ctx.db.query("rooms").filter((q) => q.eq(q.field("ownerId"), userId)).collect();
    return rooms;
  },
});