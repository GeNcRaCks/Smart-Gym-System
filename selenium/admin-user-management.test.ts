import { By, until } from "selenium-webdriver";
import { createDriver } from "./setup.js";

async function testUsers() {
    const driver = await createDriver();

    try {
        // 1. Open page
        await driver.get("http://localhost:3000/dashboard/admin/users");

        // 2. Wait for table body to exist
        const tableBody = await driver.wait(
            until.elementLocated(By.css("tbody")),
            10000
        );

        // 3. Wait until users are actually rendered (at least 1 row)
        await driver.wait(async () => {
            const rows = await driver.findElements(By.css("tbody tr"));
            return rows.length > 0;
        }, 10000);

        // 4. Now fetch rows
        const rows = await driver.findElements(By.css("tbody tr"));

        console.log("Total Users Found:", rows.length);

        // 5. Assertion-style check
        if (rows.length > 0) {
            console.log("USER MANAGEMENT TEST PASSED");
        } else {
            console.log("USER MANAGEMENT TEST FAILED");
        }

    } catch (err) {
        console.error("TEST FAILED WITH ERROR:", err);
    } finally {
        await driver.quit();
    }
}

testUsers();