const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient;
const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials;

function getVisionClient() {
  const endpoint = process.env.COMPUTER_VISION_ENDPOINT;
  const key = process.env.COMPUTER_VISION_KEY;

  if (!endpoint || !key) {
    console.warn('[ComputerVision] Not configured — skipping AI tagging');
    return null;
  }

  const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } });
  return new ComputerVisionClient(credentials, endpoint);
}

async function analyseImage(imageUrl) {
  try {
    const client = getVisionClient();
    if (!client) return [];

    const result = await client.analyzeImage(imageUrl, { visualFeatures: ['Tags'] });

    const tags = (result.tags || [])
      .filter(t => t.confidence > 0.7)
      .map(t => `ai:${t.name}`);

    console.log(`[ComputerVision] Tags generated: ${tags.join(', ')}`);
    return tags;
  } catch (err) {
    console.error('[ComputerVision] Error:', err.message);
    return [];
  }
}

module.exports = { analyseImage };