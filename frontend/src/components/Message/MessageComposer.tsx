import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageComposerProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  label?: string;
  parentContext?: {
    author: string;
    content: string;
  };
  autoFocus?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Write your message...',
  label = 'New Message',
  parentContext,
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);


  // FIXME: useKeyPressed doesn't flush the buffer, this is a hack
  useEffect(() => {
    if (content === "N") setContent('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(content);
      setContent('');
    } catch (error) {
      // TODO: inform the user 
      console.error('Failed to send message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      {parentContext && (
        <Box
          sx={{
            p: 1,
            mb: 2,
            backgroundColor: 'action.hover',
            borderLeft: 3,
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Replying to {parentContext.author}:
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
            {parentContext.content.substring(0, 100)}
            {parentContext.content.length > 100 && '...'}
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label={label}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting}
          autoFocus={autoFocus}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            endIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            disabled={!content.trim() || submitting}
          >
            {submitting ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};
