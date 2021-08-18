
import { ApolloServer } from 'apollo-server'
import { ApolloGateway } from '@apollo/gateway';
import { resolve } from 'path';
import { readFileSync } from 'fs';
const supergraphPath = resolve(__dirname, '../../../supergraph.graphql');
const supergraphSdl = readFileSync(supergraphPath).toString();

const gateway = new ApolloGateway({ supergraphSdl })
const server = new ApolloServer({
  gateway,
  subscriptions: false
})

server.listen({ port: process.env.PORT || 3000 }).then(async ({ url }) => {
  console.log(`\
🚀 Server ready at: ${url}
⭐️ See sample queries: http://pris.ly/e/ts/graphql#using-the-graphql-api
  `)
})
