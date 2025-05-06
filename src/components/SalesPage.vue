<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2>Gerenciar Vendas</h2>
        <v-btn color="primary" @click="openAddSaleDialog" prepend-icon="mdi-plus">
          Adicionar Venda
        </v-btn>
      </v-col>
    </v-row>

    <!-- Mensagens de Erro Gerais -->
    <v-row v-if="errorMessages.length">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" border="start" prominent closable @update:modelValue="clearErrorMessages">
          <ul>
            <li v-for="(error, index) in errorMessages" :key="`err-${index}`">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Mensagem de Nenhuma Informação -->
    <v-row v-if="!loading && !sales.length && !errorMessages.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" border="start">
          Nenhuma informação para ser exibida
        </v-alert>
      </v-col>
    </v-row>

    <!-- Tabela de Vendas -->
    <v-row v-if="sales.length">
      <v-col cols="12">
        <v-table hover density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left">Cliente</th>
              <th class="text-left">Descrição</th>
              <th class="text-left">Método Pag.</th>
              <th class="text-right">Valor</th>
              <th class="text-left">Venda em</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in sales" :key="sale.id">
              <td>{{ sale.clientName }}</td>
              <td>{{ sale.description }}</td>
              <td>{{ getPaymentMethodText(sale.paymentMethod) }}</td>
              <td class="text-right">{{ currency(sale.amount) }}</td>
              <td>{{ formatDate(sale.createdAt) }}</td>
              <td class="text-center">
                <v-tooltip text="Detalhes">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" color="info" variant="text" size="small"
                      @click="openViewSaleDialog(sale)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Excluir">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete" color="error" variant="text" size="small"
                      @click="openDeleteConfirmDialog(sale.id)"></v-btn>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Paginação -->
        <v-pagination v-if="totalPages > 1" v-model="pagination.page" :length="totalPages" :total-visible="5"
          @update:modelValue="handlePageChange" density="compact" class="mt-4"></v-pagination>
      </v-col>
    </v-row>

    <!-- Dialog para Adicionar Venda -->
    <v-dialog v-model="showSaleDialog" max-width="700px" persistent>
      <v-card>
        <v-form ref="saleForm" @submit.prevent="saveSale">
          <v-card-title class="headline grey lighten-2">
            Adicionar Venda
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeSaleDialog"></v-btn>
          </v-card-title>
          <v-card-text class="pt-4">
            <!-- Mensagens de Erro no Modal -->
            <v-alert v-if="modalErrorMessages.length" type="error" variant="tonal" border="start" density="compact"
              class="mb-3">
              <ul>
                <li v-for="(error, index) in modalErrorMessages" :key="`modal-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <v-row dense>
              <v-col cols="12" md="6">
                <v-select label="Cliente" v-model="currentSale.clientId" :items="clients" item-title="name"
                  item-value="id" :rules="[v => !!v || 'Cliente é obrigatório']" required variant="outlined"
                  density="compact" no-data-text="Nenhum cliente encontrado" clearable></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select label="Método de Pagamento" v-model="currentSale.paymentMethod" :items="paymentMethods"
                  item-title="text" item-value="value" :rules="[v => !!v || 'Método de pagamento é obrigatório']"
                  required variant="outlined" density="compact"></v-select>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field label="Data da Compra" v-model="currentSale.buyDate" type="date"
                  :rules="[v => !!v || 'Data da compra é obrigatória']" required variant="outlined"
                  density="compact"></v-text-field>
         
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>
            <h4>Itens da Venda</h4>

            <!-- Formulário para adicionar item -->
            <v-row dense align="end" class="mt-2">
              <v-col cols="12" md="5">
                <v-select label="Produto" v-model="newItem.productId" :items="products" item-title="display"
                  item-value="id" variant="outlined" density="compact" no-data-text="Nenhum produto encontrado"
                  clearable hide-details="auto">
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.name"
                      :subtitle="currency(item.raw.price)"></v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field label="Quantidade" v-model.number="newItem.quantity" type="number" variant="outlined"
                  density="compact" min="1" hide-details="auto"></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-btn color="secondary" @click="addItemToSale" block
                  :disabled="!newItem.productId || newItem.quantity <= 0">
                  Adicionar Item
                </v-btn>
              </v-col>
            </v-row>

            <!-- Lista de itens adicionados -->
            <v-list v-if="currentSale.items.length" lines="two" density="compact" class="mt-3 elevation-1">
              <v-list-subheader>Itens Adicionados</v-list-subheader>
              <template v-for="(item, index) in currentSale.items" :key="`sale-item-${index}`">
                <v-list-item>
                  <v-list-item-title>{{ item.productName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Qtd: {{ item.quantity }} x {{ currency(item.price) }} = {{ currency(item.quantity * item.price) }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn icon="mdi-delete" variant="text" color="error" size="small"
                      @click="removeItemFromSale(index)"></v-btn>
                  </template>
                </v-list-item>
                <v-divider v-if="index < currentSale.items.length - 1"></v-divider>
              </template>
            </v-list>
            <v-alert v-else type="info" variant="tonal" density="compact" class="mt-3">
              Nenhum item adicionado à venda.
            </v-alert>

            <v-row dense class="mt-4">
              <v-col class="text-h6 text-right">
                Total da Venda: {{ currency(saleTotalAmount) }}
              </v-col>
            </v-row>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeSaleDialog">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit" :loading="saving" :disabled="!currentSale.items.length">
              Salvar Venda
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Dialog para Visualizar Detalhes da Venda -->
    <v-dialog v-model="showDetailsDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Detalhes da Venda
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDetailsDialog"></v-btn>
        </v-card-title>
        <v-card-text>
          <p><strong>ID:</strong> {{ saleToView.id }}</p>
          <p><strong>Cliente:</strong> {{ saleToView.clientName }}</p>
          <p><strong>Descrição:</strong> {{ saleToView.description }}</p>
          <p><strong>Método de Pagamento:</strong> {{ getPaymentMethodText(saleToView.paymentMethod) }}</p>
          <p><strong>Valor:</strong> {{ currency(saleToView.amount) }}</p>
          <p><strong>Venda em:</strong> {{ formatDate(saleToView.createdAt) }}</p>
          <p v-if="saleToView.payedAt"> <!-- Display only if payedAt exists -->
            <strong>Pago em:</strong> {{ formatDate(saleToView.payedAt) }}
          </p>
          <!-- Add other details as needed -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="closeDetailsDialog">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="showDeleteConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">Confirmar Exclusão</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="closeDeleteConfirmDialog">
            Cancelar
          </v-btn>
          <v-btn color="error" @click="executeDelete" :loading="deleting">
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
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/formatDate'; // Assuming formatDateHour exists or use formatDate

// --- Keep using Options API as per the original example's style ---
export default {
  name: 'SalesManager', // Renamed for clarity and convention
  data() {
    return {
      loading: false,
      saving: false, // Loading state for save button
      deleting: false, // Loading state for delete button
      sales: [],
      products: [], // Will be populated with { id, name, price, display }
      clients: [], // Will be populated with { id, name }
      showSaleDialog: false,
      showDetailsDialog: false,
      showDeleteConfirmDialog: false,
      saleToDeleteId: null,
      currentSale: this.getInitialSaleData(), // Data for the add/edit form
      newItem: this.getInitialNewItemData(),
      saleToView: {}, // Data for the details view
      errorMessages: [],
      modalErrorMessages: [], // Errors specific to the modal
      pagination: {
        page: 1,
        perPage: 10,
        total: 0,
      },
      paymentMethods: [
        { text: 'Dinheiro', value: 'CASH' },
        { text: 'Cartão de Crédito', value: 'CREDIT_CARD' },
        { text: 'PIX', value: 'PIX' },
        { text: 'à Receber', value: 'TO_RECEIVE' },
        // Add other methods if needed
      ],
      saleForm: null // To hold the ref to v-form
    };
  },
  computed: {
    totalPages() {
      if (!this.pagination.total || this.pagination.total <= 0) return 0;
      return Math.ceil(this.pagination.total / this.pagination.perPage);
    },
    saleTotalAmount() {
      if (!this.currentSale || !this.currentSale.items) return 0;
      return this.currentSale.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * parseInt(item.quantity, 10));
      }, 0);
    }
  },
  created() {
    this.fetchSales();
    this.fetchProducts();
    this.fetchClients();
  },
  mounted() {
    // Assign ref after component is mounted
    this.saleForm = this.$refs.saleForm;
  },
  methods: {
    getInitialSaleData() {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');

      return {
        items: [],
        clientId: null,
        paymentMethod: null,
        buyDate: `${year}-${month}-${day}`, // Default to today
      };
    },
    getInitialNewItemData() {
      return {
        productId: null,
        quantity: 1,
        price: 0, // Will be set when product is selected
        productName: '', // For display in the items list
      };
    },
    async fetchSales(page = this.pagination.page, perPage = this.pagination.perPage) {
      this.loading = true;
      this.errorMessages = []; // Clear previous errors
      try {
        const response = await apiService.get(`/sales?page=${page}&perPage=${perPage}`);
        const data = await response.json(); // Read response regardless of status

        if (!response.ok) {
          this.sales = []; // Clear data on error
          this.pagination.total = 0;
          this.errorMessages = this.parseApiErrors(data);
          throw new Error(this.errorMessages[0] || 'Erro ao buscar vendas');
        }

        this.sales = data.data;
        this.pagination = {
          page: parseInt(data.meta?.page || page),
          perPage: parseInt(data.meta?.perPage || perPage),
          total: parseInt(data.meta?.total || 0),
        };
      } catch (error) {
        console.error('Fetch Sales Error:', error);
        // Ensure errorMessages has something if not set by API response
        if (!this.errorMessages.length) {
          this.errorMessages = ['Ocorreu um erro inesperado ao buscar as vendas.'];
        }
      } finally {
        this.loading = false;
      }
    },

    async fetchProducts() {
      // No loading indicator for this, usually fast
      try {
        const response = await apiService.get('/products?perPage=500'); // Fetch more if needed
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const productsParsed = await response.json();
        // Prepare products for v-select display
        this.products = productsParsed.data.map(p => ({
          ...p,
          display: `${p.name} - ${this.currency(p.price)}` // Create display text
        }));
      } catch (error) {
        console.error('Fetch Products Error:', error);
        this.errorMessages.push('Erro ao carregar lista de produtos.'); // Add to main errors
      }
    },

    async fetchClients() {
      // No loading indicator for this
      try {
        const response = await apiService.get('/clients?perPage=500'); // Fetch more if needed
        if (!response.ok) throw new Error('Erro ao buscar clientes');
        const clientsParsed = await response.json();
        this.clients = clientsParsed.data;
      } catch (error) {
        console.error('Fetch Clients Error:', error);
        this.errorMessages.push('Erro ao carregar lista de clientes.'); // Add to main errors
      }
    },

    openAddSaleDialog() {
      this.currentSale = this.getInitialSaleData();
      this.newItem = this.getInitialNewItemData();
      this.modalErrorMessages = [];
      this.$nextTick(() => {
        if (this.saleForm) {
          this.saleForm.resetValidation();
        }
      });
      this.showSaleDialog = true;
    },
    addItemToSale() {
      this.modalErrorMessages = [];
      if (!this.newItem.productId) {
        this.modalErrorMessages.push('Selecione um produto.');
        return;
      }
      if (!this.newItem.quantity || this.newItem.quantity <= 0) {
        this.modalErrorMessages.push('A quantidade deve ser maior que zero.');
        return;
      }

      const product = this.products.find(p => p.id === this.newItem.productId);
      if (!product) {
        this.modalErrorMessages.push('Produto não encontrado.');
        return;
      }

      // Check if item already exists, if so, offer to update quantity or just add new
      // For simplicity, we'll allow duplicate product entries as separate items.
      // If you want to merge, you'd find existing item and update quantity.

      this.currentSale.items.push({
        productId: product.id,
        price: product.price, // Price at the moment of adding to cart
        quantity: parseInt(this.newItem.quantity, 10),
        productName: product.name // For display purposes in the list
      });

      this.newItem = this.getInitialNewItemData(); // Reset for next item
    },

    removeItemFromSale(index) {
      this.currentSale.items.splice(index, 1);
    },

    async saveSale() {
      this.modalErrorMessages = [];

      const { valid } = await this.$refs.saleForm.validate();
      if (!valid) {
        this.modalErrorMessages.push('Por favor, corrija os erros no formulário.');
        return;
      }

      if (!this.currentSale.items.length) {
        this.modalErrorMessages.push('Adicione pelo menos um item à venda.');
        return;
      }

      this.saving = true;
      try {
        const payload = {
          items: this.currentSale.items.map(item => ({
            productId: item.productId,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity, 10)
          })),
          clientId: this.currentSale.clientId,
          paymentMethod: this.currentSale.paymentMethod,
          buyDate: this.currentSale.buyDate, // YYYY-MM-DD format
        };

        const response = await apiService.post('/sales', payload);
        const responseData = await response.json();

        if (!response.ok) {
          this.modalErrorMessages = this.parseApiErrors(responseData);
          throw new Error(this.modalErrorMessages[0] || 'Erro ao salvar a venda');
        }

        this.closeSaleDialog();
        await this.fetchSales(this.pagination.page);

      } catch (error) {
        console.error('Save Sale Error:', error);
        if (!this.modalErrorMessages.length) {
          this.modalErrorMessages = ['Ocorreu um erro inesperado ao salvar a venda.'];
        }
      } finally {
        this.saving = false;
      }
    },


    openViewSaleDialog(sale) {
      this.saleToView = { ...sale }; // Use a separate object for viewing
      this.showDetailsDialog = true;
    },

    openDeleteConfirmDialog(id) {
      this.saleToDeleteId = id;
      this.showDeleteConfirmDialog = true;
    },

    async executeDelete() {
      if (!this.saleToDeleteId) return;
      this.deleting = true;
      this.errorMessages = []; // Clear main errors

      try {
        const response = await apiService.delete(`/sales/${this.saleToDeleteId}`);
        // Check if response has content before trying to parse json
        let errorData = null;
        if (response.headers.get("content-type")?.includes("application/json")) {
          errorData = await response.json();
        }

        if (!response.ok) {
          this.errorMessages = this.parseApiErrors(errorData);
          throw new Error(this.errorMessages[0] || 'Erro ao excluir a venda');
        }

        this.closeDeleteConfirmDialog();
        // Refresh list, potentially going back a page if it was the last item
        if (this.sales.length === 1 && this.pagination.page > 1) {
          await this.fetchSales(this.pagination.page - 1);
        } else {
          await this.fetchSales(this.pagination.page);
        }
        // Optional: Show success message

      } catch (error) {
        console.error('Delete Sale Error:', error);
        if (!this.errorMessages.length) {
          this.errorMessages = ['Ocorreu um erro inesperado ao excluir a venda.'];
        }
      } finally {
        this.deleting = false;
      }
    },

    closeSaleDialog() {
      this.showSaleDialog = false;
      // Optional: Reset form validation state on close
      this.$nextTick(() => {
        if (this.$refs.saleForm) {
          this.$refs.saleForm.reset(); // Resets inputs and validation
        }
        this.currentSale = this.getInitialSaleData(); // Ensure data model is reset
        this.modalErrorMessages = []; // Clear modal errors on close
      });
    },
    closeDetailsDialog() {
      this.showDetailsDialog = false;
      this.saleToView = {}; // Clear viewed data
    },
    closeDeleteConfirmDialog() {
      this.showDeleteConfirmDialog = false;
      this.saleToDeleteId = null;
    },

    // Format date using the utility function
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      // Decide if you need time or not based on context
      // return formatDateHour(dateString); // If time is always needed
      return formatDate(dateString); // If only date is needed
    },

    // Format currency
    currency(value) {
      if (value === null || value === undefined || isNaN(Number(value))) {
        return 'R$ 0,00';
      }
      return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
    },

    // Get display text for payment method code
    getPaymentMethodText(methodValue) {
      const method = this.paymentMethods.find(m => m.value === methodValue);
      return method ? method.text : methodValue; // Fallback to value if not found
    },

    // Handle pagination change
    handlePageChange(newPage) {
      // v-model handles updating pagination.page
      this.fetchSales(newPage, this.pagination.perPage);
    },

    // Clear general error messages
    clearErrorMessages() {
      this.errorMessages = [];
    },

    // Helper to parse API errors (assuming potential structure)
    parseApiErrors(errorData) {
      if (!errorData) return ['Ocorreu um erro.'];
      if (errorData.message) {
        return Array.isArray(errorData.message) ? errorData.message : [errorData.message];
      }
      if (typeof errorData === 'string') {
        return [errorData];
      }
      // Add more specific parsing if your API returns errors differently
      return ['Ocorreu um erro desconhecido.'];
    }
  },
};
</script>

<style scoped>
/* Remove Bootstrap modal styles if they were present */
/* .modal, .modal-dialog { ... } */

/* Add any custom styles needed */
.v-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
  /* Subtle hover for table rows */
}

/* Ensure list item in select looks good */
.v-list-item--density-compact.v-list-item--one-line {
  min-height: 40px;
  /* Adjust if needed */
}
</style>