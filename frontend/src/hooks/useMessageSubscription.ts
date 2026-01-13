import { useEffect, useRef, useState, useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import {
  MESSAGE_CREATED_SUBSCRIPTION,
  MESSAGE_DELETED_SUBSCRIPTION,
} from '../graphql/subscriptions';

interface Message {
  id: string;
  content: string;
  isDeleted: boolean;
  deletedReason?: string | null;
  author: {
    id: string;
    username: string;
    role: string;
  };
  parentMessage?: {
    id: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface UseMessageSubscriptionOptions {
  conversationId?: string | null;
  currentUserId?: string;
  batchThreshold?: number; // Number of messages that triggers toast notification
  batchInterval?: number; // Milliseconds to wait before flushing buffer
}

interface UseMessageSubscriptionReturn {
  newMessages: Message[];
  deletedMessages: Message[];
  clearNewMessages: () => void;
  clearDeletedMessages: () => void;
  messageCount: number;
  showToast: boolean;
}

export const useMessageSubscription = ({
  conversationId = null,
  currentUserId,
  batchThreshold = 3,
  batchInterval = 200,
}: UseMessageSubscriptionOptions = {}): UseMessageSubscriptionReturn => {
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<Message[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const messageBufferRef = useRef<Message[]>([]);
  const deletedBufferRef = useRef<Message[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useSubscription(MESSAGE_CREATED_SUBSCRIPTION, {
    variables: { conversationId },
    onError: (error) => {
      console.error("❌ MESSAGE_CREATED subscription error:", error);
    },
    onComplete: () => {
      console.log("✅ MESSAGE_CREATED subscription completed");
    },
    onData: ({ data }) => {
      console.log("🔔 MESSAGE_CREATED subscription data received:");
      console.log("  Full data object:", JSON.stringify(data, null, 2));
      console.log("  data.data:", data.data);
      console.log("  messageCreated:", data.data?.messageCreated);
      console.log("  Current buffer:", messageBufferRef.current);

      const message = data.data?.messageCreated;
      if (!message) {
        console.warn("⚠️ No message in subscription payload!");
        return;
      }

      console.log("✅ Valid message received:", {
        id: message.id,
        content: message.content?.substring(0, 50),
        author: message.author?.username,
        parentMessage: message.parentMessage?.id,
      });

      // Don't show notifications for user's own messages
      if (currentUserId && message.author.id === currentUserId) {
        return;
      }

      // Add to buffer
      messageBufferRef.current.push(message);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to flush buffer
      timeoutRef.current = setTimeout(() => {
        flushBuffer();
      }, batchInterval);
    },
  });

  // Subscribe to deleted messages
  useSubscription(MESSAGE_DELETED_SUBSCRIPTION, {
    variables: { conversationId },
    onError: (error) => {
      console.error("❌ MESSAGE_DELETED subscription error:", error);
    },
    onData: ({ data }) => {
      console.log("🔔 MESSAGE_DELETED subscription data:", data.data);
      const message = data.data?.messageDeleted;
      if (!message) return;

      // Don't show notifications for user's own deletions
      if (currentUserId && message.author.id === currentUserId) {
        return;
      }

      // Add to deleted buffer
      deletedBufferRef.current.push(message);

      // Update immediately for deletions (no batching)
      setDeletedMessages((prev) => [...prev, message]);
    },
  });

  const flushBuffer = useCallback(() => {
    const bufferedMessages = messageBufferRef.current;
    if (bufferedMessages.length === 0) return;

    const count = bufferedMessages.length;
    setMessageCount(count);

    // Show toast if above threshold
    if (count > batchThreshold) {
      setShowToast(true);
      // Auto-hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    }

    // Add messages to state
    setNewMessages((prev) => [...prev, ...bufferedMessages]);

    // Clear buffer
    messageBufferRef.current = [];
  }, [batchThreshold]);

  const clearNewMessages = useCallback(() => {
    setNewMessages([]);
    setMessageCount(0);
    setShowToast(false);
  }, []);

  const clearDeletedMessages = useCallback(() => {
    setDeletedMessages([]);
    deletedBufferRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    newMessages,
    deletedMessages,
    clearNewMessages,
    clearDeletedMessages,
    messageCount,
    showToast,
  };
};
