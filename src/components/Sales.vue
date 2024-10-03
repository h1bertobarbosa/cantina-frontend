<template>
  <div>
    <h2>Gerenciar Vendas</h2>
    <button class="btn btn-primary mb-3" @click="addSale">Adicionar Venda</button>

    <!-- Exibição das mensagens de erro gerais -->
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>

    <!-- Tabela de Vendas -->
    <table class="table table-bordered table-hover">
      <thead class="thead-light">
        <tr>
          <th>Cliente</th>
          <th>Descrição</th>
          <th>Método de Pagamento</th>
          <th>Valor</th>
          <th>Venda em</th>
          <th class="text-center">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sale in sales" :key="sale.id">
          <td>{{ sale.clientName }}</td>
          <td>{{ sale.description }}</td>
          <td>{{ sale.paymentMethod }}</td>
          <td>{{ sale.amount }}</td>
          <td>{{ formatDate(sale.createdAt) }}</td>
          <td class="text-center">
            <button class="btn btn-info btn-sm" @click="viewSale(sale)">
              <i class="fas fa-eye"></i> Detalhes
            </button>
            <button class="btn btn-danger btn-sm" @click="deleteSale(sale.id)">
              <i class="fas fa-trash-alt"></i> Excluir
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para Adicionar Venda -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showSaleModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="saveSale">
            <div class="modal-header">
              <h5 class="modal-title">Adicionar Venda</h5>
              <button type="button" class="close" @click="closeSaleModal" aria-label="Close">
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
                <label for="product">Produto</label>
                <select
                  class="form-control"
                  id="product"
                  v-model="currentSale.productId"
                  required
                >
                  <option value="" disabled>Selecione um produto</option>
                  <option v-for="product in products" :key="product.id" :value="product.id">
                    {{ product.name }} - {{ product.price  }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="client">Cliente</label>
                <select
                  class="form-control"
                  id="client"
                  v-model="currentSale.clientId"
                  required
                >
                  <option value="" disabled>Selecione um cliente</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="quantity">Quantidade</label>
                <input
                  type="number"
                  class="form-control"
                  id="quantity"
                  v-model="currentSale.quantity"
                  required
                />
              </div>
              <div class="form-group">
                <label for="paymentMethod">Método de Pagamento</label>
                <select
                  class="form-control"
                  id="paymentMethod"
                  v-model="currentSale.paymentMethod"
                  required
                >
                  <option value="" disabled>Selecione um método de pagamento</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="PIX">PIX</option>
                  <option value="TO_RECEIVE">à Receber</option>
                  <!-- Outros métodos de pagamento -->
                </select>
              </div>
              <!-- Outros campos da venda podem ser adicionados aqui -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeSaleModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para Visualizar Detalhes da Venda -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showDetailsModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalhes da Venda</h5>
            <button type="button" class="close" @click="closeDetailsModal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>ID:</strong> {{ currentSale.id }}</p>
            <p><strong>Cliente:</strong> {{ currentSale.clientName }}</p>
            <p><strong>Descrição:</strong> {{ currentSale.description }}</p>
            <p><strong>Método de Pagamento:</strong> {{ currentSale.paymentMethod }}</p>
            <p><strong>Valor:</strong> {{ currentSale.amount }}</p>
            <p><strong>Data venda:</strong> {{ formatDate(currentSale.createdAt) }}</p>
            <p v-if="currentSale.paymentMethod !== 'TO_RECEIVE'"><strong>Data pagamento:</strong> {{ formatDate(currentSale.payedAt) }}</p>
            <!-- Outros detalhes da venda -->
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
  name: 'Sales',
  data() {
    return {
      sales: [],
      products: [],
      clients: [],
      showSaleModal: false,
      showDetailsModal: false,
      currentSale: {
        productId: '',
        clientId: '',
        quantity: 1,
        paymentMethod: ''
      },
      errorMessages: [] // Para mensagens de erro
    };
  },
  created() {
    this.fetchSales();
    this.fetchProducts();
    this.fetchClients();
  },
  methods: {
    // Busca a lista de vendas do backend
    async fetchSales() {
      try {
        const response = await apiService.get('/sales');
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao buscar vendas'];
          }
          return;
        }
        const salesParsed = await response.json();
        this.sales = salesParsed.data
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar vendas'];
      }
    },
    // Busca a lista de produtos para o formulário
    async fetchProducts() {
      try {
        const response = await apiService.get('/products');
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }
        const productsParsed = await response.json();
        this.products = productsParsed.data
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar produtos');
      }
    },
    // Busca a lista de clientes para o formulário
    async fetchClients() {
      try {
        const response = await apiService.get('/clients');
        if (!response.ok) {
          throw new Error('Erro ao buscar clientes');
        }
        const clientsParsed = await response.json();
        this.clients = clientsParsed.data
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar clientes');
      }
    },
    // Abre o modal para adicionar uma nova venda
    addSale() {
      this.currentSale = {
        productId: '',
        clientId: '',
        quantity: 1,
        paymentMethod: ''
      };
      this.errorMessages = [];
      this.showSaleModal = true;
    },
    // Salva a venda
    async saveSale() {
      try {
        this.errorMessages = [];
        // Prepara o payload conforme a estrutura esperada
        const selectedProduct = this.products.find(
          product => product.id === this.currentSale.productId
        );
        const payload = {
          productId: this.currentSale.productId,
          clientId: this.currentSale.clientId,
          price: parseFloat(selectedProduct.price),
          quantity: this.currentSale.quantity,
          paymentMethod: this.currentSale.paymentMethod
        };

        const response = await apiService.post('/sales',payload);
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao salvar a venda'];
          }
          return;
        }
        this.fetchSales();
        this.closeSaleModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar a venda'];
      }
    },
    // Visualiza detalhes de uma venda
    viewSale(sale) {
      this.currentSale = { ...sale };
      this.showDetailsModal = true;
    },
    // Deleta uma venda
    async deleteSale(id) {
      if (confirm('Tem certeza que deseja excluir esta venda?')) {
        try {
          const response = await apiService.delete(`/sales/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.message) {
              this.errorMessages = Array.isArray(errorData.message)
                ? errorData.message
                : [errorData.message];
            } else {
              this.errorMessages = ['Erro ao excluir a venda'];
            }
            return;
          }
          this.fetchSales();
        } catch (error) {
          console.error(error);
          this.errorMessages = ['Erro ao excluir a venda'];
        }
      }
    },
    closeSaleModal() {
      this.showSaleModal = false;
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
    },
    formatDate(dateString) {
      return formatDateHour(dateString)
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
.modal {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}
.modal-dialog {
  margin-top: 10%;
}
</style>
