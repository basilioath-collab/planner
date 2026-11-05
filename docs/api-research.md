# Pesquisa da API de perfil

Consulta: 05/11/2026. Região principal: Global, América do Sul.

## Resultado

O Shugo.gg declara que não oferece API pública e que os dados de personagens e itens pertencem à NCSOFT. A página pública de perfil informa que os perfis são carregados ao vivo da API oficial com cache curto. A inspeção do HTML e do JavaScript público, sem autenticação ou contorno de proteção, confirmou os endpoints oficiais usados para o armory:

- `api-search.plaync.com/aion2global/search/v2/character`
- `aion2.plaync.com/api/character/info`
- `aion2.plaync.com/api/character/equipment`
- `aion2.plaync.com/api/character/equipment/item`
- `aion2.plaync.com/api/character/daevanion/detail` (árvore Daevanion, fora do importador de equipamento atual)

Ao solicitar atualização explícita, o cliente observado usa `cache: no-store` e acrescenta um parâmetro temporal. O ASEO replica somente esse comportamento de atualização sobre os endpoints oficiais; não consome nem apresenta como pública uma API interna do Shugo.

Em 05/11/2026, a lista de 25 registros equipados do perfil público da Aseo (equipamentos e arcanas) coincidiu slot, ID, aprimoramento e transcendência com a resposta oficial da NCSOFT.

## Fontes

- Shugo.gg, “AION 2 & Shugo.GG FAQ”: https://shugo.gg/faq
- Perfil público da Aseo: https://shugo.gg/pt-br/character/global/la-zikel/Aseo
- NCSOFT Aion 2 Global: https://aion2.plaync.com/

