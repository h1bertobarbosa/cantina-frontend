module.exports = {
  root: true,
  env: {
    node: true,
    "vue/setup-compiler-macros": true, // <-- Importante para defineProps/defineEmits
  },
  extends: [
    "plugin:vue/vue3-recommended", // Ou vue3-essential, vue3-strongly-recommended
    "eslint:recommended",
    // Outras configurações que você possa ter (ex: Prettier, TypeScript)
  ],
  parser: "vue-eslint-parser", // <-- Parser principal para arquivos .vue
  parserOptions: {
    parser: "@babel/eslint-parser", // Ou '@typescript-eslint/parser' se usar TS
    ecmaVersion: 2021, // Ou mais recente
    sourceType: "module",
  },
  rules: {
    // Suas regras personalizadas aqui...
    "no-undef": "off", // Você pode desativar temporariamente se as configs acima não funcionarem de imediato
    // Mas o ideal é a configuração do plugin vue resolver isso.
  },
};
