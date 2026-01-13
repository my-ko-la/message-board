import type { GraphQLSchema } from "graphql";
import { mergeSchemas } from "@graphql-tools/schema";
import { pubSub } from "./websocket";

export const extendGraphqlSchema = (schema: GraphQLSchema) =>
  mergeSchemas({
    schemas: [schema],
    typeDefs: `
      type Mutation {
        deleteMessageWithReason(id: ID!, reason: String, userId: ID!): Message
      }

      type Subscription {
        messageCreated(conversationId: ID): Message
        messageDeleted(conversationId: ID): Message
      }
    `,

    resolvers: {
      Mutation: {
        deleteMessageWithReason: async (
          root,
          { id, reason, userId },
          context,
        ) => {
          const user = await context.query.User.findOne({
            where: { id: userId },
            query: "id role",
          });

          if (!user) {
            throw new Error("User not found");
          }

          const message = await context.query.Message.findOne({
            where: { id },
            query: "id author { id }",
          });

          if (!message) {
            throw new Error("Message not found");
          }

          const isOwner = message.author?.id === userId;
          const isSuperAdmin = user.role === "SUPER_ADMIN";

          if (user.role === "USER" && !isOwner) {
            throw new Error("Users can only delete their own messages");
          }

          if (!isSuperAdmin && !reason) {
            throw new Error("Deletion reason is required");
          }

          const deletedReason =
            isSuperAdmin && !reason ? "Deleted by Super Admin" : reason;

          const updatedMessage = await context.query.Message.updateOne({
            where: { id },
            data: {
              isDeleted: true,
              deletedReason,
            },
            query:
              "id content isDeleted deletedReason author { id username role } parentMessage { id } createdAt updatedAt",
          });

          pubSub.publish("MESSAGE_DELETED", {
            messageDeleted: updatedMessage,
          });

          return updatedMessage;
        },
      },

      Subscription: {
        messageCreated: {
          resolve: async (payload, args, context) => {
            const message = payload.messageCreated;
            const { conversationId } = args;

            console.log('✅ Subscription resolver - payload:', {
              messageId: message?.id,
              filterConversationId: conversationId || 'none (all messages)',
              messageParentId: message?.parentMessage?.id || 'none (top-level)',
            });

            // If no filter, return all messages
            if (!conversationId) {
              console.log('  ➡️ No filter - returning message');
              return message;
            }

            // If message IS the conversation starter
            if (message.id === conversationId) {
              console.log('  ➡️ Message is the conversation - returning message');
              return message;
            }

            // If message is a direct reply to the conversation
            if (message.parentMessage?.id === conversationId) {
              console.log('  ➡️ Direct reply - returning message');
              return message;
            }

            // For nested replies, traverse up the parent chain
            console.log('  🔍 Checking parent chain...');
            let currentParentId = message.parentMessage?.id;
            let depth = 0;
            const maxDepth = 10; // Prevent infinite loops

            while (currentParentId && depth < maxDepth) {
              const parent = await context.query.Message.findOne({
                where: { id: currentParentId },
                query: 'id parentMessage { id }',
              });

              if (!parent) {
                console.log('  ⚠️ Parent not found, stopping traversal');
                break;
              }

              console.log(`  📝 Checking parent: ${parent.id}`);

              if (parent.id === conversationId) {
                console.log('  ✅ Found conversation in parent chain - returning message');
                return message;
              }

              currentParentId = parent.parentMessage?.id;
              depth++;
            }

            console.log('  ❌ Message not in this conversation - returning null');
            return null;
          },
          subscribe: () => {
            console.log("🔔 Client subscribed to messageCreated");
            return pubSub.asyncIterator(["MESSAGE_CREATED"]);
          }
        },

        messageDeleted: {
          resolve: async (payload, args, context) => {
            const message = payload.messageDeleted;
            const { conversationId } = args;

            console.log('✅ Subscription resolver (deleted) - payload:', {
              messageId: message?.id,
              filterConversationId: conversationId || 'none (all messages)',
            });

            // Same filtering logic as messageCreated
            if (!conversationId) {
              return message;
            }

            if (message.id === conversationId) {
              return message;
            }

            if (message.parentMessage?.id === conversationId) {
              return message;
            }

            // Traverse parent chain
            let currentParentId = message.parentMessage?.id;
            let depth = 0;
            const maxDepth = 10;

            while (currentParentId && depth < maxDepth) {
              const parent = await context.query.Message.findOne({
                where: { id: currentParentId },
                query: 'id parentMessage { id }',
              });

              if (!parent) break;
              if (parent.id === conversationId) return message;

              currentParentId = parent.parentMessage?.id;
              depth++;
            }

            return null;
          },
          subscribe: () => {
            console.log("🔔 Client subscribed to messageDeleted");
            return pubSub.asyncIterator(["MESSAGE_DELETED"]);
          }
        },
      },
    },
  });
