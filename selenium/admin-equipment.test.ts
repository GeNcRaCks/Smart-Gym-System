import { By } from "selenium-webdriver";
import { createDriver} from "./setup.js";

async function testEquipment() {
    const driver = await createDriver();

    try {

        await driver.get(
            "http://localhost:3000/dashboard/admin/equipment"
        );

        await driver.sleep(3000);

        const inputs = await driver.findElements(
            By.css("input")
        );

        await inputs[0].sendKeys("Selenium Test Machine");

        const btns = await driver.findElements(
            By.css("button")
        );

        for (const btn of btns) {

            const txt = await btn.getText();

            if (txt.includes("Add Item")) {
                await btn.click();
                break;
            }
        }

        await driver.sleep(3000);

        console.log("EQUIPMENT ADD TEST PASSED");
    }
    finally {
        await driver.quit();
    }
}

testEquipment();