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

    <div v-if="!sales.length" class="card bg-info text-white">
      <div class="card-body">Nenhuma informação para ser exibida</div>
    </div>
    <div v-else>
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
          <td>{{ currency(sale.amount) }}</td>
          <td>{{ formatDate(sale.purchasedAt || sale.createdAt) }}</td>
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

      <pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-changed="handlePageChange"
      />
    </div>

    <!-- Modal para Adicionar Venda -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showSaleModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <!-- Cabeçalho do modal -->
          <div class="modal-header">
            <h5 class="modal-title">Nova Venda</h5>
          </div>

          <!-- Formulário -->
          <form @submit.prevent="saveSale">
            <div class="modal-body">
              <!-- Erros no modal -->
              <div v-if="errorMessages.length" class="alert alert-danger">
                <ul>
                  <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
                </ul>
              </div>

              <!-- CLIENTE -->
              <div>
                <h6><b>Cliente</b></h6>
                <div class="form-group">
                  <label for="clientCombo">Nome</label>
                  <ClientCombo
                      id="clientCombo"
                      :clients="clients"
                      @selected="onClientSelected"
                  />
                </div>
              </div>

              <hr />

              <!-- ITENS DA VENDA (LISTA DE PRODUTOS) -->
              <div>
                <h6><b>Produtos da Venda</b></h6>

                <!-- Botão para adicionar novo item -->
                <button
                    type="button"
                    class="btn btn-sm btn-secondary mb-2"
                    @click="addSaleItem"
                >
                  + Adicionar Item
                </button>

                <!-- Tabela com v-for em saleItems -->
                <table class="table table-sm">
                  <thead>
                  <tr>
                    <th style="width: 35%">Produto</th>
                    <th style="width: 15%">Qtd</th>
                    <th style="width: 25%">Preço</th>
                    <th style="width: 15%">Ação</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(item, idx) in currentSale.saleItems" :key="idx">
                    <td>
                      <select
                          class="form-control form-control-sm"
                          v-model="item.productId"
                          @change="updatePrice(idx)"
                          required
                      >
                        <option value="" disabled>Selecione</option>
                        <option
                            v-for="product in products"
                            :key="product.id"
                            :value="product.id"
                        >
                          {{ product.name }} - {{ currency(product.price) }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <input
                          type="number"
                          class="form-control form-control-sm"
                          min="1"
                          v-model="item.quantity"
                          required
                      />
                    </td>
                    <td>
                      <input
                          type="number"
                          step="0.01"
                          class="form-control form-control-sm"
                          v-model="item.price"
                      />
                    </td>
                    <td>
                      <button
                          type="button"
                          class="btn btn-sm btn-danger"
                          @click="removeSaleItem(idx)"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <hr />

              <!-- PAGAMENTO E DATA -->
              <div>
                <h6><b>Pagamento</b></h6>
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
                  </select>
                </div>

                <div class="form-group">
                  <label for="buyDate">Data da Venda (opcional)</label>
                  <input
                      type="date"
                      class="form-control"
                      id="buyDate"
                      v-model="currentSale.buyDate"
                  />
                  <small class="form-text text-muted">
                    Caso não seja informada, a data atual será usada.
                  </small>
                </div>
              </div>
            </div>

            <!-- Rodapé do modal -->
            <div class="modal-footer">
              <button
                  type="button"
                  class="btn btn-secondary"
                  @click="closeSaleModal"
              >
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Criar Venda
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para Visualizar Detalhes da Venda -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showDetailsModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <!-- Continua como seu código original -->
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
            <p><strong>Valor:</strong> {{ currency(currentSale.amount) }}</p>
            <p><strong>Data venda:</strong> {{ formatDate(currentSale.purchasedAt || currentSale.createdAt) }}</p>
            <p v-if="currentSale.paymentMethod !== 'TO_RECEIVE'">
              <strong>Data pagamento:</strong>
              {{ formatDate(currentSale.payedAt) }}
            </p>
            <!-- Se quiser exibir os itens, poderia iterar aqui -->
            <!-- <p>Itens:</p>
            <ul>
              <li v-for="item in currentSale.items" :key="item.id">
                {{ item.productName }} - {{ item.quantity }}x - {{ currency(item.price) }}
              </li>
            </ul> -->
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
import Pagination from '@/components/Pagination.vue';
import ClientCombo from '@/components/ClientCombo.vue';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Sales',
  components: { Pagination, ClientCombo },
  data() {
    return {
      sales: [],
      products: [],
      clients: [],
      showSaleModal: false,
      showDetailsModal: false,
      errorMessages: [],
      currentPage: 1,
      totalRows: 1,
      pageSize: 10,

      // Objeto representando os campos da venda
      currentSale: {
        clientId: '',
        paymentMethod: '',
        buyDate: '',
        // Agora, a venda pode ter vários itens
        saleItems: []
      }
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  created() {
    this.fetchSales();
    this.fetchProducts();
    this.fetchClients();
  },
  methods: {
    // Busca a lista de vendas
    async fetchSales(page = 1, perPage = 10) {
      try {
        const response = await apiService.get(`/sales?page=${page}&perPage=${perPage}`);
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
        const data = await response.json();
        this.sales = data.data;
        this.currentPage = parseInt(data.meta.page);
        this.totalRows = parseInt(data.meta.total) || 1;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar vendas'];
      }
    },

    // Busca produtos
    async fetchProducts() {
      try {
        const response = await apiService.get('/products');
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }
        const productsParsed = await response.json();
        this.products = productsParsed.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar produtos');
      }
    },

    // Busca clientes
    async fetchClients() {
      try {
        const response = await apiService.get('/clients?perPage=500');
        if (!response.ok) {
          throw new Error('Erro ao buscar clientes');
        }
        const clientsParsed = await response.json();
        this.clients = clientsParsed.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar clientes');
      }
    },

    // Abre o modal para nova venda
    addSale() {
      this.errorMessages = [];
      // Zera os campos da venda
      this.currentSale = {
        clientId: '',
        paymentMethod: '',
        buyDate: '',
        saleItems: []
      };
      // Adiciona pelo menos 1 item inicial
      this.addSaleItem();
      this.showSaleModal = true;
    },

    // Adiciona um novo item de produto
    addSaleItem() {
      this.currentSale.saleItems.push({
        productId: '',
        quantity: 1,
        price: 0
      });
    },

    // Remove um item
    removeSaleItem(index) {
      this.currentSale.saleItems.splice(index, 1);
    },

    // Quando muda o produto, atualiza o preço
    updatePrice(index) {
      const item = this.currentSale.saleItems[index];
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        item.price = parseFloat(product.price);
      } else {
        item.price = 0;
      }
    },

    // Salva a venda
    async saveSale() {
      try {
        this.errorMessages = [];

        // Monta o payload
        // Exemplo de estrutura esperada no backend: { clientId, paymentMethod, buyDate, items: [...] }
        const payload = {
          clientId: this.currentSale.clientId,
          paymentMethod: this.currentSale.paymentMethod,
          buyDate: this.currentSale.buyDate || null,
          items: this.currentSale.saleItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }))
        };

        const response = await apiService.post('/sales', payload);
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

        // Sucesso ao criar
        this.fetchSales();
        this.closeSaleModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar a venda'];
      }
    },

    // Visualiza detalhes
    viewSale(sale) {
      this.currentSale = { ...sale };
      this.showDetailsModal = true;
    },

    // Deleta venda
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
      return formatDateHour(dateString);
    },

    currency(value) {
      return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    },

    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchSales(this.currentPage, this.pageSize);
    },

    onClientSelected(clientId) {
      this.currentSale.clientId = clientId;
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
hr {
  margin: 1rem 0;
}

/* Mantém o diálogo centralizado e com espaço vertical */
.modal-dialog {
  margin: 1rem auto;
  max-height: calc(100vh - 2rem); /* Ajusta para seu gosto */
  display: flex;
  flex-direction: column;
}

.modal-content {
  flex: 1 1 auto;
  overflow-y: auto; /* permite rolagem dentro do modal */
}
</style>
