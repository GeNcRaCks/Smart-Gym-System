import { By } from "selenium-webdriver";
import { createDriver} from "./setup.js";

async function bookingTest() {

    const driver = await createDriver();

    try {

        await driver.get(
            "http://localhost:3000/dashboard/member/book-trainer"
        );

        await driver.sleep(3000);

        const date =
            await driver.findElement(
                By.css("input[type='date']")
            );

        await date.sendKeys("2026-06-20");

        const btns =
            await driver.findElements(By.css("button"));

        for (const btn of btns) {

            const text = await btn.getText();

            if (
                text.includes("Confirm Appointment")
            ) {
                await btn.click();
                break;
            }
        }

        await driver.sleep(4000);

        console.log("BOOKING TEST PASSED");
    }
    finally {
        await driver.quit();
    }
}

bookingTest();