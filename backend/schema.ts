import { list } from '@keystone-6/core';
import { text, relationship, timestamp, select, checkbox } from '@keystone-6/core/fields';

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
      resolveInput: async ({ resolvedData, context, operation }) => {
        // Auto-set conversation field on create
        if (operation === 'create') {
          const parentId = resolvedData.parentMessage?.connect?.id;

          if (parentId) {
            // Reply: get parent's conversation (or parent itself if it's root)
            const parent = await context.query.Message.findOne({
              where: { id: parentId },
              query: 'id conversation { id }',
            });

            if (parent) {
              // Use parent's conversation, or parent itself if no conversation (parent is root)
              const conversationId = parent.conversation?.id || parentId;
              resolvedData.conversation = { connect: { id: conversationId } };
            }
          }
          // If no parent, this is a root message - conversation will be set in afterOperation
        }
        return resolvedData;
      },
      afterOperation: async ({ operation, item, context }) => {
        // For root messages, set conversation to self
        if (operation === 'create' && item) {
          const message = await context.query.Message.findOne({
            where: { id: item.id.toString() },
            query: 'id parentMessage { id } conversation { id }',
          });

          // If no parent and no conversation, this is a root - point to self
          if (message && !message.parentMessage && !message.conversation) {
            await context.db.Message.updateOne({
              where: { id: item.id.toString() },
              data: { conversation: { connect: { id: item.id.toString() } } },
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
      // The root message of this conversation thread
      conversation: relationship({
        ref: 'Message',
        ui: {
          displayMode: 'cards',
          cardFields: ['content'],
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
