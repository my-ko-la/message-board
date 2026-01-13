import { list } from '@keystone-6/core';
import { text, relationship, timestamp, select, checkbox } from '@keystone-6/core/fields';
import { pubSub } from './websocket';

export const lists = {
  User: list({
    access: {
      operation: {
        query: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
    },
    fields: {
      username: text({ validation: { isRequired: true } }),
      sessionId: text({
        validation: { isRequired: true },
        isIndexed: 'unique',
      }),
      role: select({
        type: 'enum',
        options: [
          { label: 'User', value: 'USER' },
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Super Admin', value: 'SUPER_ADMIN' },
        ],
        defaultValue: 'USER',
        validation: { isRequired: true },
        ui: {
          displayMode: 'segmented-control',
        },
      }),
      messages: relationship({
        ref: 'Message.author',
        many: true
      }),
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
      }),
    },
  }),

  Message: list({
    access: {
      operation: {
        query: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
      },
    },
    hooks: {
      afterOperation: async ({ operation, item, context }) => {
        // Publish subscription events after message operations
        if (operation === 'create' && item) {
          const fullMessage = await context.query.Message.findOne({
            where: { id: item.id.toString() },
            query: 'id content isDeleted deletedReason author { id username role } parentMessage { id } createdAt updatedAt',
          });

          if (fullMessage) {
            console.log('📤 Publishing MESSAGE_CREATED event:', {
              id: fullMessage.id,
              content: fullMessage.content.substring(0, 50),
              author: fullMessage.author.username,
              parentMessage: fullMessage.parentMessage?.id || 'none (top-level)',
              createdAt: fullMessage.createdAt,
              updatedAt: fullMessage.updatedAt,
            });

            // Convert DateTime fields to ISO strings for subscription
            const messageForSubscription = {
              id: fullMessage.id,
              content: fullMessage.content,
              isDeleted: fullMessage.isDeleted,
              deletedReason: fullMessage.deletedReason,
              author: fullMessage.author,
              parentMessage: fullMessage.parentMessage,
              createdAt: new Date(fullMessage.createdAt).toISOString(),
              updatedAt: new Date(fullMessage.updatedAt).toISOString(),
            };

            pubSub.publish('MESSAGE_CREATED', {
              messageCreated: messageForSubscription,
            });
          }
        }
      },
    },
    fields: {
      content: text({
        validation: { isRequired: true },
        ui: {
          displayMode: 'textarea',
        },
      }),
      author: relationship({
        ref: 'User.messages',
        ui: {
          displayMode: 'cards',
          cardFields: ['username', 'role'],
          inlineCreate: { fields: ['username', 'sessionId'] },
          inlineEdit: { fields: ['username'] },
        },
      }),
      parentMessage: relationship({
        ref: 'Message.replies',
        ui: {
          displayMode: 'cards',
          cardFields: ['content'],
        },
      }),
      replies: relationship({
        ref: 'Message.parentMessage',
        many: true,
      }),
      isDeleted: checkbox({
        defaultValue: false,
      }),
      deletedReason: text({
        ui: {
          displayMode: 'textarea',
        },
      }),
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
      }),
      updatedAt: timestamp({
        db: { updatedAt: true },
      }),
    },
  }),
};
