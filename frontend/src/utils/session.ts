import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface SessionData {
  sessionId: string;
  userId: string | null;
  username: string;
  role: UserRole;
}

const SESSION_KEY = 'lumion-session';

// Generate a new session
export const generateSession = (): Pick<SessionData, 'sessionId' | 'username' | 'role'> => {
  return {
    sessionId: uuidv4(),
    username: `User_${Math.floor(Math.random() * 10000)}`,
    role: 'USER',
  };
};

// Get session from localStorage
export const getSession = (): SessionData | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse session:', e);
      return null;
    }
  }
  return null;
};

// Save session to localStorage
export const saveSession = (session: SessionData): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// Update session fields
export const updateSession = (updates: Partial<SessionData>): SessionData => {
  const current = getSession();
  if (!current) {
    throw new Error('No session found');
  }
  const updated = { ...current, ...updates };
  saveSession(updated);
  return updated;
};

// Clear session
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// Initialize session (get existing or create new)
export const initializeSession = (): Pick<SessionData, 'sessionId' | 'username' | 'role'> => {
  const existing = getSession();
  if (existing) {
    return {
      sessionId: existing.sessionId,
      username: existing.username,
      role: existing.role,
    };
  }
  return generateSession();
};
