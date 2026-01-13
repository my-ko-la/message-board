import { config } from '@keystone-6/core';
import { lists } from './schema';
import { extendGraphqlSchema } from './graphql';
import { extendHttpServer } from './websocket';

export default config({
  db: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./keystone.db',
  },
  lists,
  graphql: {
    extendGraphqlSchema,
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
    extendHttpServer,
  },
  ui: {
    isAccessAllowed: () => true,
  },
});
