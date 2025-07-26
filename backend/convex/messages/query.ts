import { query } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

export const getMessagesByRoomId = query({
  args: {
    roomId: v.id("rooms"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { roomId, paginationOpts } = args;
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("roomId"), roomId))
      .order("desc")
      .paginate(paginationOpts);
  },
});