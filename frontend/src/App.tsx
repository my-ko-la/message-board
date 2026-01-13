import { useState } from 'react';
import { Box, CircularProgress, Alert, Button, Typography, Container } from '@mui/material';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { AllConversationsPage } from './pages/AllConversationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ConversationViewPage } from './pages/ConversationViewPage';
import { Page } from './components/Layout/LeftSidebar';
import { useSession } from './contexts/SessionContext';

type ViewState =
  | { type: 'page'; page: Page }
  | { type: 'conversation'; id: string };

function App() {
  const { session, loading, error, retry } = useSession();
  const [viewState, setViewState] = useState<ViewState>({ type: 'page', page: 'home' });
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [sidebarMessageId, setSidebarMessageId] = useState<string | null>(null);

  // Loading state
  if (loading) {
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
  if (error || !session) {
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
              {error || 'Could not connect to the backend server.'}
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

  const handleNavigate = (page: Page) => {
    setViewState({ type: 'page', page });
  };

  const handleOpenConversation = (id: string) => {
    setViewState({ type: 'conversation', id });
  };

  const handleOpenInSidebar = (messageId: string) => {
    setSidebarMessageId(messageId);
    setRightSidebarOpen(true);
  };

  const handleBackToHome = () => {
    setViewState({ type: 'page', page: 'home' });
  };

  const renderContent = () => {
    if (viewState.type === 'conversation') {
      return (
        <ConversationViewPage
          conversationId={viewState.id}
          onOpenInSidebar={handleOpenInSidebar}
          onBack={handleBackToHome}
        />
      );
    }

    switch (viewState.page) {
      case 'home':
        return <HomePage onOpenConversation={handleOpenConversation} />;
      case 'conversations':
        return <AllConversationsPage onOpenConversation={handleOpenConversation} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onOpenConversation={handleOpenConversation} />;
    }
  };

  const currentPage = viewState.type === 'page' ? viewState.page : 'conversations';

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      rightSidebarOpen={rightSidebarOpen}
      onRightSidebarClose={() => setRightSidebarOpen(false)}
      rightSidebarContent={
        sidebarMessageId ? (
          <ConversationViewPage
            conversationId={sidebarMessageId}
            onOpenInSidebar={handleOpenInSidebar}
          />
        ) : null
      }
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
