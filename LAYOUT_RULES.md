# Regras de Layout
usando lib: primevue,primeicons,@primeuix/themes
## Objetivo

Este arquivo define as regras visuais do frontend para manter consistência entre telas, formulários, tabelas, cards e navegação.

Use estas regras sempre que criar ou refatorar interfaces no sistema.

## Base visual

- Fonte padrão: `Inter`, com fallback para `Roboto` e `sans-serif`.
- Fundo geral: gradiente claro com aparência limpa e administrativa.
- Cor primária: azul.
- Sidebar: navy escuro para contraste com o conteúdo principal.
- Cards principais: fundo branco, sombra suave e bordas arredondadas.

As variáveis globais ficam em `src/assets/dashboard-theme.css`.

## Bordas e arredondamento

- Campos de formulário devem usar o raio global `--app-control-radius`.
- O valor padrão atual é `14px`.
- Inputs nativos, `select`, `textarea`, `.form-control` e componentes PrimeVue de entrada devem respeitar esse mesmo raio.
- Wrappers de componentes como `Select`, `InputNumber`, `Password` e `MultiSelect` devem manter `overflow: hidden` quando necessário para não “quebrar” os cantos.
- Cards de conteúdo devem usar cantos mais amplos que os campos.

## Espaçamento

- Priorizar respiro visual.
- Usar blocos com espaçamento vertical consistente entre título, filtros, tabela e ações.
- Tabelas devem ter padding generoso nas células.
- Botões de ação devem ter espaço suficiente entre si e não ficar colados.
- Formulários devem ser organizados em grid com gaps regulares.

## Estrutura de páginas administrativas

Todas as telas administrativas devem seguir esta hierarquia:

1. Cabeçalho da área com título e subtítulo.
2. Ação principal em destaque no topo direito.
3. Card principal com filtros e conteúdo.
4. Tabela ou conteúdo principal.
5. Paginação no rodapé do card.

## Sidebar e header

- Sidebar fixa com fundo navy.
- Itens do menu devem ter ícone e estado ativo visível.
- Header deve exibir contexto da página à esquerda.
- Área do usuário deve ficar à direita, com saudação, avatar e ação de sair.

## Tabelas

- Tabelas devem ser exibidas dentro de card branco.
- Cabeçalhos devem usar fundo claro e tipografia em caixa alta discreta.
- Linhas devem priorizar leitura rápida.
- Sempre que fizer sentido, usar avatar, badge ou bloco visual para enriquecer a primeira coluna.
- A coluna de ações deve usar botões compactos com ícones.

## Formulários e dialogs

- Modais/dialogs devem seguir o mesmo padrão de cantos arredondados do sistema.
- Labels devem ficar acima dos campos.
- Campos relacionados devem ser agrupados em grid.
- Ações do formulário devem ficar alinhadas à direita.
- Ação destrutiva deve usar destaque de perigo.

## Botões

- Botão primário: azul com destaque visual.
- Botão secundário: neutro ou `text`, sem competir com a ação principal.
- Ações destrutivas: vermelho.
- Ações pontuais em tabela: preferir ícones em botões compactos.

## Filtros e busca

- Toda listagem principal deve ter busca visível no topo do card.
- Quando houver filtros extras, eles devem aparecer na mesma faixa da busca.
- Mudanças em filtros devem manter comportamento previsível:
  - resetar para página 1;
  - atualizar a listagem;
  - preservar consistência com paginação.

## Responsividade

- Em telas menores, grids devem colapsar para uma coluna.
- Toolbar de topo pode empilhar verticalmente no mobile.
- Sidebar deve poder colapsar.
- Formularios e filtros não devem exigir rolagem horizontal.

## Consistência técnica

- Preferir centralizar regras globais em `src/assets/dashboard-theme.css`.
- Evitar duplicar estilos globais dentro de componentes quando a regra é de sistema.
- Estilos locais devem existir apenas para comportamento específico de uma tela.
- Ao introduzir novos componentes PrimeVue, alinhar visualmente com o tema global antes de adicionar exceções locais.

## Checklist antes de concluir uma tela

- Todos os campos têm o mesmo arredondamento esperado.
- O card principal respeita sombra, fundo e borda do sistema.
- A página tem espaçamento consistente entre seções.
- Botões seguem hierarquia visual correta.
- A tabela está legível em desktop e mobile.
- Busca, filtros e paginação estão posicionados de forma coerente.
