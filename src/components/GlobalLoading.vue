<!-- src/components/GlobalLoading.vue -->
<template>
  <div v-if="isLoading" class="global-loading">
    <!-- Indicador de carregamento -->
    <div class="spinner"></div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'GlobalLoading',
  setup() {
    const store = useStore();
    const isLoading = computed(() => store.getters['isLoading']);
    return {
      isLoading,
    };
  },
};
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  /* Fundo semi-transparente */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  border: 16px solid #f3f3f3;
  /* Cinza claro */
  border-top: 16px solid #3498db;
  /* Azul */
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
}

/* Animação do spinner */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
