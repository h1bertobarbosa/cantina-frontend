<template>
  <section class="users-page">
    <div v-if="errorMessages.length" class="p-message p-message-error users-alert">
      <div class="users-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <Card class="users-card surface-card">
      <template #content>
        <div class="users-toolbar">
          <div>
            <span class="users-eyebrow">Equipe</span>
            <h2>Gerenciar usuários</h2>
            <p>Administre acessos, mantenha os dados da equipe atualizados e redefina senhas com segurança.</p>
          </div>

          <Button
            label="Adicionar Usuário"
            icon="pi pi-plus"
            class="users-add-button"
            @click="addUser"
          />
        </div>

        <div class="users-filters">
          <IconField iconPosition="left" class="users-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchTerm"
              type="text"
              placeholder="Buscar por nome ou email"
              @input="onSearchInput"
            />
          </IconField>
        </div>

        <DataTable
          :value="users"
          :loading="isLoading"
          responsiveLayout="scroll"
          class="users-table"
        >
          <template #empty>
            <div class="users-empty">
              <i class="pi pi-id-card"></i>
              <strong>Nenhum usuário encontrado</strong>
              <span>Ajuste a busca ou adicione um novo usuário.</span>
            </div>
          </template>

          <Column header="Usuário">
            <template #body="{ data }">
              <div class="user-identity">
                <Avatar
                  :label="getInitials(data.name)"
                  shape="circle"
                  class="user-avatar"
                />
                <div>
                  <strong>{{ data.name }}</strong>
                  <span>{{ data.email }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Criado em">
            <template #body="{ data }">
              {{ formatDateHour(data.createdAt) }}
            </template>
          </Column>

          <Column header="Ações" bodyClass="users-actions-cell" headerClass="users-actions-header">
            <template #body="{ data }">
              <div class="users-actions">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  text
                  aria-label="Ver detalhes"
                  @click="viewUser(data.id)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  rounded
                  text
                  aria-label="Editar usuário"
                  @click="editUser(data)"
                />
                <Button
                  icon="pi pi-lock"
                  severity="secondary"
                  rounded
                  text
                  aria-label="Alterar senha"
                  @click="openPasswordModal(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  aria-label="Excluir usuário"
                  @click="confirmDeleteUser(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="users-pagination">
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
      v-model:visible="showUserModal"
      modal
      :header="isEditing ? 'Editar usuário' : 'Adicionar usuário'"
      class="users-dialog"
    >
      <form class="users-form" @submit.prevent="saveUser">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="users-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="users-form-grid">
          <div class="users-field">
            <label for="user-name">Nome</label>
            <InputText id="user-name" v-model="currentUser.name" required />
          </div>

          <div class="users-field">
            <label for="user-email">Email</label>
            <InputText id="user-email" v-model="currentUser.email" type="email" required />
          </div>

          <div v-if="!isEditing" class="users-field users-field-full">
            <label for="user-password">Senha</label>
            <Password
              id="user-password"
              v-model="currentUser.password"
              toggleMask
              :feedback="false"
              required
            />
            <small>A senha deve ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.</small>
          </div>
        </div>

        <div class="users-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closeUserModal"
          />
          <Button type="submit" :label="isEditing ? 'Atualizar' : 'Salvar'" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showPasswordModal"
      modal
      header="Alterar senha"
      class="users-dialog"
    >
      <form class="users-form" @submit.prevent="savePassword">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="users-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="users-password-summary">
          <small>Usuário</small>
          <strong>{{ currentUser.name }}</strong>
          <span>{{ currentUser.email }}</span>
        </div>

        <div class="users-form-grid">
          <div class="users-field users-field-full">
            <label for="new-password">Nova senha</label>
            <Password
              id="new-password"
              v-model="passwordForm.password"
              toggleMask
              :feedback="false"
              required
            />
          </div>

          <div class="users-field users-field-full">
            <label for="confirm-password">Confirmar senha</label>
            <Password
              id="confirm-password"
              v-model="passwordForm.passwordConfirm"
              toggleMask
              :feedback="false"
              required
            />
          </div>
        </div>

        <div class="users-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closePasswordModal"
          />
          <Button type="submit" label="Alterar senha" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Detalhes do usuário"
      class="users-dialog"
    >
      <div class="user-details">
        <div class="user-details-header">
          <Avatar
            :label="getInitials(currentUser.name)"
            shape="circle"
            class="user-avatar user-avatar-large"
          />
          <div>
            <strong>{{ currentUser.name }}</strong>
            <span>{{ currentUser.email }}</span>
          </div>
        </div>

        <div class="user-details-grid">
          <div>
            <small>Criado em</small>
            <strong>{{ formatDateHour(currentUser.createdAt) }}</strong>
          </div>
          <div>
            <small>Atualizado em</small>
            <strong>{{ formatDateHour(currentUser.updatedAt) }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteModal"
      modal
      header="Excluir usuário"
      class="users-dialog users-dialog-compact"
    >
      <p class="users-delete-copy">
        Tem certeza que deseja excluir <strong>{{ currentUser.name }}</strong>?
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
          @click="deleteUser"
        />
      </template>
    </Dialog>
  </section>
</template>

<script>
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
import Password from 'primevue/password';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';

const emptyUser = () => ({
  id: null,
  name: '',
  email: '',
  password: '',
  createdAt: '',
  updatedAt: ''
});

const emptyPasswordForm = () => ({
  password: '',
  passwordConfirm: ''
});

export default {
  name: 'UsersPage',
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
    Paginator,
    Password
  },
  data() {
    return {
      users: [],
      showUserModal: false,
      showPasswordModal: false,
      showDeleteModal: false,
      showDetailsModal: false,
      isEditing: false,
      isLoading: false,
      currentUser: emptyUser(),
      passwordForm: emptyPasswordForm(),
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
    this.fetchUsers();
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceId);
  },
  methods: {
    formatDateHour,
    async fetchUsers(page = this.pagination.page, perPage = this.pagination.perPage) {
      this.isLoading = true;
      this.errorMessages = [];

      try {
        const params = new URLSearchParams({
          page: String(page),
          perPage: String(perPage),
          orderBy: 'name',
          orderDir: 'asc'
        });

        if (this.searchTerm.trim()) {
          params.set('search', this.searchTerm.trim());
        }

        const response = await apiService.get(`/users?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar usuários'];
          return;
        }

        const data = await response.json();
        this.users = data.data;
        this.pagination = {
          page: Number(data.meta.page),
          perPage: Number(data.meta.perPage),
          total: Number(data.meta.total)
        };
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar usuários'];
      } finally {
        this.isLoading = false;
      }
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchUsers(1, this.pagination.perPage);
      }, 300);
    },
    onPageChange(event) {
      const page = Math.floor(event.first / event.rows) + 1;
      this.fetchUsers(page, event.rows);
    },
    addUser() {
      this.isEditing = false;
      this.currentUser = emptyUser();
      this.errorMessages = [];
      this.showUserModal = true;
    },
    editUser(user) {
      this.isEditing = true;
      this.currentUser = { ...emptyUser(), ...user, password: '' };
      this.errorMessages = [];
      this.showUserModal = true;
    },
    confirmDeleteUser(user) {
      this.currentUser = { ...user };
      this.showDeleteModal = true;
    },
    openPasswordModal(user) {
      this.currentUser = { ...user };
      this.passwordForm = emptyPasswordForm();
      this.errorMessages = [];
      this.showPasswordModal = true;
    },
    async saveUser() {
      try {
        this.errorMessages = [];
        const method = this.isEditing ? 'put' : 'post';
        const url = this.isEditing ? `/users/${this.currentUser.id}` : '/users';

        const payload = {
          name: this.currentUser.name,
          email: this.currentUser.email
        };

        if (!this.isEditing) {
          payload.password = this.currentUser.password;
        }

        const response = await apiService[method](url, payload);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao salvar o usuário'];
          return;
        }

        await this.fetchUsers();
        this.closeUserModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar o usuário'];
      }
    },
    async savePassword() {
      try {
        this.errorMessages = [];

        if (this.passwordForm.password !== this.passwordForm.passwordConfirm) {
          this.errorMessages = ['As senhas não conferem'];
          return;
        }

        const response = await apiService.patch(
          `/users/${this.currentUser.id}/change-password`,
          {
            password: this.passwordForm.password,
            passwordConfirm: this.passwordForm.passwordConfirm
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao alterar a senha'];
          return;
        }

        this.closePasswordModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao alterar a senha'];
      }
    },
    async deleteUser() {
      try {
        const response = await apiService.delete(`/users/${this.currentUser.id}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao excluir o usuário'];
          return;
        }

        this.showDeleteModal = false;

        if (this.users.length === 1 && this.pagination.page > 1) {
          this.pagination.page -= 1;
        }

        await this.fetchUsers();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao excluir o usuário'];
      }
    },
    async viewUser(id) {
      try {
        const response = await apiService.get(`/users/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar detalhes do usuário'];
          return;
        }

        this.currentUser = await response.json();
        this.showDetailsModal = true;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar detalhes do usuário'];
      }
    },
    closeUserModal() {
      this.showUserModal = false;
      this.currentUser = emptyUser();
      this.errorMessages = [];
    },
    closePasswordModal() {
      this.showPasswordModal = false;
      this.passwordForm = emptyPasswordForm();
      this.errorMessages = [];
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
    },
    getInitials(name) {
      return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'US';
    }
  }
};
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.users-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.users-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.users-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.users-card :deep(.p-card-body) {
  padding: 28px;
}

.users-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.users-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.users-toolbar h2 {
  margin: 10px 0 8px;
  font-size: 1.8rem;
}

.users-toolbar p {
  margin: 0;
  color: var(--app-surface-muted);
}

.users-add-button {
  background: linear-gradient(135deg, var(--app-primary) 0%, #3b82f6 100%);
  border: none;
  border-radius: 14px;
  padding-inline: 1.2rem;
  box-shadow: 0 16px 30px rgba(29, 78, 216, 0.22);
}

.users-filters {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.users-search {
  width: min(100%, 360px);
}

.users-search :deep(.p-inputtext) {
  width: 100%;
}

.users-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.users-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.users-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-identity strong,
.user-details-header strong {
  display: block;
}

.user-identity span,
.user-details-header span,
.user-details-grid small,
.users-password-summary small,
.users-field small {
  color: var(--app-surface-muted);
}

.user-identity span,
.user-details-header span,
.users-password-summary span {
  display: block;
  margin-top: 4px;
}

.user-avatar {
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.user-avatar-large {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.users-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-actions-cell,
.users-actions-header {
  width: 180px;
}

.users-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  color: var(--app-surface-muted);
}

.users-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.users-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.users-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.users-field label {
  font-weight: 600;
}

.users-field-full {
  grid-column: 1 / -1;
}

.users-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.users-password-summary {
  padding: 18px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.users-password-summary strong,
.user-details-grid strong {
  display: block;
  margin-top: 6px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.users-delete-copy {
  margin: 0;
  color: var(--app-text);
}

.users-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

.users-empty i {
  font-size: 2rem;
  color: var(--app-primary);
}

.users-dialog :deep(.p-dialog-content) {
  padding-top: 4px;
}

@media (max-width: 768px) {
  .users-toolbar,
  .users-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .users-form-grid,
  .user-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
