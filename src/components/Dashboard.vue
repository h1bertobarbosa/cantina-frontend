<!-- src/components/Dashboard.vue -->
<template>
  <div class="container mt-5">
    <h2>Bem-vindo ao Dashboard</h2>
    <p>Esta é uma área protegida.</p>
    <button class="btn btn-secondary" @click="logout">Sair</button>
  </div>
</template>

<script>
export default {
  name: 'DashBoard',
  methods: {
    logout() {
      localStorage.removeItem('accessToken');
      this.$router.push('/signin');
    }
  }
};
</script>

<style scoped>
/* Estilos personalizados, se necessário */
</style>
