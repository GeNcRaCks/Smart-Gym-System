import { By, until } from "selenium-webdriver";
import { createDriver} from "./setup.js";

async function loginTest() {
    const driver = await createDriver();

    try {
        await driver.get("http://localhost:3000/login");

        await driver.findElement(By.css("input[type='email']"))
            .sendKeys("ali@gmail.com");

        await driver.findElement(By.css("input[type='password']"))
            .sendKeys("1234567");

        await driver.findElement(By.css("button[type='submit']"))
            .click();

        await driver.wait(
            until.urlContains("/dashboard"),
            10000
        );

        console.log("LOGIN TEST PASSED");
    }
    finally {
        await driver.quit();
    }
}

loginTest();