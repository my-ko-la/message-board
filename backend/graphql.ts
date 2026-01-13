import type { GraphQLSchema } from 'graphql';
import { mergeSchemas } from '@graphql-tools/schema';
import { pubSub } from './websocket';

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
        deleteMessageWithReason: async (root, { id, reason, userId }, context) => {
          // Fetch the user to check their role
          const user = await context.query.User.findOne({
            where: { id: userId },
            query: 'id role',
          });

          if (!user) {
            throw new Error('User not found');
          }

          // Fetch the message to check ownership
          const message = await context.query.Message.findOne({
            where: { id },
            query: 'id author { id }',
          });

          if (!message) {
            throw new Error('Message not found');
          }

          // Role-based deletion logic
          const isOwner = message.author?.id === userId;
          const isSuperAdmin = user.role === 'SUPER_ADMIN';

          // Check permissions
          if (user.role === 'USER' && !isOwner) {
            throw new Error('Users can only delete their own messages');
          }

          // Require reason for USER and ADMIN (but not SUPER_ADMIN)
          if (!isSuperAdmin && !reason) {
            throw new Error('Deletion reason is required');
          }

          // Set the deletion reason
          const deletedReason = isSuperAdmin && !reason
            ? 'Deleted by Super Admin'
            : reason;

          // Update the message
          const updatedMessage = await context.query.Message.updateOne({
            where: { id },
            data: {
              isDeleted: true,
              deletedReason,
            },
            query: 'id content isDeleted deletedReason author { id username role } parentMessage { id } createdAt updatedAt',
          });

          console.log('📤 Publishing MESSAGE_DELETED event:', {
            id: updatedMessage.id,
            deletedBy: user.role,
          });

          // Publish deletion event
          pubSub.publish('MESSAGE_DELETED', {
            messageDeleted: updatedMessage,
          });

          return updatedMessage;
        },
      },

      Subscription: {
        messageCreated: {
          subscribe: () => pubSub.asyncIterator(['MESSAGE_CREATED']),
          resolve: async (payload: any, { conversationId }, context) => {
            const message = payload.messageCreated;

            console.log('📥 Subscription received message:', {
              messageId: message.id,
              filterConversationId: conversationId || 'none',
              parentMessageId: message.parentMessage?.id || 'none',
            });

            // If no conversationId filter, return all messages
            if (!conversationId) {
              console.log('✅ Returning message (no filter)');
              return message;
            }

            // Check if this message is the conversation itself
            if (message.id === conversationId) {
              console.log('✅ Message IS the conversation');
              return message;
            }

            // Check if this is a direct reply to the conversation
            if (message.parentMessage?.id === conversationId) {
              console.log('✅ Message is direct reply to conversation');
              return message;
            }

            // For nested replies, traverse up the parent chain
            console.log('🔍 Traversing parent chain for nested reply...');
            let currentMessage = message;
            while (currentMessage.parentMessage) {
              const parent = await context.query.Message.findOne({
                where: { id: currentMessage.parentMessage.id },
                query: 'id parentMessage { id }',
              });

              if (!parent) {
                console.log('⚠️ Parent not found, breaking chain');
                break;
              }

              console.log(`  Checking parent ${parent.id}`);

              if (parent.id === conversationId) {
                console.log('✅ Found matching conversation in parent chain');
                return message;
              }

              if (!parent.parentMessage) {
                if (parent.id === conversationId) {
                  console.log('✅ Parent is root and matches conversation');
                  return message;
                }
                console.log('❌ Reached root but does not match conversation');
                break;
              }

              currentMessage = parent;
            }

            console.log('❌ Message does not belong to this conversation');
            return null;
          },
        },

        messageDeleted: {
          subscribe: () => pubSub.asyncIterator(['MESSAGE_DELETED']),
          resolve: async (payload: any, { conversationId }, context) => {
            const message = payload.messageDeleted;

            if (!conversationId) {
              return message;
            }

            if (message.id === conversationId) {
              return message;
            }

            if (message.parentMessage?.id === conversationId) {
              return message;
            }

            // Traverse parent chain for nested messages
            let currentMessage = message;
            while (currentMessage.parentMessage) {
              const parent = await context.query.Message.findOne({
                where: { id: currentMessage.parentMessage.id },
                query: 'id parentMessage { id }',
              });

              if (!parent) break;

              if (parent.id === conversationId) {
                return message;
              }

              if (!parent.parentMessage) {
                if (parent.id === conversationId) {
                  return message;
                }
                break;
              }

              currentMessage = parent;
            }

            return null;
          },
        },
      },
    },
  });
