import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  SessionData,
  getSession,
  saveSession,
  initializeSession,
} from "../utils/session";

const FIND_OR_CREATE_USER = gql`
  mutation FindOrCreateUser(
    $sessionId: String!
    $username: String!
    $role: UserRoleType!
  ) {
    createUser(
      data: { sessionId: $sessionId, username: $username, role: $role }
    ) {
      id
      username
      sessionId
      role
    }
  }
`;

const FIND_USER_BY_SESSION = gql`
  query FindUserBySession($sessionId: String!) {
    users(where: { sessionId: { equals: $sessionId } }) {
      id
      username
      sessionId
      role
    }
  }
`;

interface SessionContextType {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  updateUsername: (username: string) => Promise<void>;
  updateRole: (role: SessionData["role"]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createUser] = useMutation(FIND_OR_CREATE_USER);
  const { refetch: findUser } = useQuery(FIND_USER_BY_SESSION, {
    skip: true,
  });

  const initSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check localStorage first
      const existingSession = getSession();

      if (existingSession && existingSession.userId) {
        // We have a complete session
        setSession(existingSession);
        setLoading(false);
        return;
      }

      // Initialize new or partial session
      const { sessionId, username, role } = initializeSession();

      // Try to find existing user by sessionId
      const { data: findData } = await findUser({ sessionId });

      if (findData?.users && findData.users.length > 0) {
        // User exists
        const user = findData.users[0];
        const newSession: SessionData = {
          sessionId: user.sessionId,
          userId: user.id,
          username: user.username,
          role: user.role,
        };
        saveSession(newSession);
        setSession(newSession);
      } else {
        // Create new user
        const { data: createData } = await createUser({
          variables: { sessionId, username, role },
        });

        if (createData?.createUser) {
          const user = createData.createUser;
          const newSession: SessionData = {
            sessionId: user.sessionId,
            userId: user.id,
            username: user.username,
            role: user.role,
          };
          saveSession(newSession);
          setSession(newSession);
        } else {
          throw new Error("Failed to create user session");
        }
      }
    } catch (err) {
      console.error("Failed to initialize session:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to server. Please check if the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, [createUser, findUser]);

  const updateUsername = async (newUsername: string) => {
    if (!session) return;

    // Update in state and localStorage
    const updated = { ...session, username: newUsername };
    setSession(updated);
    saveSession(updated);

    // TODO: Update in backend via mutation
  };

  const updateRole = (newRole: SessionData["role"]) => {
    if (!session) return;

    // Update in state and localStorage
    const updated = { ...session, role: newRole };
    setSession(updated);
    saveSession(updated);

    // TODO: Update in backend via mutation
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        error,
        retry: initSession,
        updateUsername,
        updateRole,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
