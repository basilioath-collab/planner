import { expect, test } from "@playwright/test";

test("navega pelos módulos V4 sem sobrepor o armário", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Combate" }).click();
  await expect(page.getByRole("heading", { name: "Análise de combate" })).toBeVisible();
  await expect(page.locator(".workspace")).toBeHidden();
  await expect(page.locator("main > .floating")).toBeHidden();

  await page.getByRole("button", { name: "Mercado" }).click();
  await expect(page.getByRole("heading", { name: "Observatório de mercado" })).toBeVisible();
  await page.getByPlaceholder("Nome exato do item").fill("Item de teste");
  await page.getByPlaceholder("Preço alvo").fill("1200");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText("Item de teste")).toBeVisible();

  await page.getByRole("button", { name: "Pets" }).click();
  await expect(page.getByRole("heading", { name: "Coleção de pets" })).toBeVisible();
});
