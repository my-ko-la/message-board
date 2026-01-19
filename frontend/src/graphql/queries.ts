import { gql } from '@apollo/client';

export const GET_CONVERSATIONS = gql`
  query GetConversations(
    $where: MessageWhereInput
    $orderBy: [MessageOrderByInput!]!
    $take: Int
    $skip: Int
  ) {
    messages(where: $where, orderBy: $orderBy, take: $take, skip: $skip) {
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
    messagesCount(where: $where)
  }
`;

// Get all messages in a conversation (flat list)
export const GET_CONVERSATION_MESSAGES = gql`
  query GetConversationMessages($conversationId: ID!) {
    messages(
      where: { conversation: { id: { equals: $conversationId } } }
      orderBy: [{ createdAt: asc }]
    ) {
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
        author {
          id
          username
        }
      }
    }
  }
`;

// Get single message (for root message details)
export const GET_MESSAGE = gql`
  query GetMessage($id: ID!) {
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
