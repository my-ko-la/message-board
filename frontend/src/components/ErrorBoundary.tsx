import React, { Component, ReactNode } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type ErrorLevel = 'root' | 'page' | 'component';

interface ErrorBoundaryProps {
  children: ReactNode;
  level: ErrorLevel;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoBack = (): void => {
    window.history.back();
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { level } = this.props;
    const { error } = this.state;

    if (level === 'root') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The application encountered an unexpected error. Please reload the page to try again.
            </Typography>
            {error && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mt: 2,
                  p: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxWidth: '100%',
                  textAlign: 'left',
                }}
              >
                {error.message}
              </Typography>
            )}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReload}
            size="large"
          >
            Reload App
          </Button>
        </Box>
      );
    }

    if (level === 'page') {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Paper elevation={2} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="error">
              Page Error
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This page encountered an error and could not be displayed.
            </Typography>
            {error && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mb: 3,
                  p: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxWidth: '100%',
                  textAlign: 'left',
                }}
              >
                {error.message}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={this.handleGoBack}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    // component level - minimal inline error
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        <Typography variant="body2">
          Failed to load this content.{' '}
          <Button size="small" onClick={this.handleRetry}>
            Retry
          </Button>
        </Typography>
      </Alert>
    );
  }
}
