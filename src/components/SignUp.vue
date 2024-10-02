<template>
  <div class="container mt-5">
    <h2>Cadastro</h2>
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>
    <form @submit.prevent="submitForm">
      <!-- Campos da Empresa -->
      <div class="form-group">
        <label for="companyName">Nome da Empresa</label>
        <input type="text" class="form-control" id="companyName" v-model="companyName" required>
      </div>
      <div class="form-group">
        <label for="companyEmail">Email da Empresa</label>
        <input type="email" class="form-control" id="companyEmail" v-model="companyEmail" required>
      </div>
      <div class="form-group">
        <label for="companyDocument">Documento da Empresa</label>
        <input type="text" class="form-control" id="companyDocument" v-model="companyDocument" required>
      </div>

      <!-- Campos do Usuário -->
      <div class="form-group">
        <label for="name">Nome</label>
        <input type="text" class="form-control" id="name" v-model="name" required>
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" class="form-control" id="email" v-model="email" required>
      </div>
      <div class="form-group">
        <label for="password">Senha</label>
        <input type="password" class="form-control" id="password" v-model="password" required>
      </div>

      <button type="submit" class="btn btn-primary">Cadastrar</button>
    </form>
  </div>
</template>

<script>
import { apiService } from '../services/apiService';
export default {
  name: 'SignUp',
  data() {
    return {
      companyName: '',
      companyEmail: '',
      companyDocument: '',
      name: '',
      email: '',
      password: '',
      errorMessages: []
    };
  },
  methods: {
    async submitForm() {
      this.errorMessages = [];
      const payload = {
        companyName: this.companyName,
        companyEmail: this.companyEmail,
        companyDocument: this.companyDocument,
        name: this.name,
        email: this.email,
        password: this.password
      };

      try {
        const response = await apiService.post('/signup', payload);

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
            this.errorMessages = ['Erro ao realizar o cadastro.'];
          }
          return; // Encerra a execução se houver erro
        }

        //const data = await response.json();
        alert('Cadastro realizado com sucesso!');
        // Redirecionar ou limpar formulário
      } catch (error) {
        console.error(error);
        alert('Erro ao realizar o cadastro.');
      }
    }
  }
};
</script>

<style scoped>
/* Estilos personalizados, se necessário */
</style>
