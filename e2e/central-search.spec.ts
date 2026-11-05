import { test, expect } from "@playwright/test";
import path from "node:path";

test("busca a personagem pelo cabeçalho permanente", async ({ page }) => {
  const apiFailures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/aion-api/") && !response.ok())
      apiFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("/");
  await expect(page.getByLabel("Nickname")).toHaveValue("Aseo");
  await expect(page.getByLabel("Servidor")).toHaveValue("Zikel");
  await expect(page.locator("header .headerSearch")).toBeVisible();
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page.getByRole("button", { name: "Pesquisar" })).toBeVisible({ timeout: 60_000 });
  expect(apiFailures).toEqual([]);
  await expect(page.locator(".heroSearch em")).toHaveCount(0);
  await expect(page.getByText("Espada de Kromede Furiosa").first()).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("Aseo", { exact: true }).first()).toBeVisible();
  await page.locator('.emptyHero input[type="file"]').setInputFiles(path.join(process.cwd(), "public", "deus-research-base-original.png"));
  await expect(page.locator(".portraitFrame")).toBeVisible();
  await page.screenshot({ path: "artifacts/aseo-v2-portrait-frame.png" });
});
