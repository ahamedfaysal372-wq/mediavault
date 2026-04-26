const { CosmosClient } = require('@azure/cosmos');

let client;
let container;

async function getCosmosContainer() {
  if (container) return container;

  client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
  });

  const dbName = process.env.COSMOS_DATABASE || 'mediavaultdb';
  const containerName = process.env.COSMOS_CONTAINER || 'media';

  // Create DB and container if they don't exist
  const { database } = await client.databases.createIfNotExists({ id: dbName });
  const { container: c } = await database.containers.createIfNotExists({
    id: containerName,
    partitionKey: { paths: ['/mediaType'] },
  });

  container = c;
  console.log(`[CosmosDB] Connected to database: ${dbName}, container: ${containerName}`);
  return container;
}

module.exports = { getCosmosContainer };
