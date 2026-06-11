import { createDriver } from "./setup.js";

async function test() {
  const driver = await createDriver();

  await driver.get("https://www.google.com");

  console.log(await driver.getTitle());

  await driver.quit();
}

test();