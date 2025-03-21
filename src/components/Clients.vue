<template>
  <div>
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">
          {{ error }}
        </li>
      </ul>
    </div>

    <h2>Gerenciar Clientes</h2>
    <button class="btn btn-primary mb-3" @click="addClient">
      Adicionar Cliente
    </button>

    <div v-if="!clients.length" class="card bg-info text-white">
      <div class="card-body">
        Nenhuma informação para ser exibida
      </div>
    </div>

    <!-- Tabela de clientes -->
    <table v-else class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Email</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in clients" :key="client.id">
          <td>{{ client.name }}</td>
          <td>{{ client.phone }}</td>
          <td>{{ client.email }}</td>
          <td>
            <button class="btn btn-info btn-sm" @click="viewClient(client)">
              Detalhes
            </button>
            <button class="btn btn-warning btn-sm" @click="editClient(client)">
              Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="deleteClient(client.id)">
              Excluir
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages"
      @page-changed="handlePageChange" />

    <!-- Modal para Adicionar/Editar cliente -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showClientModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="saveClient">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isEditing ? 'Editar cliente' : 'Adicionar cliente' }}
              </h5>
              <button type="button" class="close" @click="closeClientModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <!-- Exibição das mensagens de erro -->
              <div v-if="errorMessages.length" class="alert alert-danger">
                <ul>
                  <li v-for="(error, index) in errorMessages" :key="index">
                    {{ error }}
                  </li>
                </ul>
              </div>
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="productName">Nome</label>
                <input type="text" class="form-control" id="productName" v-model="currentClient.name" required />
              </div>
              <div class="form-group">
                <label for="productName">Telefone</label>
                <input type="text" class="form-control" id="productPhone" v-model="currentClient.phone"
                  v-mask="'(##) #####-####'" required />
              </div>
              <div class="form-group">
                <label for="productName">Email</label>
                <input type="text" class="form-control" id="productEmail" v-model="currentClient.email" required />
              </div>
              <!-- Outros campos do cliente podem ser adicionados aqui -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeClientModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Atualizar' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para Visualizar Detalhes do Produto -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showDetailsModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalhes do Cliente</h5>
            <button type="button" class="close" @click="closeDetailsModal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>Nome:</strong> {{ currentClient.name }}</p>
            <p><strong>Telefone:</strong> {{ currentClient.phone }}</p>
            <p><strong>Email:</strong> {{ currentClient.email }}</p>
            <p><strong>Criado em:</strong> {{ currentClient.createdAt }}</p>
            <p><strong>Última Atualização:</strong> {{ currentClient.updatedAt }}</p>
            <!-- Outros detalhes do produto -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { apiService } from '../services/apiService';
import Pagination from '@/components/Pagination.vue'; 

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Clients',
  components: {
    Pagination
  },
  data() {
    return {
      clients: [],
      showClientModal: false,
      showDetailsModal: false,
      isEditing: false,
      currentClient: {
        id: null,
        name: '',
        phone: '',
        email: '',
        createdAt: '',
        updatedAt: ''
      },
      errorMessages: [],
      currentPage: 1,
      totalRows: 1,
      pageSize: 10 
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  created() {
    this.fetchClients();
  },
  methods: {
    async fetchClients() {
      try {
        // Exemplo de como passar parâmetros de paginação
        // Ajuste conforme a API do seu backend
        const response = await apiService.get(`/clients?page=${this.currentPage}&perPage=${this.pageSize}`);

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao buscar clientes'];
          }
          return;
        }

        const data = await response.json();
        this.clients = data.data;
        // Ajuste essas props conforme os nomes retornados pela API
        this.currentPage = parseInt(data.meta.page);
        this.totalRows = parseInt(data.meta.total) || 1;

      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar clientes'];
      }
    },

    // Abre o modal para adicionar um novo cliente
    addClient() {
      this.isEditing = false;
      this.currentClient = {
        id: null,
        name: '',
        phone: '',
        email: ''
      };
      this.showClientModal = true;
    },

    // Abre o modal para editar um cliente existente
    editClient(client) {
      this.isEditing = true;
      this.currentClient = { ...client };
      this.showClientModal = true;
    },

    // Salva o cliente (adiciona ou atualiza)
    async saveClient() {
      this.errorMessages = [];
      try {
        const method = this.isEditing ? 'put' : 'post';
        const url = this.isEditing
          ? `/clients/${this.currentClient.id}`
          : '/clients';

        const response = await apiService[method](url, this.currentClient);

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao salvar o cliente.'];
          }
          return;
        }

        // Recarrega a listagem ao salvar
        await this.fetchClients();
        this.closeClientModal();
      } catch (error) {
        console.error(error);
        alert('Erro ao salvar o cliente');
      }
    },

    // Deleta um cliente
    async deleteClient(id) {
      if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
          const response = await apiService.delete(`/clients/${id}`);
          if (!response.ok) {
            throw new Error('Erro ao excluir o cliente');
          }
          this.fetchClients();
        } catch (error) {
          console.error(error);
          alert('Erro ao excluir o cliente');
        }
      }
    },

    // Visualiza detalhes de um cliente
    viewClient(client) {
      this.currentClient = { ...client };
      this.showDetailsModal = true;
    },

    // Fecha o modal de adicionar/editar cliente
    closeClientModal() {
      this.showClientModal = false;
    },

    // Fecha o modal de detalhes do cliente
    closeDetailsModal() {
      this.showDetailsModal = false;
    },

    // Quando o usuário troca de página
    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchClients();
    }
  }
};
</script>

<style scoped>
.modal {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin-top: 10%;
}
</style>
