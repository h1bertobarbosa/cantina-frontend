<template>
  <section class="charge-history-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Financeiro
        </p>
        <h1 class="page-title">
          Historico de lancamentos
        </h1>
        <p class="page-subtitle">
          Consulte as cobrancas manuais registradas por cliente, descricao, valor e data de ocorrencia.
        </p>
      </div>
    </header>

    <Message
      v-if="errorMessages.length"
      severity="error"
      class="page-message"
    >
      <ul class="message-list">
        <li
          v-for="(error, index) in errorMessages"
          :key="`charge-history-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="history-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Filtros e historico
            </h2>
            <p class="card-subtitle">
              Refine a consulta por cliente, descricao e periodo de ocorrencia.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="history-client-filter"
            >Cliente</label>
            <Select
              id="history-client-filter"
              v-model="filters.clientId"
              :options="clients"
              option-label="name"
              option-value="id"
              placeholder="Todos os clientes"
              filter
              show-clear
            />
          </div>

          <IconField class="history-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por descricao"
            />
          </IconField>

          <div class="field-block">
            <label
              class="field-label"
              for="history-start-date"
            >Data inicial</label>
            <InputText
              id="history-start-date"
              v-model="filters.startDate"
              type="date"
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="history-end-date"
            >Data final</label>
            <InputText
              id="history-end-date"
              v-model="filters.endDate"
              type="date"
            />
          </div>
        </div>

        <DataTable
          :value="records"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="history-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhum registro encontrado.</span>
            </div>
          </template>

          <Column
            field="client_name"
            header="Cliente"
            sortable
            sort-field="client_name"
          >
            <template #body="{ data }">
              <div class="history-client">
                <Avatar
                  :label="getInitials(data.client?.name)"
                  shape="circle"
                  class="history-client__avatar"
                />
                <div>
                  <strong class="history-client__name">{{ data.client?.name || 'N/A' }}</strong>
                  <small class="history-client__meta">ID {{ data.client?.id || 'N/A' }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="description"
            header="Descricao"
            sortable
          />

          <Column
            field="amount"
            header="Valor"
            sortable
          >
            <template #body="{ data }">
              {{ currency(data.amount) }}
            </template>
          </Column>

          <Column
            field="created_at"
            header="Data do lancamento"
            sortable
            sort-field="created_at"
          >
            <template #body="{ data }">
              {{ formatDateLabel(data.created_at) }}
            </template>
          </Column>
        </DataTable>

        <Paginator
          v-if="pagination.total > 0"
          :rows="pagination.perPage"
          :total-records="pagination.total"
          :first="firstRecordIndex"
          :rows-per-page-options="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          @page="handlePageChange"
        />
      </template>
    </Card>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import Select from 'primevue/select';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';

const loading = ref(false);
const records = ref([]);
const clients = ref([]);
const errorMessages = ref([]);
const searchQuery = ref('');
const sortField = ref('created_at');
const sortOrder = ref(-1);

const filters = reactive({
  clientId: null,
  startDate: '',
  endDate: '',
});

const pagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
});

const firstRecordIndex = computed(() => (pagination.page - 1) * pagination.perPage);

const normalizeMessages = (errorData, fallbackMessage = 'Ocorreu um erro.') => {
  if (!errorData) {
    return [fallbackMessage];
  }

  if (errorData.message) {
    return Array.isArray(errorData.message) ? errorData.message : [errorData.message];
  }

  if (typeof errorData === 'string') {
    return [errorData];
  }

  return [fallbackMessage];
};

const currency = (value) => (
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0))
);

const formatDateLabel = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  try {
    return formatDateHour(value);
  } catch (error) {
    return fallback;
  }
};

const getInitials = (value) => (
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'HC'
);

const getOrderDir = () => (sortOrder.value === 1 ? 'asc' : 'desc');

const buildHistoryQuery = () => {
  const params = new URLSearchParams({
    page: String(pagination.page),
    perPage: String(pagination.perPage),
    sortBy: sortField.value,
    orderDir: getOrderDir(),
  });

  if (filters.clientId) {
    params.append('clientId', filters.clientId);
  }

  if (searchQuery.value) {
    params.append('search', searchQuery.value);
  }

  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }

  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  return params.toString();
};

const fetchRecords = async () => {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    records.value = [];
    pagination.total = 0;
    errorMessages.value = ['A data inicial nao pode ser maior que a data final.'];
    return;
  }

  loading.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.get(`/clients/charge-logs?${buildHistoryQuery()}`);
    const data = await response.json();

    if (!response.ok) {
      records.value = [];
      pagination.total = 0;
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar historico.');
      throw new Error(errorMessages.value[0]);
    }

    records.value = data.data || [];
    pagination.page = Number(data.meta?.page || pagination.page);
    pagination.perPage = Number(data.meta?.perPage || pagination.perPage);
    pagination.total = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Fetch Charge History Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao buscar o historico.'];
    }
  } finally {
    loading.value = false;
  }
};

const fetchClients = async () => {
  try {
    const response = await apiService.get('/clients?perPage=500&sortBy=name&orderDir=asc');

    if (!response.ok) {
      throw new Error('Erro ao buscar clientes');
    }

    const data = await response.json();
    clients.value = data.data || [];
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    errorMessages.value.push('Erro ao carregar lista de clientes.');
  }
};

const handlePageChange = (event) => {
  pagination.page = event.page + 1;
  pagination.perPage = event.rows;
  fetchRecords();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'created_at';
  sortOrder.value = event.sortOrder || -1;
  pagination.page = 1;
  fetchRecords();
};

let searchDebounce = null;
watch(searchQuery, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.page = 1;
    fetchRecords();
  }, 400);
});

watch(
  () => [filters.clientId, filters.startDate, filters.endDate],
  () => {
    pagination.page = 1;
    fetchRecords();
  },
);

onMounted(() => {
  fetchClients();
  fetchRecords();
});
</script>

<style scoped>
.charge-history-page {
  display: grid;
  gap: 22px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--app-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  color: var(--app-text);
  font-size: 2rem;
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--app-text-muted);
}

.page-message {
  margin: 0;
}

.message-list {
  margin: 0;
  padding-left: 18px;
}

.history-card {
  border: 1px solid var(--app-border);
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.card-title {
  margin: 0;
  color: var(--app-text);
  font-size: 1.1rem;
}

.card-subtitle {
  margin: 8px 0 0;
  color: var(--app-text-muted);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  color: var(--app-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.history-search {
  width: 100%;
  align-self: end;
}

.history-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.history-client {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-client__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.history-client__name {
  display: block;
}

.history-client__meta {
  color: var(--app-text-muted);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  color: var(--app-text-muted);
}

@media (max-width: 959px) {
  .page-header,
  .card-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
