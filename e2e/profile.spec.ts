import { expect, test } from "@playwright/test";
import path from "node:path";
test("retrato, equipamentos e editor planejado funcionam", async ({ page }) => {
  await page.goto("/");
  await page.locator('.portraitEmpty input[type="file"]').setInputFiles(path.join(process.cwd(), "public", "deus-research-base-original.png"));
  await expect(page.locator(".portrait5.filled img")).toBeVisible();
  await page.getByRole("button", { name: /Arma/ }).click();
  await expect(page.getByRole("heading", { name: /equipamento/i })).toBeVisible();
  await page.getByPlaceholder("Nome original do item").fill("Espada de teste");
  await page.getByRole("button", { name: /Salvar na planejada/ }).click();
  await expect(page.getByText("Espada de teste")).toBeVisible();
  await expect(page.getByRole("button", { name: /Planejada/ })).toHaveClass(/on/);
});
test("layout responde em desktop, ultrawide e mobile", async ({ page }) => {
  for (const viewport of [{width:1920,height:1080},{width:3440,height:1440},{width:390,height:844}]) {
    await page.setViewportSize(viewport); await page.goto("/");
    await expect(page.locator(".v5shell")).toBeVisible();
    expect(await page.locator("body").evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
    if(viewport.width===1920) await page.screenshot({path:"artifacts/pad-plan-v5-desktop.png"});
    if(viewport.width===390) await page.screenshot({path:"artifacts/pad-plan-v5-mobile.png",fullPage:true});
  }
});
