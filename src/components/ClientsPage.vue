<template>
  <v-container fluid>
    <v-row class="align-center mb-2">
      <v-col cols="12" md="6">
        <h2 class="text-h5">Gerenciar Clientes</h2>
      </v-col>
      <v-col cols="12" md="6" class="d-flex ga-2 flex-wrap">
        <v-text-field
          v-model="searchQuery"
          label="Buscar por nome ou email..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="flex-grow-1"
        ></v-text-field>
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus" 
          @click="openAddClientDialog"
          height="40"
        >
          Adicionar Cliente
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="generalErrorMessages.length">
      <v-col cols="12">
        <v-alert
          type="error"
          variant="tonal"
          border="start"
          prominent
          closable
          @update:modelValue="generalErrorMessages = []"
        >
          <ul>
            <li v-for="(error, index) in generalErrorMessages" :key="`gen-err-${index}`">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card border flat>
          <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
          
          <v-table v-if="!loading && clients.length" hover density="compact">
            <thead class="bg-grey-lighten-4">
              <tr>
                <th 
                  v-for="header in headers" 
                  :key="header.key" 
                  :class="['text-left', { 'cursor-pointer': header.sortable }]"
                  @click="header.sortable ? handleSort(header.key) : null"
                >
                  {{ header.title }}
                  <v-icon 
                    v-if="sort.key === header.key" 
                    :icon="sort.order === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                    size="small"
                  ></v-icon>
                </th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="client in clients" :key="client.id">
                <td>{{ client.name }}</td>
                <td>{{ client.phone }}</td>
                <td>{{ client.email }}</td>
                <td>{{ formatDateWithHour(client.createdAt) }}</td>
                <td class="text-center">
                  <v-tooltip text="Detalhes">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-eye" color="info" variant="text" size="small" @click="openViewClientDialog(client)"></v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Editar">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-pencil" color="warning" variant="text" size="small" @click="openEditClientDialog(client)"></v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Excluir">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-delete" color="error" variant="text" size="small" @click="openDeleteConfirmDialog(client.id)"></v-btn>
                    </template>
                  </v-tooltip>
                </td>
              </tr>
            </tbody>
          </v-table>
          
          <v-alert v-if="!loading && !clients.length && !generalErrorMessages.length" type="info" variant="tonal" class="ma-2">
            Nenhuma informação para ser exibida.
          </v-alert>

          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="compact"
            class="mt-4"
          ></v-pagination>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showClientFormDialog" max-width="600px" persistent>
      <v-card>
        <v-form ref="clientForm" @submit.prevent="saveClient">
          <v-card-title class="headline grey lighten-2">
            {{ isEditing ? 'Editar Cliente' : 'Adicionar Cliente' }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeClientFormDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="modalErrorMessages.length"
              type="error" variant="tonal" border="start" density="compact" class="mb-3"
              closable @update:modelValue="modalErrorMessages = []"
            >
              <ul>
                <li v-for="(error, index) in modalErrorMessages" :key="`mod-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>
            <v-text-field
              v-model="currentClient.name" label="Nome" :rules="[rules.required]"
              required variant="outlined" density="compact" class="mb-3"
            ></v-text-field>
            <v-text-field
              v-model="currentClient.phone" label="Telefone" v-maska:[maskOptions]
              :rules="[rules.required, rules.phone]" required variant="outlined"
              density="compact" class="mb-3"
            ></v-text-field>
            <v-text-field
              v-model="currentClient.email" label="Email" type="email"
              :rules="[rules.required, rules.email]" required variant="outlined"
              density="compact" class="mb-3"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeClientFormDialog">Cancelar</v-btn>
            <v-btn color="primary" type="submit" :loading="saving">
              {{ isEditing ? 'Atualizar' : 'Salvar' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDetailsDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Detalhes do Cliente
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <p><strong>Nome:</strong> {{ currentClient.name }}</p>
          <p><strong>Telefone:</strong> {{ currentClient.phone }}</p>
          <p><strong>Email:</strong> {{ currentClient.email }}</p>
          <p><strong>Criado em:</strong> {{ formatDateWithHour(currentClient.created_at) }}</p>
          <p><strong>Última Atualização:</strong> {{ formatDateWithHour(currentClient.updated_at) }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showDetailsDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <v-dialog v-model="showDeleteConfirmDialog" max-width="500px" persistent>
      <v-card>
         <v-card-title class="headline">Confirmar Exclusão</v-card-title>
         <v-card-text>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
         </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeDeleteConfirmDialog">Cancelar</v-btn>
            <v-btn color="error" :loading="deleting" @click="confirmDeleteClient">Excluir</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { apiService } from '../services/apiService'; // Mantenha seu serviço de API
import { formatDateHour } from '../utils/formatDate'; // Mantenha seu utilitário de data
import { vMaska } from "maska"; // Diretiva de máscara para Vue 3

// --- STATE MANAGEMENT (Refs & Reactive) ---
const clients = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const showClientFormDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteConfirmDialog = ref(false);

const generalErrorMessages = ref([]);
const modalErrorMessages = ref([]);

const clientForm = ref(null); // Para acessar o componente <v-form>
const isEditing = ref(false);
const clientToDeleteId = ref(null);

const getEmptyClient = () => ({
  id: null, name: '', phone: '', email: '', created_at: '', updated_at: ''
});

const currentClient = reactive(getEmptyClient());

// --- PAGINATION, SEARCH & SORT STATE ---
const currentPage = ref(1);
const totalPages = ref(0);
const pageSize = ref(10); // Pode ser ajustado ou vir da API
const searchQuery = ref('');
const sort = ref({ key: 'name', order: 'asc' }); // Ordenação inicial padrão

// Cabeçalhos da tabela para facilitar a renderização e ordenação
const headers = [
  { title: 'Nome', key: 'name', sortable: true },
  { title: 'Telefone', key: 'phone', sortable: false },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Criado em', key: 'created_at', sortable: true },
];

// --- API & DATA FETCHING ---
const fetchClients = async () => {
  loading.value = true;
  generalErrorMessages.value = [];
  try {
    // Construção dinâmica dos query params
    const params = new URLSearchParams({
      page: currentPage.value,
      perPage: pageSize.value,
    });
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }
    if (sort.value.key) {
      params.append('sortBy', sort.value.key);
      params.append('sortOrder', sort.value.order);
    }

    const response = await apiService.get(`/clients?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw (data.message || `Erro ${response.status}: Falha ao buscar clientes.`);
    }

    clients.value = data.data || [];
    currentPage.value = data.meta?.page || 1;
    totalPages.value = data.meta?.totalPages || 0;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    const errorMessage = Array.isArray(error) ? error : [error.toString()];
    generalErrorMessages.value = errorMessage;
  } finally {
    loading.value = false;
  }
};

// --- WATCHERS (for debounced search and pagination) ---
let debounceTimer = null;
watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1; // Reseta para a primeira página ao buscar
    fetchClients();
  }, 500); // Aguarda 500ms após o usuário parar de digitar
});

watch(currentPage, (newPage, oldPage) => {
    if (newPage !== oldPage) {
        fetchClients();
    }
});


// --- SORTING ---
const handleSort = (key) => {
  if (sort.value.key === key) {
    // Se já está ordenando por esta coluna, inverte a ordem
    sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    // Se é uma nova coluna, define como a principal e ordena 'asc'
    sort.value.key = key;
    sort.value.order = 'asc';
  }
  fetchClients(); // Busca os dados com a nova ordenação
};


// --- CRUD OPERATIONS & DIALOGS ---
const openAddClientDialog = () => {
  isEditing.value = false;
  Object.assign(currentClient, getEmptyClient()); // Reseta o objeto reativo
  modalErrorMessages.value = [];
  clientForm.value?.resetValidation();
  showClientFormDialog.value = true;
};

const openEditClientDialog = (client) => {
  isEditing.value = true;
  Object.assign(currentClient, client); // Copia os valores para o objeto reativo
  modalErrorMessages.value = [];
  clientForm.value?.resetValidation();
  showClientFormDialog.value = true;
};

const closeClientFormDialog = () => {
  showClientFormDialog.value = false;
};

const saveClient = async () => {
  const { valid } = await clientForm.value.validate();
  if (!valid) return;

  saving.value = true;
  modalErrorMessages.value = [];
  try {
    const method = isEditing.value ? 'put' : 'post';
    const url = isEditing.value ? `/clients/${currentClient.id}` : '/clients';
    const payload = { name: currentClient.name, phone: currentClient.phone, email: currentClient.email };

    const response = await apiService[method](url, payload);
    const data = await response.json();

    if (!response.ok) {
      throw (data.message || `Erro ao salvar cliente.`);
    }

    closeClientFormDialog();
    await fetchClients(); // Recarrega a lista
    // Opcional: Exibir snackbar de sucesso
  } catch (error) {
    console.error('Erro ao salvar o cliente:', error);
    modalErrorMessages.value = Array.isArray(error) ? error : [error.toString()];
  } finally {
    saving.value = false;
  }
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
  if (!clientToDeleteId.value) return;

  deleting.value = true;
  generalErrorMessages.value = [];
  try {
    const response = await apiService.delete(`/clients/${clientToDeleteId.value}`);
    if (!response.ok) {
      const data = await response.json();
      throw (data.message || `Erro ao excluir o cliente.`);
    }
    closeDeleteConfirmDialog();
    // Se a página ficar vazia após a exclusão, volta uma página
    if (clients.value.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    await fetchClients(); // Recarrega
  } catch (error) {
    console.error('Erro ao excluir o cliente:', error);
    generalErrorMessages.value = Array.isArray(error) ? error : [error.toString()];
  } finally {
    deleting.value = false;
  }
};

const openViewClientDialog = (client) => {
  Object.assign(currentClient, client);
  showDetailsDialog.value = true;
};

// --- UTILITY & VALIDATION ---
const formatDateWithHour = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return formatDateHour(dateString); // Sua função utilitária
  } catch (e) {
    return dateString;
  }
};

// Regras de validação
const rules = {
  required: value => !!value || 'Campo obrigatório.',
  email: value => /.+@.+\..+/.test(value) || 'E-mail inválido.',
  phone: value => {
    const digits = (value || '').replace(/\D/g, '');
    return digits.length >= 10 || 'Telefone inválido.';
  }
};

// Opções para a máscara de telefone
const maskOptions = {
  mask: ['(##) ####-####', '(##) #####-####'],
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  fetchClients();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.v-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>