import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import App from './App.tsx';
import { apolloClient } from './lib/apolloClient.ts';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { SessionProvider } from './contexts/SessionContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary level="root">
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <ThemeProvider>
            <SessionProvider>
              <App />
            </SessionProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
