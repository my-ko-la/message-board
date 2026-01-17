import { config } from '@keystone-6/core';
import { lists } from './schema';

export default config({
  db: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./keystone.db',
  },
  lists,
  graphql: {
    playground: true,
    apolloConfig: {
      introspection: true,
    },
  },
  server: {
    cors: {
      origin: '*',
      credentials: true,
    },
    port: 3000,
  },
  ui: {
    isAccessAllowed: () => true,
  },
});
