import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import App from './App.tsx';
import { apolloClient } from './lib/apolloClient.ts';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { SessionProvider } from './contexts/SessionContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>
);
