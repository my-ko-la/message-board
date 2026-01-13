# Lumion Message Board - Implementation Plan

## Project Overview

**Description**: A real-time message board with nested threading, user sessions, and GraphQL-powered data layer.

**Tech Stack**:
- **Monorepo**: npm workspaces
- **Backend**: KeystoneJS 6 + SQLite + Prisma
- **Frontend**: Vite + React 18 + TypeScript + Material UI
- **GraphQL**: Apollo Client with Subscriptions
- **Real-time**: GraphQL Subscriptions (WebSocket transport)
- **Session**: LocalStorage-based (display name + sessionId)

**Repository Structure**:
```
/lumion-message-board/
├── package.json                 # Root workspace config
├── README.md                    # Setup instructions
├── PLAN.md                      # This file
├── /backend/                    # KeystoneJS server
│   ├── schema.prisma           # Database schema
│   ├── schema.ts               # Keystone GraphQL schema
│   ├── keystone.ts             # Keystone config
│   └── package.json
├── /frontend/                   # Vite + React app
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utilities
│   │   └── generated/          # Auto-generated GraphQL types
│   ├── vite.config.ts
│   └── package.json
└── /shared/                     # Shared types/configs (if needed)
```

---

## Data Model

### User
```typescript
{
  id: ID!
  username: String!           // Display name
  sessionId: String! @unique  // LocalStorage UUID
  role: UserRole!             // USER | ADMIN | SUPER_ADMIN
  createdAt: DateTime!
  messages: [Message]         // All messages by this user
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}
```

### Message
```typescript
{
  id: ID!
  content: String!
  author: User!
  parentMessage: Message?     // null = top-level conversation
  replies: [Message]          // Computed: messages where parentMessage = this.id
  isDeleted: Boolean! @default(false)
  deletedReason: String?      // Required when isDeleted = true (except SUPER_ADMIN)
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

**Threading Logic**:
- **Conversation**: Message where `parentMessage = null`
- **Reply**: Message where `parentMessage != null`
- **Thread**: Conversation + all nested descendants

---

## UI/UX Design

### Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Left Sidebar  │         Main Content Area        │  Right Sidebar  │
│    (15-20%)    │            (50-65%)              │    (0-35%)      │
├────────────────┼──────────────────────────────────┼─────────────────┤
│ • Home         │                                  │                 │
│ • All Convos   │   [Dynamic Content]              │  [Thread View]  │
│ • Settings     │   - Homepage                     │  - Toggled by   │
│                │   - Conversation Full View       │    icon/button  │
│                │   - List View                    │  - Persistant   │
│                │   - Settings Page                │  - Collapsible  │
└────────────────┴──────────────────────────────────┴─────────────────┘
```

### Mobile Layout (<768px)

```
┌───────────────────────────┐
│    [Dynamic Content]      │
│    - Homepage             │
│    - Conversation View    │
│    - List View            │
│    - Settings             │
├───────────────────────────┤
│  Bottom Tab Bar           │
│  [Home] [All] [Settings]  │
└───────────────────────────┘
```

### Key UI Features

**Homepage**:
- User details card (username, sessionId, stats)
- Recently viewed conversations (max 5-10)
- Activity on your conversations (recent replies to your threads)

**All Conversations Page**:
- List view with filters: All / Your Conversations / Others
- Search by content
- Sort by: Most Recent, Most Replies, Created Date
- Click to open full view in main area

**Conversation Full View**:
- Top-level message at top
- Nested replies (show one level deep)
  - When viewing deeper levels, always show: original conversation + direct parent
- Each message has "open in sidebar" icon
- Real-time updates with batching (1 second intervals)

**Right Sidebar (Thread Viewer)**:
- Opens when clicking sidebar icon on any message
- Shows message + one level of direct replies
- Max 35% viewport width
- Persists across navigation
- Manually closable

**Settings**:
- Dark/Light mode toggle
- Edit display name
- Role selector (USER/ADMIN/SUPER_ADMIN) - for testing
- Toggle: "Show conversation in sidebar when returning home"
- Notification preferences

**Message Deletion**:
- USER: Can delete their own messages (must provide reason)
- ADMIN: Can delete any message (must provide reason via modal)
- SUPER_ADMIN: Can delete without reason
- Deleted messages show: "[Deleted: {reason}]" or "[Deleted by Super Admin]"

**Real-time Updates**:
- Buffer incoming messages, render every ~1 second
- Show toast/banner if >N messages (e.g., >3): "5 new messages"
- If ≤N messages: just animate in
- Lock scroll position (no auto-scroll)
- Badge on conversations showing unread count

---

## Stage 1: Project Setup & Monorepo

**Goal**: Initialize monorepo with KeystoneJS backend and Vite frontend, verify basic communication.

**Success Criteria**:
- ✅ Run `npm install` at root to install all workspace dependencies
- ✅ Run `npm run dev` to start both backend and frontend concurrently
- ✅ Backend accessible at `http://localhost:3000` (KeystoneJS Admin UI)
- ✅ Frontend accessible at `http://localhost:5173` (Vite dev server)
- ✅ Frontend can fetch data from KeystoneJS GraphQL API

**Implementation Steps**:

1. **Initialize Monorepo**
   ```bash
   mkdir lumion-message-board && cd lumion-message-board
   npm init -y
   ```
   - Configure `package.json` with workspaces:
     ```json
     {
       "name": "lumion-message-board",
       "private": true,
       "workspaces": ["backend", "frontend"],
       "scripts": {
         "dev": "concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
         "install:all": "npm install"
       },
       "devDependencies": {
         "concurrently": "^8.0.0"
       }
     }
     ```

2. **Setup Backend (KeystoneJS)**
   ```bash
   mkdir backend && cd backend
   npm init -y
   npm install @keystone-6/core @keystone-6/fields-document
   npm install --save-dev typescript @types/node
   ```
   - Create `keystone.ts` with basic config (SQLite)
   - Create `schema.ts` with placeholder User/Message models
   - Create `schema.prisma` (managed by Keystone)
   - Add scripts to `backend/package.json`:
     ```json
     {
       "scripts": {
         "dev": "keystone dev",
         "build": "keystone build",
         "start": "keystone start"
       }
     }
     ```

3. **Setup Frontend (Vite + React + TypeScript)**
   ```bash
   cd .. && npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install @mui/material @emotion/react @emotion/styled
   npm install @apollo/client graphql
   npm install react-router-dom
   ```
   - Configure `vite.config.ts` (proxy GraphQL to backend if needed)
   - Basic Apollo Client setup in `src/main.tsx`
   - Add scripts to `frontend/package.json`:
     ```json
     {
       "scripts": {
         "dev": "vite",
         "build": "vite build",
         "preview": "vite preview"
       }
     }
     ```

4. **Verify Communication**
   - Create a test query in frontend that fetches from KeystoneJS
   - Display result in `App.tsx`

**Tests**:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access KeystoneJS Admin UI
- [ ] Frontend successfully queries backend GraphQL API

**Status**: ✅ Complete

---

## Stage 2: Backend Schema & GraphQL API

**Goal**: Implement complete data model with nested threading, GraphQL subscriptions, and role-based permissions.

**Success Criteria**:
- ✅ Prisma schema matches data model (User, Message with relationships)
- ✅ KeystoneJS schema exposes GraphQL queries/mutations/subscriptions
- ✅ Can create users with roles (USER/ADMIN/SUPER_ADMIN)
- ✅ Can create conversations (parentMessage = null)
- ✅ Can create replies (parentMessage = messageId)
- ✅ GraphQL subscription triggers on new message
- ✅ Message deletion respects role permissions

**Implementation Steps**:

1. **Define Prisma Schema** (`backend/schema.prisma`)
   - User model:
     - id, username, sessionId (unique), role (enum), createdAt
   - Message model:
     - id, content, authorId, parentMessageId (nullable), isDeleted, deletedReason, createdAt, updatedAt
   - Relations:
     - User.messages → Message[]
     - Message.author → User
     - Message.parentMessage → Message?
     - Message.replies → Message[]

2. **Configure KeystoneJS Schema** (`backend/schema.ts`)
   - Define User list with fields matching Prisma
   - Define Message list with fields matching Prisma
   - Add computed field `replies` (filter messages by parentMessage)
   - Configure access control:
     - Users can delete their own messages
     - ADMINs can delete any message
     - SUPER_ADMINs can delete without reason

3. **Enable GraphQL Subscriptions**
   - Install `graphql-ws` and configure in `keystone.ts`
   - Add subscription for `messageCreated` event
   - Test with GraphQL Playground

4. **Seed Sample Data**
   - Create seed script with 2-3 users
   - Create 3-4 conversations with nested replies
   - Test that relationships work correctly

5. **Test Mutations & Queries**
   - createUser
   - createMessage (conversation)
   - createMessage (reply with parentMessage)
   - deleteMessage (with role checks)
   - Query: allMessages, message by ID
   - Query: messages with replies (nested)

**Tests**:
- [ ] Can create user with each role (USER/ADMIN/SUPER_ADMIN)
- [ ] Can create top-level conversation
- [ ] Can create reply to conversation
- [ ] Can create nested reply (reply to reply)
- [ ] Query returns correct nested structure
- [ ] Subscription fires when new message created
- [ ] USER can only delete own messages (requires reason)
- [ ] ADMIN can delete any message (requires reason)
- [ ] SUPER_ADMIN can delete without reason
- [ ] Deleted messages show correct deleted state

**Status**: ✅ Complete

---

## Stage 3: Core Frontend Architecture

**Goal**: Set up frontend foundation with Apollo Client, Material UI theme, layout structure, and session management.

**Success Criteria**:
- ✅ Apollo Client configured with WebSocket subscriptions
- ✅ Material UI theme with dark/light mode toggle
- ✅ Layout renders: left sidebar, main content, collapsible right sidebar
- ✅ Session management: generate/load sessionId from localStorage
- ✅ Basic navigation between Home/All Conversations/Settings
- ✅ Responsive layout (desktop ≥768px, mobile <768px)

**Implementation Steps**:

1. **Apollo Client Setup** (`src/lib/apolloClient.ts`)
   - Configure HttpLink for queries/mutations
   - Configure WebSocketLink for subscriptions (graphql-ws)
   - Split link based on operation type
   - Wrap app with ApolloProvider

2. **GraphQL Code Generation** (optional but recommended)
   - Install `@graphql-codegen/cli`
   - Configure codegen to generate TypeScript types from backend schema
   - Generate types into `src/generated/graphql.ts`
   - Add script: `npm run codegen`

3. **Material UI Theme** (`src/theme/`)
   - Create theme with dark/light mode
   - Create ThemeProvider wrapper
   - Create context/hook for theme toggle: `useThemeMode()`
   - Define color palette, typography, spacing

4. **Layout Components**
   - `<Layout>`: Main container
   - `<LeftSidebar>`: Navigation (Home, All Conversations, Settings)
   - `<MainContent>`: Dynamic content area
   - `<RightSidebar>`: Collapsible thread viewer (max 35% width)
   - Mobile: `<BottomTabBar>` for navigation

5. **Session Management** (`src/utils/session.ts`)
   - Generate UUID on first visit
   - Store in localStorage: `{ sessionId, userId, username, role }`
   - Create hook: `useSession()` to access/update session
   - Create/fetch user from backend on first load
   - Allow editing username in Settings

6. **Navigation State**
   - Use React state or react-router-dom for page switching
   - Pages: HomePage, AllConversationsPage, SettingsPage, ConversationViewPage
   - Right sidebar state: `{ isOpen, messageId, conversation }`

7. **Responsive Breakpoints**
   - Define MUI breakpoints: `sm: 768px`
   - Hide left sidebar on mobile
   - Show BottomTabBar on mobile
   - Disable right sidebar on mobile

**Tests**:
- [ ] Apollo Client can query backend
- [ ] Theme toggles between dark/light mode
- [ ] Layout renders correctly on desktop (3 columns)
- [ ] Layout renders correctly on mobile (single column + bottom tabs)
- [ ] Session generates and persists in localStorage
- [ ] Can navigate between pages
- [ ] Right sidebar opens/closes on button click

**Status**: ✅ Complete

---

## Stage 4: Message Features

**Goal**: Implement core messaging functionality with nested threading, real-time updates, and role-based deletion.

**Success Criteria**:
- ✅ Can create new conversation from UI
- ✅ Can reply to conversation (nested one level deep)
- ✅ Conversation view shows original message + direct replies
- ✅ When viewing deeper reply, show: original conversation + parent + reply
- ✅ Right sidebar opens any message with its direct replies
- ✅ Real-time updates with 1-second batching
- ✅ New message animations
- ✅ Toast notification when >N messages buffered
- ✅ Scroll position locked during updates
- ✅ Message deletion with role-based UI (modal for reason)
- ✅ Deleted messages show replacement text

**Implementation Steps**:

1. **Message Components**
   - `<MessageCard>`: Display single message
     - Author, content, timestamp
     - Reply button
     - "Open in sidebar" icon button
     - Delete button (conditional on role)
   - `<MessageThread>`: Display conversation + replies
     - Recursive rendering (limit depth to 1 visible level)
     - "Load more replies" or "Expand" for nested threads
   - `<MessageComposer>`: Form to create/reply to messages
     - Textarea with character limit
     - Submit button
     - Show parent context if replying

2. **Conversation Full View** (`<ConversationViewPage>`)
   - Fetch conversation by ID with all replies
   - Display top-level message prominently
   - Display direct replies below (one level)
   - Each reply can be expanded in-place or opened in sidebar
   - When expanding deeper: show breadcrumb (Original → Parent → Current)

3. **Real-time Updates** (`src/hooks/useMessageSubscription.ts`)
   - Subscribe to `messageCreated` GraphQL subscription
   - Buffer incoming messages for 1 second
   - After buffer timeout:
     - If >N messages (e.g., 3): show toast "X new messages"
     - If ≤N messages: just render with animation
   - Use CSS transitions for fade-in animation
   - Maintain scroll position using `useRef` + scrollTop

4. **Right Sidebar Thread Viewer** (`<RightSidebar>`)
   - Opens when "sidebar icon" clicked on any MessageCard
   - Fetch message by ID with direct replies
   - Max width: 35% viewport (CSS: `max-width: 35vw`)
   - Persists across navigation (global state)
   - Show close button
   - Collapsible with smooth transition

5. **Message Deletion**
   - `<DeleteMessageDialog>`: Modal with reason textarea
   - Role-based logic:
     - USER: Can delete own messages, must provide reason
     - ADMIN: Can delete any message, must provide reason
     - SUPER_ADMIN: Can delete any message, reason optional
   - Mutation: `deleteMessage(id, reason?)`
   - Update message: `isDeleted: true, deletedReason`
   - UI shows: "[Deleted: {reason}]" or "[Deleted by Super Admin]"

6. **Unread Badges**
   - Track last viewed timestamp per conversation
   - Show badge count on conversation in list view
   - Clear badge when conversation opened

**Tests**:
- [ ] Can create new conversation
- [ ] Can reply to conversation
- [ ] Can reply to reply
- [ ] Conversation view shows correct nesting
- [ ] Expanding deep reply shows breadcrumb context
- [ ] Subscription receives new messages
- [ ] Messages batch every 1 second
- [ ] Toast shows when >N messages
- [ ] Scroll position stays locked
- [ ] Right sidebar opens with message + replies
- [ ] Right sidebar persists across navigation
- [ ] USER can delete own message (requires reason)
- [ ] ADMIN can delete any message (requires reason)
- [ ] SUPER_ADMIN can delete without reason
- [ ] Deleted message shows replacement text

**Status**: ✅ Complete

---

## Stage 5: Home, List View & Polish

**Goal**: Complete homepage, all conversations list view, settings page, and final UX polish.

**Success Criteria**:
- ✅ Homepage shows user details, recently viewed, activity
- ✅ All Conversations page with filters, search, sort
- ✅ Settings page functional (name, role, theme, preferences)
- ✅ Mobile layout fully responsive
- ✅ All animations polished
- ✅ Dark/Light mode applied consistently
- ✅ README with setup instructions

**Implementation Steps**:

1. **Homepage** (`<HomePage>`)
   - **User Details Card**:
     - Display username, sessionId, role
     - Stats: X messages posted, Y conversations started
     - Edit username button (inline or modal)
   - **Recently Viewed Section**:
     - Store view history in localStorage (messageId + timestamp)
     - Display last 5-10 conversations
     - Click to open in main view
   - **Activity Section**:
     - Query: recent replies to conversations user created
     - Display as list with snippet + timestamp
     - Click to open conversation

2. **All Conversations Page** (`<AllConversationsPage>`)
   - **Filters**:
     - Tabs: All / Your Conversations / Others
     - Query based on tab selection
   - **Search**:
     - Input field to search by content (substring match)
     - Debounced query (500ms)
   - **Sort**:
     - Dropdown: Most Recent, Most Replies, Created Date
     - Update query with orderBy
   - **List View**:
     - Material UI Table or List component
     - Each row: title (first 60 chars), author, reply count, timestamp
     - Click row to open in main view

3. **Settings Page** (`<SettingsPage>`)
   - **Theme Toggle**: Switch between Dark/Light mode
   - **Edit Display Name**: TextField + Save button
   - **Role Selector**: Dropdown (USER/ADMIN/SUPER_ADMIN) - testing only
   - **Sidebar Preference**: Checkbox "Show conversation in sidebar when returning home"
   - **Notification Preferences**: Checkboxes for highlight/toast options
   - Save button updates localStorage + backend (if persisting)

4. **Mobile Responsive Polish**
   - Test all pages at <768px breakpoint
   - Left sidebar hidden, BottomTabBar visible
   - Right sidebar disabled (or fullscreen modal?)
   - Touch-friendly button sizes (min 44px)
   - Swipe gestures (optional, stretch goal)

5. **Animation Polish**
   - New message fade-in: CSS transition (opacity 0→1, 300ms)
   - Toast notifications: Slide-in from top (MUI Snackbar)
   - Sidebar open/close: Smooth width transition (300ms)
   - Theme toggle: Fade transition (200ms)

6. **Accessibility**
   - ARIA labels on buttons
   - Keyboard navigation (Tab, Enter, Esc)
   - Focus indicators
   - Semantic HTML (header, nav, main, aside)

7. **README.md**
   - Project description
   - Tech stack
   - Setup instructions:
     ```bash
     npm install
     npm run dev
     ```
   - Testing instructions (how to switch roles)
   - Architecture overview
   - Screenshots (optional)

8. **Final Testing**
   - Test all features end-to-end
   - Test on multiple browsers (Chrome, Firefox, Safari)
   - Test mobile layout on device or emulator
   - Test dark/light mode across all pages
   - Test role permissions (USER/ADMIN/SUPER_ADMIN)

**Tests**:
- [ ] Homepage displays correct user details
- [ ] Recently viewed updates when opening conversations
- [ ] Activity shows recent replies to user's conversations
- [ ] All Conversations filters work (All/Your/Others)
- [ ] Search finds conversations by content
- [ ] Sort orders conversations correctly
- [ ] Settings save and persist
- [ ] Role selector changes user role
- [ ] Mobile layout renders correctly
- [ ] All animations smooth and performant
- [ ] Dark/Light mode works on all pages
- [ ] README instructions work for fresh setup

**Status**: Not Started

---

## Development Guidelines Checklist

Following AGENTS.md principles:

- [ ] **Incremental Progress**: Each stage compiles and runs
- [ ] **Clear Commits**: Commit after each completed feature with message linking to plan
- [ ] **Test-Driven**: Write behavior tests where possible
- [ ] **Learn from Existing**: Study KeystoneJS/Material UI examples before implementing
- [ ] **Pragmatic Solutions**: Choose boring, simple solutions over clever tricks
- [ ] **Stop After 3 Attempts**: If stuck, document and reassess approach

**Before Each Commit**:
- [ ] Run linter/formatter
- [ ] All tests passing
- [ ] No console errors
- [ ] Self-review changes
- [ ] Update PLAN.md status

---

## Notes

- Keep this plan updated as implementation progresses
- Mark stages as "In Progress" or "Complete"
- Document any deviations or challenges
- Remove this file when all stages complete
