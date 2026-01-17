import type { GraphQLSchema } from "graphql";
import { mergeSchemas } from "@graphql-tools/schema";

export const extendGraphqlSchema = (schema: GraphQLSchema) => {
  return mergeSchemas({
    schemas: [schema],
    typeDefs: `
      extend type Mutation {
        deleteMessageWithReason(id: ID!, reason: String, userId: ID!): Message
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

          return updatedMessage;
        },
      },
    },
  });
};
