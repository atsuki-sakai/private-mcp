import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createRoom = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const { ownerId, name, description } = args;
    const roomId = await ctx.db.insert("rooms", {
      ownerId,
      userIds: [ownerId],
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return roomId;
  },
});

export const updateRoomOwner = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { roomId, userId } = args;
    await ctx.db.patch(roomId, {
      ownerId: userId,
      updatedAt: Date.now()
    });
  },
});

export const addUserToRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { roomId, userId } = args;
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    await ctx.db.patch(roomId, {
      userIds: [...room.userIds, userId],
      updatedAt: Date.now()
    });
  },
});

export const removeUserFromRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { roomId, userId } = args;
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    await ctx.db.patch(roomId, {
      userIds: room.userIds.filter((id: string) => id !== userId),
      updatedAt: Date.now()
    });
  },
});

export const deleteRoom = mutation({
  args: {
    ownerId: v.id("users"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const { ownerId, roomId } = args;
    const room = await ctx.db.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.ownerId !== ownerId) {
      throw new Error("You are not the owner of this room");
    }
    await ctx.db.delete(roomId);
  },
}); 