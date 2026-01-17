import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { MessageCard } from '../components/Message/MessageCard';
import { MessageComposer } from '../components/Message/MessageComposer';
import { GET_CONVERSATION_WITH_REPLIES } from '../graphql/queries';
import { CREATE_REPLY, DELETE_MESSAGE_WITH_REASON } from '../graphql/mutations';
import { useSession } from '../contexts/SessionContext';

interface ConversationViewPageProps {
  conversationId: string;
  onOpenInSidebar?: (messageId: string) => void;
  onBack?: () => void;
}

// Progressive polling intervals (ms): starts fast, slows down if no changes
const POLL_INTERVALS = [2000, 5000, 15000];
const IDLE_TIMEOUT = 30000; // Time without changes before slowing down

export const ConversationViewPage: React.FC<ConversationViewPageProps> = ({
  conversationId,
  onOpenInSidebar,
  onBack,
}) => {
  const { session } = useSession();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pollIntervalIndex, setPollIntervalIndex] = useState(0);
  const lastDataHashRef = useRef<string>('');
  const lastChangeTimeRef = useRef<number>(Date.now());

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATION_WITH_REPLIES, {
    variables: { id: conversationId },
    pollInterval: POLL_INTERVALS[pollIntervalIndex],
  });

  // Compute a simple hash of the data to detect changes
  const computeDataHash = useCallback((data: any): string => {
    if (!data?.message) return '';
    const countReplies = (msg: any): number => {
      if (!msg.replies) return 0;
      return msg.replies.length + msg.replies.reduce((sum: number, r: any) => sum + countReplies(r), 0);
    };
    return `${data.message.id}-${data.message.updatedAt}-${countReplies(data.message)}`;
  }, []);

  // Adjust polling interval based on activity
  useEffect(() => {
    const currentHash = computeDataHash(data);

    if (currentHash && currentHash !== lastDataHashRef.current) {
      // Data changed - reset to fast polling
      lastDataHashRef.current = currentHash;
      lastChangeTimeRef.current = Date.now();
      setPollIntervalIndex(0);
    } else {
      // Check if we should slow down
      const timeSinceChange = Date.now() - lastChangeTimeRef.current;
      if (timeSinceChange > IDLE_TIMEOUT && pollIntervalIndex < POLL_INTERVALS.length - 1) {
        setPollIntervalIndex((prev) => Math.min(prev + 1, POLL_INTERVALS.length - 1));
      }
    }
  }, [data, computeDataHash, pollIntervalIndex]);

  const [createReply] = useMutation(CREATE_REPLY, {
    onCompleted: () => {
      setReplyingTo(null);
      // Reset to fast polling and refetch immediately
      setPollIntervalIndex(0);
      lastChangeTimeRef.current = Date.now();
      refetch();
    },
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE_WITH_REASON, {
    onCompleted: () => {
      // Reset to fast polling and refetch immediately
      setPollIntervalIndex(0);
      lastChangeTimeRef.current = Date.now();
      refetch();
    },
  });

  const handleReply = async (content: string, parentId: string) => {
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

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load conversation: {error.message}
      </Alert>
    );
  }

  const conversation = data?.message;

  if (!conversation) {
    return (
      <Alert severity="warning">
        Conversation not found
      </Alert>
    );
  }

  // If this is a reply (has parentMessage), show breadcrumb
  const showBreadcrumb = conversation.parentMessage;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }} aria-label="go back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Conversation
        </Typography>
      </Box>

      {showBreadcrumb && (
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={onBack}
            sx={{ cursor: 'pointer' }}
          >
            Back
          </Link>
          <Typography variant="body2" color="text.secondary">
            Reply from {conversation.author.username}
          </Typography>
        </Breadcrumbs>
      )}

      {/* Original conversation (if this is a reply, show parent context) */}
      {conversation.parentMessage && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Original message by {conversation.parentMessage.author.username}:
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {conversation.parentMessage.content}
          </Typography>
        </Box>
      )}

      {/* Main message */}
      <MessageCard
        content={conversation.content}
        author={conversation.author}
        createdAt={conversation.createdAt}
        isDeleted={conversation.isDeleted}
        deletedReason={conversation.deletedReason}
        replyCount={conversation.replies?.length || 0}
        onReply={() => setReplyingTo(conversation.id)}
        onOpenInSidebar={() => onOpenInSidebar?.(conversation.id)}
        onDelete={(reason) => handleDelete(conversation.id, reason)}
      />

      {/* Reply composer for main message */}
      {replyingTo === conversation.id && (
        <Box sx={{ mb: 3 }}>
          <MessageComposer
            onSubmit={(content) => handleReply(content, conversation.id)}
            label="Your Reply"
            parentContext={{
              author: conversation.author.username,
              content: conversation.content,
            }}
            autoFocus
          />
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Direct replies */}
      {conversation.replies && conversation.replies.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Replies ({conversation.replies.length})
          </Typography>

          {conversation.replies.map((reply: any) => (
            <Box key={reply.id} sx={{ ml: 2 }}>
              <MessageCard
                content={reply.content}
                author={reply.author}
                createdAt={reply.createdAt}
                isDeleted={reply.isDeleted}
                deletedReason={reply.deletedReason}
                replyCount={reply.replies?.length || 0}
                onReply={() => setReplyingTo(reply.id)}
                onOpenInSidebar={() => onOpenInSidebar?.(reply.id)}
                onDelete={(reason) => handleDelete(reply.id, reason)}
              />

              {/* Reply composer for this reply */}
              {replyingTo === reply.id && (
                <Box sx={{ mb: 2, ml: 2 }}>
                  <MessageComposer
                    onSubmit={(content) => handleReply(content, reply.id)}
                    label="Your Reply"
                    parentContext={{
                      author: reply.author.username,
                      content: reply.content,
                    }}
                    autoFocus
                  />
                </Box>
              )}

              {/* Nested replies (show count and allow expanding) */}
              {reply.replies && reply.replies.length > 0 && (
                <Box sx={{ ml: 4, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {reply.replies.length} nested {reply.replies.length === 1 ? 'reply' : 'replies'}
                  </Typography>
                  {/* Show nested replies */}
                  {reply.replies.map((nestedReply: any) => (
                    <MessageCard
                      key={nestedReply.id}
                      content={nestedReply.content}
                      author={nestedReply.author}
                      createdAt={nestedReply.createdAt}
                      isDeleted={nestedReply.isDeleted}
                      deletedReason={nestedReply.deletedReason}
                      onOpenInSidebar={() => onOpenInSidebar?.(nestedReply.id)}
                      onDelete={(reason) => handleDelete(nestedReply.id, reason)}
                      compact
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {!conversation.isDeleted && conversation.replies?.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No replies yet. Be the first to reply!
        </Typography>
      )}
    </Box>
  );
};
