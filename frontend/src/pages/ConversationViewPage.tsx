import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Breadcrumbs,
  Link,
  Snackbar,
  Fade,
} from '@mui/material';
import { MessageCard } from '../components/Message/MessageCard';
import { MessageComposer } from '../components/Message/MessageComposer';
import { GET_CONVERSATION_WITH_REPLIES } from '../graphql/queries';
import { CREATE_REPLY, DELETE_MESSAGE_WITH_REASON } from '../graphql/mutations';
import { useSession } from '../contexts/SessionContext';
import { useMessageSubscription } from '../hooks/useMessageSubscription';
import { useScrollLock } from '../hooks/useScrollLock';

interface ConversationViewPageProps {
  conversationId: string;
  onOpenInSidebar?: (messageId: string) => void;
  onBack?: () => void;
}

export const ConversationViewPage: React.FC<ConversationViewPageProps> = ({
  conversationId,
  onOpenInSidebar,
  onBack,
}) => {
  const { session } = useSession();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [conversationData, setConversationData] = useState<any>(null);

  const { containerRef, lockScroll, unlockScroll } = useScrollLock();

  // Real-time subscription for new/deleted messages
  const {
    newMessages,
    deletedMessages,
    clearNewMessages,
    clearDeletedMessages,
    messageCount,
    showToast,
  } = useMessageSubscription({
    conversationId,
    currentUserId: session?.userId || undefined,
  });

  const { data, loading, error } = useQuery(GET_CONVERSATION_WITH_REPLIES, {
    variables: { id: conversationId },
  });

  useEffect(() => {
    if (data?.message) {
      setConversationData(data.message);
    }
  }, [data]);

  useEffect(() => {
    if (newMessages.length > 0 && conversationData) {
      lockScroll();

      setConversationData((prev: any) => {
        if (!prev) return prev;

        // Create a copy of the conversation
        const updated = { ...prev };

        // Add new messages to the appropriate place in the tree
        newMessages.forEach((newMsg) => {
          // Initialize replies array on incoming message to prevent crashes
          const normalizedMsg = { ...newMsg, replies: newMsg.replies || [] };

          // Check if message already exists (avoid duplicates)
          const existsInReplies = updated.replies?.some((r: any) => r.id === normalizedMsg.id);
          if (existsInReplies) return;

          // If it's a direct reply to the conversation
          if (normalizedMsg.parentMessage?.id === conversationId) {
            updated.replies = [...(updated.replies || []), normalizedMsg];
          } else {
            // It's a nested reply - find parent and add to it (immutably)
            const addToParent = (messages: any[]): any[] | null => {
              return messages.map(msg => {
                if (msg.id === normalizedMsg.parentMessage?.id) {
                  // Found parent - add reply
                  return {
                    ...msg,
                    replies: [...(msg.replies || []), normalizedMsg]
                  };
                }
                if (msg.replies && msg.replies.length > 0) {
                  // Recursively search in nested replies
                  const updatedReplies = addToParent(msg.replies);
                  if (updatedReplies) {
                    return { ...msg, replies: updatedReplies };
                  }
                }
                return msg;
              });
            };

            if (updated.replies) {
              const updatedReplies = addToParent(updated.replies);
              if (updatedReplies) {
                updated.replies = updatedReplies;
              }
            }
          }
        });

        return updated;
      });

      clearNewMessages();
      setTimeout(() => unlockScroll(), 100);
    }
  }, [newMessages, conversationData, conversationId, clearNewMessages, lockScroll, unlockScroll]);

  useEffect(() => {
    if (deletedMessages.length > 0 && conversationData) {
      setConversationData((prev: any) => {
        if (!prev) return prev;

        const updated = { ...prev };

        // Update deleted messages in the tree
        const updateDeleted = (messages: any[]): any[] => {
          return messages.map((msg) => {
            const deletedMsg = deletedMessages.find((d) => d.id === msg.id);
            if (deletedMsg) {
              return { ...msg, isDeleted: true, deletedReason: deletedMsg.deletedReason };
            }
            if (msg.replies) {
              return { ...msg, replies: updateDeleted(msg.replies) };
            }
            return msg;
          });
        };

        if (updated.replies) {
          updated.replies = updateDeleted(updated.replies);
        }

        // Check if the conversation itself was deleted
        const deletedConv = deletedMessages.find((d) => d.id === conversationId);
        if (deletedConv) {
          updated.isDeleted = true;
          updated.deletedReason = deletedConv.deletedReason;
        }

        return updated;
      });

      clearDeletedMessages();
    }
  }, [deletedMessages, conversationData, conversationId, clearDeletedMessages]);

  const [createReply] = useMutation(CREATE_REPLY, {
    onCompleted: () => {
      setReplyingTo(null);
    },
  });

  const [deleteMessage] = useMutation(DELETE_MESSAGE_WITH_REASON, {
    onCompleted: () => {
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

  if (loading && !conversationData) {
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

  // Use conversationData from state (which includes real-time updates)
  const conversation = conversationData;

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
    <Box ref={containerRef} sx={{ height: '100%', overflowY: 'auto' }}>
      {/* Toast notification for bulk new messages */}
      <Snackbar
        open={showToast}
        message={`${messageCount} new ${messageCount === 1 ? 'message' : 'messages'}`}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Fade}
      />

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

      <Typography variant="h4" gutterBottom>
        Conversation
      </Typography>

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
