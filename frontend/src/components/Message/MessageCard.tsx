import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '../../contexts/SessionContext';

interface Author {
  id: string;
  username: string;
  role?: string;
}

interface MessageCardProps {
  content: string;
  author: Author;
  createdAt: string;
  isDeleted?: boolean;
  deletedReason?: string | null;
  replyCount?: number;
  onReply?: () => void;
  onOpenInSidebar?: () => void;
  onDelete?: (reason?: string) => void;
  compact?: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  content,
  author,
  createdAt,
  isDeleted = false,
  deletedReason,
  replyCount = 0,
  onReply,
  onOpenInSidebar,
  onDelete,
  compact = false,
}) => {
  const { session } = useSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const canDelete = session && (
    session.userId === author.id || // Own message
    session.role === 'ADMIN' ||
    session.role === 'SUPER_ADMIN'
  );

  const requiresReason = session && session.role !== 'SUPER_ADMIN';

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.(requiresReason ? deleteReason : undefined);
    setDeleteDialogOpen(false);
    setDeleteReason('');
  };

  const displayContent = isDeleted
    ? `[Deleted${deletedReason ? `: ${deletedReason}` : ' by Super Admin'}]`
    : content;

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          mb: compact ? 1 : 2,
          opacity: isDeleted ? 0.6 : 1,
          backgroundColor: isDeleted ? 'action.disabledBackground' : 'background.paper',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
                {author.username}
              </Typography>
              {author.role && author.role !== 'USER' && (
                <Chip
                  label={author.role}
                  size="small"
                  color={author.role === 'SUPER_ADMIN' ? 'error' : 'warning'}
                  sx={{ ml: 1, height: 20 }}
                />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </Typography>
            </Box>
            <Box>
              {!isDeleted && onOpenInSidebar && (
                <IconButton size="small" onClick={onOpenInSidebar} title="Open in sidebar">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              )}
              {!isDeleted && canDelete && onDelete && (
                <IconButton size="small" onClick={handleDeleteClick} color="error" title="Delete message">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>

          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              fontStyle: isDeleted ? 'italic' : 'normal',
              color: isDeleted ? 'text.secondary' : 'text.primary',
            }}
          >
            {displayContent}
          </Typography>

          {!isDeleted && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={onReply}
                >
                  Reply
                </Button>
              {replyCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {requiresReason
              ? 'Please provide a reason for deleting this message:'
              : 'Are you sure you want to delete this message?'}
          </Typography>
          {requiresReason && (
            <TextField
              autoFocus
              margin="dense"
              label="Deletion Reason"
              fullWidth
              multiline
              rows={3}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={requiresReason && !deleteReason.trim()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
