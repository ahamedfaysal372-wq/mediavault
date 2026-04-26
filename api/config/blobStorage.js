const { BlobServiceClient } = require('@azure/storage-blob');

let containerClient;

async function getBlobContainer() {
  if (containerClient) return containerClient;

  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );

  const containerName = process.env.BLOB_CONTAINER_NAME || 'mediavault-files';

  containerClient = blobServiceClient.getContainerClient(containerName);

  // Create container if it doesn't exist
  await containerClient.createIfNotExists({ access: 'blob' });

  console.log(`[BlobStorage] Connected to container: ${containerName}`);
  return containerClient;
}

module.exports = { getBlobContainer };
