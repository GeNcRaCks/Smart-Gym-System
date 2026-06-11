import { Builder } from "selenium-webdriver";

(async () => {
  console.log("Creating driver...");

  const driver = await new Builder()
    .usingServer("http://127.0.0.1:4444/wd/hub")
    .forBrowser("MicrosoftEdge")
    .build();

  console.log("Driver created");

  await driver.get("https://example.com");

  await driver.sleep(5000);

  await driver.quit();
})();