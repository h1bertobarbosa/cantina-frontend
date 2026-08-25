# AGENTS.md — Diretrizes para Agentes de IA e Desenvolvedores

## 1. Visão Geral

* **Linguagem:** JavaScript (ES2021+), sem TypeScript.
* **Runtime:** SPA client-side, Vue CLI 5 (`@vue/cli-service`) + webpack.
* **Frameworks principais:** Vue 3 (Composition API), Vue Router 4, Vuex 4, PrimeVue 4 (`@primeuix/themes` preset Aura) + PrimeIcons.
* **Persistência:** nenhuma local — toda a persistência é remota via API REST consumida por `fetch` (`src/services/apiService.js`). Autenticação por JWT em `localStorage` (`accessToken`).
* **Testes:** **Não determinado com confiança a partir do repositório atual.** Não há framework de teste configurado em `package.json`, nem diretório `tests/`.
* **Arquitetura:** monólito frontend simples, "page component" por feature — não segue Clean Architecture/MVC formal. Cada tela em `src/components/*Page.vue` (ou equivalente) contém template, estado, chamadas de API e estilos no mesmo arquivo (Single-File Component). Não há camada de "service"/"repository" por entidade — todas as páginas chamam `apiService` diretamente com endpoints REST hardcoded inline.
* Regras de negócio (validação de formulário, cálculo de totais, formatação, mapeamento de status/severidade) vivem dentro do `<script setup>` de cada componente de página. Não há camada de domínio separada.

## 2. Mapa do Repositório

| Caminho | Responsabilidade |
| --- | --- |
| `src/main.js` | Bootstrap da aplicação: registra Vuex, Router, PrimeVue (tema Aura), ToastService, VueTheMask, diretiva `v-maska` e CSS global. |
| `src/App.vue` | Shell raiz: `GlobalLoading`, `Toast` global e `RouterView`. |
| `src/router/index.js` | Definição de rotas e guard de autenticação (`requiresAuth`, checa `localStorage.accessToken`). |
| `src/store/index.js` | Vuex — hoje só controla um contador global de loading (`isLoading`). |
| `src/services/apiService.js` | Wrapper único de `fetch` (get/post/put/patch/delete) que injeta header de auth e dispara loading global. Ponto central de acesso à API. |
| `src/helper/api.js` | Exporta `baseUrl` a partir de `process.env.VUE_APP_BACKEND_BASE_URL`. |
| `src/helper/authHeader.js` | Monta header `Authorization: Bearer <token>` a partir do `localStorage`. |
| `src/layouts/DashboardLayout.vue` | Layout autenticado: sidebar, drawer mobile, toolbar, navegação e logout. Envolve todas as rotas `/dashboard/*`. |
| `src/components/*Page.vue`, `SignIn.vue`, `SignUp.vue`, `ChargeHistory.vue`, `DashBoard.vue` | Uma "página" por feature de negócio (Clientes, Produtos, Vendas, Faturas, Usuários, Dashboard, Login/Cadastro, Histórico). Cada uma é autocontida (fetch, validação, CRUD, layout). |
| `src/components/GlobalLoading.vue` | Overlay de loading ligado ao contador do Vuex. |
| `src/components/CustomPagination.vue`, `ClientCombo.vue`, `CurrencyInput.vue`, `Datepicker.vue` | **Não utilizados** em nenhuma tela atual (ver seção 6 — dívida técnica). |
| `src/composables/useDisplay.js` | Composable de breakpoint (`mobile`, `smAndDown`, `mdAndUp`) baseado em `window.innerWidth`. |
| `src/plugins/vuetify.js` | Shim que expõe `$vuetify.display` via `globalProperties` — não é o pacote Vuetify real (não está em `package.json`). Resquício de uma migração. |
| `src/directives/maska.js` | Diretiva customizada `v-maska` para máscara de telefone (não é o pacote `vue-the-mask`, embora `vue-the-mask` também esteja registrado globalmente em `main.js`). |
| `src/utils/formatDate.js` | `formatDate` (dd/mm/yyyy) e `formatDateHour` (dd/mm/yyyy HH:mm, locale pt-BR). |
| `src/assets/dashboard-theme.css` | Fonte única de verdade para variáveis visuais globais (`--app-*`) e overrides de componentes PrimeVue. |
| `LAYOUT_RULES.md` | Regras de UI/UX obrigatórias para qualquer tela nova ou refatorada — leia antes de mexer em layout. |
| `docker/` | `Dockerfile` + `nginx.conf` para build de produção servido via Nginx. |

## 3. Fluxo Arquitetural

Fluxo típico de uma tela de CRUD (ex.: `src/components/ClientsPage.vue`):

`Componente de página (`<script setup>`) → apiService.<verbo>(endpoint, payload) → fetch (com authHeader + baseUrl) → backend REST → response.json() tratado no próprio componente`

Não há camada intermediária de serviço por domínio (ex.: não existe `clientsService.js`); `apiService` é genérico (verbos HTTP) e cada página monta a URL/endpoint e trata a resposta localmente.

Regras de dependência observadas:
* Componentes de página importam de `services/`, `helper/`, `utils/`, `directives/` — nunca o inverso.
* `apiService.js` depende de `helper/authHeader.js`, `helper/api.js` e `store/index.js` (para o loading global). Não deve haver chamadas `fetch` diretas fora de `apiService` (ver seção 6).
* O router (`router/index.js`) é a única fonte de verdade sobre quais rotas exigem autenticação (`meta.requiresAuth`); a checagem usa `localStorage.accessToken` diretamente (não usa Vuex/estado reativo de auth).
* Não existe um módulo Vuex de autenticação — estado de sessão vive inteiramente em `localStorage` e é decodificado sob demanda com `jwt-decode` (ver `DashboardLayout.vue`, `UsersPage.vue`).

## 4. Convenções de Código

### Nomenclatura

* Componentes de página: `PascalCase` + sufixo `Page` quando fizer sentido (`ClientsPage.vue`, `SalesPage.vue`, `Billings.vue`, `UsersPage.vue` — o sufixo não é 100% uniforme, mas é o padrão dominante nas telas mais recentes).
* Variáveis reativas: `camelCase` (`loading`, `saving`, `deleting`, `showXDialog`, `currentX`, `xToDelete`, `xFormErrors`). Este padrão de nomes de estado (`show*Dialog`, `*ErrorMessages`, `formErrors`) se repete em todas as páginas de CRUD e deve ser seguido em telas novas.
* Payloads de API usam `camelCase` no client (`clientId`, `paymentMethod`, `purchasedAt`), refletindo o contrato JSON do backend.
* Parâmetros de query usam `page`, `perPage`, `search`, e ora `sortBy`/`orderBy` + `orderDir` — **inconsistente entre páginas** (ver seção 6).

### Organização de arquivos

* Single-File Components: `<template>` → `<script setup>` → `<style scoped>`, nesta ordem, em todas as páginas modernas.
* Todo CSS de página é `scoped` e usa exclusivamente as variáveis globais de `src/assets/dashboard-theme.css` (`--app-text`, `--app-text-muted`, `--app-border`, `--app-primary-soft`, `--app-primary-dark`, `--app-shadow`, `--app-card-radius`). Não hardcode cores/raios que já têm variável equivalente.
* Cada página de listagem segue a mesma estrutura de blocos: `page-header` (eyebrow + título + subtítulo + ação primária) → `Message` de erro geral → `Card` com toolbar + busca → `DataTable` com paginação (`Paginator`) → `Dialog`s de criar/editar, detalhes e exclusão. Siga esta estrutura ao criar uma tela nova (também exigido por `LAYOUT_RULES.md`).

### Imports e dependências

* Import relativo (`../services/apiService`, `../utils/formatDate`) é o padrão dominante em quase todas as páginas.
* `UsersPage.vue` usa o alias `@/` (`@/services/apiService`, `@/utils/formatDate`) configurado em `jsconfig.json`/`vue.config.js` — é o único arquivo que faz isso. **Inconsistência isolada**, não um padrão a replicar nem a "corrigir" preventivamente; ao tocar em `UsersPage.vue` prefira manter consistência com o restante do arquivo, e ao criar telas novas prefira import relativo (padrão dominante).
* Componentes PrimeVue são sempre importados individualmente (`import Button from 'primevue/button'`), nunca registrados globalmente em `main.js` (exceto `Toast`, via `ToastService`, e `PrimeVue` core). Siga esse padrão — não adicione registros globais de componentes PrimeVue.

### Validação

* Validação de formulário é sempre manual e local ao componente: função `validateForm`/`validateXForm` que popta um objeto `reactive` de erros (`formErrors`) e retorna um `boolean`. Não há biblioteca de validação (ex. vee-validate/yup) no projeto — não introduza uma sem necessidade clara, pois quebraria o padrão dominante.
* Mensagens de erro de campo aparecem como `<small class="field-error">` abaixo do input, condicionadas a `Boolean(formErrors.campo)` e à prop `:invalid` do componente PrimeVue.

### Erros

* Toda chamada de API segue o padrão: `try { const response = await apiService.x(...); const data = await response.json(); if (!response.ok) throw data.message || 'mensagem padrão'; ... } catch (error) { console.error('Contexto:', error); errosArray.value = normalizeMessages(error, fallback); } finally { loadingFlag.value = false; }`.
* Cada página redefine sua própria função `normalizeMessages(errorOrData, fallback)` — é copiada quase identicamente entre páginas (ver seção 6, candidato a extração para `utils/`, mas hoje é o padrão real, não invente uma função compartilhada que não existe).
* Erros são exibidos em `<Message severity="error">` com lista (`<ul><li>`), tanto no nível da página (erros gerais) quanto dentro de cada `Dialog` (erros específicos do formulário/ação).
* Não há error handler global (`app.config.errorHandler`), nem interceptor central de resposta HTTP além do que cada página implementa manualmente.

### Logging

* `console.error('Contexto descritivo:', error)` é o único mecanismo de logging, chamado em todo `catch`. Não há serviço de logging/observabilidade (Sentry, etc.) integrado.

### Persistência

* Único dado persistido no client é `accessToken` em `localStorage` (setado em `SignIn.vue`/removido em `DashboardLayout.vue` no logout). Não use `sessionStorage`, cookies ou outro mecanismo sem justificativa — o padrão é `localStorage`.

### Assincronismo

* Todas as chamadas de rede usam `async/await` com `fetch` nativo via `apiService`; não há uso de `axios` ou bibliotecas HTTP externas (apesar de o README mencionar "Fetch API", o que está alinhado).
* Loading por página usa `ref` local (`loading`, `saving`, `deleting`) para controlar spinners/botões; o Vuex `isLoading` (global) é disparado automaticamente pelo próprio `apiService` a cada requisição e alimenta o overlay de `GlobalLoading.vue` — não redispare `startLoading`/`stopLoading` manualmente nas páginas.
* Debounce de busca: `setTimeout`/`clearTimeout` manual em `watch(searchQuery, ...)` com 400ms, repetido em todas as páginas com busca — siga o mesmo padrão em vez de introduzir uma lib de debounce.

## 5. Padrões que DEVEM ser seguidos

* [ ] Toda nova tela de listagem/CRUD deve seguir a estrutura de blocos descrita na seção 4 (header → Message de erro → Card com DataTable + Paginator → Dialogs). Referência: `src/components/ClientsPage.vue`, `src/components/Products.vue`.
* [ ] Use `<script setup>` (Composition API) para páginas novas — é o padrão dominante e mais recente (`ClientsPage.vue`, `Products.vue`, `SalesPage.vue`, `Billings.vue`, `UsersPage.vue`, `ChargeHistory.vue`, `DashBoard.vue`). Não use Options API em código novo (ver seção 6).
* [ ] Toda chamada de API deve passar por `src/services/apiService.js`, nunca `fetch` direto no componente. Referência: `src/services/apiService.js`.
* [ ] Toda cor, raio de borda, sombra ou fonte que já tenha uma variável `--app-*` equivalente deve usar a variável, não um valor hardcoded. Referência: `src/assets/dashboard-theme.css`, `LAYOUT_RULES.md`.
* [ ] Siga `LAYOUT_RULES.md` para qualquer alteração visual — ele já documenta a maioria das regras de UI atuais e tem prioridade quando houver dúvida de estilo.
* [ ] Erros de API devem ser normalizados com uma função local `normalizeMessages` (ou equivalente) e exibidos via `<Message severity="error">`, nunca `alert()`/erro silencioso. Referência: `src/components/Billings.vue`.
* [ ] Componentes PrimeVue devem ser importados individualmente por arquivo (`import X from 'primevue/x'`), nunca registrados globalmente fora de `main.js`.
* [ ] Rotas autenticadas devem ficar sob `/dashboard` (filhas de `DashboardLayout.vue`) com `meta: { requiresAuth: true }` herdado do pai. Referência: `src/router/index.js`.
* [ ] Ao adicionar item de navegação, atualize `navigationItems` **e** `pageContextMap` em `src/layouts/DashboardLayout.vue` juntos — eles são mantidos manualmente em paralelo e não há teste que garanta consistência entre os dois.

## 6. Anti-padrões que NÃO devem ser replicados

### Options API residual em telas de autenticação

**Encontrado em:** `src/components/SignIn.vue`, `src/components/SignUp.vue`

**Problema:** Usam `export default { data(), methods: {...} }` (Options API) com registro manual de componentes, enquanto todas as páginas de CRUD já migraram para `<script setup>` (Composition API). É um padrão mais antigo coexistindo com o moderno.

**Faça em vez disso:** Ao tocar nessas telas de forma não-trivial, prefira migrar para `<script setup>` seguindo o mesmo estilo das páginas de CRUD. Não é necessário migrar apenas para "limpar" — só ao fazer uma alteração funcional relevante nesses arquivos.

**Referência do padrão preferido:** `src/components/ClientsPage.vue`, `src/components/Products.vue`.

### Componentes órfãos não utilizados

**Encontrado em:** `src/components/CustomPagination.vue`, `src/components/ClientCombo.vue`, `src/components/CurrencyInput.vue`, `src/components/Datepicker.vue`

**Problema:** Nenhum desses arquivos é importado em nenhum lugar do código atual (confirmado por busca no repositório). Foram substituídos por componentes nativos do PrimeVue (`Paginator`, `Select`, `InputNumber` com `mode="currency"`, `<InputText type="date">`).

**Faça em vez disso:** Não importe nem estenda esses componentes em código novo. Use os equivalentes PrimeVue já usados em todas as páginas ativas (`Paginator`, `Select` com `option-label`/`option-value`, `InputNumber` com `mode="currency"` e `locale="pt-BR"`). Considere sinalizar ao time a remoção desses arquivos — não delete sem confirmação explícita, pois pode haver uso planejado desconhecido.

**Referência do padrão preferido:** paginação em `src/components/ClientsPage.vue` (`Paginator`), input de preço em `src/components/Products.vue` (`InputNumber`).

### Resquícios de stacks de UI substituídas (Vuetify/Bootstrap/FontAwesome)

**Encontrado em:** `src/plugins/vuetify.js`, `src/main.js` (imports comentados de `bootstrap` e `@fortawesome/*`), `package.json` (dependência `bootstrap` ainda listada), `src/App.vue` (bloco de CSS legado com classes `.row-offcanvas`, `.card-body .rotate` sem uso aparente nas telas atuais).

**Problema:** O projeto migrou visualmente para PrimeVue/PrimeIcons (ver `LAYOUT_RULES.md`), mas mantém um shim `src/plugins/vuetify.js` (não é o pacote Vuetify real) só para suportar `useDisplay`/`$vuetify.display`, além de CSS e imports mortos de Bootstrap/FontAwesome.

**Faça em vez disso:** Para responsividade, use o composable `src/composables/useDisplay.js` diretamente (`import { useDisplay } from '@/composables/useDisplay'`) em vez de depender de `$vuetify.display`. Para ícones, use `pi pi-*` (PrimeIcons), não FontAwesome. Não reative os imports comentados de Bootstrap/FontAwesome em `main.js`.

**Referência do padrão preferido:** uso de `pi pi-*` em qualquer página atual; `src/layouts/DashboardLayout.vue` para toolbar/drawer responsivos com PrimeVue puro.

### `normalizeMessages` e helpers de formatação duplicados por arquivo

**Encontrado em:** `src/components/ClientsPage.vue`, `Products.vue`, `SalesPage.vue`, `Billings.vue`, `UsersPage.vue`, `ChargeHistory.vue`, `SignIn.vue`

**Problema:** Cada página redefine sua própria função `normalizeMessages`/`normalizeApiMessages` e sua própria função `currency`/`getInitials`, com pequenas variações de assinatura, em vez de reutilizar uma implementação de `src/utils/`.

**Faça em vez disso:** Este é o padrão real e dominante hoje — não centralize preventivamente numa refatoração isolada não solicitada. Se uma tarefa já exigir tocar em várias dessas páginas, é aceitável extrair `normalizeMessages`, `currency` e `getInitials` para `src/utils/`, mas isso deve ser uma decisão explícita da tarefa, não um efeito colateral.

**Referência do padrão preferido (já centralizado):** `src/utils/formatDate.js`, que é reutilizado corretamente pelas páginas via import.

### Query params de paginação/ordenação inconsistentes entre endpoints

**Encontrado em:** `ClientsPage.vue` (`sortBy`), `Products.vue`/`SalesPage.vue`/`Billings.vue`/`UsersPage.vue` (`orderBy`), `ChargeHistory.vue` (`sortBy`) — todos usam `orderDir` para a direção.

**Problema:** O nome do parâmetro de campo de ordenação (`sortBy` vs `orderBy`) não é uniforme entre chamadas de API, refletindo (provavelmente) inconsistências reais no backend.

**Faça em vez disso:** Ao integrar um endpoint novo, confirme com o contrato real do backend qual nome de parâmetro ele espera — não assuma `orderBy` por ser mais frequente. Não "corrija" endpoints existentes sem validar contra o backend, pois eles já funcionam com o nome atual.

## 7. Como Implementar uma Nova Funcionalidade

Fluxo de referência: uma nova tela de CRUD administrativo (padrão de `ClientsPage.vue`/`Products.vue`).

1. Crie `src/components/<Feature>Page.vue` (ou `<Feature>.vue`, seguindo o nome já usado por telas irmãs).
2. Estruture o `<template>` com: `page-header` (eyebrow + título + subtítulo + botão de ação primária), `Message` de erro geral condicional, `Card` contendo toolbar de busca + `DataTable` (com `#empty`, colunas, coluna de ações com botões `text rounded` por ícone) + `Paginator` condicional a `total > 0`.
3. Adicione `Dialog`s conforme a necessidade: formulário de criar/editar, detalhes (somente leitura), confirmação de exclusão — todos com `Message` de erro local e `dialog-actions` alinhado à direita.
4. No `<script setup>`, importe apenas os componentes PrimeVue usados individualmente, `apiService` de `../services/apiService`, e helpers de `../utils/` conforme necessário.
5. Modele o estado com `ref`/`reactive` seguindo a nomenclatura já usada (`loading`, `saving`, `deleting`, `show*Dialog`, `current*`, `*FormErrors`, `pagination`/`currentPage`+`pageSize`+`totalRecords`, `sortField`, `sortOrder`, `searchQuery`).
6. Implemente `fetch<Feature>()` seguindo o padrão try/catch/finally da seção 4 (Erros), montando `URLSearchParams` com os parâmetros que o endpoint real espera (confirme `sortBy` vs `orderBy` com o backend).
7. Implemente `validate<Feature>Form()` local, populando um `reactive` de erros e retornando `boolean` — sem lib de validação externa.
8. Implemente `save`, `delete` (e ações específicas de domínio, ex. "pagar fatura") chamando `apiService.<verbo>` e recarregando a listagem (`fetch<Feature>()`) após sucesso; ajuste `currentPage`/`pagination.page` ao excluir o último item de uma página.
9. Adicione um `watch(searchQuery, ...)` com debounce de 400ms resetando para a página 1, e `watch` adicional para filtros extras, se houver.
10. Registre a rota em `src/router/index.js` como filha de `/dashboard` (herda `requiresAuth`), e adicione a entrada correspondente em `navigationItems` e `pageContextMap` em `src/layouts/DashboardLayout.vue`.
11. Escreva o `<style scoped>` reaproveitando as classes de bloco padrão (`page-header`, `card-toolbar`, `field-block`, `field-label`, `field-error`, `details-grid`, `dialog-actions`, `empty-state`, media query `@media (max-width: 959px)`) e as variáveis `--app-*` — não hardcode cores/raios.
12. Antes de concluir, rode `npm run lint` (não há `typecheck`/testes configurados — ver seção 8) e valide manualmente a tela no navegador (`npm run serve`), conferindo o checklist de `LAYOUT_RULES.md`.

Não há fluxos alternativos relevantes (worker/job/CLI) neste repositório — é uma SPA puramente client-side consumindo uma API REST externa.

## 8. Estratégia de Testes

**Não determinado com confiança a partir do repositório atual.** Não há framework de teste (Jest, Vitest, Cypress, etc.) configurado em `package.json`, nem diretório `tests/` ou arquivos `*.spec.js`/`*.test.js` no repositório. Não introduza uma suíte de testes nova sem alinhar antes com o time, já que isso mudaria a stack do projeto.

Validação manual de funcionalidades hoje é feita rodando `npm run serve` e testando no navegador contra um backend real (`VUE_APP_BACKEND_BASE_URL`).

## 9. Comandos Úteis

```bash
# instalar dependências
npm install

# desenvolvimento (hot-reload)
npm run serve

# build de produção
npm run build

# lint (com correção automática, via vue-cli-service lint)
npm run lint
```

Não há comandos de `test`, `typecheck` ou `format` definidos em `package.json` — não invente.

## 10. Checklist antes de concluir uma alteração

* [ ] A implementação respeita as fronteiras arquiteturais existentes (componente de página → `apiService` → backend; sem `fetch` direto fora de `apiService`).
* [ ] Não foi replicado nenhum anti-padrão legado da seção 6 (Options API em telas novas, componentes órfãos, resquícios Vuetify/Bootstrap/FontAwesome sem necessidade).
* [ ] Validações de formulário estão no próprio componente, seguindo o padrão `validate*Form` + `reactive` de erros.
* [ ] Erros de API são tratados com `try/catch/finally`, normalizados e exibidos via `<Message severity="error">`.
* [ ] Estilo novo usa as variáveis `--app-*` de `src/assets/dashboard-theme.css` e segue `LAYOUT_RULES.md`.
* [ ] Rotas novas estão sob `/dashboard` com `requiresAuth` (quando aplicável) e `navigationItems`/`pageContextMap` de `DashboardLayout.vue` foram atualizados juntos.
* [ ] `npm run lint` passa sem novos erros.
* [ ] A tela foi validada manualmente no navegador (`npm run serve`) contra um backend real, cobrindo o caminho principal e ao menos um caso de erro.
* [ ] Nenhuma mudança não relacionada foi introduzida.

## 11. Áreas de Atenção

* `src/components/CustomPagination.vue`, `ClientCombo.vue`, `CurrencyInput.vue`, `Datepicker.vue` estão sem uso — investigue com o time antes de removê-los ou de basear código novo neles.
* `src/plugins/vuetify.js` é um shim, não o pacote Vuetify — qualquer expectativa de API real do Vuetify (temas, diretivas, etc.) não se aplica aqui.
* `src/components/SignIn.vue` e `SignUp.vue` ainda usam Options API — trate como candidatos a migração oportunista, não como padrão a seguir.
* Nomes de parâmetros de query (`sortBy` vs `orderBy`) variam por endpoint — sempre confira o contrato real do backend antes de assumir um nome.
* Não há suíte de testes automatizados nem typecheck — qualquer alteração depende de validação manual cuidadosa no navegador.
* `package.json` ainda lista `bootstrap` como dependência apesar de o import estar comentado em `main.js` — não reative sem necessidade explícita.
* O guard de autenticação do router (`router/index.js`) só verifica a *presença* do token em `localStorage`, não sua validade/expiração — decodificação e tratamento de token expirado/inválido ficam a cargo de cada componente (`DashboardLayout.vue`, `UsersPage.vue` usam `jwt-decode` individualmente).
