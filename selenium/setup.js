const { Builder } = require("selenium-webdriver");
const edge = require("selenium-webdriver/edge");
const path = require("path");

async function createDriver() {
  const service = new edge.ServiceBuilder(
    path.join(process.cwd(), "drivers", "msedgedriver.exe")
  );

  const options = new edge.Options();

  return await new Builder()
    .forBrowser("MicrosoftEdge")
    .setEdgeService(service)
    .setEdgeOptions(options)
    .build();
}

module.exports = { createDriver };