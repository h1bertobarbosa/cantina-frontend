<template>
  <section class="audit-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Auditoria
        </p>
        <h1 class="page-title">
          Logs do sistema
        </h1>
        <p class="page-subtitle">
          Consulte eventos operacionais registrados em todas as contas.
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
          :key="`audit-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="audit-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Registros de auditoria
            </h2>
            <p class="card-subtitle">
              Filtre por tenant, tipo, usuario ou conteudo do payload.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="audit-account-filter"
            >Tenant</label>
            <Select
              id="audit-account-filter"
              v-model="filters.accountId"
              :options="accounts"
              option-label="label"
              option-value="id"
              placeholder="Todos os tenants"
              filter
              show-clear
            />
          </div>

          <IconField class="audit-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar em observacao ou JSON"
            />
          </IconField>

          <div class="field-block">
            <label
              class="field-label"
              for="audit-log-type"
            >Tipo</label>
            <InputText
              id="audit-log-type"
              v-model="filters.logType"
              placeholder="create_sale, pay_billing..."
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="audit-user-email"
            >E-mail do usuario</label>
            <InputText
              id="audit-user-email"
              v-model="filters.userEmail"
              placeholder="usuario@email.com"
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
          class="audit-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhum log encontrado.</span>
            </div>
          </template>

          <Column
            field="created_at"
            header="Data"
            sortable
            sort-field="created_at"
          >
            <template #body="{ data }">
              {{ formatDateLabel(data.created_at) }}
            </template>
          </Column>

          <Column
            field="log_type"
            header="Tipo"
            sortable
          >
            <template #body="{ data }">
              <Tag
                :value="data.log_type"
                severity="info"
              />
            </template>
          </Column>

          <Column
            field="user_name"
            header="Usuario"
            sortable
          >
            <template #body="{ data }">
              <div class="audit-user">
                <Avatar
                  :label="getInitials(data.user_name || data.user_email)"
                  shape="circle"
                  class="audit-user__avatar"
                />
                <div>
                  <strong>{{ data.user_name || 'N/A' }}</strong>
                  <small>{{ data.user_email || 'N/A' }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="account_id"
            header="Conta"
          >
            <template #body="{ data }">
              <span class="mono-value">{{ data.account_id }}</span>
            </template>
          </Column>

          <Column
            field="obs"
            header="Observacao"
          >
            <template #body="{ data }">
              {{ data.obs || '-' }}
            </template>
          </Column>

          <Column header="Acoes">
            <template #body="{ data }">
              <Button
                icon="pi pi-eye"
                label="Detalhes"
                severity="secondary"
                variant="outlined"
                size="small"
                @click="openDetails(data)"
              />
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

    <Dialog
      v-model:visible="detailsVisible"
      modal
      header="Detalhes do log"
      class="audit-dialog"
      :style="{ width: 'min(920px, 94vw)' }"
    >
      <div
        v-if="selectedLog"
        class="details-grid"
      >
        <div class="details-item">
          <span>ID</span>
          <strong class="mono-value">{{ selectedLog.id }}</strong>
        </div>
        <div class="details-item">
          <span>Tipo</span>
          <strong>{{ selectedLog.log_type }}</strong>
        </div>
        <div class="details-item">
          <span>Conta</span>
          <strong class="mono-value">{{ selectedLog.account_id }}</strong>
        </div>
        <div class="details-item">
          <span>Usuario</span>
          <strong>{{ selectedLog.user_name || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span>E-mail</span>
          <strong>{{ selectedLog.user_email || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span>Data</span>
          <strong>{{ formatDateLabel(selectedLog.created_at) }}</strong>
        </div>
      </div>

      <div class="json-block">
        <div class="json-block__header">
          <span>Payload</span>
        </div>
        <pre>{{ formattedPayload }}</pre>
      </div>
    </Dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';

const loading = ref(false);
const records = ref([]);
const accounts = ref([]);
const errorMessages = ref([]);
const searchQuery = ref('');
const sortField = ref('created_at');
const sortOrder = ref(-1);
const detailsVisible = ref(false);
const selectedLog = ref(null);

const filters = reactive({
  accountId: null,
  logType: '',
  userEmail: '',
});

const pagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
});

const firstRecordIndex = computed(() => (pagination.page - 1) * pagination.perPage);

const formattedPayload = computed(() => {
  if (!selectedLog.value) {
    return '';
  }

  return JSON.stringify(selectedLog.value.data || {}, null, 2);
});

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
    .join('') || 'LG'
);

const getOrderDir = () => (sortOrder.value === 1 ? 'asc' : 'desc');

const buildAuditQuery = () => {
  const params = new URLSearchParams({
    page: String(pagination.page),
    perPage: String(pagination.perPage),
    orderBy: sortField.value,
    orderDir: getOrderDir(),
  });

  if (filters.logType) {
    params.append('logType', filters.logType);
  }

  if (filters.accountId) {
    params.append('accountId', filters.accountId);
  }

  if (filters.userEmail) {
    params.append('userEmail', filters.userEmail);
  }

  if (searchQuery.value) {
    params.append('search', searchQuery.value);
  }

  return params.toString();
};

const fetchAccounts = async () => {
  try {
    const response = await apiService.get('/logs/accounts');
    const data = await response.json();

    if (!response.ok) {
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar tenants.');
      return;
    }

    accounts.value = (data || []).map((account) => ({
      ...account,
      label: account.slug ? `${account.name} (${account.slug})` : account.name,
    }));
  } catch (error) {
    console.error('Fetch Audit Accounts Error:', error);
    errorMessages.value = ['Ocorreu um erro inesperado ao buscar os tenants.'];
  }
};

const fetchRecords = async () => {
  loading.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.get(`/logs?${buildAuditQuery()}`);
    const data = await response.json();

    if (!response.ok) {
      records.value = [];
      pagination.total = 0;
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar logs.');
      throw new Error(errorMessages.value[0]);
    }

    records.value = data.data || [];
    pagination.page = Number(data.meta?.page || pagination.page);
    pagination.perPage = Number(data.meta?.perPage || pagination.perPage);
    pagination.total = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao buscar os logs.'];
    }
  } finally {
    loading.value = false;
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

const openDetails = (log) => {
  selectedLog.value = log;
  detailsVisible.value = true;
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
  () => [filters.accountId, filters.logType, filters.userEmail],
  () => {
    pagination.page = 1;
    fetchRecords();
  },
);

onMounted(() => {
  fetchAccounts();
  fetchRecords();
});
</script>

<style scoped>
.audit-page {
  display: grid;
  gap: 22px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
}

.page-eyebrow {
  margin: 0 0 8px;
  color: #54606d;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  color: #152238;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  letter-spacing: 0;
}

.page-subtitle {
  max-width: 680px;
  margin: 8px 0 0;
  color: #64748b;
}

.page-message {
  border-radius: 8px;
}

.message-list {
  margin: 0;
  padding-left: 18px;
}

.audit-card {
  border-radius: 8px;
  overflow: hidden;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card-title {
  margin: 0;
  color: #172033;
  font-size: 1.1rem;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #6b7280;
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(210px, 0.9fr) minmax(260px, 1.2fr) repeat(2, minmax(180px, 0.8fr));
  gap: 14px;
  margin-bottom: 20px;
}

.field-block {
  display: grid;
  gap: 6px;
}

.field-label {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.audit-search {
  align-self: end;
}

.audit-table {
  overflow: hidden;
  border-radius: 8px;
}

.audit-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.audit-user strong,
.audit-user small {
  display: block;
}

.audit-user small {
  color: #64748b;
}

.audit-user__avatar {
  background: #17324d;
  color: #fff;
}

.mono-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 0.82rem;
  word-break: break-all;
}

.empty-state {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 34px;
  color: #64748b;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.details-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background: #f8fafc;
}

.details-item span,
.json-block__header {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.json-block {
  overflow: hidden;
  border: 1px solid #d9e2ec;
  border-radius: 8px;
  background: #0f172a;
}

.json-block__header {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: #dbeafe;
}

.json-block pre {
  max-height: min(52vh, 520px);
  margin: 0;
  padding: 16px;
  overflow: auto;
  color: #e5edf7;
  font-size: 0.82rem;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .filters-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
