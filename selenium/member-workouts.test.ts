import { By, until } from "selenium-webdriver";
import { createDriver } from "./setup.js";

async function workoutTest() {
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

        // 4. Go to workouts page
        await driver.get("http://localhost:3000/dashboard/member/workouts");

        // 5. Wait for workouts to load
        await driver.wait(async () => {
            const buttons = await driver.findElements(
                By.xpath("//button[contains(text(),'Start Workout')]")
            );
            return buttons.length > 0;
        }, 15000);

        const buttons = await driver.findElements(
            By.xpath("//button[contains(text(),'Start Workout')]")
        );

        console.log("Workout Plans Found:", buttons.length);

        await buttons[0].click();

        console.log("MEMBER WORKOUT TEST PASSED");

    } catch (err) {
        console.error("TEST FAILED:", err);
    } finally {
        await driver.quit();
    }
}

workoutTest();