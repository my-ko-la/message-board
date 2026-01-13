import type http from 'http';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { PubSub } from 'graphql-subscriptions';
import { parse } from 'graphql';

import type { Context } from '.keystone/types';

declare global {
  var graphqlSubscriptionPubSub: PubSub;
}

export const pubSub = global.graphqlSubscriptionPubSub || new PubSub();
globalThis.graphqlSubscriptionPubSub = pubSub;

export function extendHttpServer(httpServer: http.Server, commonContext: Context) {
  // Setup WebSocket server using 'ws'
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql',
  });

  useServer(
    {
      schema: commonContext.graphql.schema,
      onSubscribe: async (ctx: any, msg) => {
        const context = await commonContext.withRequest(ctx.extra.request);
        return {
          schema: commonContext.graphql.schema,
          operationName: msg.payload.operationName,
          document: parse(msg.payload.query),
          variableValues: msg.payload.variables,
          contextValue: context,
        };
      },
    },
    wss
  );

  console.log('✅ WebSocket server initialized on ws://localhost:3000/api/graphql');
}
