<template>
  <div>
    <h2>Gerenciar Usuários</h2>
    <button class="btn btn-primary mb-3" @click="addUser">Adicionar Usuário</button>

    <!-- Exibição das mensagens de erro gerais -->
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>

    <!-- Tabela de Usuários -->
    <table class="table table-bordered table-hover">
      <thead class="thead-light">
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Data de Criação</th>
          <th class="text-center">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ formatDate(user.createdAt) }}</td>
          <td class="text-center">
            <button class="btn btn-info btn-sm" @click="viewUser(user.id)">
              <fa-icon :icon="['fas', 'eye']"/> Detalhes
            </button>
            <button class="btn btn-warning btn-sm" @click="editUser(user)">
              <fa-icon :icon="['fas', 'edit']"/> Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="deleteUser(user.id)">
              <fa-icon :icon="['fas', 'trash']"/> Excluir
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para Adicionar/Editar Usuário -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showUserModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="saveUser">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Usuário' : 'Adicionar Usuário' }}</h5>
              <button type="button" class="close" @click="closeUserModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <!-- Exibição das mensagens de erro no modal -->
              <div v-if="errorMessages.length" class="alert alert-danger">
                <ul>
                  <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
                </ul>
              </div>
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="userName">Nome</label>
                <input
                  type="text"
                  class="form-control"
                  id="userName"
                  v-model="currentUser.name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="userEmail">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="userEmail"
                  v-model="currentUser.email"
                  required
                />
              </div>
              <div v-if="!isEditing" class="form-group">
                <label for="userPassword">Senha</label>
                <input
                  type="password"
                  class="form-control"
                  id="userPassword"
                  v-model="currentUser.password"
                  :required="!isEditing"
                />
              </div>
              <!-- Outros campos do usuário podem ser adicionados aqui -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeUserModal">
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

    <!-- Modal para Visualizar Detalhes do Usuário -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showDetailsModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalhes do Usuário</h5>
            <button type="button" class="close" @click="closeDetailsModal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>ID:</strong> {{ currentUser.id }}</p>
            <p><strong>Nome:</strong> {{ currentUser.name }}</p>
            <p><strong>Email:</strong> {{ currentUser.email }}</p>
            <p><strong>Criado em:</strong> {{ formatDate(currentUser.createdAt) }}</p>
            <!-- Outros detalhes do usuário -->
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
import { formatDateHour } from '../utils/formatDate';
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Users',
  data() {
    return {
      users: [],
      showUserModal: false,
      showDetailsModal: false,
      isEditing: false,
      currentUser: {
        id: null,
        name: '',
        email: '',
        password: ''
      },
      errorMessages: [] // Para mensagens de erro
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    // Busca a lista de usuários do backend
    async fetchUsers() {
      try {
        const response = await apiService.get('/users');
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar usuários'];
          return;
        }
        const data = await response.json();
        this.users = data.data;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar usuários'];
      }
    },
    // Abre o modal para adicionar um novo usuário
    addUser() {
      this.isEditing = false;
      this.currentUser = {
        id: null,
        name: '',
        email: '',
        password: ''
      };
      this.errorMessages = [];
      this.showUserModal = true;
    },
    // Abre o modal para editar um usuário existente
    editUser(user) {
      this.isEditing = true;
      this.currentUser = { ...user, password: '' }; // Não preenche o campo de senha
      this.errorMessages = [];
      this.showUserModal = true;
    },
    // Salva o usuário (adiciona ou atualiza)
    async saveUser() {
      try {
        this.errorMessages = [];
        const method = this.isEditing ? 'put' : 'post';
        const url = this.isEditing
          ? `/users/${this.currentUser.id}`
          : `/users`;

        // Prepara o payload
        const payload = {
          name: this.currentUser.name,
          email: this.currentUser.email
        };
        if (!this.isEditing || this.currentUser.password) {
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

        this.fetchUsers();
        this.closeUserModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar o usuário'];
      }
    },
    // Deleta um usuário
    async deleteUser(id) {
      if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
          const response = await apiService.delete(`/users/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message || 'Erro ao excluir o usuário'];
            return;
          }
          this.fetchUsers();
        } catch (error) {
          console.error(error);
          this.errorMessages = ['Erro ao excluir o usuário'];
        }
      }
    },
    // Visualiza detalhes de um usuário
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
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
    },
    formatDate(dateString) {
      return formatDateHour(dateString)
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
