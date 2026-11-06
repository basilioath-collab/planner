import { expect, test } from "@playwright/test";
test("arcanas são uma área dedicada e respeitam o limite", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Arcanas" }).click();
  await expect(page.getByRole("heading", { name: "Arcanas" })).toBeVisible();
  await expect(page.locator(".arcanaCard5")).toHaveCount(5);
  await expect(page.getByText("2 tentativas restantes").first()).toBeVisible();
});
test("navegação não reaproveita painéis da versão anterior", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Evolução" }).click();
  await expect(page.getByRole("heading", { name: "Próximos movimentos" })).toBeVisible();
  await expect(page.locator(".workspace,.modulePage,.floating")).toHaveCount(0);
});
