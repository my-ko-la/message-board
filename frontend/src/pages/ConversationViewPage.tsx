import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReplyIcon from '@mui/icons-material/Reply';
import { MessageCard } from '../components/Message/MessageCard';
import { MessageComposer } from '../components/Message/MessageComposer';
import { GET_CONVERSATION_MESSAGES } from '../graphql/queries';
import { CREATE_REPLY, DELETE_MESSAGE_WITH_REASON } from '../graphql/mutations';
import { useSession } from '../contexts/SessionContext';
import { useKeyPressed, KeyBindings } from '../hooks/useKeyPressed';

interface ConversationViewPageProps {
  conversationId?: string;
  onOpenInSidebar?: (messageId: string) => void;
}

interface Message {
  id: string;
  content: string;
  isDeleted: boolean;
  deletedReason?: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    username: string;
    role: string;
  };
  parentMessage?: {
    id: string;
    author?: {
      id: string;
      username: string;
    };
  } | null;
}

const POLL_INTERVALS = [2000, 5000, 15000];
const IDLE_TIMEOUT = 30000;

export const ConversationViewPage: React.FC<ConversationViewPageProps> = ({
  conversationId: propConversationId,
  onOpenInSidebar,
}) => {
  const { id: urlConversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();

  const conversationId = propConversationId || urlConversationId;

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pollIntervalIndex, setPollIntervalIndex] = useState(0);
  const lastCountRef = useRef<number>(0);
  const lastChangeTimeRef = useRef<number>(Date.now());

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATION_MESSAGES, {
    variables: { conversationId },
    skip: !conversationId,
    pollInterval: POLL_INTERVALS[pollIntervalIndex],
  });

  // Adjust polling based on message count changes
  useEffect(() => {
    const count = data?.messages?.length || 0;
    if (count !== lastCountRef.current) {
      lastCountRef.current = count;
      lastChangeTimeRef.current = Date.now();
      setPollIntervalIndex(0);
    } else {
      const timeSinceChange = Date.now() - lastChangeTimeRef.current;
      if (timeSinceChange > IDLE_TIMEOUT && pollIntervalIndex < POLL_INTERVALS.length - 1) {
        setPollIntervalIndex((prev) => Math.min(prev + 1, POLL_INTERVALS.length - 1));
      }
    }
  }, [data?.messages?.length, pollIntervalIndex]);

  const [createReply] = useMutation(CREATE_REPLY, {
    onCompleted: () => {
      setReplyingTo(null);
      setPollIntervalIndex(0);
      lastChangeTimeRef.current = Date.now();
      refetch();
    },
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE_WITH_REASON, {
    onCompleted: () => {
      setPollIntervalIndex(0);
      lastChangeTimeRef.current = Date.now();
      refetch();
    },
  });

  const recordReply = async (content: string, parentId: string) => {
    if (!session?.userId) return;
    await createReply({
      variables: {
        content,
        authorId: session.userId,
        parentMessageId: parentId,
      },
    });
  };

  const handleDelete = async (messageId: string, reason?: string) => {
    if (!session?.userId) return;
    await deleteMessage({
      variables: {
        id: messageId,
        userId: session.userId,
        reason,
      },
    });
  };

  const returnToPreviousPage = useCallback(() => {
    navigate('/conversations');
  }, [navigate]);

  useKeyPressed({
    bindings: [
      KeyBindings.escape(() => {
        if (replyingTo) {
          setReplyingTo(null);
        } else {
          returnToPreviousPage();
        }
      }),
      KeyBindings.goBack(returnToPreviousPage),
    ],
  });

  const messages: Message[] = data?.messages || [];
  const rootMessage = messages.find((m) => !m.parentMessage);

  if (!conversationId) {
    return <Alert severity="warning">No conversation ID provided</Alert>;
  }

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load conversation: {error.message}</Alert>;
  }

  if (messages.length === 0) {
    return <Alert severity="warning">Conversation not found</Alert>;
  }

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={returnToPreviousPage} sx={{ mr: 1 }} aria-label="go back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Conversation</Typography>
        <Chip
          label={`${messages.length} message${messages.length !== 1 ? 's' : ''}`}
          size="small"
          sx={{ ml: 2 }}
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((message) => {
          const isRootMessage = !message.parentMessage;
          const parentAuthor = message.parentMessage?.author?.username;

          return (
            <Box key={message.id}>
              {parentAuthor && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1, color: 'text.secondary' }}>
                  <ReplyIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">replying to @{parentAuthor}</Typography>
                </Box>
              )}

              <MessageCard
                content={message.content}
                author={message.author}
                createdAt={message.createdAt}
                isDeleted={message.isDeleted}
                deletedReason={message.deletedReason}
                onReply={() => setReplyingTo(message.id)}
                onOpenInSidebar={onOpenInSidebar ? () => onOpenInSidebar(message.id) : undefined}
                onDelete={(reason) => handleDelete(message.id, reason)}
                compact={!isRootMessage}
              />

              {replyingTo === message.id && (
                <Box sx={{ mt: 2, ml: 2 }}>
                  <MessageComposer
                    onSubmit={(content) => recordReply(content, message.id)}
                    onCancel={() => setReplyingTo(null)}
                    label="Your Reply"
                    parentContext={{ author: message.author.username, content: message.content }}
                    autoFocus
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {messages.length === 1 && rootMessage && !rootMessage.isDeleted && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No replies yet. Be the first to reply!
        </Typography>
      )}

      {!replyingTo && rootMessage && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <MessageComposer
            onSubmit={(content) => recordReply(content, rootMessage.id)}
            label="Reply to conversation"
            placeholder="Add your reply..."
          />
        </Box>
      )}
    </Box>
  );
};
