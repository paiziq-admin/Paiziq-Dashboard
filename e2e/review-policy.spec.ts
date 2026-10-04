import { expect, test } from "@playwright/test";
import { installMockApi, login } from "./support/mockApi";

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
  await login(page);
});

test("reviewer claims and approves a payment with a required note", async ({
  page,
}) => {
  await page.goto("/reviews");
  await expect(page.getByText("Review Details")).toBeVisible();
  await expect(page.getByLabel("Acting reviewer")).toHaveValue("alice@example.com");
  await expect(page.getByLabel("Acting reviewer")).toHaveAttribute("readonly", "");

  await page.getByRole("button", { name: "Approve" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Add an action note" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Claim" }).click();
  await expect(page.getByText("pay_1 claimed.")).toBeVisible();

  await page.getByLabel(/Reviewer notes/).fill("Purchase order verified");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(
    page.getByText("pay_1 approved and removed from the queue."),
  ).toBeVisible();
  await expect(page.getByText("Review queue is clear")).toBeVisible();
});

test("operator edits, saves, and publishes a policy draft", async ({ page }) => {
  await page.goto("/policies");
  await expect(page.getByText("Default payment policy").first()).toBeVisible();

  await page.getByLabel("Review threshold").fill("150");
  await page.getByLabel("Policy draft audit reason").fill(
    "Raise the manual-review threshold for the verified test policy",
  );
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved.")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText(/Published version 2/)).toBeVisible();
  await expect(page.getByText("Active v2")).toBeVisible();
});
