import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '../contexts/SessionContext';
import { GET_CONVERSATIONS } from '../graphql/queries';
import { CREATE_CONVERSATION } from '../graphql/mutations';
import { MessageComposer } from '../components/Message/MessageComposer';

type FilterTab = 'all' | 'yours' | 'others';
type SortOption = 'recent' | 'mostReplies' | 'created';

interface AllConversationsPageProps {
  onOpenConversation?: (conversationId: string) => void;
}

export const AllConversationsPage: React.FC<AllConversationsPageProps> = ({ onOpenConversation }) => {
  const { session } = useSession();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const whereClause = useMemo(() => {
    const base: any = { parentMessage: null }; // Only top-level conversations

    if (filterTab === 'yours' && session?.userId) {
      base.author = { id: { equals: session.userId } };
    } else if (filterTab === 'others' && session?.userId) {
      base.author = { id: { not: { equals: session.userId } } };
    }

    if (searchQuery) {
      base.content = { contains: searchQuery, mode: 'insensitive' };
    }

    return base;
  }, [filterTab, session?.userId, searchQuery]);

  const orderBy = useMemo(() => {
    switch (sortBy) {
      case 'mostReplies':
        return [{ replies: { count: 'desc' } }, { createdAt: 'desc' }];
      case 'created':
        return [{ createdAt: 'asc' }];
      case 'recent':
      default:
        return [{ createdAt: 'desc' }];
    }
  }, [sortBy]);

  const { data, loading, error, refetch } = useQuery(GET_CONVERSATIONS, {
    variables: { where: whereClause, orderBy },
    pollInterval: 10000, // Poll every 10 seconds
  });

  const [createConversation] = useMutation(CREATE_CONVERSATION, {
    onCompleted: () => {
      setShowComposer(false);
      refetch();
    },
  });

  const handleCreateConversation = async (content: string) => {
    if (!session?.userId) return;

    await createConversation({
      variables: {
        content,
        authorId: session.userId,
      },
    });
  };

  const conversations = data?.messages || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          All Conversations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowComposer(!showComposer)}
        >
          {showComposer ? 'Cancel' : 'New Conversation'}
        </Button>
      </Box>

      {/* Message Composer */}
      {showComposer && (
        <Box sx={{ mb: 3 }}>
          <MessageComposer
            onSubmit={handleCreateConversation}
            label="Start a new conversation"
            placeholder="What would you like to discuss?"
            autoFocus
          />
        </Box>
      )}

      {/* Filter Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(_, newValue) => setFilterTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="All" value="all" />
          <Tab label="Your Conversations" value="yours" />
          <Tab label="Others" value="others" />
        </Tabs>
      </Paper>

      {/* Search and Sort */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search conversations"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by content..."
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="mostReplies">Most Replies</MenuItem>
            <MenuItem value="created">Created Date</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Conversation List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          Failed to load conversations: {error.message}
        </Alert>
      ) : conversations.length === 0 ? (
        <Alert severity="info">
          No conversations found. {filterTab === 'yours' ? "Start one by clicking 'New Conversation'!" : ''}
        </Alert>
      ) : (
        <List>
          {conversations.map((conv: any) => (
            <ListItem
              key={conv.id}
              button
              onClick={() => onOpenConversation?.(conv.id)}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                opacity: conv.isDeleted ? 0.6 : 1,
              }}
            >
              <ListItemText
                primary={
                  conv.isDeleted
                    ? `[Deleted${conv.deletedReason ? `: ${conv.deletedReason}` : ''}]`
                    : conv.content.substring(0, 100) + (conv.content.length > 100 ? '...' : '')
                }
                secondary={`${conv.author.username} • ${conv.replies?.length || 0} replies • ${formatDistanceToNow(
                  new Date(conv.createdAt),
                  { addSuffix: true }
                )}`}
                primaryTypographyProps={{
                  sx: { fontStyle: conv.isDeleted ? 'italic' : 'normal' },
                }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
