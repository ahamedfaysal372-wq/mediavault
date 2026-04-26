// Application Insights must be initialised FIRST before any other requires
const appInsights = require('applicationinsights');

function initAppInsights() {
  if (!process.env.APPINSIGHTS_CONNECTION_STRING) {
    console.warn('[AppInsights] No connection string found – monitoring disabled.');
    return;
  }

  appInsights
    .setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setSendLiveMetrics(true)
    .start();

  console.log('[AppInsights] Azure Application Insights initialised.');
}

module.exports = { initAppInsights };
