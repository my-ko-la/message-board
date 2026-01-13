import type http from "http";
import { WebSocketServer } from "ws";
import { PubSub } from "graphql-subscriptions";
import { useServer } from "graphql-ws/use/ws";
import { parse } from "graphql";

import type { Context } from ".keystone/types";
import { extendGraphqlSchema } from "./extra-graphql";

// Setup pubsub as a Global variable in dev so it survives Hot Reloads.
declare global {
  var graphqlSubscriptionPubSub: PubSub
}

export const pubSub = global.graphqlSubscriptionPubSub || new PubSub()
globalThis.graphqlSubscriptionPubSub = pubSub

export function extendHttpServer(
  httpServer: http.Server,
  commonContext: Context,
) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/api/graphql",
  });

  useServer(
    {
      schema: extendGraphqlSchema(commonContext.graphql.schema),
      context: async (ctx: any) => {
        return commonContext;
      },
      onConnect: (ctx: any) => {
        console.log('🔌 WebSocket client connected');
        return true;
      },
      onDisconnect: (ctx: any, code, reason) => {
        console.log('🔌 WebSocket client disconnected:', code, reason);
      },
      onError: (ctx: any, message, errors) => {
        console.error('❌ WebSocket error:', message, errors);
      },
    },
    wss,
  );

  console.log(
    "✅ WebSocket server initialized on ws://localhost:3000/api/graphql",
  );
}
