<template>
  <section class="clients-page">
    <div v-if="errorMessages.length" class="p-message p-message-error clients-alert">
      <div class="clients-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <Card class="clients-card surface-card">
      <template #content>
        <div class="clients-toolbar">
          <div>
            <span class="clients-eyebrow">Relacionamento</span>
            <h2>Gerenciar clientes</h2>
            <p>Encontre, cadastre e acompanhe os dados dos clientes da cantina.</p>
          </div>

          <Button
            label="Adicionar Cliente"
            icon="pi pi-plus"
            class="clients-add-button"
            @click="addClient"
          />
        </div>

        <div class="clients-filters">
          <IconField iconPosition="left" class="clients-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchTerm"
              type="text"
              placeholder="Buscar por nome, telefone ou email"
              @input="onSearchInput"
            />
          </IconField>
        </div>

        <DataTable
          :value="clients"
          :loading="isLoading"
          responsiveLayout="scroll"
          class="clients-table"
        >
          <template #empty>
            <div class="clients-empty">
              <i class="pi pi-users"></i>
              <strong>Nenhum cliente encontrado</strong>
              <span>Ajuste a busca ou adicione um novo cliente.</span>
            </div>
          </template>

          <Column header="Cliente">
            <template #body="{ data }">
              <div class="client-identity">
                <Avatar
                  :label="getInitials(data.name)"
                  shape="circle"
                  class="client-avatar"
                />
                <div>
                  <strong>{{ data.name }}</strong>
                  <span>{{ data.email }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="phone" header="Telefone"></Column>

          <Column header="Criado em">
            <template #body="{ data }">
              {{ formatDateHour(data.createdAt) }}
            </template>
          </Column>

          <Column header="Ações" bodyClass="clients-actions-cell" headerClass="clients-actions-header">
            <template #body="{ data }">
              <div class="clients-actions">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  text
                  aria-label="Ver detalhes"
                  @click="viewClient(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  rounded
                  text
                  aria-label="Editar cliente"
                  @click="editClient(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  aria-label="Excluir cliente"
                  @click="confirmDeleteClient(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="clients-pagination">
          <span>Página {{ pagination.page }} de {{ totalPages }}</span>
          <Paginator
            :first="firstRow"
            :rows="pagination.perPage"
            :totalRecords="pagination.total"
            :rowsPerPageOptions="[10]"
            template="PrevPageLink PageLinks NextPageLink"
            @page="onPageChange"
          />
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="showClientModal"
      modal
      :header="isEditing ? 'Editar cliente' : 'Adicionar cliente'"
      class="clients-dialog"
    >
      <form class="clients-form" @submit.prevent="saveClient">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="clients-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="clients-form-grid">
          <div class="clients-field">
            <label for="client-name">Nome</label>
            <InputText id="client-name" v-model="currentClient.name" required />
          </div>

          <div class="clients-field">
            <label for="client-phone">Telefone</label>
            <InputText
              id="client-phone"
              v-model="currentClient.phone"
              v-mask="'(##) #####-####'"
              required
            />
          </div>

          <div class="clients-field clients-field-full">
            <label for="client-email">Email</label>
            <InputText id="client-email" v-model="currentClient.email" type="email" required />
          </div>
        </div>

        <div class="clients-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closeClientModal"
          />
          <Button type="submit" :label="isEditing ? 'Atualizar' : 'Salvar'" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Detalhes do cliente"
      class="clients-dialog"
    >
      <div class="client-details">
        <div class="client-details-header">
          <Avatar
            :label="getInitials(currentClient.name)"
            shape="circle"
            class="client-avatar client-avatar-large"
          />
          <div>
            <strong>{{ currentClient.name }}</strong>
            <span>{{ currentClient.email }}</span>
          </div>
        </div>

        <div class="client-details-grid">
          <div>
            <small>Telefone</small>
            <strong>{{ currentClient.phone }}</strong>
          </div>
          <div>
            <small>Criado em</small>
            <strong>{{ formatDateHour(currentClient.createdAt) }}</strong>
          </div>
          <div>
            <small>Atualizado em</small>
            <strong>{{ formatDateHour(currentClient.updatedAt) }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteModal"
      modal
      header="Excluir cliente"
      class="clients-dialog clients-dialog-compact"
    >
      <p class="clients-delete-copy">
        Tem certeza que deseja excluir <strong>{{ currentClient.name }}</strong>?
      </p>

      <template #footer>
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          text
          @click="showDeleteModal = false"
        />
        <Button
          type="button"
          label="Excluir"
          severity="danger"
          @click="deleteClient"
        />
      </template>
    </Dialog>
  </section>
</template>

<script>
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';

const emptyClient = () => ({
  id: null,
  name: '',
  phone: '',
  email: '',
  createdAt: '',
  updatedAt: ''
});

export default {
  name: 'ClientsPage',
  components: {
    Avatar,
    Button,
    Card,
    Column,
    DataTable,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Paginator
  },
  data() {
    return {
      clients: [],
      showClientModal: false,
      showDeleteModal: false,
      showDetailsModal: false,
      isEditing: false,
      isLoading: false,
      currentClient: emptyClient(),
      errorMessages: [],
      searchTerm: '',
      searchDebounceId: null,
      pagination: {
        page: 1,
        perPage: 10,
        total: 0
      }
    };
  },
  computed: {
    firstRow() {
      return (this.pagination.page - 1) * this.pagination.perPage;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.pagination.total / this.pagination.perPage));
    }
  },
  created() {
    this.fetchClients();
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceId);
  },
  methods: {
    formatDateHour,
    async fetchClients() {
      this.isLoading = true;
      this.errorMessages = [];

      try {
        const params = new URLSearchParams({
          page: String(this.pagination.page),
          perPage: String(this.pagination.perPage),
          orderBy: 'name',
          orderDir: 'asc'
        });

        if (this.searchTerm.trim()) {
          params.set('search', this.searchTerm.trim());
        }

        const response = await apiService.get(`/clients?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar clientes'];
          return;
        }

        const result = await response.json();
        this.clients = result.data;
        this.pagination = {
          page: Number(result.meta.page),
          perPage: Number(result.meta.perPage),
          total: Number(result.meta.total)
        };
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar clientes'];
      } finally {
        this.isLoading = false;
      }
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchClients();
      }, 300);
    },
    onPageChange(event) {
      this.pagination.page = Math.floor(event.first / event.rows) + 1;
      this.fetchClients();
    },
    addClient() {
      this.isEditing = false;
      this.errorMessages = [];
      this.currentClient = emptyClient();
      this.showClientModal = true;
    },
    editClient(client) {
      this.isEditing = true;
      this.errorMessages = [];
      this.currentClient = { ...client };
      this.showClientModal = true;
    },
    viewClient(client) {
      this.currentClient = { ...client };
      this.showDetailsModal = true;
    },
    confirmDeleteClient(client) {
      this.currentClient = { ...client };
      this.showDeleteModal = true;
    },
    async saveClient() {
      this.errorMessages = [];

      try {
        const method = this.isEditing ? 'put' : 'post';
        const url = this.isEditing ? `/clients/${this.currentClient.id}` : '/clients';
        const payload = {
          name: this.currentClient.name,
          phone: this.currentClient.phone,
          email: this.currentClient.email
        };

        const response = await apiService[method](url, payload);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao salvar o cliente'];
          return;
        }

        this.closeClientModal();
        await this.fetchClients();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar o cliente'];
      }
    },
    async deleteClient() {
      try {
        const response = await apiService.delete(`/clients/${this.currentClient.id}`);

        if (!response.ok) {
          throw new Error('Erro ao excluir o cliente');
        }

        this.showDeleteModal = false;

        if (this.clients.length === 1 && this.pagination.page > 1) {
          this.pagination.page -= 1;
        }

        await this.fetchClients();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao excluir o cliente'];
      }
    },
    closeClientModal() {
      this.showClientModal = false;
      this.currentClient = emptyClient();
      this.errorMessages = [];
    },
    getInitials(name) {
      return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    }
  }
};
</script>

<style scoped>
.clients-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.clients-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.clients-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.clients-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.clients-card :deep(.p-card-body) {
  padding: 28px;
}

.clients-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.clients-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.clients-toolbar h2 {
  margin: 10px 0 8px;
  font-size: 1.8rem;
}

.clients-toolbar p {
  margin: 0;
  color: var(--app-surface-muted);
}

.clients-add-button {
  background: linear-gradient(135deg, var(--app-primary) 0%, #3b82f6 100%);
  border: none;
  border-radius: 14px;
  padding-inline: 1.2rem;
  box-shadow: 0 16px 30px rgba(29, 78, 216, 0.22);
}

.clients-filters {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.clients-search {
  width: min(100%, 360px);
}

.clients-search :deep(.p-inputtext) {
  width: 100%;
  border-radius: 14px;
}

.clients-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.clients-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.clients-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.client-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.client-identity span {
  display: block;
  margin-top: 4px;
  color: var(--app-surface-muted);
}

.client-identity strong,
.client-details-header strong {
  display: block;
}

.client-avatar {
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.client-avatar-large {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.clients-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clients-actions-cell,
.clients-actions-header {
  width: 140px;
}

.clients-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  color: var(--app-surface-muted);
}

.clients-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.clients-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.clients-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clients-field label {
  font-weight: 600;
}

.clients-field-full {
  grid-column: 1 / -1;
}

.clients-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.client-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.client-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.client-details-header span,
.client-details-grid small {
  color: var(--app-surface-muted);
}

.client-details-header span {
  display: block;
  margin-top: 4px;
}

.client-details-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.client-details-grid strong {
  display: block;
  margin-top: 6px;
}

.clients-delete-copy {
  margin: 0;
  color: var(--app-text);
}

.clients-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

.clients-empty i {
  font-size: 2rem;
  color: var(--app-primary);
}

.clients-dialog :deep(.p-dialog-content) {
  padding-top: 4px;
}

@media (max-width: 768px) {
  .clients-toolbar,
  .clients-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .clients-form-grid,
  .client-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
