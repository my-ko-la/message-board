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
