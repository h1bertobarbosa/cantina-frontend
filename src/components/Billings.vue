<template>
  <section class="billings-page">
    <div v-if="errorMessages.length" class="p-message p-message-error billings-alert">
      <div class="billings-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <Card class="billings-card surface-card">
      <template #content>
        <div class="billings-toolbar">
          <div>
            <span class="billings-eyebrow">Financeiro</span>
            <h2>Gerenciar faturas</h2>
            <p>Acompanhe pendências, consulte itens vinculados e registre pagamentos com clareza.</p>
          </div>
        </div>

        <div class="billings-filters">
          <IconField iconPosition="left" class="billings-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters.search"
              type="text"
              placeholder="Buscar por cliente ou descrição"
              @input="onSearchInput"
            />
          </IconField>

          <Select
            v-model="filters.clientId"
            :options="clientOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Cliente"
            showClear
            class="billings-filter-select"
            @change="onFilterChange"
          />

          <Select
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            showClear
            class="billings-filter-select"
            @change="onFilterChange"
          />
        </div>

        <DataTable
          :value="billings"
          :loading="isLoading"
          responsiveLayout="scroll"
          class="billings-table"
        >
          <template #empty>
            <div class="billings-empty">
              <i class="pi pi-receipt"></i>
              <strong>Nenhuma fatura encontrada</strong>
              <span>Refine os filtros ou aguarde novos lançamentos.</span>
            </div>
          </template>

          <Column header="Cliente">
            <template #body="{ data }">
              <div class="billing-client">
                <Avatar
                  :label="getInitials(data.clientName)"
                  shape="circle"
                  class="billing-avatar"
                />
                <div>
                  <strong>{{ data.clientName }}</strong>
                  <span>{{ data.description }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Valor">
            <template #body="{ data }">
              <strong class="billing-amount">{{ currency(data.amount) }}</strong>
              <span class="billing-subvalue">Pago: {{ currency(data.amountPayed) }}</span>
            </template>
          </Column>

          <Column header="Pagamento">
            <template #body="{ data }">
              <Tag
                :value="billingStatusLabel(data)"
                :severity="billingStatusSeverity(data)"
                rounded
              />
              <span class="billing-subvalue billing-method">
                {{ formatPaymentMethod(data.paymentMethod) }}
              </span>
            </template>
          </Column>

          <Column header="Pago em">
            <template #body="{ data }">
              {{ formatDate(data.payedAt) }}
            </template>
          </Column>

          <Column header="Ações" bodyClass="billings-actions-cell" headerClass="billings-actions-header">
            <template #body="{ data }">
              <div class="billings-actions">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  text
                  aria-label="Ver detalhes"
                  @click="viewBilling(data.id)"
                />
                <Button
                  v-if="canPayBilling(data)"
                  icon="pi pi-wallet"
                  severity="success"
                  rounded
                  text
                  aria-label="Pagar fatura"
                  @click="payBilling(data.id)"
                />
                <Button
                  icon="pi pi-list"
                  severity="secondary"
                  rounded
                  text
                  aria-label="Ver itens"
                  @click="viewBillingItems(data.id)"
                />
                <Button
                  icon="pi pi-external-link"
                  severity="contrast"
                  rounded
                  text
                  aria-label="Resumo para cliente"
                  @click="openCustomerSummary(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="billings-pagination">
          <span>Página {{ pagination.page }} de {{ totalPages }}</span>
          <Paginator
            :first="firstRow"
            :rows="pagination.perPage"
            :totalRecords="pagination.total"
            :rowsPerPageOptions="[10]"
            template="PrevPageLink PageLinks NextPageLink"
            @page="onPageChange"
          />
        </div>
      </template>
    </Card>

    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Detalhes da fatura"
      class="billings-dialog"
    >
      <div class="billing-details">
        <div class="billing-details-header">
          <Avatar
            :label="getInitials(currentBilling.clientName)"
            shape="circle"
            class="billing-avatar billing-avatar-large"
          />
          <div>
            <strong>{{ currentBilling.clientName }}</strong>
            <span>{{ currentBilling.description }}</span>
          </div>
        </div>

        <div class="billing-details-grid">
          <div>
            <small>Valor</small>
            <strong>{{ currency(currentBilling.amount) }}</strong>
          </div>
          <div>
            <small>Valor pago</small>
            <strong>{{ currency(currentBilling.amountPayed) }}</strong>
          </div>
          <div>
            <small>Método</small>
            <strong>{{ formatPaymentMethod(currentBilling.paymentMethod) }}</strong>
          </div>
          <div>
            <small>Pago em</small>
            <strong>{{ formatDate(currentBilling.payedAt) }}</strong>
          </div>
          <div>
            <small>Criado em</small>
            <strong>{{ formatDate(currentBilling.createdAt) }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showPayModal"
      modal
      header="Pagar fatura"
      class="billings-dialog"
    >
      <form class="billings-form" @submit.prevent="confirmPayBilling">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="billings-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="billings-payment-summary">
          <div>
            <small>Cliente</small>
            <strong>{{ currentBilling.clientName }}</strong>
          </div>
          <div>
            <small>Descrição</small>
            <strong>{{ currentBilling.description }}</strong>
          </div>
          <div>
            <small>Saldo atual</small>
            <strong>{{ currency(currentBilling.amount) }}</strong>
          </div>
        </div>

        <div class="billings-form-grid">
          <div class="billings-field">
            <label for="billing-payment-method">Método de pagamento</label>
            <Select
              id="billing-payment-method"
              v-model="paymentMethod"
              :options="paymentMethodOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um método"
              required
            />
          </div>

          <div class="billings-field">
            <label for="billing-amount">Valor a pagar</label>
            <CurrencyInput
              id="billing-amount"
              class="form-control"
              v-model="amount"
              required
              :options="currencyOptions"
            />
          </div>
        </div>

        <div class="billings-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closePayModal"
          />
          <Button type="submit" label="Pagar" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showItemsModal"
      modal
      header="Itens da fatura"
      class="billings-dialog billings-dialog-large"
    >
      <DataTable
        :value="billingItems"
        responsiveLayout="scroll"
        class="billings-items-table"
      >
        <template #empty>
          <div class="billings-empty">
            <i class="pi pi-list"></i>
            <strong>Nenhum item encontrado</strong>
          </div>
        </template>

        <Column field="clientName" header="Cliente"></Column>

        <Column field="description" header="Descrição"></Column>

        <Column header="Valor">
          <template #body="{ data }">
            <strong :class="data.type === 'CREDIT' ? 'billing-credit' : 'billing-debit'">
              {{ formatAmount(data.amount, data.type) }}
            </strong>
          </template>
        </Column>

        <Column header="Método">
          <template #body="{ data }">
            {{ formatPaymentMethod(data.paymentMethod) }}
          </template>
        </Column>

        <Column header="Data da venda">
          <template #body="{ data }">
            {{ formatDate(data.saleDate || data.createdAt) }}
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </section>
</template>

<script>
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';
import { formatPaymentMethod } from '../utils/paymentMethod';
import CurrencyInput from './CurrencyInput';

export default {
  name: 'BillingsPage',
  components: {
    Avatar,
    Button,
    Card,
    Column,
    CurrencyInput,
    DataTable,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Paginator,
    Select,
    Tag
  },
  data() {
    return {
      billings: [],
      currentBilling: {},
      showDetailsModal: false,
      showPayModal: false,
      showItemsModal: false,
      isLoading: false,
      errorMessages: [],
      paymentMethod: '',
      amount: 0,
      clients: [],
      billingItems: [],
      searchDebounceId: null,
      filters: {
        search: '',
        clientId: null,
        status: null
      },
      currencyOptions: {
        locale: 'pt-BR',
        currency: 'BRL',
        currencyDisplay: 'symbol',
        precision: 2,
        autoDecimalDigits: true,
        useGrouping: true,
        hideCurrencySymbolOnFocus: false,
        hideGroupingSeparatorOnFocus: false
      },
      paymentMethodOptions: [
        { label: 'PIX', value: 'PIX' },
        { label: 'Dinheiro', value: 'CASH' },
        { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
        { label: 'Cartão de Débito', value: 'DEBIT_CARD' }
      ],
      statusOptions: [
        { label: 'Pendentes', value: 'pending' },
        { label: 'Pagas', value: 'paid' }
      ],
      pagination: {
        page: 1,
        perPage: 10,
        total: 0
      }
    };
  },
  computed: {
    firstRow() {
      return (this.pagination.page - 1) * this.pagination.perPage;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.pagination.total / this.pagination.perPage));
    },
    clientOptions() {
      return this.clients.map((client) => ({
        label: client.name,
        value: client.id
      }));
    }
  },
  created() {
    this.fetchBillings();
    this.fetchClients();
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceId);
  },
  methods: {
    formatPaymentMethod,
    async fetchClients() {
      try {
        const response = await apiService.get('/clients?perPage=300&orderBy=name&orderDir=asc');

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages.push(errorData.message || 'Erro ao buscar clientes');
          return;
        }

        const data = await response.json();
        this.clients = data.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar clientes');
      }
    },
    async fetchBillings(page = this.pagination.page, perPage = this.pagination.perPage) {
      this.isLoading = true;
      this.errorMessages = [];

      try {
        const params = new URLSearchParams({
          page: String(page),
          perPage: String(perPage),
          orderBy: 'created_at',
          orderDir: 'desc'
        });

        if (this.filters.search.trim()) {
          params.set('search', this.filters.search.trim());
        }
        if (this.filters.clientId) {
          params.set('clientId', this.filters.clientId);
        }
        if (this.filters.status) {
          params.set('status', this.filters.status);
        }

        const response = await apiService.get(`/billings?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar faturas'];
          return;
        }

        const data = await response.json();
        this.billings = data.data;
        this.pagination = {
          page: Number(data.meta.page),
          perPage: Number(data.meta.perPage),
          total: Number(data.meta.total)
        };
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar faturas'];
      } finally {
        this.isLoading = false;
      }
    },
    async viewBilling(id) {
      try {
        const response = await apiService.get(`/billings/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar detalhes da fatura'];
          return;
        }

        this.currentBilling = await response.json();
        this.showDetailsModal = true;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar detalhes da fatura'];
      }
    },
    payBilling(id) {
      this.currentBilling = this.billings.find((billing) => billing.id === id) || {};
      this.amount = this.currentBilling.amount;
      this.paymentMethod = '';
      this.errorMessages = [];
      this.showPayModal = true;
    },
    async confirmPayBilling() {
      try {
        const payload = {
          amount: Number(this.amount),
          paymentMethod: this.paymentMethod
        };
        const response = await apiService.patch(
          `/billings/${this.currentBilling.id}/pay`,
          payload
        );

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao pagar a fatura'];
          return;
        }

        await this.fetchBillings();
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

        this.billingItems = await response.json();
        this.showItemsModal = true;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar itens da fatura'];
      }
    },
    openCustomerSummary(id) {
      this.$router.push(`/dashboard/billings/${id}/customer-summary`);
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
    onSearchInput() {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchBillings(1, this.pagination.perPage);
      }, 300);
    },
    onFilterChange() {
      this.pagination.page = 1;
      this.fetchBillings(1, this.pagination.perPage);
    },
    onPageChange(event) {
      const page = Math.floor(event.first / event.rows) + 1;
      this.fetchBillings(page, event.rows);
    },
    formatDate(dateString) {
      if (!dateString) {
        return 'Não pago';
      }

      return formatDateHour(dateString);
    },
    currency(value) {
      return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    },
    formatAmount(amount, type) {
      let adjustedAmount = Number(amount);

      if (type === 'CREDIT') {
        adjustedAmount = -Math.abs(adjustedAmount);
      }

      return this.currency(adjustedAmount);
    },
    getInitials(name) {
      return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'FT';
    },
    canPayBilling(billing) {
      return !billing.payedAt && Number(billing.amount) > 0;
    },
    billingStatusLabel(billing) {
      return billing.payedAt ? 'Paga' : 'Pendente';
    },
    billingStatusSeverity(billing) {
      return billing.payedAt ? 'success' : 'warning';
    }
  }
};
</script>

<style scoped>
.billings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.billings-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.billings-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.billings-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.billings-card :deep(.p-card-body) {
  padding: 28px;
}

.billings-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.billings-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.billings-toolbar h2 {
  margin: 10px 0 8px;
  font-size: 1.8rem;
}

.billings-toolbar p {
  margin: 0;
  color: var(--app-surface-muted);
}

.billings-filters {
  display: grid;
  grid-template-columns: minmax(260px, 1.6fr) repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.billings-search,
.billings-filter-select {
  width: 100%;
}

.billings-search :deep(.p-inputtext) {
  width: 100%;
}

.billings-table :deep(.p-datatable-table-container),
.billings-items-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.billings-table :deep(th),
.billings-items-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.billings-table :deep(td),
.billings-items-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.billing-client {
  display: flex;
  align-items: center;
  gap: 14px;
}

.billing-client strong,
.billing-details-header strong {
  display: block;
}

.billing-client span,
.billing-details-header span,
.billing-details-grid small,
.billing-subvalue {
  color: var(--app-surface-muted);
}

.billing-client span,
.billing-details-header span,
.billing-subvalue {
  display: block;
  margin-top: 4px;
}

.billing-avatar {
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.billing-avatar-large {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.billing-amount {
  color: var(--app-primary-dark);
}

.billing-method {
  margin-top: 8px;
}

.billings-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.billings-actions-cell,
.billings-actions-header {
  width: 210px;
}

.billings-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  color: var(--app-surface-muted);
}

.billing-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.billing-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.billing-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.billing-details-grid strong,
.billings-payment-summary strong {
  display: block;
  margin-top: 6px;
}

.billings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.billings-payment-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.billings-payment-summary small,
.billing-details-grid small {
  color: var(--app-surface-muted);
}

.billings-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.billings-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.billings-field label {
  font-weight: 600;
}

.billings-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.billing-credit {
  color: var(--app-danger);
}

.billing-debit {
  color: var(--app-success);
}

.billings-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

.billings-empty i {
  font-size: 2rem;
  color: var(--app-primary);
}

.billings-dialog :deep(.p-dialog-content) {
  padding-top: 4px;
}

.billings-dialog-large :deep(.p-dialog) {
  width: min(960px, 92vw);
}

@media (max-width: 768px) {
  .billings-filters,
  .billing-details-grid,
  .billings-payment-summary,
  .billings-form-grid,
  .billings-pagination {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
