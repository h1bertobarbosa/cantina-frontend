<template>
  <div>
    <div>
      <div v-if="errorMessages.length" class="alert alert-danger">
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>
    <h2>Gerenciar Clientes</h2>
    <button class="btn btn-primary mb-3" @click="addClient()">Adicionar Cliente</button>

    <!-- Tabela de clientes -->
    <table class="table table-bordered">
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
            <button class="btn btn-info btn-sm" @click="viewClient(client)">Detalhes</button>
            <button class="btn btn-warning btn-sm" @click="editClient(client)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="deleteClient(client.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>



    <!-- Modal para Adicionar/Editar cliente -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showClientModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="saveClient">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar cliente' : 'Adicionar cliente' }}</h5>
              <button type="button" class="close" @click="closeClientModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <!-- Exibição das mensagens de erro -->
              <div v-if="errorMessages.length" class="alert alert-danger">
                <ul>
                  <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
                </ul>
              </div>
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="productName">Nome</label>
                <input type="text" class="form-control" id="productName" v-model="currentClient.name" required />
              </div>
               <div class="form-group">
                <label for="productName">Telefone</label>
                <input type="text" class="form-control" id="productPhone" v-model="currentClient.phone" required />
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
            <button type="button" class="btn btn-secondary" @click="closeDetailsModal">Fechar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import { authHeader } from '../helper/authHeader';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Clients',
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
      errorMessages: []
    };
  },
  created() {
    this.fetchClients();
  },
  methods: {
    // Busca a lista de clientes do backend
    async fetchClients() {
      try {
        console.log(process.env.BASE_URL)
        const response = await fetch('http://localhost:3000/clients', {
          method: 'GET',
          headers: authHeader()
        });
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
        const clients = await response.json();
        this.clients = clients.data;
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
        price: 0
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
        const method = this.isEditing ? 'PUT' : 'POST';
        const url = this.isEditing
          ? `http://localhost:3000/clients/${this.currentClient.id}`
          : 'http://localhost:3000/clients';

        const response = await fetch(url, {
          method: method,
          headers: authHeader(),
          body: JSON.stringify(this.currentClient)
        });

        if (!response.ok) {
          // Captura o corpo da resposta de erro
          const errorData = await response.json();

          // Verifica se há uma propriedade 'message' na resposta
          if (errorData.message) {
            // Se 'message' for um array, usa diretamente; se for uma string, coloca em um array
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            // Mensagem genérica caso não haja 'message' na resposta
            this.errorMessages = ['Erro ao salvar o cliente.'];
          }
          return; // Encerra a execução se houver erro
        }
        this.fetchClients();
        this.closeClientModal();
      } catch (error) {
        console.error(error);
        alert('Erro ao salvar o cliente2');
      }
    },
    // Deleta um cliente
    async deleteClient(id) {
      if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
          const response = await fetch(`http://localhost:3000/clients/${id}`, {
            method: 'DELETE',
            headers: authHeader()
          });
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
    }
  },
  filters: {
    // Filtro para formatar o valor como moeda
    currency(value) {
      return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    }
  }
};
</script>

<style scoped>
/* Estilos para os modais */
.modal {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin-top: 10%;
}
</style>
