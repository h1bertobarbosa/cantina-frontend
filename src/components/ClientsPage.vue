<template>
  <section class="clients-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Relacionamento
        </p>
        <h1 class="page-title">
          Gerenciar clientes
        </h1>
        <p class="page-subtitle">
          Busque, edite e acompanhe a base de clientes da sua conta.
        </p>
      </div>

      <Button
        label="Adicionar cliente"
        icon="pi pi-plus"
        @click="openAddClientDialog"
      />
    </header>

    <Message
      v-if="generalErrorMessages.length"
      severity="error"
      class="page-message"
    >
      <ul class="message-list">
        <li
          v-for="(error, index) in generalErrorMessages"
          :key="`client-general-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="clients-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Lista principal
            </h2>
            <p class="card-subtitle">
              Use a busca para localizar por nome, e-mail ou telefone.
            </p>
          </div>

          <IconField class="clients-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por nome, telefone ou e-mail"
            />
          </IconField>
        </div>

        <DataTable
          :value="clients"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="clients-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhuma informacao para ser exibida.</span>
            </div>
          </template>

          <Column
            field="name"
            header="Cliente"
            sortable
          >
            <template #body="{ data }">
              <div class="client-cell">
                <Avatar
                  :label="getInitials(data.name)"
                  shape="circle"
                  class="client-cell__avatar"
                />
                <div>
                  <strong class="client-cell__name">{{ data.name }}</strong>
                  <small class="client-cell__meta">ID {{ data.id }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="phone"
            header="Telefone"
          />

          <Column
            field="email"
            header="E-mail"
            sortable
          />

          <Column
            field="createdAt"
            header="Criado em"
            sortable
          >
            <template #body="{ data }">
              {{ formatDateWithHour(data.createdAt) }}
            </template>
          </Column>

          <Column
            header="Acoes"
            class="actions-column"
          >
            <template #body="{ data }">
              <div class="actions-row">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="info"
                  aria-label="Detalhes"
                  @click="openViewClientDialog(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="warning"
                  aria-label="Editar"
                  @click="openEditClientDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Excluir"
                  @click="openDeleteConfirmDialog(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <Paginator
          v-if="totalRecords > 0"
          :rows="pageSize"
          :total-records="totalRecords"
          :first="firstRecordIndex"
          :rows-per-page-options="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          @page="handlePageChange"
        />
      </template>
    </Card>

    <Dialog
      v-model:visible="showClientFormDialog"
      modal
      :header="isEditing ? 'Editar cliente' : 'Adicionar cliente'"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '90vw' }"
      @hide="closeClientFormDialog"
    >
      <Message
        v-if="modalErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in modalErrorMessages"
            :key="`client-modal-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="client-form"
        @submit.prevent="saveClient"
      >
        <div class="field-block">
          <label
            class="field-label"
            for="client-name"
          >Nome</label>
          <InputText
            id="client-name"
            v-model.trim="currentClient.name"
            :invalid="Boolean(formErrors.name)"
            placeholder="Nome completo do cliente"
          />
          <small
            v-if="formErrors.name"
            class="field-error"
          >
            {{ formErrors.name }}
          </small>
        </div>

        <div class="field-block">
          <label
            class="field-label"
            for="client-phone"
          >Telefone</label>
          <InputText
            id="client-phone"
            v-model="currentClient.phone"
            v-maska:[maskOptions]
            :invalid="Boolean(formErrors.phone)"
            placeholder="(00) 00000-0000"
          />
          <small
            v-if="formErrors.phone"
            class="field-error"
          >
            {{ formErrors.phone }}
          </small>
        </div>

        <div class="field-block">
          <label
            class="field-label"
            for="client-email"
          >E-mail</label>
          <InputText
            id="client-email"
            v-model.trim="currentClient.email"
            type="email"
            :invalid="Boolean(formErrors.email)"
            placeholder="cliente@empresa.com"
          />
          <small
            v-if="formErrors.email"
            class="field-error"
          >
            {{ formErrors.email }}
          </small>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeClientFormDialog"
          />
          <Button
            :label="isEditing ? 'Atualizar' : 'Salvar'"
            type="submit"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsDialog"
      modal
      header="Detalhes do cliente"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <div class="details-grid">
        <div class="details-item">
          <span class="details-item__label">Nome</span>
          <strong>{{ currentClient.name || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Telefone</span>
          <strong>{{ currentClient.phone || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">E-mail</span>
          <strong>{{ currentClient.email || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Criado em</span>
          <strong>{{ formatDateWithHour(currentClient.createdAt) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Ultima atualizacao</span>
          <strong>{{ formatDateWithHour(currentClient.updatedAt) }}</strong>
        </div>
      </div>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="showDetailsDialog = false"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteConfirmDialog"
      modal
      header="Confirmar exclusao"
      :style="{ width: '28rem' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <p class="delete-text">
        Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita.
      </p>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="closeDeleteConfirmDialog"
        />
        <Button
          label="Excluir"
          severity="danger"
          :loading="deleting"
          @click="confirmDeleteClient"
        />
      </template>
    </Dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
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
import { apiService } from '../services/apiService';
import { vMaska } from '../directives/maska';
import { formatDateHour } from '../utils/formatDate';

const clients = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const showClientFormDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteConfirmDialog = ref(false);

const generalErrorMessages = ref([]);
const modalErrorMessages = ref([]);

const isEditing = ref(false);
const clientToDeleteId = ref(null);

const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);
const searchQuery = ref('');
const sortField = ref('name');
const sortOrder = ref(1);

const getEmptyClient = () => ({
  id: null,
  name: '',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: '',
});

const currentClient = reactive(getEmptyClient());
const formErrors = reactive({
  name: '',
  phone: '',
  email: '',
});

const maskOptions = {
  mask: ['(##) ####-####', '(##) #####-####'],
};

const firstRecordIndex = computed(() => (currentPage.value - 1) * pageSize.value);

const getOrderDir = () => (sortOrder.value === -1 ? 'desc' : 'asc');

const normalizeMessages = (error, fallbackMessage) => {
  if (Array.isArray(error)) {
    return error;
  }

  if (error?.message) {
    return Array.isArray(error.message) ? error.message : [error.message];
  }

  return [fallbackMessage];
};

const resetFormErrors = () => {
  formErrors.name = '';
  formErrors.phone = '';
  formErrors.email = '';
};

const validateEmail = (value) => /.+@.+\..+/.test(value);

const validateForm = () => {
  resetFormErrors();

  if (!currentClient.name) {
    formErrors.name = 'Nome e obrigatorio.';
  }

  const phoneDigits = (currentClient.phone || '').replace(/\D/g, '');
  if (!currentClient.phone) {
    formErrors.phone = 'Telefone e obrigatorio.';
  } else if (phoneDigits.length < 10) {
    formErrors.phone = 'Telefone invalido.';
  }

  if (!currentClient.email) {
    formErrors.email = 'E-mail e obrigatorio.';
  } else if (!validateEmail(currentClient.email)) {
    formErrors.email = 'E-mail invalido.';
  }

  return !formErrors.name && !formErrors.phone && !formErrors.email;
};

const getInitials = (value) => (
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CL'
);

const formatDateWithHour = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    return formatDateHour(dateString);
  } catch (error) {
    return dateString;
  }
};

const fetchClients = async () => {
  loading.value = true;
  generalErrorMessages.value = [];

  try {
    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(pageSize.value),
      sortBy: sortField.value,
      orderDir: getOrderDir(),
    });

    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const response = await apiService.get(`/clients?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw data.message || `Erro ${response.status}: Falha ao buscar clientes.`;
    }

    clients.value = data.data || [];
    currentPage.value = Number(data.meta?.page || 1);
    pageSize.value = Number(data.meta?.perPage || pageSize.value);
    totalRecords.value = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    generalErrorMessages.value = normalizeMessages(error, 'Erro ao buscar clientes.');
  } finally {
    loading.value = false;
  }
};

let debounceTimer = null;
watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchClients();
  }, 400);
});

const handlePageChange = (event) => {
  currentPage.value = event.page + 1;
  pageSize.value = event.rows;
  fetchClients();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'name';
  sortOrder.value = event.sortOrder || 1;
  currentPage.value = 1;
  fetchClients();
};

const openAddClientDialog = () => {
  isEditing.value = false;
  Object.assign(currentClient, getEmptyClient());
  modalErrorMessages.value = [];
  resetFormErrors();
  showClientFormDialog.value = true;
};

const openEditClientDialog = (client) => {
  isEditing.value = true;
  Object.assign(currentClient, client);
  modalErrorMessages.value = [];
  resetFormErrors();
  showClientFormDialog.value = true;
};

const closeClientFormDialog = () => {
  showClientFormDialog.value = false;
};

const saveClient = async () => {
  modalErrorMessages.value = [];

  if (!validateForm()) {
    return;
  }

  saving.value = true;

  try {
    const method = isEditing.value ? 'put' : 'post';
    const endpoint = isEditing.value ? `/clients/${currentClient.id}` : '/clients';
    const payload = {
      name: currentClient.name,
      phone: currentClient.phone,
      email: currentClient.email,
    };

    const response = await apiService[method](endpoint, payload);
    const data = await response.json();

    if (!response.ok) {
      throw data.message || 'Erro ao salvar cliente.';
    }

    closeClientFormDialog();
    await fetchClients();
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    modalErrorMessages.value = normalizeMessages(error, 'Erro ao salvar cliente.');
  } finally {
    saving.value = false;
  }
};

const openViewClientDialog = (client) => {
  Object.assign(currentClient, client);
  showDetailsDialog.value = true;
};

const openDeleteConfirmDialog = (id) => {
  clientToDeleteId.value = id;
  showDeleteConfirmDialog.value = true;
};

const closeDeleteConfirmDialog = () => {
  showDeleteConfirmDialog.value = false;
  clientToDeleteId.value = null;
};

const confirmDeleteClient = async () => {
  if (!clientToDeleteId.value) {
    return;
  }

  deleting.value = true;
  generalErrorMessages.value = [];

  try {
    const response = await apiService.delete(`/clients/${clientToDeleteId.value}`);

    if (!response.ok) {
      const data = await response.json();
      throw data.message || 'Erro ao excluir cliente.';
    }

    closeDeleteConfirmDialog();

    if (clients.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }

    await fetchClients();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    generalErrorMessages.value = normalizeMessages(error, 'Erro ao excluir cliente.');
  } finally {
    deleting.value = false;
  }
};

fetchClients();
</script>

<style scoped>
.clients-page {
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

.page-message,
.dialog-message {
  margin: 0;
}

.message-list {
  margin: 0;
  padding-left: 18px;
}

.clients-card {
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

.clients-search {
  width: min(100%, 360px);
}

.clients-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.client-cell__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.client-cell__name {
  display: block;
}

.client-cell__meta {
  color: var(--app-text-muted);
}

.actions-column {
  width: 140px;
}

.actions-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  color: var(--app-text-muted);
}

.client-form,
.details-grid {
  display: grid;
  gap: 18px;
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

.field-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.details-item {
  display: grid;
  gap: 6px;
}

.details-item__label {
  color: var(--app-text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.delete-text {
  margin: 0;
  color: var(--app-text);
  line-height: 1.6;
}

@media (max-width: 959px) {
  .page-header,
  .card-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .clients-search {
    width: 100%;
  }
}
</style>
