<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <h2 class="text-h5">Histórico de Lançamentos</h2>
      </v-col>
    </v-row>

    <v-card border flat class="mb-4">
      <v-card-title class="text-subtitle-1">Filtros de Busca</v-card-title>
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <ClientCombo
              v-model="filters.clientId"
              :clients="clients"
              label="Filtrar por Cliente"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6" class="d-flex ga-2">
            <v-btn color="primary" @click="applyFilters">
              <v-icon start>mdi-filter</v-icon>
              Buscar
            </v-btn>
            <v-btn variant="tonal" @click="clearFilters">
              <v-icon start>mdi-filter-off</v-icon>
              Limpar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table-server
      v-model:items-per-page="options.itemsPerPage"
      :headers="headers"
      :items="records"
      :items-length="totalRecords"
      :loading="loading"
      :search="searchTrigger"
      @update:options="fetchRecords"
      item-value="id"
      class="elevation-1"
      no-data-text="Nenhum registro encontrado"
      loading-text="Carregando dados..."
    >
      <template v-slot:[`item.amount`]="{ item }">
        {{ currency(item.amount) }}
      </template>

      <template v-slot:[`item.created_at`]="{ item }">
        {{ formatDateHour(item.created_at) }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiService } from "../services/apiService"; // Ajuste o caminho se necessário
import ClientCombo from "@/components/ClientCombo.vue"; // Ajuste o caminho se necessário
import { formatDateHour } from '../utils/formatDate';
// --- State ---
const loading = ref(false);
const records = ref([]);
const totalRecords = ref(0);
const clients = ref([]);
const searchTrigger = ref(0); // Usado para forçar a atualização da tabela

// Filtros
const filters = ref({
  clientId: null,
});

// Opções do v-data-table-server (paginação, ordenação)
const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [{ key: "created_at", order: "desc" }], // Ordenação inicial
});

// Cabeçalhos da tabela
const headers = [
  { title: "Cliente", key: "client.name", sortable: false },
  { title: "Descrição", key: "description", sortable: true },
  { title: "Valor", key: "amount", align: "end", sortable: true },
  {
    title: "Data do Lançamento",
    key: "created_at",
    align: "center",
    sortable: true,
  },
];

// --- Methods ---

// Busca os registros do backend
const fetchRecords = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: options.value.page,
      perPage: options.value.itemsPerPage,
    });

    // Adiciona filtros se estiverem preenchidos
    if (filters.value.clientId) {
      params.append("clientId", filters.value.clientId.id);
    }

    // Adiciona ordenação
    if (options.value.sortBy.length > 0) {
      params.append("sortBy", options.value.sortBy[0].key);
      params.append("orderDir", options.value.sortBy[0].order);
    }

    const response = await apiService.get(`/clients/charge-logs?${params.toString()}`); // Use o nome do endpoint definido
    const data = await response.json();

    records.value = data.data;
    totalRecords.value = data.meta.total;
  } catch (error) {
    console.error("Erro ao buscar registros:", error);
    // Aqui você pode adicionar um alerta de erro para o usuário
  } finally {
    loading.value = false;
  }
};

// Busca a lista de clientes para o combo de filtro
const fetchClients = async () => {
  try {
    const response = await apiService.get("/clients?perPage=500"); // Pega muitos clientes de uma vez
    const data = await response.json();
    clients.value = data.data;
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
  }
};

// Ações dos botões de filtro
const applyFilters = () => {
  options.value.page = 1; // Volta para a primeira página ao aplicar o filtro
  fetchRecords();
};

const clearFilters = () => {
  filters.value.clientId = null;
  options.value.page = 1;
  fetchRecords();
};

// --- Funções de Formatação ---
const currency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// --- Lifecycle ---
onMounted(() => {
  fetchClients();
  // A tabela chama o fetchRecords() automaticamente na montagem
});
</script>
