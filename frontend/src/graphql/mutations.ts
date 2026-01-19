import { gql } from '@apollo/client';

// Create a new top-level conversation
export const CREATE_CONVERSATION = gql`
  mutation CreateConversation($content: String!, $authorId: ID!) {
    createMessage(
      data: {
        content: $content
        author: { connect: { id: $authorId } }
      }
    ) {
      id
      content
      isDeleted
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

// Create a reply to a message
export const CREATE_REPLY = gql`
  mutation CreateReply($content: String!, $authorId: ID!, $parentMessageId: ID!) {
    createMessage(
      data: {
        content: $content
        author: { connect: { id: $authorId } }
        parentMessage: { connect: { id: $parentMessageId } }
      }
    ) {
      id
      content
      isDeleted
      createdAt
      updatedAt
      author {
        id
        username
        role
      }
      parentMessage {
        id
      }
    }
  }
`;

// Delete message with reason (role-based)
export const DELETE_MESSAGE_WITH_REASON = gql`
  mutation DeleteMessageWithReason($id: ID!, $userId: ID!, $reason: String) {
    deleteMessageWithReason(id: $id, userId: $userId, reason: $reason) {
      id
      content
      isDeleted
      deletedReason
      deletedBy {
        id
        username
        role
      }
      updatedAt
    }
  }
`;

// Update user (for changing username or role)
export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $username: String, $role: UserRoleType) {
    updateUser(where: { id: $id }, data: { username: $username, role: $role }) {
      id
      username
      role
    }
  }
`;
