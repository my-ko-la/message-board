import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from '../contexts/SessionContext';
import { GET_USER_CONVERSATIONS, GET_RECENT_ACTIVITY } from '../graphql/queries';
import { Message } from '../types/graphql';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  const { data: conversationsData, loading: conversationsLoading } = useQuery(GET_USER_CONVERSATIONS, {
    variables: { userId: session?.userId },
    skip: !session?.userId,
    pollInterval: 30000,
  });

  const { data: activityData, loading: activityLoading } = useQuery(GET_RECENT_ACTIVITY, {
    variables: { userId: session?.userId },
    skip: !session?.userId,
    pollInterval: 30000,
  });

  const handleOpenConversation = (conversationId: string) => {
    navigate(`/conversation/${conversationId}`);
  };

  if (!session) {
    return (
      <Box>
        <Typography>Loading session...</Typography>
      </Box>
    );
  }

  const userConversations = conversationsData?.messages || [];
  const recentActivity = activityData?.messages || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>

      {/* User Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Display Name
              </Typography>
              <Typography variant="body1">{session.username}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Role
              </Typography>
              <Chip
                label={session.role}
                color={
                  session.role === 'SUPER_ADMIN'
                    ? 'error'
                    : session.role === 'ADMIN'
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Stats
              </Typography>
              <Typography variant="body1">
                {userConversations.length} conversations started
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Session ID (for testing)
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {session.sessionId}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Your Conversations Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Conversations
        </Typography>
        {conversationsLoading ? (
          <CircularProgress size={24} />
        ) : userConversations.length > 0 ? (
          <List>
            {userConversations.slice(0, 5).map((conv: Message) => (
              <ListItem
                key={conv.id}
                button
                onClick={() => handleOpenConversation(conv.id)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={conv.content.substring(0, 80) + (conv.content.length > 80 ? '...' : '')}
                  secondary={`${conv.replies?.length || 0} replies • ${formatDistanceToNow(
                    new Date(conv.createdAt),
                    { addSuffix: true }
                  )}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            You haven't started any conversations yet. Go to All Conversations to create one!
          </Alert>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Activity Section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Activity on Your Conversations
        </Typography>
        {activityLoading ? (
          <CircularProgress size={24} />
        ) : recentActivity.length > 0 ? (
          <List>
            {recentActivity
              .filter((activity: Message) => activity.parentMessage)
              .map((activity: Message) => (
                <ListItem
                  key={activity.id}
                  button
                  onClick={() => handleOpenConversation(activity.parentMessage!.id)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={`${activity.author.username} replied: "${activity.content.substring(
                      0,
                      60
                    )}${activity.content.length > 60 ? '...' : ''}"`}
                    secondary={`On: "${activity.parentMessage!.content.substring(0, 50)}..." • ${formatDistanceToNow(
                      new Date(activity.createdAt),
                      { addSuffix: true }
                    )}`}
                  />
                </ListItem>
              ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            No recent activity on your conversations
          </Typography>
        )}
      </Box>
    </Box>
  );
};
