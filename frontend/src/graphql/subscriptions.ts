import { gql } from '@apollo/client';

export const MESSAGE_CREATED_SUBSCRIPTION = gql`
  subscription messageCreated($conversationId: ID) {
    messageCreated(conversationId: $conversationId) {
      id
      content
      isDeleted
      deletedReason
      author {
        id
        username
        role
      }
      parentMessage {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

export const MESSAGE_DELETED_SUBSCRIPTION = gql`
  subscription messageDeleted($conversationId: ID) {
    messageDeleted(conversationId: $conversationId) {
      id
      content
      isDeleted
      deletedReason
      author {
        id
        username
        role
      }
      parentMessage {
        id
      }
      createdAt
      updatedAt
    }
  }
`;
