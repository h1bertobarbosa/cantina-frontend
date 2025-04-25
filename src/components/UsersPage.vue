<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center mb-3">
        <h2>Gerenciar Usuários</h2>
        <v-btn color="primary" @click="openAddUserDialog">
          <v-icon start>mdi-plus</v-icon>
          Adicionar Usuário
        </v-btn>
      </v-col>
    </v-row>

    <!-- Mensagens de Erro Gerais -->
    <v-row v-if="errorMessages.length">
      <v-col cols="12">
        <!-- Using closable to allow user dismissal -->
        <v-alert type="error" variant="tonal" border="start" prominent closable @update:modelValue="errorMessages = []">
          <ul>
            <li v-for="(error, index) in errorMessages" :key="`err-${index}`">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Indicador de Carregamento da Tabela -->
     <v-row v-if="loading">
       <v-col cols="12" class="text-center">
         <v-progress-circular indeterminate color="primary"></v-progress-circular>
         <p>Carregando usuários...</p>
       </v-col>
     </v-row>

    <!-- Tabela de Usuários -->
    <v-row v-if="!loading && users.length">
      <v-col cols="12">
        <v-table hover density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left">Nome</th>
              <th class="text-left">Email</th>
              <th class="text-left">Data de Criação</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td class="text-center">
                <v-tooltip text="Detalhes">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" color="info" variant="text" size="small" @click="openViewUserDialog(user.id)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Editar">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-pencil" color="warning" variant="text" size="small" @click="openEditUserDialog(user)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Excluir">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete" color="error" variant="text" size="small" @click="confirmDeleteUser(user.id)"></v-btn>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Paginação -->
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          @update:modelValue="handlePageChange"
          density="compact"
          class="mt-4"
        ></v-pagination>
      </v-col>
    </v-row>

     <!-- Mensagem de Nenhuma Informação -->
     <v-row v-if="!loading && !users.length && !errorMessages.length">
       <v-col cols="12">
         <v-alert type="info" variant="tonal" border="start">
           Nenhum usuário encontrado.
         </v-alert>
       </v-col>
     </v-row>

    <!-- Dialog para Adicionar/Editar Usuário -->
    <v-dialog v-model="showUserDialog" max-width="600px" persistent>
      <v-card>
        <v-form ref="userForm" @submit.prevent="saveUser">
          <v-card-title class="headline grey lighten-2">
            {{ isEditing ? 'Editar Usuário' : 'Adicionar Usuário' }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeUserDialog"></v-btn>
          </v-card-title>
          <v-card-text>
             <!-- Mensagens de Erro no Dialog -->
             <v-alert v-if="dialogErrorMessages.length" type="error" variant="tonal" border="start" density="compact" class="mb-3" closable @update:modelValue="dialogErrorMessages = []">
               <ul>
                 <li v-for="(error, index) in dialogErrorMessages" :key="`dialog-err-${index}`">{{ error }}</li>
               </ul>
             </v-alert>

            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    label="Nome"
                    v-model="currentUser.name"
                    :rules="[rules.required]"
                    required
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    label="Email"
                    v-model="currentUser.email"
                    :rules="[rules.required, rules.email]"
                    required
                    type="email"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                   <!-- Password field only shown/required when adding, optional when editing -->
                  <v-text-field
                    label="Senha"
                    v-model="currentUser.password"
                    :rules="isEditing ? [] : [rules.required, rules.minLength(6)]"
                    :required="!isEditing"
                    type="password"
                    variant="outlined"
                    density="compact"
                    :hint="isEditing ? 'Deixe em branco para manter a senha atual' : 'Mínimo 6 caracteres'"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <!-- Outros campos podem ser adicionados como v-col -->
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeUserDialog">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit" :loading="saving">
              {{ isEditing ? 'Atualizar' : 'Salvar' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Dialog para Visualizar Detalhes do Usuário -->
    <v-dialog v-model="showDetailsDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Detalhes do Usuário
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
            <v-list density="compact">
                <v-list-item>
                    <v-list-item-title><strong>ID:</strong> {{ currentUserDetails.id }}</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title><strong>Nome:</strong> {{ currentUserDetails.name }}</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title><strong>Email:</strong> {{ currentUserDetails.email }}</v-list-item-title>
                </v-list-item>
                 <v-list-item>
                    <v-list-item-title><strong>Criado em:</strong> {{ formatDate(currentUserDetails.createdAt) }}</v-list-item-title>
                </v-list-item>
                <!-- Outros detalhes podem ser adicionados como v-list-item -->
            </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showDetailsDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <!-- Dialog de Confirmação de Exclusão -->
     <v-dialog v-model="showDeleteConfirmDialog" max-width="400px" persistent>
        <v-card>
            <v-card-title class="headline">Confirmar Exclusão</v-card-title>
            <v-card-text>
                Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey darken-1" text @click="cancelDelete">Cancelar</v-btn>
                <v-btn color="error" :loading="deleting" @click="executeDelete">Excluir</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref,  computed, onMounted } from 'vue';
import { apiService } from '@/services/apiService'; // Ajuste o path se necessário
import { formatDateHour } from '@/utils/formatDate'; // Ajuste o path se necessário

// --- State ---
const users = ref([]);
const loading = ref(false);
const saving = ref(false); // Loading state for save/update button
const deleting = ref(false); // Loading state for delete button
const showUserDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteConfirmDialog = ref(false);
const isEditing = ref(false);
const currentUser = ref({ // Used for the form
  id: null,
  name: '',
  email: '',
  password: ''
});
const currentUserDetails = ref({}); // Used for the details view
const userToDeleteId = ref(null); // Store ID for deletion confirmation

const errorMessages = ref([]); // General page errors
const dialogErrorMessages = ref([]); // Errors specific to the add/edit dialog

const currentPage = ref(1);
const totalRows = ref(0);
const pageSize = ref(10); // Or get from config/API meta

// --- Computed ---
const totalPages = computed(() => {
  if (!totalRows.value || totalRows.value <= 0) return 0;
  return Math.ceil(totalRows.value / pageSize.value);
});

// --- Validation Rules ---
const rules = {
  required: value => !!value || 'Campo obrigatório.',
  email: value => /.+@.+\..+/.test(value) || 'E-mail inválido.',
  minLength: (length) => (value) => (value && value.length >= length) || `Mínimo ${length} caracteres.`,
};

// --- Vuetify Form Reference ---
const userForm = ref(null); // Reference to the v-form

// --- Methods ---
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Assuming formatDateHour handles potential invalid dates gracefully
    return formatDateHour(dateString);
};

const fetchUsers = async () => {
  loading.value = true;
  errorMessages.value = [];
  try {
    const response = await apiService.get(`/users?page=${currentPage.value}&perPage=${pageSize.value}`);
    const data = await response.json(); // Always try to parse JSON

    if (!response.ok) {
        users.value = [];
        totalRows.value = 0;
        errorMessages.value = Array.isArray(data?.message)
            ? data.message
            : [data?.message || `Erro ${response.status} ao buscar usuários.`];
        throw new Error(errorMessages.value[0]); // Propagate error
    }

    users.value = data.data || [];
    currentPage.value = parseInt(data.meta?.page || currentPage.value);
    totalRows.value = parseInt(data.meta?.total || 0);
    pageSize.value = parseInt(data.meta?.perPage || pageSize.value);

  } catch (error) {
    console.error("Fetch Users Error:", error);
     if (!errorMessages.value.length) { // Set generic error if none came from API
        errorMessages.value = ['Ocorreu um erro inesperado ao buscar usuários.'];
     }
  } finally {
    loading.value = false;
  }
};

const resetCurrentUser = () => {
    currentUser.value = { id: null, name: '', email: '', password: '' };
};

const openAddUserDialog = () => {
  isEditing.value = false;
  resetCurrentUser();
  dialogErrorMessages.value = []; // Clear dialog errors
  // Reset validation state if form exists
  userForm.value?.resetValidation();
  showUserDialog.value = true;
};

const openEditUserDialog = (user) => {
  isEditing.value = true;
  // Create a copy to avoid modifying the list directly
  currentUser.value = { ...user, password: '' }; // Clear password for editing form
  dialogErrorMessages.value = [];
  userForm.value?.resetValidation();
  showUserDialog.value = true;
};

const closeUserDialog = () => {
  showUserDialog.value = false;
  // Optional: resetCurrentUser(); // Reset form data on close
};

const saveUser = async () => {
  // Trigger Vuetify form validation
  const { valid } = await userForm.value?.validate();
  if (!valid) {
    return; // Stop if validation fails
  }

  saving.value = true;
  dialogErrorMessages.value = []; // Clear previous dialog errors
  try {
    const method = isEditing.value ? 'put' : 'post';
    const url = isEditing.value ? `/users/${currentUser.value.id}` : `/users`;

    // Prepare payload, only include password if provided (or if creating)
    const payload = {
      name: currentUser.value.name,
      email: currentUser.value.email,
    };
    if (!isEditing.value || currentUser.value.password) {
      payload.password = currentUser.value.password;
    }

    const response = await apiService[method](url, payload);
    const responseData = await response.json();

    if (!response.ok) {
      dialogErrorMessages.value = Array.isArray(responseData?.message)
        ? responseData.message
        : [responseData?.message || `Erro ${response.status} ao salvar o usuário.`];
      throw new Error(dialogErrorMessages.value[0]);
    }

    closeUserDialog();
    // Fetch users on the *current* page after add/edit
    await fetchUsers();
    // Optionally show success message (e.g., using a Snackbar)

  } catch (error) {
    console.error("Save User Error:", error);
     // Error messages are already set in the catch block for API errors
     if (!dialogErrorMessages.value.length) {
        dialogErrorMessages.value = ['Ocorreu um erro inesperado ao salvar o usuário.'];
     }
  } finally {
    saving.value = false;
  }
};

const confirmDeleteUser = (id) => {
    userToDeleteId.value = id;
    showDeleteConfirmDialog.value = true;
};

const cancelDelete = () => {
    showDeleteConfirmDialog.value = false;
    userToDeleteId.value = null;
};

const executeDelete = async () => {
    if (!userToDeleteId.value) return;

    deleting.value = true;
    errorMessages.value = []; // Clear general errors
    try {
        const response = await apiService.delete(`/users/${userToDeleteId.value}`);

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({})); // Try get json error
             errorMessages.value = Array.isArray(errorData?.message)
                ? errorData.message
                : [errorData?.message || `Erro ${response.status} ao excluir o usuário.`];
             throw new Error(errorMessages.value[0]);
        }

        // Success
        showDeleteConfirmDialog.value = false;
        userToDeleteId.value = null;

        // Adjust current page if the last item on the page was deleted
        if (users.value.length === 1 && currentPage.value > 1) {
            currentPage.value--;
        }
        await fetchUsers(); // Refresh list
        // Optionally show success message

    } catch (error) {
        console.error("Delete User Error:", error);
        // Errors are set above
        if (!errorMessages.value.length) {
             errorMessages.value = ['Ocorreu um erro inesperado ao excluir o usuário.'];
        }
        // Keep the confirm dialog open in case of error? Or close it? Closing for now.
        showDeleteConfirmDialog.value = false;
        userToDeleteId.value = null;
    } finally {
        deleting.value = false;
    }
};

const openViewUserDialog = async (id) => {
  // You could fetch fresh data or use existing if details aren't extensive
  const user = users.value.find(u => u.id === id);
  if (user) {
    currentUserDetails.value = { ...user }; // Use a copy
    showDetailsDialog.value = true;
  } else {
     // Optional: Fetch from API if not found in current list
     loading.value = true; // Show general loading maybe
     errorMessages.value = [];
     try {
        const response = await apiService.get(`/users/${id}`);
        const data = await response.json();
        if (!response.ok) {
            errorMessages.value = Array.isArray(data?.message) ? data.message : [data?.message || 'Erro ao buscar detalhes.'];
            throw new Error(errorMessages.value[0]);
        }
        currentUserDetails.value = data;
        showDetailsDialog.value = true;
     } catch (error) {
        console.error("View User Error:", error);
        if (!errorMessages.value.length) {
            errorMessages.value = ['Erro ao buscar detalhes do usuário.'];
        }
     } finally {
        loading.value = false;
     }
  }
};

const handlePageChange = () => {
  // v-model already updates currentPage
  // The @update:modelValue triggers this
  fetchUsers();
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchUsers();
});

</script>

<style scoped>
/* Remove modal styles if they were Bootstrap specific */
/* .modal { ... } */

/* Add any Vuetify specific adjustments if needed */
.v-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03); /* Subtle hover for v-table */
}

/* Ensure list items in details dialog don't have extra padding */
.v-list-item {
    min-height: auto;
    padding-top: 4px;
    padding-bottom: 4px;
}
</style>