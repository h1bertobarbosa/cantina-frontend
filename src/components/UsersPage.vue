<template>
  <section class="users-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Equipe
        </p>
        <h1 class="page-title">
          Gerenciar usuarios
        </h1>
        <p class="page-subtitle">
          Cadastre, edite, acompanhe e proteja o acesso dos usuarios da sua conta.
        </p>
      </div>

      <Button
        label="Adicionar usuario"
        icon="pi pi-plus"
        @click="openAddUserDialog"
      />
    </header>

    <Message
      v-if="errorMessages.length"
      severity="error"
      class="page-message"
    >
      <ul class="message-list">
        <li
          v-for="(error, index) in errorMessages"
          :key="`users-page-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="users-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Lista principal
            </h2>
            <p class="card-subtitle">
              Busque por nome ou e-mail, revise os dados e gerencie senhas com rapidez.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <IconField class="users-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por nome ou email"
            />
          </IconField>
        </div>

        <DataTable
          :value="users"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="users-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhum usuario encontrado.</span>
            </div>
          </template>

          <Column
            field="name"
            header="Nome"
            sortable
          >
            <template #body="{ data }">
              <div class="user-identity">
                <Avatar
                  :label="getInitials(data.name)"
                  shape="circle"
                  class="user-identity__avatar"
                />
                <div>
                  <strong class="user-identity__name">{{ data.name }}</strong>
                  <small class="user-identity__meta">ID {{ data.id }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="email"
            header="Email"
            sortable
          />

          <Column
            field="created_at"
            header="Criado em"
            sortable
            sort-field="created_at"
          >
            <template #body="{ data }">
              {{ formatDateLabel(data.createdAt) }}
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
                  @click="openViewUserDialog(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="warning"
                  aria-label="Editar"
                  @click="openEditUserDialog(data)"
                />
                <Button
                  icon="pi pi-key"
                  text
                  rounded
                  severity="help"
                  aria-label="Trocar senha"
                  @click="openPasswordDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Excluir"
                  :disabled="isCurrentUser(data.id)"
                  @click="confirmDeleteUser(data)"
                />
              </div>
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
      v-model:visible="showUserDialog"
      modal
      :header="isEditing ? 'Editar usuario' : 'Adicionar usuario'"
      :style="{ width: '36rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closeUserDialog"
    >
      <Message
        v-if="dialogErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in dialogErrorMessages"
            :key="`user-dialog-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="dialog-form"
        @submit.prevent="saveUser"
      >
        <div class="form-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="user-name"
            >Nome</label>
            <InputText
              id="user-name"
              v-model="currentUser.name"
              :invalid="Boolean(userFormErrors.name)"
            />
            <small
              v-if="userFormErrors.name"
              class="field-error"
            >
              {{ userFormErrors.name }}
            </small>
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="user-email"
            >Email</label>
            <InputText
              id="user-email"
              v-model="currentUser.email"
              type="email"
              :invalid="Boolean(userFormErrors.email)"
            />
            <small
              v-if="userFormErrors.email"
              class="field-error"
            >
              {{ userFormErrors.email }}
            </small>
          </div>

          <div
            v-if="!isEditing"
            class="field-block"
          >
            <label
              class="field-label"
              for="user-password"
            >Senha</label>
            <Password
              id="user-password"
              v-model="currentUser.password"
              toggle-mask
              :feedback="false"
              fluid
              :invalid="Boolean(userFormErrors.password)"
            />
            <small
              v-if="userFormErrors.password"
              class="field-error"
            >
              {{ userFormErrors.password }}
            </small>
          </div>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeUserDialog"
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
      header="Detalhes do usuario"
      :style="{ width: '32rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closeDetailsDialog"
    >
      <div class="details-grid">
        <div class="details-item">
          <span class="details-item__label">ID</span>
          <strong>{{ currentUserDetails.id || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Nome</span>
          <strong>{{ currentUserDetails.name || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Email</span>
          <strong>{{ currentUserDetails.email || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Criado em</span>
          <strong>{{ formatDateLabel(currentUserDetails.createdAt) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Atualizado em</span>
          <strong>{{ formatDateLabel(currentUserDetails.updatedAt) }}</strong>
        </div>
      </div>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="closeDetailsDialog"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showPasswordDialog"
      modal
      header="Trocar senha"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closePasswordDialog"
    >
      <Message
        v-if="passwordErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in passwordErrorMessages"
            :key="`password-dialog-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="dialog-form"
        @submit.prevent="savePassword"
      >
        <div class="details-grid details-grid--compact">
          <div class="details-item">
            <span class="details-item__label">Usuario</span>
            <strong>{{ passwordTarget.name || 'N/A' }}</strong>
          </div>
          <div class="details-item">
            <span class="details-item__label">Email</span>
            <strong>{{ passwordTarget.email || 'N/A' }}</strong>
          </div>
        </div>

        <div class="form-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="password-new"
            >Nova senha</label>
            <Password
              id="password-new"
              v-model="passwordForm.password"
              toggle-mask
              :feedback="false"
              fluid
              :invalid="Boolean(passwordFormErrors.password)"
            />
            <small
              v-if="passwordFormErrors.password"
              class="field-error"
            >
              {{ passwordFormErrors.password }}
            </small>
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="password-confirm"
            >Confirmar senha</label>
            <Password
              id="password-confirm"
              v-model="passwordForm.passwordConfirm"
              toggle-mask
              :feedback="false"
              fluid
              :invalid="Boolean(passwordFormErrors.passwordConfirm)"
            />
            <small
              v-if="passwordFormErrors.passwordConfirm"
              class="field-error"
            >
              {{ passwordFormErrors.passwordConfirm }}
            </small>
          </div>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closePasswordDialog"
          />
          <Button
            label="Atualizar senha"
            type="submit"
            :loading="savingPassword"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteConfirmDialog"
      modal
      header="Confirmar exclusao"
      :style="{ width: '30rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="cancelDelete"
    >
      <p class="delete-text">
        Tem certeza que deseja excluir este usuario? Esta acao nao pode ser desfeita.
      </p>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="cancelDelete"
        />
        <Button
          label="Excluir"
          severity="danger"
          :loading="deleting"
          @click="executeDelete"
        />
      </template>
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
import Password from 'primevue/password';
import { jwtDecode } from 'jwt-decode';
import { apiService } from '@/services/apiService';
import { formatDateHour } from '@/utils/formatDate';

const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const savingPassword = ref(false);
const deleting = ref(false);

const showUserDialog = ref(false);
const showDetailsDialog = ref(false);
const showPasswordDialog = ref(false);
const showDeleteConfirmDialog = ref(false);

const isEditing = ref(false);
const currentUser = reactive({
  id: null,
  name: '',
  email: '',
  password: '',
});
const currentUserDetails = ref({});
const passwordTarget = ref({});
const userToDeleteId = ref(null);

const errorMessages = ref([]);
const dialogErrorMessages = ref([]);
const passwordErrorMessages = ref([]);
const searchQuery = ref('');

const currentUserId = ref(null);
const sortField = ref('name');
const sortOrder = ref(1);

const pagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
});

const userFormErrors = reactive({
  name: '',
  email: '',
  password: '',
});

const passwordForm = reactive({
  password: '',
  passwordConfirm: '',
});

const passwordFormErrors = reactive({
  password: '',
  passwordConfirm: '',
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
    .join('') || 'US'
);

const isCurrentUser = (userId) => userId && userId === currentUserId.value;

const getOrderDir = () => (sortOrder.value === 1 ? 'asc' : 'desc');

const buildUsersQuery = () => {
  const params = new URLSearchParams({
    page: String(pagination.page),
    perPage: String(pagination.perPage),
    orderBy: sortField.value,
    orderDir: getOrderDir(),
  });

  if (searchQuery.value) {
    params.append('search', searchQuery.value);
  }

  return params.toString();
};

const fetchUsers = async () => {
  loading.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.get(`/users?${buildUsersQuery()}`);
    const data = await response.json();

    if (!response.ok) {
      users.value = [];
      pagination.total = 0;
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar usuarios.');
      throw new Error(errorMessages.value[0]);
    }

    users.value = data.data || [];
    pagination.page = Number(data.meta?.page || pagination.page);
    pagination.perPage = Number(data.meta?.perPage || pagination.perPage);
    pagination.total = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao buscar usuarios.'];
    }
  } finally {
    loading.value = false;
  }
};

const resetCurrentUser = () => {
  currentUser.id = null;
  currentUser.name = '';
  currentUser.email = '';
  currentUser.password = '';
};

const resetUserFormErrors = () => {
  userFormErrors.name = '';
  userFormErrors.email = '';
  userFormErrors.password = '';
};

const isValidEmail = (value) => /.+@.+\..+/.test(String(value || '').trim());

const isStrongEnoughPassword = (value) => {
  const password = String(value || '');
  return password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password);
};

const validateUserForm = () => {
  resetUserFormErrors();

  if (!String(currentUser.name || '').trim()) {
    userFormErrors.name = 'Nome e obrigatorio.';
  }

  if (!isValidEmail(currentUser.email)) {
    userFormErrors.email = 'Email invalido.';
  }

  if (!isEditing.value && !isStrongEnoughPassword(currentUser.password)) {
    userFormErrors.password = 'A senha deve ter 8 caracteres, com maiuscula, minuscula e numero.';
  }

  return !userFormErrors.name && !userFormErrors.email && !userFormErrors.password;
};

const openAddUserDialog = () => {
  isEditing.value = false;
  resetCurrentUser();
  resetUserFormErrors();
  dialogErrorMessages.value = [];
  showUserDialog.value = true;
};

const openEditUserDialog = (user) => {
  isEditing.value = true;
  currentUser.id = user.id;
  currentUser.name = user.name;
  currentUser.email = user.email;
  currentUser.password = '';
  resetUserFormErrors();
  dialogErrorMessages.value = [];
  showUserDialog.value = true;
};

const closeUserDialog = () => {
  showUserDialog.value = false;
  resetCurrentUser();
  resetUserFormErrors();
  dialogErrorMessages.value = [];
};

const saveUser = async () => {
  dialogErrorMessages.value = [];

  if (!validateUserForm()) {
    dialogErrorMessages.value.push('Por favor, corrija os erros do formulario.');
    return;
  }

  saving.value = true;

  try {
    const payload = {
      name: String(currentUser.name).trim(),
      email: String(currentUser.email).trim(),
    };

    let response;
    if (isEditing.value) {
      response = await apiService.put(`/users/${currentUser.id}`, payload);
    } else {
      response = await apiService.post('/users', {
        ...payload,
        password: currentUser.password,
      });
    }

    const responseData = await response.json();

    if (!response.ok) {
      dialogErrorMessages.value = normalizeMessages(responseData, 'Erro ao salvar o usuario.');
      throw new Error(dialogErrorMessages.value[0]);
    }

    closeUserDialog();
    await fetchUsers();
  } catch (error) {
    console.error('Save User Error:', error);
    if (!dialogErrorMessages.value.length) {
      dialogErrorMessages.value = ['Ocorreu um erro inesperado ao salvar o usuario.'];
    }
  } finally {
    saving.value = false;
  }
};

const openViewUserDialog = async (user) => {
  currentUserDetails.value = { ...user };

  if (!user.updatedAt) {
    try {
      const response = await apiService.get(`/users/${user.id}`);
      const data = await response.json();

      if (response.ok) {
        currentUserDetails.value = data;
      }
    } catch (error) {
      console.error('Fetch User Details Error:', error);
    }
  }

  showDetailsDialog.value = true;
};

const closeDetailsDialog = () => {
  showDetailsDialog.value = false;
  currentUserDetails.value = {};
};

const resetPasswordForm = () => {
  passwordForm.password = '';
  passwordForm.passwordConfirm = '';
};

const resetPasswordFormErrors = () => {
  passwordFormErrors.password = '';
  passwordFormErrors.passwordConfirm = '';
};

const validatePasswordForm = () => {
  resetPasswordFormErrors();

  if (!isStrongEnoughPassword(passwordForm.password)) {
    passwordFormErrors.password = 'A senha deve ter 8 caracteres, com maiuscula, minuscula e numero.';
  }

  if (passwordForm.passwordConfirm !== passwordForm.password) {
    passwordFormErrors.passwordConfirm = 'As senhas precisam ser iguais.';
  }

  return !passwordFormErrors.password && !passwordFormErrors.passwordConfirm;
};

const openPasswordDialog = (user) => {
  passwordTarget.value = { ...user };
  resetPasswordForm();
  resetPasswordFormErrors();
  passwordErrorMessages.value = [];
  showPasswordDialog.value = true;
};

const closePasswordDialog = () => {
  showPasswordDialog.value = false;
  passwordTarget.value = {};
  resetPasswordForm();
  resetPasswordFormErrors();
  passwordErrorMessages.value = [];
};

const savePassword = async () => {
  passwordErrorMessages.value = [];

  if (!validatePasswordForm()) {
    passwordErrorMessages.value.push('Por favor, corrija os erros do formulario.');
    return;
  }

  savingPassword.value = true;

  try {
    const response = await apiService.patch(`/users/${passwordTarget.value.id}/change-password`, {
      password: passwordForm.password,
      passwordConfirm: passwordForm.passwordConfirm,
    });
    const responseData = await response.json();

    if (!response.ok) {
      passwordErrorMessages.value = normalizeMessages(responseData, 'Erro ao atualizar a senha.');
      throw new Error(passwordErrorMessages.value[0]);
    }

    closePasswordDialog();
  } catch (error) {
    console.error('Change Password Error:', error);
    if (!passwordErrorMessages.value.length) {
      passwordErrorMessages.value = ['Ocorreu um erro inesperado ao atualizar a senha.'];
    }
  } finally {
    savingPassword.value = false;
  }
};

const confirmDeleteUser = (user) => {
  userToDeleteId.value = user.id;
  showDeleteConfirmDialog.value = true;
};

const cancelDelete = () => {
  showDeleteConfirmDialog.value = false;
  userToDeleteId.value = null;
};

const executeDelete = async () => {
  if (!userToDeleteId.value) {
    return;
  }

  deleting.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.delete(`/users/${userToDeleteId.value}`);
    let errorData = null;

    if (response.headers.get('content-type')?.includes('application/json')) {
      errorData = await response.json();
    }

    if (!response.ok) {
      errorMessages.value = normalizeMessages(errorData, 'Erro ao excluir o usuario.');
      throw new Error(errorMessages.value[0]);
    }

    cancelDelete();

    if (users.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }

    await fetchUsers();
  } catch (error) {
    console.error('Delete User Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao excluir o usuario.'];
    }
    cancelDelete();
  } finally {
    deleting.value = false;
  }
};

const handlePageChange = (event) => {
  pagination.page = event.page + 1;
  pagination.perPage = event.rows;
  fetchUsers();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'name';
  sortOrder.value = event.sortOrder || 1;
  pagination.page = 1;
  fetchUsers();
};

const loadCurrentUserId = () => {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    currentUserId.value = null;
    return;
  }

  try {
    const decodedToken = jwtDecode(accessToken);
    currentUserId.value = decodedToken.sub || null;
  } catch (error) {
    currentUserId.value = null;
  }
};

let searchDebounce = null;
watch(searchQuery, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.page = 1;
    fetchUsers();
  }, 400);
});

onMounted(() => {
  loadCurrentUserId();
  fetchUsers();
});
</script>

<style scoped>
.users-page {
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

.users-card {
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
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.users-search {
  width: 100%;
}

.users-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-identity__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.user-identity__name {
  display: block;
}

.user-identity__meta {
  color: var(--app-text-muted);
}

.actions-column {
  width: 180px;
}

.actions-row {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  color: var(--app-text-muted);
}

.dialog-form,
.details-grid {
  display: grid;
  gap: 18px;
}

.details-grid--compact {
  gap: 12px;
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

.form-grid {
  display: grid;
  gap: 16px;
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
}
</style>
