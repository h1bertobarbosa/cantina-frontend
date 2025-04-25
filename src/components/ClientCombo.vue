<template>
  <v-autocomplete
    v-model="selectedClient"
    :items="clients"
    item-title="name"
    item-value="id"
    label="Selecione ou digite o nome do cliente"
    placeholder="Digite para buscar..."
    variant="outlined"
    density="compact"
    clearable
    no-data-text="Nenhum cliente encontrado"
    return-object="false"
    @update:modelValue="handleSelection"
  >
    <!-- Opcional: Customizar como cada item aparece na lista -->
    <!--
    <template v-slot:item="{ props, item }">
      <v-list-item
        v-bind="props"
        :title="item.raw.name"
        :subtitle="`ID: ${item.raw.id}`"
      ></v-list-item>
    </template>
    -->

    <!-- Opcional: Customizar como o item selecionado aparece no input -->
    <!--
    <template v-slot:selection="{ item }">
        <span>{{ item.raw.name }}</span>
    </template>
    -->

  </v-autocomplete>
</template>

<script setup>
import { ref, watch } from 'vue';

// --- Props ---
// Define as propriedades que o componente recebe
const props = defineProps({
  clients: {
    type: Array,
    required: true,
    default: () => [] // Boa prática fornecer um valor padrão
  },
  // Opcional: Se você quiser pré-selecionar um cliente pelo ID
  initialClientId: {
    type: [String, Number, null],
    default: null
  }
});

// --- Emits ---
// Define os eventos que o componente pode emitir
const emit = defineEmits(['selected']);

// --- State ---
// Modelo reativo para armazenar o ID do cliente selecionado
// Inicializa com o valor inicial passado por prop, se houver
const selectedClient = ref(props.initialClientId);

// --- Methods / Watchers ---

// Função chamada quando o v-model (selectedClient) é atualizado
const handleSelection = (value) => {
  // O v-autocomplete com return-object="false" já nos dá o ID (item-value)
  // Emitimos o evento 'selected' com o ID (ou null se limpo)
  emit('selected', value);
};

// Observador opcional: Se a prop initialClientId mudar externamente,
// atualiza o modelo interno. Útil se o pai puder resetar a seleção.
watch(() => props.initialClientId, (newId) => {
  selectedClient.value = newId;
});

/*
  Nota: A lógica de `filterClients` e `isOpen` é gerenciada internamente
  pelo componente v-autocomplete do Vuetify. Não precisamos mais dela aqui.
*/
</script>

<style scoped>
/* Geralmente não são necessários estilos customizados aqui,
   pois o v-autocomplete já é estilizado pelo Vuetify.
   Remova o estilo .combo-dropdown anterior. */
</style>