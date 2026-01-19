# Lumion Message Board

A real-time message board with nested threading, built with KeystoneJS, React, and GraphQL.

## Tech Stack

### Backend
- **KeystoneJS 6** - GraphQL CMS/API framework
- **SQLite** - Embedded database
- **Prisma** - ORM
- **GraphQL Polling** - Near Real-time updates

### Frontend
- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material UI** - Component library
- **Apollo Client** - GraphQL client

## Project Structure

```
message-board/
├── backend/          # KeystoneJS GraphQL server
├── frontend/         # React + Vite application
├── package.json      # Monorepo workspace configuration
└── README.md         # This file
```

## Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository:
```bash
cd message-board
```

2. Install all dependencies (installs both backend and frontend):
```bash
npm install --ignore-scripts
```

Note: We use `--ignore-scripts` to skip the postinstall hook. The database will be created automatically when you start the backend.

## Running the Application

### Start Both Backend and Frontend

Run this command from the root directory:

```bash
npm run dev
```

This will start:
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:5174 (or 5173 if available)

### Access the Application

- **Frontend UI**: http://localhost:5174 (or check terminal output)
- **KeystoneJS Admin UI**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3000/api/graphql

### First Time Setup

1. Start the backend:
```bash
npm run dev -w backend
```

2. Seed the database with sample data (optional):
```bash
npm run seed -w backend
```

3. In another terminal, start the frontend:
```bash
npm run dev -w frontend
```

### Start Frontend and Backend
```bash
npm run dev
```

### Start Backend Only

```bash
npm run dev -w backend
```

### Start Frontend Only

```bash
npm run dev -w frontend
```

## Development Status

### ✅ All Stages Complete!

#### Stage 1: Project Setup & Monorepo
- ✅ Monorepo with npm workspaces
- ✅ KeystoneJS backend with SQLite
- ✅ Vite + React + TypeScript frontend
- ✅ Apollo Client with GraphQL subscriptions
- ✅ Basic communication verified

#### Stage 2: Backend Schema & GraphQL API
- ✅ User and Message models with nested threading
- ✅ Role-based permissions (USER/ADMIN/SUPER_ADMIN)
- ✅ Custom deleteMessageWithReason mutation
- ✅ Database seeding with sample data
- ✅ All queries and mutations tested

#### Stage 3: Core Frontend Architecture
- ✅ Layout with left sidebar, main content, and collapsible right sidebar
- ✅ Session management with localStorage
- ✅ Dark/Light theme toggle
- ✅ Navigation between pages
- ✅ Responsive design (desktop & mobile)

#### Stage 4: Message Features
- ✅ MessageCard component with delete/reply actions
- ✅ MessageComposer for creating messages and replies
- ✅ ConversationViewPage with nested threading
- ✅ Real-time updates (polling every 5-10 seconds)
- ✅ Role-based message deletion with reason modals
- ✅ Right sidebar thread viewer

#### Stage 5: Pages & Polish
- ✅ Homepage with user stats, your conversations, and activity feed
- ✅ All Conversations page with filters, search, and sort
- ✅ Settings page with theme, username, and role management
- ✅ Mobile-responsive bottom tab bar
- ✅ Integration complete and tested

## Features

### Core Features
- ✅ Post new messages (conversations)
- ✅ Reply to existing messages (nested threading up to 3 levels)
- ✅ Real-time updates via GraphQL polling
- ✅ User session management with localStorage
- ✅ Role-based permissions (USER/ADMIN/SUPER_ADMIN)
- ✅ Message deletion with audit trail and reasons
- ✅ Dark/Light mode toggle
- ✅ Mobile responsive design

### User Interface
- ✅ Homepage with user stats and activity feed
- ✅ All Conversations page with filters (All/Yours/Others)
- ✅ Search conversations by content
- ✅ Sort by: Most Recent, Most Replies, Created Date
- ✅ Settings page for customization
- ✅ Thread viewer in collapsible right sidebar (desktop only)
- ✅ Bottom tab navigation (mobile)

### User Roles
- **USER**: Can post messages and delete their own (must provide reason)
- **ADMIN**: Can delete any message (must provide reason)
- **SUPER_ADMIN**: Can delete any message without providing a reason

### Technical Features
- ✅ GraphQL queries and mutations
- ✅ Custom resolver for role-based deletion
- ✅ Session persistence across page reloads
- ✅ Theme preference saved to localStorage
- ✅ Responsive breakpoints (<768px for mobile)
- ✅ Material UI components throughout
- ✅ TypeScript for type safety

## Database

The SQLite database is created automatically at `backend/keystone.db` when you first start the backend.

To reset the database:
```bash
rm backend/keystone.db
npm run dev -w backend
```

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not in use
- Try removing `backend/keystone.db` and restarting

### Frontend won't start
- Make sure port 5173 is not in use
- Try `rm -rf frontend/node_modules` and `npm install` again

### GraphQL connection errors
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify `backend/keystone.ts` has correct CORS configuration

## License

MIT
