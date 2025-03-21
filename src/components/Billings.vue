<template>
  <div>
    <h2>Gerenciar Faturas</h2>
    <!-- Campo de seleção de cliente -->
    <div class="form-group">
      <label for="clientSelect">Filtrar por Cliente:</label>
      <ClientCombo :clients="clients" @selected="onClientSelected" />
    </div>
    <!-- Exibição das mensagens de erro gerais -->
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>
    <div v-if="!billings.length" class="card bg-info text-white">
      <div class="card-body">Nenhuma informação para ser exibida</div>
    </div>
    <div v-else>
      <!-- Tabela de Faturas -->
      <table class="table table-bordered table-hover">
        <thead class="thead-light">
          <tr>
            <th>Cliente</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Método de Pagamento</th>
            <th>Pago em</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="billing in billings" :key="billing.id">
            <td>{{ billing.clientName }}</td>
            <td>{{ billing.description }}</td>
            <td>{{ currency(billing.amount) }}</td>
            <td>{{ billing.paymentMethod }}</td>
            <td>{{ formatDate(billing.payedAt) }}</td>
            <td class="text-center">
              <button class="btn btn-info btn-sm" @click="viewBilling(billing.id)">
                <fa-icon :icon="['fas', 'eye']" /> Detalhes
              </button>
              <button v-if="!billing.payedAt && billing.amount > 0" class="btn btn-success btn-sm"
                @click="payBilling(billing.id)">
                <fa-icon :icon="['fas', 'fa-dollar-sign']" /> Pagar
              </button>
              <button class="btn btn-primary btn-sm" @click="viewBillingItems(billing.id)">
                <fa-icon :icon="['fas', 'fa-list']" /> Itens
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages"
        @page-changed="handlePageChange" />
    </div>
    <!-- Modal para Visualizar Detalhes da Fatura -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showDetailsModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalhes da Fatura</h5>
            <button type="button" class="close" @click="closeDetailsModal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p><strong>ID:</strong> {{ currentBilling.id }}</p>
            <p><strong>Cliente:</strong> {{ currentBilling.clientName }}</p>
            <p><strong>Descrição:</strong> {{ currentBilling.description }}</p>
            <p><strong>Valor:</strong> {{ currency(currentBilling.amount) }}</p>
            <p><strong>Valor Pago:</strong> {{ currency(currentBilling.amountPayed) }}</p>
            <p><strong>Método de Pagamento:</strong> {{ currentBilling.paymentMethod }}</p>
            <p><strong>Pago em:</strong> {{ formatDate(currentBilling.payedAt) }}</p>
            <p><strong>Criado em:</strong> {{ formatDate(currentBilling.createdAt) }}</p>
            <!-- Outros detalhes da fatura -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Pagar Fatura -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showPayModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="confirmPayBilling">
            <div class="modal-header">
              <h5 class="modal-title">Pagar Fatura</h5>
              <button type="button" class="close" @click="closePayModal" aria-label="Close">
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
              <p>Deseja realmente pagar esta fatura?</p>
              <p><strong>ID:</strong> {{ currentBilling.id }}</p>
              <p><strong>Descrição:</strong> {{ currentBilling.description }}</p>
              <p><strong>Valor:</strong> {{ currency(currentBilling.amount) }}</p>
              <div class="form-group">
                <label for="paymentMethod">Método de Pagamento</label>
                <select class="form-control" id="paymentMethod" v-model="paymentMethod" required>
                  <option value="" disabled>Selecione um método de pagamento</option>
                  <option value="PIX">PIX</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <!-- Outros métodos de pagamento -->
                </select>
              </div>
              <div class="form-group">
                <label for="amount">Valor a Pagar</label>
                <CurrencyInput class="form-control" id="amount" v-model.lazy="amount" required
                  :options="{ currency: 'BRL', precision: 2 }" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closePayModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">Pagar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para Visualizar Itens da Fatura -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showItemsModal">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Itens da Fatura</h5>
            <button type="button" class="close" @click="closeItemsModal" aria-label="Close">
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
            <!-- Tabela de Itens da Fatura -->
            <table class="table table-bordered table-hover">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Método de Pagamento</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in billingItems" :key="item.id">
                  <td>{{ item.clientName }}</td>
                  <td>{{ item.description }}</td>
                  <td>{{ formatAmount(item.amount, item.type) }}</td>
                  <td>{{ item.paymentMethod }}</td>
                  <td>{{ formatDate(item.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeItemsModal">
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
import CurrencyInput from './CurrencyInput'
import Pagination from '@/components/Pagination.vue';
import ClientCombo from '@/components/ClientCombo.vue';
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Billings',
  components: { CurrencyInput, Pagination, ClientCombo },
  data() {
    return {
      billings: [],
      currentBilling: {},
      showDetailsModal: false,
      showPayModal: false,
      errorMessages: [],
      paymentMethod: '',
      amount: 0,
      clients: [],
      selectedClientId: '',
      showItemsModal: false,
      billingItems: [],
      currentPage: 1,
      totalRows: 1,
      pageSize: 10
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  created() {
    this.fetchBillings();
    this.fetchClients();
  },
  methods: {
    async fetchClients() {
      try {
        const response = await apiService.get('/clients?perPage=500');
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages.push(
            errorData.message || 'Erro ao buscar clientes'
          );
          return;
        }
        const data = await response.json();
        this.clients = data.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar clientes');
      }
    },
    // Busca a lista de faturas do backend
    async fetchBillings(page = 1, perPage = 10) {
      try {
        let url = `/billings?page=${page}&perPage=${perPage}`;
        if (this.selectedClientId) {
          url += `&clientId=${this.selectedClientId}`;
        }
        const response = await apiService.get(url);
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao buscar faturas'];
          }
          return;
        }
        const data = await response.json();
        this.billings = data.data;
        this.currentPage = parseInt(data.meta.page);
        this.totalRows = parseInt(data.meta.total) || 1;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar faturas'];
      }
    },
    // Visualiza detalhes de uma fatura
    async viewBilling(id) {
      try {
        const response = await apiService.get(`/billings/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao buscar detalhes da fatura'];
          }
          return;
        }
        this.currentBilling = await response.json();
        this.showDetailsModal = true;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar detalhes da fatura'];
      }
    },
    // Abre o modal para pagar uma fatura
    async payBilling(id) {
      this.currentBilling = this.billings.find(billing => billing.id === id);
      this.amount = this.currentBilling.amount;
      this.paymentMethod = '';
      this.errorMessages = [];
      this.showPayModal = true;
    },
    // Confirma o pagamento da fatura
    async confirmPayBilling() {
      try {
        const payload = {
          amount: this.amount,
          paymentMethod: this.paymentMethod
        };
        const response = await apiService.patch(
          `/billings/${this.currentBilling.id}/pay`,
          payload
        );
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao pagar a fatura'];
          }
          return;
        }
        this.fetchBillings();
        this.closePayModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao pagar a fatura'];
      }
    },
    async viewBillingItems(id) {
      try {
        const response = await apiService.get(`/billings/${id}/items`);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar itens da fatura'];
          return;
        }
        this.billingItems = await response.json(); // Presume que a resposta é um array de itens
        this.showItemsModal = true; // Exibe o modal com os itens
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar itens da fatura'];
      }
    },
    closeItemsModal() {
      this.showItemsModal = false;
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
    },
    closePayModal() {
      this.showPayModal = false;
    },
    formatDate(dateString) {
      if (!dateString) return 'Não Pago';
      return formatDateHour(dateString)
    },
    currency(value) {
      return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    },
    formatAmount(amount, type) {
      let adjustedAmount = parseFloat(amount);
      if (type === 'CREDIT') {
        adjustedAmount = -Math.abs(adjustedAmount);
      }
      return this.currency(adjustedAmount);
    },
    onClientChange() {
      this.currentPage = 1; // Reseta para a primeira página
      this.fetchBillings(this.currentPage, this.pageSize);
    },

    handlePageChange(newPage) {
      this.currentPage = newPage;
      this.fetchBillings(this.currentPage, this.pageSize);
    },
    onClientSelected(clientId) {
      this.selectedClientId = clientId
      this.fetchBillings(this.currentPage, this.pageSize)
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
