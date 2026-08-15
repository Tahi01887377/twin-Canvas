# TwinCanvas

Real-time collaborative design & painting for exactly two people.

TwinCanvas lets two users share a canvas — draw with pens, add shapes and text, move and style objects, and watch each other's cursors and selections live. Built with a Socket.IO + Express + SQLite/Prisma backend and a React (Vite) + Fabric.js frontend.

## Features

- **Two-user live collaboration** — objects, strokes, cursors, and selections sync in real time
- **Drawing tools** — pen, eraser, smooth strokes with pressure
- **Shapes & text** — rect, rounded rect, circle, ellipse, triangle, line, arrow, star, polygon, heart, diamond, and text
- **Object styling** — fill, stroke, opacity, z-order, position, size, rotation (right sidebar inspector)
- **Undo / Redo** with history
- **Canvas templates** — preset sizes (Instagram, YouTube, etc.) or custom dimensions
- **Share links** — copy an invite link to bring in the second user
- **Presence** — remote cursors, selection outlines, and live user list
- **Persistence** — canvases saved to SQLite via Prisma; rooms are restored from the DB after restart
- **Export** — download the canvas as PNG (SVG/JPEG ready)

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Fabric.js 5, Socket.IO client |
| Backend  | Node.js, Express, Socket.IO, TypeScript |
| Storage  | SQLite, Prisma ORM |

## Repository Layout

```
twin-canvas/
├─ shared/        # Shared types, socket events, constants (imported by both apps)
├─ server/        # Express + Socket.IO backend, room manager, Prisma persistence
├─ client/        # React + Vite frontend
└─ tests/         # Vitest unit tests (RoomManager, etc.)
```

## Prerequisites

- Node.js 20+ (developed on Node 24)
- npm

## Setup

Install dependencies for the root, client, and server:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

Set up the database (creates `server/prisma/dev.db`):

```bash
cd server
copy .env.example .env   # or create .env manually
npx prisma generate
npx prisma migrate dev --name init
```

### Environment files

`server/.env`:

```
PORT=3001
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

`client/.env` (optional):

```
VITE_SERVER_URL=http://localhost:3001
```

## Running

Start both the client and server with:

```bash
npm run dev
```

Or run them separately (two terminals):

```bash
npm run dev:server   # http://localhost:3001 (REST + Socket.IO)
npm run dev:client   # http://localhost:3000 (Vite)
```

### Test it with two people

1. Open `http://localhost:3000`, click **Start Creating**, pick a template.
2. You'll land in a room at `/twin/<roomId>`.
3. Click **Invite** in the top toolbar to copy the room link.
4. Open that link in a second browser window (or incognito) and enter a name.
5. Draw in one window — the other updates live, including cursors and selections.

## Verification

| Check | How |
|-------|-----|
| TypeScript | `npm run typecheck` |
| Unit tests | `npm test` |
| Production build | `npm run build` |
| Server health | `GET http://localhost:3001/api/health` |

## Useful endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/health` | Server status + room count |
| POST | `/api/rooms` | Create a room (`{ ownerName?, width?, height? }`) → `{ roomId, joinUrl, ownerId }` |
| GET  | `/api/rooms/:roomId` | Room info + canvas snapshot |

## Socket events (core)

- `join_room` / `room_joined` — join a room and receive initial canvas state
- `create_object` / `object_created` — add a shape or stroke
- `update_object` / `object_updated` — move/resize/style an object
- `delete_object` / `object_deleted` — remove an object
- `cursor_move` / `cursor_updated`, `selection_change` / `selection_updated` — live presence
- `lock_object` / `object_locked` — object locking (prevents conflicting edits)
- `save_canvas` / `canvas_saved` — persist to SQLite

## Status

Working end-to-end: two-user sync (objects, updates, deletes, presence), room creation + share links, undo/redo, template sizes, export, and SQLite persistence with room restoration after restart. Tests cover the room manager (2-user limit, ops, locks, snapshots, recreation).