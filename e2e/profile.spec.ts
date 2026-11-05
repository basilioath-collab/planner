import { test, expect } from "@playwright/test";
test("atualiza pelo nickname e servidor com detalhes oficiais", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page.getByText("Espada de Kromede Furiosa").first()).toBeVisible({timeout:60_000});
  await expect(page.getByLabel("Aparências equipadas").locator("figure")).toHaveCount(13);
  await expect(page.getByText("VISUAL EQUIPADO")).toBeVisible();
  await expect.poll(() => page.locator(".gearTiles button").first().evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(52);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect.poll(() => page.locator(".appearanceItems img").evaluateAll((images: HTMLImageElement[]) => images.every(image => image.complete && image.naturalWidth > 0)), { timeout: 15_000 }).toBe(true);
  await page.screenshot({ path: "artifacts/aseo-v2-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/aseo-v2-mobile.png" });
  await page.setViewportSize({ width: 3440, height: 1440 });
  await page.screenshot({ path: "artifacts/aseo-v2-ultrawide.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByText("2.770").first()).toBeVisible();
  await page
    .getByRole("button", { name: /Arma Espada de Kromede Furiosa/ })
    .click();
  await expect(page.getByText("BUILD ATUAL", {exact:true})).toBeVisible();
  await expect(page.getByText("CENÁRIO PLANEJADO", {exact:true})).toBeVisible();
  await expect(page.getByLabel("Adicional 1", {exact:true})).toBeVisible();
  await page.getByLabel("Fechar").click();
  await page.getByRole("button", { name: "Arcanas" }).click();
  await expect(page.locator(".modulePage .arcanaPanel")).toBeVisible();
  await expect(page.locator(".dock .arcanaPanel")).toHaveCount(0);
  const arts = page.locator(".arcanaArt img");
  await expect(arts).toHaveCount(5);
  for (let i = 0; i < 5; i++)
    await expect(arts.nth(i)).toHaveAttribute(
      "src",
      /^\/aion-api\/asset\?name=Icon_Arcana_/,
    );
});
