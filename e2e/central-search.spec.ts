import { test, expect } from "@playwright/test";

test("busca a personagem diretamente no palco central", async ({ page }) => {
  const apiFailures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/aion-api/") && !response.ok())
      apiFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await expect(page.getByLabel("Nickname")).toHaveValue("Aseo");
  await expect(page.getByLabel("Servidor")).toHaveValue("Zikel");
  await page.getByRole("button", { name: "Buscar personagem" }).click();
  await expect(page.getByRole("button", { name: "Buscar personagem" })).toBeVisible({ timeout: 60_000 });
  expect(apiFailures).toEqual([]);
  await expect(page.locator(".heroSearch em")).toHaveCount(0);
  await expect(page.getByText("Espada de Kromede Furiosa")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Aseo", { exact: true }).first()).toBeVisible();
});
