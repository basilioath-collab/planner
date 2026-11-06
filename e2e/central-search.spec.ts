import { expect, test } from "@playwright/test";
test("mantém pesquisa e contexto do personagem no cabeçalho", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Nickname")).toHaveValue("Aseo");
  await expect(page.getByLabel("Servidor")).toHaveValue("Zikel");
  await expect(page.locator(".heroLookup")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aseo" })).toBeVisible();
  await expect(page.getByText("PAD PLAN", { exact: true })).toBeVisible();
});
