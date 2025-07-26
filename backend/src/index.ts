import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
import bcrypt from 'bcrypt';
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env["CONVEX_URL"] as string);

const app = new Hono()

// CORS設定を改善 - 開発環境ではすべてのオリジンを許可
app.use('*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  maxAge: 86400,
}))

// users
app.get('/users', async (c) => {
  const users = await client.query(api.users.query.getUsers);
  return c.json(users);
})
app.post('/users', async (c) => {
  const body = await c.req.json()
  if (!body.name || !body.email || !body.password) {
    return c.json({ error: 'Invalid body' }, 400);
  }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await client.mutation(api.users.mutation.createUser, {
    name: body.name,
    email: body.email,
    passwordHash: passwordHash
  });
  return c.json(user);
})
app.get('/users/:id', async (c) => {
  const user = await client.query(api.users.query.getUser, {
    id: c.req.param('id')
  });
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json(user);
})
app.delete('/users/:id', async (c) => {
  const id = c.req.param('id')
  if (typeof id !== 'string') {
    return c.json({ error: 'Invalid id' }, 400);
  }
  await client.mutation(api.users.mutation.deleteUser, { id: id });
  return c.json({ message: 'User deleted' });
})

// rooms
app.post('/rooms/:ownerId', async (c) => {
  const ownerId = c.req.param('ownerId')
  if (typeof ownerId !== 'string') {
    return c.json({ error: 'Invalid owner id' }, 400);
  }
  const room = await client.mutation(api.rooms.mutation.createRoom, {
    ownerId: ownerId,
    name: 'test',
    description: 'test'
  });
  return c.json(room);
})
app.get('/rooms/:id', async (c) => {
  const room = await client.query(api.rooms.query.getRoom, {
    id: c.req.param('id')
  });
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }
  return c.json(room);
})

app.post('/rooms/:id/owner/:ownerId', async (c) => {
  const roomId = c.req.param('id')
  const ownerId = c.req.param('ownerId')
  if (typeof roomId !== 'string' || typeof ownerId !== 'string') {
    return c.json({ error: 'Invalid id' }, 400);
  }
  await client.mutation(api.rooms.mutation.updateRoomOwner, {
    roomId: roomId,
    ownerId: ownerId
  });
  return c.json({ message: 'Owner updated' });
})

app.get('/rooms/user/:userId', async (c) => {
  const userId = c.req.param('userId')
  if (typeof userId !== 'string') {
    return c.json({ error: 'Invalid user id' }, 400);
  }
  const rooms = await client.query(api.rooms.query.getRoomsByUserId, {
    userId: userId
  });
  return c.json(rooms);
})
app.post('/rooms/:id/users/:userId', async (c) => {
  const roomId = c.req.param('id')
  const userId = c.req.param('userId')
  if (typeof roomId !== 'string' || typeof userId !== 'string') {
    return c.json({ error: 'Invalid id' }, 400);
  }
  await client.mutation(api.rooms.mutation.addUserToRoom, {
    roomId: roomId,
    userId: userId
  });
  return c.json({ message: 'User added to room' });
})
app.delete('/rooms/:id/owner/:ownerId', async (c) => {
  const roomId = c.req.param('id')
  const ownerId = c.req.param('ownerId')
  if (typeof roomId !== 'string' || typeof ownerId !== 'string') {
    return c.json({ error: 'Invalid id' }, 400);
  }
  await client.mutation(api.rooms.mutation.deleteRoom, {
    ownerId: ownerId,
    roomId: roomId
  });
  return c.json({ message: 'Owner updated' });
})


//messages
app.post('/messages/:roomId/:userId', async (c) => {
  const roomId = c.req.param('roomId')
  const userId = c.req.param('userId')
  if (typeof roomId !== 'string' || typeof userId !== 'string') {
    return c.json({ error: 'Invalid id' }, 400);
  }
  const body = await c.req.json()
  if (!body.content) {
    return c.json({ error: 'Invalid body' }, 400);
  }
  await client.mutation(api.messages.mutation.createMessage, {
    roomId: roomId,
    userId: userId,
    content: body.content
  });
  return c.json({ message: 'Message created' });
})

app.get('/messages/:roomId/:userId', async (c) => {
  const roomId = c.req.param('roomId')
  if (typeof roomId !== 'string') {
    return c.json({ error: 'Invalid room id' }, 400);
  }
  const userId = c.req.param('userId')
  if (typeof userId !== 'string') {
    return c.json({ error: 'Invalid user id' }, 400);
  }
  const messages = await client.query(api.messages.query.getMessagesByRoomId, {
    roomId: roomId,
    userId: userId
  });
  return c.json(messages);
})


app.get('/', (c) => {
  return c.text('Hello Hono!')
})


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Backend Server is running on http://localhost:${info.port}`)
})
