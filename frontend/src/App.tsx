import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button, Typography, Container } from '@mui/material';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { AllConversationsPage } from './pages/AllConversationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ConversationViewPage } from './pages/ConversationViewPage';
import { useSession } from './contexts/SessionContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { session, loading: sessionLoading, error: sessionError, retry } = useSession();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [sidebarMessageId, setSidebarMessageId] = useState<string | null>(null);

  // Loading state
  if (sessionLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Connecting to server...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 3,
          }}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Failed to Initialize Session
            </Typography>
            <Typography variant="body2">
              {sessionError || 'Could not connect to the backend server.'}
            </Typography>
          </Alert>
          <Button variant="contained" onClick={retry} size="large">
            Retry Connection
          </Button>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Make sure the backend server is running on http://localhost:3000
            <br />
            Run: npm run dev -w backend
          </Typography>
        </Box>
      </Container>
    );
  }

  const doOpenMessageInSidebar = (messageId: string) => {
    setSidebarMessageId(messageId);
    setRightSidebarOpen(true);
  };

  return (
    <Layout
      rightSidebarOpen={rightSidebarOpen}
      onRightSidebarClose={() => setRightSidebarOpen(false)}
      rightSidebarContent={
        sidebarMessageId ? (
          <ConversationViewPage
            conversationId={sidebarMessageId}
            onOpenInSidebar={doOpenMessageInSidebar}
          />
        ) : null
      }
    >
      <Routes>
        <Route path="/" element={<ErrorBoundary level="page"><HomePage /></ErrorBoundary>} />
        <Route path="/conversations" element={<ErrorBoundary level="page"><AllConversationsPage /></ErrorBoundary>} />
        <Route
          path="/conversation/:id"
          element={<ErrorBoundary level="page"><ConversationViewPage onOpenInSidebar={doOpenMessageInSidebar} /></ErrorBoundary>}
        />
        <Route path="/settings" element={<ErrorBoundary level="page"><SettingsPage /></ErrorBoundary>} />
      </Routes>
    </Layout>
  );
}

export default App;
