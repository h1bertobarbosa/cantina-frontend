<template>
    <v-pagination :model-value="currentPage"
:length="totalPages" :total-visible="totalVisibleComputed" rounded="circle"
        active-color="primary"
density="comfortable" show-first-last-page :disabled="totalPages <= 1"
        @update:modelValue="onPageChange"
:prev-icon="mdiChevronLeft" :next-icon="mdiChevronRight"
        :first-icon="mdiPageFirst"
:last-icon="mdiPageLast">
  </v-pagination>
</template>

<script setup>
/* eslint-disable */
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
// Importar ícones se não estiverem globalmente disponíveis
import { mdiChevronLeft, mdiChevronRight, mdiPageFirst, mdiPageLast } from '@mdi/js';

// --- Props ---
const props = defineProps({
    // Página atual
    currentPage: {
        type: Number,
        required: true,
        validator: (value) => value > 0, // Validação básica
    },
    // Total de páginas
    totalPages: {
        type: Number,
        required: true,
        validator: (value) => value >= 0, // Total não pode ser negativo
    },
    // Opcional: Quantidade máxima de botões de página a serem exibidos
    // Se não for passado, será calculado com base no tamanho da tela
    totalVisible: {
        type: Number,
        default: null // Default null para indicar cálculo automático
    }
});

// --- Emits ---
const emit = defineEmits(['page-changed']);

// --- Vuetify Display Helper ---
// Para ajustar o total de páginas visíveis em telas menores
const { mobile } = useDisplay();

// --- Computed ---
// Determina quantas páginas mostrar. Usa a prop se fornecida,
// ou ajusta para telas móveis.
const totalVisibleComputed = computed(() => {
    if (props.totalVisible !== null) {
        return props.totalVisible;
    }
    return mobile.value ? 5 : 7; // Exibe 5 no mobile, 7 em telas maiores
});

// --- Methods ---
// Função chamada quando o v-pagination emite o evento de atualização
const onPageChange = (newPage) => {
    // v-pagination já garante que newPage está dentro dos limites [1, totalPages]
    emit('page-changed', newPage);
};

// --- Validação de Props ---
// Garante que a página atual não seja maior que o total de páginas
if (props.currentPage > props.totalPages && props.totalPages > 0) {
    console.warn(`Pagination: currentPage (${props.currentPage}) cannot be greater than totalPages (${props.totalPages}).`);
    // Opcionalmente, você pode emitir um evento para corrigir a página atual no componente pai
    // emit('page-changed', props.totalPages);
}

</script>

<style scoped>
/* Estilos específicos podem ser adicionados aqui, mas v-pagination
     geralmente se integra bem ao tema Vuetify. */
.v-pagination {
    justify-content: center;
    /* Centraliza a paginação por padrão */
}
</style>