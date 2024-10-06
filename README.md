# Projeto de Gerenciamento de Vendas e Faturamento - frontend

## Descrição

Este é um sistema web desenvolvido em **Vue.js** para gerenciamento de produtos, vendas, clientes, faturas e usuários. O objetivo do projeto é fornecer uma interface amigável para gerenciar operações comerciais básicas, incluindo controle de estoque, processamento de vendas, gerenciamento de clientes, faturamento e administração de usuários.

## Funcionalidades

- **Autenticação e Autorização:**

  - Login de usuários com autenticação JWT.
  - Proteção de rotas e recursos com base em tokens de acesso.
- **Gerenciamento de Produtos:**

  - Listagem de produtos.
  - Adição de novos produtos.
  - Edição de produtos existentes.
  - Visualização de detalhes de produtos.
  - Exclusão de produtos.
- **Gerenciamento de Vendas:**

  - Listagem de vendas.
  - Registro de novas vendas.
  - Visualização de detalhes de vendas.
  - Exclusão de vendas.
- **Gerenciamento de Clientes:**

  - Listagem de clientes.
  - Cadastro de novos clientes.
  - Edição de clientes existentes.
  - Visualização de detalhes de clientes.
  - Exclusão de clientes.
- **Gerenciamento de Faturas (Billings):**

  - Listagem de faturas.
  - Visualização de detalhes de faturas.
  - Pagamento de faturas.
  - Visualização de itens associados a uma fatura.
  - Filtragem de faturas por cliente.
- **Gerenciamento de Usuários:**

  - Listagem de usuários do sistema.
  - Cadastro de novos usuários.
  - Edição de usuários existentes.
  - Visualização de detalhes de usuários.
  - Exclusão de usuários.

## Tecnologias Utilizadas

- **Frontend:**

  - Vue.js
  - Vue Router
  - Bootstrap ou outro framework CSS
  - Fetch API para requisições HTTP
- **Backend:**

  - API RESTful (endpoints conforme descritos nas seções abaixo)
  - Autenticação JWT

## Pré-requisitos

- **Node.js** instalado na máquina (versão recomendada: 14.x ou superior)
- **NPM** ou **Yarn** como gerenciador de pacotes
- **Backend** configurado e em execução (necessário para que o frontend funcione corretamente)

## Configuração

1. **Variáveis de Ambiente:**

    Crie um arquivo `.env` na raiz do projeto e defina a variável `VUE_APP_API_BASE_URL` com a URL base do backend:

    env

    Copy code

    `VUE_APP_API_BASE_URL=http://localhost:3000`

    Se estiver usando diferentes ambientes (desenvolvimento, produção), você pode criar arquivos `.env.development` e `.env.production` conforme necessário.

2. **Configuração do Backend:**

    Certifique-se de que o backend está configurado corretamente e em execução. O frontend se comunica com o backend através dos endpoints definidos.

## Uso

1. **Acessar a aplicação:**

    Abra o navegador e navegue até `http://localhost:8080`.

2. **Fazer login:**

    - Acesse a página de login (`/signin`).
    - Insira suas credenciais (o backend deve ter usuários cadastrados).
    - Faça login para acessar as funcionalidades protegidas.
3. **Navegar pelo sistema:**

    - Use o menu lateral para acessar as diferentes seções: Produtos, Vendas, Clientes, Faturas, Usuários.
    - Em cada seção, você pode realizar as operações CRUD (Create, Read, Update, Delete) conforme permitido.

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

Para contribuir:

1. Faça um fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`).
3. Commit suas alterações (`git commit -m 'Adiciona nova feature'`).
4. Faça push para a branch (`git push origin feature/nova-feature`).
5. Abra um pull request.

## Licença

Este projeto está sob a licença MIT

## Contato

Em caso de dúvidas ou sugestões, entre em contato:

- **Nome**: Humberto Barbosa
- **Email**: <humberto.obarbosa@gmail.com>

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
