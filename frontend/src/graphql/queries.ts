import { gql } from '@apollo/client';

export const GET_CONVERSATIONS = gql`
  query GetConversations($where: MessageWhereInput, $orderBy: [MessageOrderByInput!]!) {
    messages(where: $where, orderBy: $orderBy) {
      id
      content
      isDeleted
      deletedReason
      createdAt
      updatedAt
      author {
        id
        username
        role
      }
      replies {
        id
      }
    }
  }
`;

export const GET_CONVERSATION_WITH_REPLIES = gql`
  query GetConversationWithReplies($id: ID!) {
    message(where: { id: $id }) {
      id
      content
      isDeleted
      deletedReason
      createdAt
      updatedAt
      author {
        id
        username
        role
      }
      parentMessage {
        id
        content
        author {
          id
          username
        }
      }
      replies {
        id
        content
        isDeleted
        deletedReason
        createdAt
        updatedAt
        author {
          id
          username
          role
        }
        replies {
          id
          content
          isDeleted
          deletedReason
          createdAt
          author {
            id
            username
            role
          }
        }
      }
    }
  }
`;

export const GET_USER_CONVERSATIONS = gql`
  query GetUserConversations($userId: ID!) {
    messages(where: { author: { id: { equals: $userId } }, parentMessage: null }) {
      id
      content
      isDeleted
      createdAt
      author {
        id
        username
      }
      replies {
        id
      }
    }
  }
`;

export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($userId: ID!) {
    messages(
      where: {
        parentMessage: {
          author: { id: { equals: $userId } }
        }
      }
      orderBy: { createdAt: desc }
      take: 10
    ) {
      id
      content
      createdAt
      author {
        id
        username
      }
      parentMessage {
        id
        content
      }
    }
  }
`;
