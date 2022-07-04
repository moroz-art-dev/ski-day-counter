const { createServer } = require("http");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { ApolloServer, gql } = require("apollo-server-express");
const { MockList } = require("@graphql-tools/mock");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const express = require("express");

(async function () {
  const typeDefs = gql`
    scalar Date

    """
    An object that describes the characteristics of a ski day
    """
    type SkiDay {
      "A ski day's unique identifier"
      id: ID!
      date: Date!
      mountain: String!
      conditions: Conditions
    }

    enum Conditions {
      POWDER
      HEAVY
      ICE
      THIN
    }

    type Query {
      totalDays: Int!
      allDays: [SkiDay!]!
    }

    input AddDayInput {
      date: Date!
      mountain: String!
      conditions: Conditions
    }

    type RemoveDayPayload {
      day: SkiDay!
      remove: Boolean
      totalBefore: Int
      totalAfter: Int
    }

    type Mutation {
      addDay(input: AddDayInput!): SkiDay!
      removeDay(id: ID!): RemoveDayPayload!
    }

    type Subscription {
      newDay: SkiDay!
    }
  `;

  // const resolvers = {

  // }

  const mocks = {
    Date: () => "1/2/2025",
    String: () => "Cool date",
    Query: () => ({
      allDays: () => new MockList([1, 15]),
    }),
  };

  const app = express();
  const httpServer = createServer(app);

  const schema = makeExecutableSchema({
    typeDefs,
    mocks,
    // resolvers,
  });

  const subscriptionServer = SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: "/graphql" }
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}/graphql`)
  );
})();
