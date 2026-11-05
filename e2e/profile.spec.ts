import { test, expect } from "@playwright/test";
test("atualiza pelo nickname e servidor com detalhes oficiais", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTitle("Atualizar personagem").click();
  await expect(
    page.getByText("Atualizar personagem", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atualizar agora" }).click();
  await expect(page.getByText("Prévia antes de aplicar")).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByText(/21 slots atualizados/)).toBeVisible();
  await page.getByRole("button", { name: "Aplicar atualização" }).click();
  await expect(page.getByText("Espada de Kromede Furiosa")).toBeVisible();
  await expect(page.getByText("2.770")).toBeVisible();
  await page
    .getByRole("button", { name: /Arma Espada de Kromede Furiosa/ })
    .click();
  await expect(page.getByText(/Amplificação de Dano de Arma/).last()).toBeVisible();
  await page.getByLabel("Fechar").click();
  await page.getByRole("button", { name: "Arcanas" }).click();
  const arts = page.locator(".arcanaArt img");
  await expect(arts).toHaveCount(5);
  for (let i = 0; i < 5; i++)
    await expect
      .poll(() =>
        arts
          .nth(i)
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
      )
      .toBe(true);
});
