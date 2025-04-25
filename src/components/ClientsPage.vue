<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2>Gerenciar Clientes</h2>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddClientDialog">
          Adicionar Cliente
        </v-btn>
      </v-col>
    </v-row>

    <!-- Mensagens de Erro Gerais -->
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

    <!-- Indicador de Carregamento -->
     <v-row v-if="loading">
      <v-col cols="12">
         <v-progress-linear indeterminate color="primary" class="mb-4"></v-progress-linear>
      </v-col>
     </v-row>

    <!-- Mensagem de Nenhuma Informação -->
    <v-row v-if="!loading && !clients.length && !generalErrorMessages.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" border="start">
          Nenhuma informação para ser exibida
        </v-alert>
      </v-col>
    </v-row>

    <!-- Tabela de Clientes -->
    <v-row v-if="!loading && clients.length">
      <v-col cols="12">
        <v-table hover density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left">Nome</th>
              <th class="text-left">Telefone</th>
              <th class="text-left">Email</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id">
              <td>{{ client.name }}</td>
              <td>{{ client.phone }}</td>
              <td>{{ client.email }}</td>
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
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"  
          @update:modelValue="handlePageChange"
          density="compact"
          class="mt-4"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- Dialog para Adicionar/Editar Cliente -->
    <v-dialog v-model="showClientFormDialog" max-width="600px" persistent>
      <v-card>
        <v-form ref="clientForm" @submit.prevent="saveClient">
          <v-card-title class="headline grey lighten-2">
            {{ isEditing ? 'Editar Cliente' : 'Adicionar Cliente' }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeClientFormDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Mensagens de Erro no Modal -->
            <v-alert
              v-if="modalErrorMessages.length"
              type="error"
              variant="tonal"
              border="start"
              density="compact"
              class="mb-3"
              closable
              @update:modelValue="modalErrorMessages = []"
            >
              <ul>
                <li v-for="(error, index) in modalErrorMessages" :key="`mod-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <v-text-field
              v-model="currentClient.name"
              label="Nome"
              :rules="[rules.required]"
              required
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="currentClient.phone"
              label="Telefone"
              v-mask="'(##) #####-####'"
              :rules="[rules.required, rules.phone]"
              required
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-text-field>
            <!-- ATENÇÃO: v-mask é uma diretiva externa. Certifique-se de que 'vue-the-mask' ou similar esteja instalado e registrado corretamente para Vue 3 -->
            <!-- Exemplo de registro em main.js:
                import { createApp } from 'vue'
                import App from './App.vue'
                import VueTheMask from 'vue-the-mask' // ou outra lib compatível
                // ... outros imports
                const app = createApp(App)
                app.use(VueTheMask) // ou app.directive('mask', ...) se for customizada
                app.mount('#app')
             -->

            <v-text-field
              v-model="currentClient.email"
              label="Email"
              type="email"
              :rules="[rules.required, rules.email]"
              required
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeClientFormDialog">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit" :loading="saving">
              {{ isEditing ? 'Atualizar' : 'Salvar' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Dialog para Visualizar Detalhes do Cliente -->
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
          <p><strong>Criado em:</strong> {{ formatDateWithHour(currentClient.createdAt) }}</p>
          <p><strong>Última Atualização:</strong> {{ formatDateWithHour(currentClient.updatedAt) }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showDetailsDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

     <!-- Dialog para Confirmação de Exclusão -->
    <v-dialog v-model="showDeleteConfirmDialog" max-width="500px" persistent>
      <v-card>
         <v-card-title class="headline">Confirmar Exclusão</v-card-title>
         <v-card-text>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
         </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeDeleteConfirmDialog">
              Cancelar
            </v-btn>
            <v-btn color="error" :loading="deleting" @click="confirmDeleteClient">
              Excluir
            </v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import { apiService } from '../services/apiService'; // Mantenha seu serviço de API
import { formatDateHour } from '../utils/formatDate'; // Importe seu utilitário de data
// Importe a diretiva de máscara se estiver usando uma biblioteca
// import { mask } from 'vue-the-mask'; // Exemplo

export default {
  name: 'ClientManager', // Nome do componente atualizado
  // directives: { mask }, // Registre a diretiva se usar uma biblioteca como vue-the-mask
  data() {
    return {
      currentPage: 1,
      totalRows: 0,
      pageSize: 10,
      loading: false,
      saving: false, // Loading para o botão de salvar/atualizar
      deleting: false, // Loading para o botão de excluir
      clients: [],
      showClientFormDialog: false, // Renomeado para clareza
      showDetailsDialog: false,
      showDeleteConfirmDialog: false, // Para o modal de confirmação
      isEditing: false,
      currentClient: this.getEmptyClient(), // Usar função para resetar
      clientToDeleteId: null, // Para guardar o ID do cliente a ser excluído
      generalErrorMessages: [], // Erros gerais da página
      modalErrorMessages: [], // Erros específicos do modal de formulário
      // Regras de validação do Vuetify
      rules: {
        required: value => !!value || 'Campo obrigatório.',
        email: value => /.+@.+\..+/.test(value) || 'E-mail inválido.',
        phone: value => {
          // Remove máscara para validar o tamanho
          const digits = (value || '').replace(/\D/g, '');
          return digits.length === 10 || digits.length === 11 || 'Telefone inválido (10 ou 11 dígitos).';
        }
      }
    };
  },
  computed: {
    totalPages() {
      if (!this.totalRows || this.totalRows <= 0) return 0;
      return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  created() {
    this.fetchClients(this.currentPage, this.pageSize);
  },
  methods: {
    handlePageChange(newPage) {
      // v-model already updates `currentPage`, so we just fetch
      this.fetchClients(newPage, this.pageSize);
    },
    getEmptyClient() {
      return {
        id: null,
        name: '',
        phone: '',
        email: '',
        createdAt: '',
        updatedAt: ''
      };
    },

    formatDateWithHour(dateString) {
      if (!dateString) return 'N/A';
      try {
         return formatDateHour(dateString); // Use sua função utilitária
      } catch (e) {
         console.error("Error formatting date:", e);
         return dateString; // Retorna original em caso de erro
      }
    },

    async fetchClients(page = 1, perPage = 10) {
      this.loading = true;
      this.generalErrorMessages = [];
      this.clients = []; // Limpa antes de buscar
      try {
        const response = await apiService.get(`/clients?page=${page}&perPage=${perPage}`);
        // Não precisamos mais checar response.ok aqui se apiService já trata isso
        // ou se queremos ler a resposta mesmo em caso de erro HTTP tratado pela API
        const data = await response.json(); // Lê o corpo da resposta

        if (!response.ok) {
          this.clients = []
          this.totalRows = 0;
          if (data && data.message) {
            this.generalErrorMessages = Array.isArray(data.message) ? data.message : [data.message];
          } else {
            this.generalErrorMessages = [`Erro ${response.status}: Não foi possível buscar os clientes.`];
          }
           throw new Error(this.generalErrorMessages[0]); // Lança erro para cair no catch
        }

        // Sucesso
        this.clients = data.data || []; // Garante que seja um array
        this.currentPage = parseInt(data.meta?.page || page);
        this.totalRows = parseInt(data.meta?.total || 0);
        this.pageSize = parseInt(data.meta?.perPage || perPage);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        // Garante que uma mensagem de erro seja exibida se nenhuma foi capturada da API
        if (!this.generalErrorMessages.length) {
           this.generalErrorMessages = ['Ocorreu um erro inesperado ao buscar os clientes.'];
        }
      } finally {
        this.loading = false;
      }
    },

    openAddClientDialog() {
      this.isEditing = false;
      this.currentClient = this.getEmptyClient();
      this.modalErrorMessages = []; // Limpa erros do modal
      this.$nextTick(() => {
        this.$refs.clientForm?.resetValidation(); // Reseta validação do Vuetify
      });
      this.showClientFormDialog = true;
    },

    openEditClientDialog(client) {
      this.isEditing = true;
      // Cria uma cópia para evitar mutação direta da lista
      this.currentClient = { ...client };
      this.modalErrorMessages = []; // Limpa erros do modal
       this.$nextTick(() => {
        this.$refs.clientForm?.resetValidation(); // Reseta validação
      });
      this.showClientFormDialog = true;
    },

    async saveClient() {
       // Valida o formulário Vuetify
      const { valid } = await this.$refs.clientForm.validate();
      if (!valid) {
          return; // Interrompe se a validação falhar
      }

      this.saving = true;
      this.modalErrorMessages = []; // Limpa erros anteriores

      try {
        const method = this.isEditing ? 'put' : 'post';
        const url = this.isEditing
          ? `/clients/${this.currentClient.id}`
          : '/clients';

        // Prepara o payload (pode remover campos não editáveis se necessário)
        const payload = {
            name: this.currentClient.name,
            phone: this.currentClient.phone,
            email: this.currentClient.email
            // Inclua outros campos conforme necessário
        };

        const response = await apiService[method](url, payload);
        const responseData = await response.json(); // Lê mesmo se não OK

        if (!response.ok) {
          if (responseData && responseData.message) {
            this.modalErrorMessages = Array.isArray(responseData.message)
              ? responseData.message
              : [responseData.message];
          } else {
            this.modalErrorMessages = [`Erro ${response.status} ao salvar o cliente.`];
          }
          throw new Error(this.modalErrorMessages[0]);
        }

        // Sucesso
        this.closeClientFormDialog();
        await this.fetchClients(this.currentPage, this.pageSize); // Recarrega a lista
        // Opcional: Exibir snackbar de sucesso
        // this.showSnackbar('Cliente salvo com sucesso!', 'success');

      } catch (error) {
        console.error('Erro ao salvar o cliente:', error);
         if (!this.modalErrorMessages.length) {
           this.modalErrorMessages = ['Ocorreu um erro inesperado ao salvar o cliente.'];
         }
      } finally {
        this.saving = false;
      }
    },

    openDeleteConfirmDialog(id) {
        this.clientToDeleteId = id;
        this.showDeleteConfirmDialog = true;
    },

    closeDeleteConfirmDialog() {
        this.showDeleteConfirmDialog = false;
        this.clientToDeleteId = null;
    },

    async confirmDeleteClient() {
        if (!this.clientToDeleteId) return;

        this.deleting = true;
        this.generalErrorMessages = []; // Limpa erros gerais ao tentar excluir

        try {
            const response = await apiService.delete(`/clients/${this.clientToDeleteId}`);

            if (!response.ok) {
                 // Tenta ler a mensagem de erro da API
                 let errorMsg = `Erro ${response.status} ao excluir o cliente.`;
                 try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                       errorMsg = Array.isArray(errorData.message) ? errorData.message.join(' ') : errorData.message;
                    }
                 } catch (e) { /* Ignora erro ao ler json de erro */ }

                 this.generalErrorMessages = [errorMsg];
                 throw new Error(errorMsg);
            }

            // Sucesso
            this.closeDeleteConfirmDialog();
            await this.fetchClients(this.currentPage, this.pageSize); // Recarrega a lista
            // Opcional: Exibir snackbar de sucesso
            // this.showSnackbar('Cliente excluído com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao excluir o cliente:', error);
             if (!this.generalErrorMessages.length) {
                this.generalErrorMessages = ['Ocorreu um erro inesperado ao excluir o cliente.'];
             }
        } finally {
            this.deleting = false;
        }
    },

    openViewClientDialog(client) {
      this.currentClient = { ...client }; // Usa cópia
      this.showDetailsDialog = true;
    },

    closeClientFormDialog() {
      this.showClientFormDialog = false;
      // Não é estritamente necessário resetar currentClient aqui se sempre o definimos ao abrir
      // this.currentClient = this.getEmptyClient();
    },
    // closeDetailsModal não é mais necessário, v-model faz o trabalho
    // closeDeleteConfirmModal também não é estritamente necessário
  }
  // Filtros removidos, use métodos ou computeds em Vue 3
};
</script>

<style scoped>
/* Remover estilos de modal antigos */
/* .modal, .modal-dialog { ... } */

/* Adicionar estilos específicos do Vuetify, se necessário */
/* Exemplo: ajustar espaçamento ou alinhamento */
.v-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03); /* Hover suave padrão do Vuetify */
}
</style>