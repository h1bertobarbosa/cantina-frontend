<template>
  <section class="sales-page">
    <div v-if="errorMessages.length" class="p-message p-message-error sales-alert">
      <div class="sales-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <Card class="sales-card surface-card">
      <template #content>
        <div class="sales-toolbar">
          <div>
            <span class="sales-eyebrow">Operação</span>
            <h2>Gerenciar vendas</h2>
            <p>Acompanhe vendas, filtre por período e registre novos lançamentos com mais contexto.</p>
          </div>

          <Button
            label="Adicionar Venda"
            icon="pi pi-plus"
            class="sales-add-button"
            @click="addSale"
          />
        </div>

        <div class="sales-filters">
          <IconField iconPosition="left" class="sales-search">
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
            class="sales-filter-select"
            @change="onFilterChange"
          />

          <Select
            v-model="filters.paymentMethod"
            :options="paymentMethodOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Pagamento"
            showClear
            class="sales-filter-select"
            @change="onFilterChange"
          />

          <input
            v-model="filters.createdAtFrom"
            type="date"
            class="sales-date-input"
            @change="onFilterChange"
          />

          <input
            v-model="filters.createdAtTo"
            type="date"
            class="sales-date-input"
            @change="onFilterChange"
          />
        </div>

        <DataTable
          :value="sales"
          :loading="isLoading"
          responsiveLayout="scroll"
          class="sales-table"
        >
          <template #empty>
            <div class="sales-empty">
              <i class="pi pi-shopping-cart"></i>
              <strong>Nenhuma venda encontrada</strong>
              <span>Refine os filtros ou registre uma nova venda.</span>
            </div>
          </template>

          <Column header="Cliente">
            <template #body="{ data }">
              <div class="sale-client">
                <Avatar
                  :label="getInitials(data.clientName)"
                  shape="circle"
                  class="sale-avatar"
                />
                <div>
                  <strong>{{ data.clientName }}</strong>
                  <span>{{ data.description }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Pagamento">
            <template #body="{ data }">
              <Tag :value="formatPaymentMethod(data.paymentMethod)" :severity="paymentMethodSeverity(data.paymentMethod)" rounded />
            </template>
          </Column>

          <Column header="Valor">
            <template #body="{ data }">
              <strong class="sale-amount">{{ currency(data.amount) }}</strong>
              <span class="sale-quantity">{{ data.quantity }} item(ns)</span>
            </template>
          </Column>

          <Column header="Venda em">
            <template #body="{ data }">
              {{ formatDateHour(data.createdAt) }}
            </template>
          </Column>

          <Column header="Ações" bodyClass="sales-actions-cell" headerClass="sales-actions-header">
            <template #body="{ data }">
              <div class="sales-actions">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  text
                  aria-label="Ver detalhes"
                  @click="viewSale(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  rounded
                  text
                  aria-label="Editar venda"
                  @click="editSale(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  aria-label="Excluir venda"
                  @click="confirmDeleteSale(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="sales-pagination">
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
      v-model:visible="showSaleModal"
      modal
      :header="isEditingSale ? 'Editar venda' : 'Adicionar venda'"
      class="sales-dialog"
    >
      <form class="sales-form" @submit.prevent="saveSale">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="sales-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="sales-form-grid">
          <div class="sales-field">
            <label for="sale-product">Produto</label>
            <Select
              id="sale-product"
              v-model="currentSale.productId"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um produto"
              filter
              required
            />
          </div>

          <div v-if="!isEditingSale" class="sales-field">
            <label for="sale-client">Cliente</label>
            <Select
              id="sale-client"
              v-model="currentSale.clientId"
              :options="clientOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um cliente"
              filter
              required
            />
          </div>

          <div class="sales-field">
            <label for="sale-quantity">Quantidade</label>
            <InputNumber
              id="sale-quantity"
              v-model="currentSale.quantity"
              inputClass="sales-input-number"
              :min="1"
              required
            />
          </div>

          <div class="sales-field">
            <label for="sale-date">Data da venda</label>
            <input
              id="sale-date"
              v-model="currentSale.saleDate"
              type="date"
              class="sales-date-input"
            />
          </div>

          <div v-if="!isEditingSale" class="sales-field sales-field-full">
            <label for="sale-payment">Método de pagamento</label>
            <Select
              id="sale-payment"
              v-model="currentSale.paymentMethod"
              :options="paymentMethodOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione um método"
              required
            />
          </div>
        </div>

        <div class="sales-summary">
          <div>
            <small>Produto selecionado</small>
            <strong>{{ selectedProduct ? selectedProduct.name : 'Nenhum produto' }}</strong>
          </div>
          <div>
            <small>Total estimado</small>
            <strong>{{ currency(totalAmountPreview) }}</strong>
          </div>
        </div>

        <div class="sales-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closeSaleModal"
          />
          <Button type="submit" :label="isEditingSale ? 'Atualizar' : 'Salvar'" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Detalhes da venda"
      class="sales-dialog"
    >
      <div class="sale-details">
        <div class="sale-details-header">
          <Avatar
            :label="getInitials(currentSale.clientName)"
            shape="circle"
            class="sale-avatar sale-avatar-large"
          />
          <div>
            <strong>{{ currentSale.clientName }}</strong>
            <span>{{ currentSale.description }}</span>
          </div>
        </div>

        <div class="sale-details-grid">
          <div>
            <small>Pagamento</small>
            <strong>{{ formatPaymentMethod(currentSale.paymentMethod) }}</strong>
          </div>
          <div>
            <small>Valor</small>
            <strong>{{ currency(currentSale.amount) }}</strong>
          </div>
          <div>
            <small>Data da venda</small>
            <strong>{{ formatDateHour(currentSale.createdAt) }}</strong>
          </div>
          <div v-if="currentSale.paymentMethod !== 'TO_RECEIVE'">
            <small>Data do pagamento</small>
            <strong>{{ formatDateHour(currentSale.payedAt) }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteModal"
      modal
      header="Excluir venda"
      class="sales-dialog sales-dialog-compact"
    >
      <p class="sales-delete-copy">
        Tem certeza que deseja excluir a venda de <strong>{{ currentSale.clientName }}</strong>?
      </p>

      <template #footer>
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          text
          @click="showDeleteModal = false"
        />
        <Button
          type="button"
          label="Excluir"
          severity="danger"
          @click="deleteSale"
        />
      </template>
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
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';
import { formatPaymentMethod } from '../utils/paymentMethod';

const emptySale = () => ({
  id: '',
  productId: '',
  clientId: '',
  clientName: '',
  description: '',
  quantity: 1,
  paymentMethod: '',
  amount: 0,
  createdAt: '',
  updatedAt: '',
  payedAt: '',
  saleDate: ''
});

export default {
  name: 'SalesPage',
  components: {
    Avatar,
    Button,
    Card,
    Column,
    DataTable,
    Dialog,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Paginator,
    Select,
    Tag
  },
  data() {
    return {
      sales: [],
      products: [],
      clients: [],
      isLoading: false,
      showSaleModal: false,
      showDeleteModal: false,
      showDetailsModal: false,
      isEditingSale: false,
      currentSale: emptySale(),
      errorMessages: [],
      searchDebounceId: null,
      filters: {
        search: '',
        clientId: null,
        paymentMethod: null,
        createdAtFrom: '',
        createdAtTo: ''
      },
      paymentMethodOptions: [
        { label: 'Dinheiro', value: 'CASH' },
        { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
        { label: 'PIX', value: 'PIX' },
        { label: 'à Receber', value: 'TO_RECEIVE' }
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
    },
    productOptions() {
      return this.products.map((product) => ({
        label: `${product.name} - ${this.currency(product.price)}`,
        value: product.id
      }));
    },
    selectedProduct() {
      return this.products.find((product) => product.id === this.currentSale.productId) || null;
    },
    totalAmountPreview() {
      if (!this.selectedProduct) {
        return 0;
      }

      return Number(this.selectedProduct.price) * Number(this.currentSale.quantity || 0);
    }
  },
  created() {
    this.fetchSales();
    this.fetchProducts();
    this.fetchClients();
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceId);
  },
  methods: {
    formatDateHour,
    formatPaymentMethod,
    currency(value) {
      return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    },
    paymentMethodSeverity(paymentMethod) {
      const severityMap = {
        CASH: 'success',
        PIX: 'info',
        CREDIT_CARD: 'warning',
        TO_RECEIVE: 'danger'
      };

      return severityMap[paymentMethod] || 'secondary';
    },
    getInitials(name) {
      return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'VD';
    },
    toInputDate(dateString) {
      if (!dateString) {
        return '';
      }

      return new Date(dateString).toISOString().slice(0, 10);
    },
    async fetchSales(page = this.pagination.page, perPage = this.pagination.perPage) {
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
        if (this.filters.paymentMethod) {
          params.set('paymentMethod', this.filters.paymentMethod);
        }
        if (this.filters.createdAtFrom) {
          params.set('createdAtFrom', this.filters.createdAtFrom);
        }
        if (this.filters.createdAtTo) {
          params.set('createdAtTo', this.filters.createdAtTo);
        }

        const response = await apiService.get(`/sales?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar vendas'];
          return;
        }

        const data = await response.json();
        this.sales = data.data;
        this.pagination = {
          page: Number(data.meta.page),
          perPage: Number(data.meta.perPage),
          total: Number(data.meta.total)
        };
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar vendas'];
      } finally {
        this.isLoading = false;
      }
    },
    async fetchProducts() {
      try {
        const response = await apiService.get('/products?perPage=300&orderBy=name&orderDir=asc');

        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }

        const parsed = await response.json();
        this.products = parsed.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar produtos');
      }
    },
    async fetchClients() {
      try {
        const response = await apiService.get('/clients?perPage=300&orderBy=name&orderDir=asc');

        if (!response.ok) {
          throw new Error('Erro ao buscar clientes');
        }

        const parsed = await response.json();
        this.clients = parsed.data;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar clientes');
      }
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchSales(1, this.pagination.perPage);
      }, 300);
    },
    onFilterChange() {
      this.pagination.page = 1;
      this.fetchSales(1, this.pagination.perPage);
    },
    onPageChange(event) {
      const page = Math.floor(event.first / event.rows) + 1;
      this.fetchSales(page, event.rows);
    },
    addSale() {
      this.currentSale = emptySale();
      this.isEditingSale = false;
      this.errorMessages = [];
      this.showSaleModal = true;
    },
    viewSale(sale) {
      this.currentSale = { ...sale };
      this.showDetailsModal = true;
    },
    editSale(sale) {
      this.currentSale = {
        ...emptySale(),
        ...sale,
        saleDate: this.toInputDate(sale.createdAt)
      };
      this.isEditingSale = true;
      this.errorMessages = [];
      this.showSaleModal = true;
    },
    confirmDeleteSale(sale) {
      this.currentSale = { ...sale };
      this.showDeleteModal = true;
    },
    async saveSale() {
      try {
        this.errorMessages = [];
        const response = this.isEditingSale
          ? await this.updateSale()
          : await this.createSale();

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao salvar a venda'];
          return;
        }

        await this.fetchSales();
        this.closeSaleModal();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar a venda'];
      }
    },
    async createSale() {
      const payload = {
        productId: this.currentSale.productId,
        clientId: this.currentSale.clientId,
        price: Number(this.selectedProduct?.price || 0),
        quantity: Number(this.currentSale.quantity),
        paymentMethod: this.currentSale.paymentMethod,
        ...(this.currentSale.saleDate ? { saleDate: this.currentSale.saleDate } : {})
      };

      return apiService.post('/sales', payload);
    },
    async updateSale() {
      const payload = {
        productId: this.currentSale.productId,
        quantity: Number(this.currentSale.quantity),
        saleDate: this.currentSale.saleDate
      };

      return apiService.put(`/sales/${this.currentSale.id}`, payload);
    },
    async deleteSale() {
      try {
        const response = await apiService.delete(`/sales/${this.currentSale.id}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao excluir a venda'];
          return;
        }

        this.showDeleteModal = false;

        if (this.sales.length === 1 && this.pagination.page > 1) {
          this.pagination.page -= 1;
        }

        await this.fetchSales();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao excluir a venda'];
      }
    },
    closeSaleModal() {
      this.showSaleModal = false;
      this.isEditingSale = false;
      this.currentSale = emptySale();
      this.errorMessages = [];
    }
  }
};
</script>

<style scoped>
.sales-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sales-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.sales-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.sales-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.sales-card :deep(.p-card-body) {
  padding: 28px;
}

.sales-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.sales-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.sales-toolbar h2 {
  margin: 10px 0 8px;
  font-size: 1.8rem;
}

.sales-toolbar p {
  margin: 0;
  color: var(--app-surface-muted);
}

.sales-add-button {
  background: linear-gradient(135deg, var(--app-primary) 0%, #3b82f6 100%);
  border: none;
  border-radius: 14px;
  padding-inline: 1.2rem;
  box-shadow: 0 16px 30px rgba(29, 78, 216, 0.22);
}

.sales-filters {
  display: grid;
  grid-template-columns: minmax(240px, 1.6fr) repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.sales-search,
.sales-filter-select {
  width: 100%;
}

.sales-search :deep(.p-inputtext),
.sales-date-input {
  width: 100%;
  border-radius: 14px;
}

.sales-date-input {
  min-height: 42px;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--app-surface-border);
  background: #fff;
  color: var(--app-text);
}

.sales-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.sales-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.sales-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.sale-client {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sale-client strong,
.sale-details-header strong {
  display: block;
}

.sale-client span,
.sale-details-header span,
.sale-details-grid small,
.sale-quantity {
  color: var(--app-surface-muted);
}

.sale-client span,
.sale-details-header span,
.sale-quantity {
  display: block;
  margin-top: 4px;
}

.sale-avatar {
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.sale-avatar-large {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.sale-amount {
  color: var(--app-primary-dark);
}

.sales-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sales-actions-cell,
.sales-actions-header {
  width: 140px;
}

.sales-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  color: var(--app-surface-muted);
}

.sales-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sales-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.sales-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sales-field label {
  font-weight: 600;
}

.sales-field-full {
  grid-column: 1 / -1;
}

.sales-field :deep(.p-select),
.sales-field :deep(.p-inputnumber),
.sales-field :deep(.p-inputnumber-input),
.sales-field :deep(.p-inputtext),
.sales-field .sales-date-input {
  border-radius: 14px;
}

.sales-field :deep(.p-select),
.sales-field :deep(.p-inputnumber) {
  overflow: hidden;
}

.sales-field :deep(.p-select:focus-within),
.sales-field :deep(.p-inputnumber:focus-within),
.sales-field .sales-date-input:focus {
  border-radius: 14px;
}

.sales-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 18px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.sales-summary small,
.sale-details-grid small {
  color: var(--app-surface-muted);
}

.sales-summary strong {
  display: block;
  margin-top: 6px;
}

.sales-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.sale-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sale-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sale-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.sale-details-grid strong {
  display: block;
  margin-top: 6px;
}

.sales-delete-copy {
  margin: 0;
  color: var(--app-text);
}

.sales-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

.sales-empty i {
  font-size: 2rem;
  color: var(--app-primary);
}

.sales-dialog :deep(.p-dialog-content) {
  padding-top: 4px;
}

@media (max-width: 992px) {
  .sales-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .sales-toolbar,
  .sales-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .sales-filters,
  .sales-form-grid,
  .sales-summary,
  .sale-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
