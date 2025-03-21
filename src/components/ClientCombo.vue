<!-- ClientCombo.vue -->
<template>
    <div class="position-relative">
      <input
        class="form-control"
        type="text"
        v-model="search"
        @focus="isOpen = true"
        @input="filterClients"
        placeholder="Digite o nome do cliente..."
      />
      <!-- Dropdown de sugestões -->
      <ul
        v-if="isOpen && filteredClients.length"
        class="list-group combo-dropdown"
      >
        <li
          v-for="client in filteredClients"
          :key="client.id"
          class="list-group-item"
          @click="selectClient(client)"
        >
          {{ client.name }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ClientCombo',
    props: {
      clients: {
        type: Array,
        required: true
      }
    },
    emits: ['selected'],
    data() {
      return {
        search: '',
        isOpen: false,
        filteredClients: []
      };
    },
    methods: {
      filterClients() {
        const query = this.search.toLowerCase();
        this.filteredClients = this.clients.filter((c) =>
          c.name.toLowerCase().includes(query)
        );
      },
      selectClient(client) {
        // Ao clicar, atualiza o input
        this.search = client.name;
        // Fecha o dropdown
        this.isOpen = false;
        // E emite o ID para o componente pai saber qual foi escolhido
        this.$emit('selected', client.id);
      }
    }
  };
  </script>
  
  <style scoped>
  .combo-dropdown {
    position: absolute;
    width: 100%;
    z-index: 999;
  }
  </style>
  