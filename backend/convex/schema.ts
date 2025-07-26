import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  rooms: defineTable({
    ownerId: v.id("users"),
    userIds: v.array(v.id("users")),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }),
});

