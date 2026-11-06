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
test("importa uma sessão real no medidor e alterna métricas", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Combate" }).click();
  await page.locator('.sessionRail input[type="file"]').setInputFiles({name:"luta.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify({name:"Teste local",duration:90,players:[{name:"Aseo",className:"Templário",damage:1200,healing:300,taken:80},{name:"Aliado",damage:800,healing:50,taken:120}]}))});
  await expect(page.getByText("Teste local")).toBeVisible();
  await expect(page.getByText("1.200")).toBeVisible();
  await page.getByRole("button",{name:"Cura"}).click();
  await expect(page.getByText("300")).toBeVisible();
});
test("coleções, chefes e eventos aceitam registros persistentes", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Coleção" }).click();
  await page.getByPlaceholder("Nome do mascote").fill("Atiel");
  await page.getByPlaceholder("Nível, almas ou origem").fill("Nível 3");
  await page.getByRole("button",{name:"Adicionar"}).click();
  await expect(page.getByText("Atiel")).toBeVisible();
  await page.reload(); await page.getByRole("button", { name: "Coleção" }).click();
  await expect(page.getByText("Atiel")).toBeVisible();
});
