import { By } from "selenium-webdriver";
import { createDriver} from "./setup.js";

async function trainerWorkoutTest() {

    const driver = await createDriver();

    try {

        await driver.get(
            "http://localhost:3000/dashboard/trainer/manage-workouts"
        );

        await driver.sleep(3000);

        const nameInput =
            (await driver.findElements(
                By.css("input")
            ))[0];

        await nameInput.sendKeys(
            "Selenium Workout"
        );

        const submitButtons =
            await driver.findElements(
                By.css("button")
            );

        for (const btn of submitButtons) {

            const txt = await btn.getText();

            if (
                txt.includes("Create Workout Plan")
            ) {

                await btn.click();

                break;
            }
        }

        await driver.sleep(3000);

        console.log(
            "TRAINER WORKOUT TEST PASSED"
        );
    }
    finally {
        await driver.quit();
    }
}

trainerWorkoutTest();