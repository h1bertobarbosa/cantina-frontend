<template>
  <div class="container mt-5">
    <h2>Login</h2>

    <!-- Exibição das mensagens de erro -->
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          class="form-control"
          id="email"
          v-model="email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Senha</label>
        <input
          type="password"
          class="form-control"
          id="password"
          v-model="password"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting">Entrando...</span>
        <span v-else>Entrar</span>
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'SignIn',
  data() {
    return {
      email: '',
      password: '',
      errorMessages: [],
      isSubmitting: false
    };
  },
  methods: {
    async submitForm() {
      const payload = {
        email: this.email,
        password: this.password
      };

      this.errorMessages = [];
      this.isSubmitting = true;

      try {
        const response = await fetch('http://localhost:3000/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao realizar o login.'];
          }
          return;
        }

        const data = await response.json();
        const accessToken = data.accessToken;

        // Armazenar o accessToken (por exemplo, no localStorage)
        localStorage.setItem('accessToken', accessToken);

        // Opcional: Redirecionar o usuário para a página inicial ou dashboard
        this.$router.push('/dashboard'); // Certifique-se de que essa rota existe
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao realizar o login.'];
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
/* Estilos personalizados, se necessário */
</style>
