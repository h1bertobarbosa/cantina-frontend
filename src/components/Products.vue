<template>
  <v-container fluid>
    <!-- Page Title and Add Button -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <h2>Gerenciar Produtos</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-md-right">
        <v-btn color="primary" @click="addProduct" prepend-icon="mdi-plus">
          Adicionar Produto
        </v-btn>
      </v-col>
    </v-row>

    <!-- General Page Error Messages -->
    <v-row v-if="pageErrorMessages.length">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" border="start" prominent closable @update:modelValue="pageErrorMessages = []">
          <ul>
            <li v-for="(error, index) in pageErrorMessages" :key="`page-err-${index}`">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- "No Data" Message -->
    <v-row v-if="!loading && !products.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" border="start">
          Nenhuma informação para ser exibida
        </v-alert>
      </v-col>
    </v-row>

    <!-- Products Table -->
    <v-row v-if="products.length">
      <v-col cols="12">
        <v-table hover density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left">Nome</th>
              <th class="text-left">Preço</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.name }}</td>
              <td>{{ currency(product.price) }}</td>
              <td class="text-center">
                <v-tooltip text="Detalhes">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" color="info" variant="text" size="small" @click="viewProduct(product)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Editar">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-pencil" color="warning" variant="text" size="small" @click="editProduct(product)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Excluir">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete" color="error" variant="text" size="small" @click="confirmDeleteProduct(product)"></v-btn>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Pagination -->
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :length="totalPages"
          @update:modelValue="handlePageChange"
          density="compact"
          class="mt-4"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- Add/Edit Product Dialog -->
    <v-dialog v-model="showProductDialog" max-width="500px" persistent>
      <v-card>
        <v-form @submit.prevent="saveProduct" ref="productForm">
          <v-card-title class="headline grey lighten-2">
            {{ isEditing ? 'Editar Produto' : 'Adicionar Produto' }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeProductDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Modal Error Messages -->
            <v-alert v-if="modalErrorMessages.length" type="error" variant="tonal" border="start" density="compact" class="mb-3">
              <ul>
                <li v-for="(error, index) in modalErrorMessages" :key="`modal-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <v-text-field
              label="Nome"
              v-model="currentProduct.name"
              :rules="[rules.required]"
              required
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-text-field>

            <CurrencyInput
              label="Preço"
              v-model.lazy="currentProduct.price"
              required
              :options="{ currency: 'BRL', precision: 2 }"
              variant="outlined"
              density="compact"
              :rules="[rules.required, rules.positiveNumber]"
            />
             <!-- Alternative:
             <v-text-field
               label="Preço"
               v-model="currentProduct.price"
               type="number"
               prefix="R$"
               :rules="[rules.required, rules.positiveNumber]"
               required
               variant="outlined"
               density="compact"
             ></v-text-field>
             -->

            <!-- Add other product fields here -->

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeProductDialog">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit" :loading="saving">
              {{ isEditing ? 'Atualizar' : 'Salvar' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- View Product Details Dialog -->
    <v-dialog v-model="showDetailsDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Detalhes do Produto
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <p><strong>ID:</strong> {{ currentProduct.id }}</p>
          <p><strong>Nome:</strong> {{ currentProduct.name }}</p>
          <p><strong>Preço:</strong> {{ currency(currentProduct.price) }}</p>
          <p><strong>Criado em:</strong> {{ formatDateWithHour(currentProduct.createdAt) }}</p>
          <p><strong>Última Atualização:</strong> {{ formatDateWithHour(currentProduct.updatedAt) }}</p>
          <!-- Other details -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showDetailsDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500px" persistent>
        <v-card>
           <v-card-title class="headline error white--text" primary-title>
               Confirmar Exclusão
               <v-spacer></v-spacer>
               <v-btn icon="mdi-close" variant="text" @click="showDeleteDialog = false"></v-btn>
           </v-card-title>
           <v-card-text>
               Tem certeza que deseja excluir o produto <strong>{{ currentProduct.name }}</strong> (ID: {{ currentProduct.id }})? Esta ação não pode ser desfeita.
           </v-card-text>
           <v-card-actions>
               <v-spacer></v-spacer>
               <v-btn text @click="showDeleteDialog = false">
                   Cancelar
               </v-btn>
               <v-btn color="error" @click="executeDeleteProduct" :loading="deleting">
                   Excluir
               </v-btn>
           </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay :model-value="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>

  </v-container>
</template>

<script>
import { ref } from 'vue'; // Using ref for the form reference
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate'; // Assuming you have this helper
import CurrencyInput from './CurrencyInput'; // Keep your custom component

// Removed: import Pagination from '@/components/CustomPagination.vue';

export default {
  name: 'ProductsManager', // Renamed to PascalCase convention
  components: { CurrencyInput }, // Removed Pagination
  setup() {
    // If using <script setup> or Composition API, refs for forms are defined here
    const productForm = ref(null);
    return { productForm };
  },
  data() {
    return {
      loading: false,
      saving: false, // Loading state for save button
      deleting: false, // Loading state for delete button
      products: [],
      showProductDialog: false,
      showDetailsDialog: false,
      showDeleteDialog: false,
      isEditing: false,
      currentProduct: { // Reset structure
        id: null,
        name: '',
        price: 0, // Use number type
        createdAt: null,
        updatedAt: null
      },
      pageErrorMessages: [], // Errors shown on the main page
      modalErrorMessages: [], // Errors shown inside the add/edit modal
      currentPage: 1,
      totalRows: 0, // Start with 0
      pageSize: 10,
      // Basic Vuetify validation rules
      rules: {
          required: value => !!value || 'Campo obrigatório.',
          positiveNumber: value => (value && parseFloat(value) > 0) || 'O valor deve ser maior que zero.'
          // Add more rules as needed
      },
    };
  },
  created() {
    this.fetchProducts(this.currentPage, this.pageSize);
  },
  computed: {
    totalPages() {
       if (!this.totalRows || this.totalRows <= 0) return 0;
       return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  methods: {
    formatDateWithHour(dateString) {
       if (!dateString) return 'N/A';
       try {
        return formatDateHour(dateString); // Use your existing utility
       } catch (e) {
        return 'Data inválida';
       }
    },
    currency(value) {
      // Ensure value is a number before formatting
      const numberValue = parseFloat(value);
      if (isNaN(numberValue)) {
          return 'R$ 0,00'; // Or handle as invalid input
      }
      return 'R$ ' + numberValue.toFixed(2).replace('.', ',');
    },

    async fetchProducts(page = 1, perPage = 10) {
      this.loading = true;
      this.pageErrorMessages = []; // Clear page errors on fetch
      try {
        const response = await apiService.get(`/products?page=${page}&perPage=${perPage}`);
        const data = await response.json(); // Read response body regardless of status

        if (!response.ok) {
           this.products = []; // Clear data on error
           this.totalRows = 0;
           if (data && data.message) {
             this.pageErrorMessages = Array.isArray(data.message) ? data.message : [data.message];
           } else {
             this.pageErrorMessages = [`Erro ${response.status}: Não foi possível buscar os produtos.`];
           }
           throw new Error(this.pageErrorMessages[0]);
        }

        this.products = data.data || [];
        this.currentPage = parseInt(data.meta?.page || page);
        this.totalRows = parseInt(data.meta?.total || 0);
        this.pageSize = parseInt(data.meta?.perPage || perPage);

      } catch (error) {
        console.error('Fetch Products Error:', error);
        // Ensure generic error message if none came from API
        if (!this.pageErrorMessages.length) {
            this.pageErrorMessages = ['Ocorreu um erro inesperado ao buscar os produtos.'];
        }
      } finally {
        this.loading = false;
      }
    },

    resetCurrentProduct() {
       this.currentProduct = {
        id: null,
        name: '',
        price: 0,
        createdAt: null,
        updatedAt: null
      };
    },

    addProduct() {
      this.isEditing = false;
      this.resetCurrentProduct();
      this.modalErrorMessages = []; // Clear modal errors
      // Reset form validation if using ref
      this.$nextTick(() => {
          if (this.$refs.productForm) {
              this.$refs.productForm.resetValidation();
          }
      });
      this.showProductDialog = true;
    },

    editProduct(product) {
      this.isEditing = true;
      // Create a deep copy to avoid modifying the original object in the table directly
      this.currentProduct = JSON.parse(JSON.stringify(product));
      // Ensure price is a number if it comes as string
      this.currentProduct.price = parseFloat(this.currentProduct.price) || 0;
      this.modalErrorMessages = []; // Clear modal errors
      // Reset form validation if using ref
      this.$nextTick(() => {
          if (this.$refs.productForm) {
              this.$refs.productForm.resetValidation();
          }
      });
      this.showProductDialog = true;
    },

    async saveProduct() {
      // Trigger Vuetify form validation
       const { valid } = await this.$refs.productForm.validate();
       if (!valid) {
           return; // Stop if validation fails
       }

      this.saving = true;
      this.modalErrorMessages = []; // Clear previous modal errors

      try {
        const method = this.isEditing ? 'patch' : 'post';
        const url = this.isEditing
          ? `/products/${this.currentProduct.id}`
          : '/products';

        // Ensure price is sent as a number
        const payload = {
            ...this.currentProduct,
            price: parseFloat(this.currentProduct.price) || 0
        };

        const response = await apiService[method](url, payload);
        const responseData = await response.json(); // Read body

        if (!response.ok) {
          if (responseData && responseData.message) {
            this.modalErrorMessages = Array.isArray(responseData.message) ? responseData.message : [responseData.message];
          } else {
            this.modalErrorMessages = [`Erro ${response.status} ao salvar o produto.`];
          }
          throw new Error(this.modalErrorMessages[0]);
        }

        this.closeProductDialog();
        await this.fetchProducts(this.currentPage, this.pageSize); // Refresh list
        // Optional: Show success snackbar

      } catch (error) {
        console.error('Save Product Error:', error);
        if (!this.modalErrorMessages.length) {
           this.modalErrorMessages = ['Ocorreu um erro inesperado ao salvar o produto.'];
        }
      } finally {
        this.saving = false;
      }
    },

    confirmDeleteProduct(product) {
        this.currentProduct = { ...product }; // Store product to delete
        this.pageErrorMessages = []; // Clear page errors
        this.showDeleteDialog = true;
    },

    async executeDeleteProduct() {
      this.deleting = true;
      this.pageErrorMessages = []; // Clear page errors before attempting delete

      try {
        const response = await apiService.delete(`/products/${this.currentProduct.id}`);

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
           if (errorData && errorData.message) {
             this.pageErrorMessages = Array.isArray(errorData.message) ? errorData.message : [errorData.message];
           } else {
              this.pageErrorMessages = [`Erro ${response.status} ao excluir o produto.`];
           }
           throw new Error(this.pageErrorMessages[0]);
        }

        this.showDeleteDialog = false;
        // Check if we need to go to previous page after deletion
        if (this.products.length === 1 && this.currentPage > 1) {
            this.currentPage--;
        }
        await this.fetchProducts(this.currentPage, this.pageSize); // Refresh list
        // Optional: Show success snackbar

      } catch (error) {
        console.error('Delete Product Error:', error);
        // Error messages should already be set
         if (!this.pageErrorMessages.length) {
            this.pageErrorMessages = ['Ocorreu um erro inesperado ao excluir o produto.'];
         }
        this.showDeleteDialog = false; // Close dialog even on error
      } finally {
        this.deleting = false;
      }
    },

    viewProduct(product) {
      this.currentProduct = { ...product }; // Use a copy for display
      this.showDetailsDialog = true;
    },

    closeProductDialog() {
      this.showProductDialog = false;
      // It's good practice to reset after closing, prevents showing old data briefly
      this.$nextTick(() => {
          this.resetCurrentProduct();
          this.modalErrorMessages = [];
           if (this.$refs.productForm) {
              this.$refs.productForm.resetValidation();
           }
      });
    },

    handlePageChange(newPage) {
      // v-model handles currentPage update, this method just fetches data
      this.fetchProducts(newPage, this.pageSize);
    }
  }
};
</script>

<style scoped>
/* Remove Bootstrap modal styles if they were present */

/* Add any Vuetify specific overrides or custom styles if needed */
.v-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03); /* Subtle hover for v-table */
}

/* Align text in text fields if needed */
.v-text-field input {
  text-align: left; /* Default, adjust if needed */
}
</style>