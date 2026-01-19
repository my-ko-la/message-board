import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/api/graphql',
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        messages: {
          // Cache separately per filter/sort combination
          keyArgs: ['where', 'orderBy'],
          merge(existing = [], incoming, { args }) {
            // If skip is 0 or undefined, this is a fresh query - replace cache
            if (!args?.skip) {
              return incoming;
            }
            // Otherwise append for pagination
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
