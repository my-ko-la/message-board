export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface Author {
  id: string;
  username: string;
  role?: UserRole;
}

export interface Message {
  id: string;
  content: string;
  isDeleted?: boolean;
  deletedReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  author: Author;
  replies?: Array<{ id: string }>;
  parentMessage?: {
    id: string;
    content: string;
    author?: {
      id: string;
      username: string;
    };
  } | null;
}

// Query response types
export interface MessagesQueryData {
  messages: Message[];
  messagesCount?: number;
}

export interface MessageQueryData {
  message: Message | null;
}
