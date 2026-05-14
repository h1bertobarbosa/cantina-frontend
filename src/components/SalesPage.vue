<template>
  <section class="sales-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Movimento
        </p>
        <h1 class="page-title">
          Gerenciar vendas
        </h1>
        <p class="page-subtitle">
          Consulte as transacoes registradas e cadastre novas vendas com rapidez.
        </p>
      </div>

      <Button
        label="Adicionar venda"
        icon="pi pi-plus"
        @click="openAddSaleDialog"
      />
    </header>

    <Message
      v-if="errorMessages.length"
      severity="error"
      class="page-message"
    >
      <ul class="message-list">
        <li
          v-for="(error, index) in errorMessages"
          :key="`sales-page-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="sales-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Lista principal
            </h2>
            <p class="card-subtitle">
              Filtre por cliente, data e texto para localizar transacoes.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <IconField class="sales-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por cliente ou descricao"
            />
          </IconField>

          <div class="field-block">
            <label
              class="field-label"
              for="sales-client-filter"
            >Cliente</label>
            <Select
              id="sales-client-filter"
              v-model="filters.clientId"
              :options="clients"
              option-label="name"
              option-value="id"
              placeholder="Todos os clientes"
              show-clear
              filter
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="sales-date-filter"
            >Data da compra</label>
            <InputText
              id="sales-date-filter"
              v-model="filters.purchasedAt"
              type="date"
            />
          </div>
        </div>

        <DataTable
          :value="sales"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="sales-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhuma informacao para ser exibida.</span>
            </div>
          </template>

          <Column
            field="client_name"
            header="Cliente"
            sortable
            sort-field="client_name"
          >
            <template #body="{ data }">
              <div class="sale-client">
                <Avatar
                  :label="getInitials(data.clientName)"
                  shape="circle"
                  class="sale-client__avatar"
                />
                <div>
                  <strong class="sale-client__name">{{ data.clientName }}</strong>
                  <small class="sale-client__meta">ID {{ data.id }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="description"
            header="Descricao"
            sortable
          />

          <Column
            field="payment_method"
            header="Pagamento"
            sortable
            sort-field="payment_method"
          >
            <template #body="{ data }">
              <Tag
                :value="getPaymentMethodText(data.paymentMethod)"
                :severity="getPaymentMethodSeverity(data.paymentMethod)"
              />
            </template>
          </Column>

          <Column
            field="amount"
            header="Valor"
            sortable
          >
            <template #body="{ data }">
              {{ currency(data.amount) }}
            </template>
          </Column>

          <Column
            field="purchased_at"
            header="Data da compra"
            sortable
            sort-field="purchased_at"
          >
            <template #body="{ data }">
              {{ formatDateLabel(data.purchasedAt || data.createdAt) }}
            </template>
          </Column>

          <Column
            field="created_at"
            header="Criado em"
            sortable
            sort-field="created_at"
          >
            <template #body="{ data }">
              {{ formatDateLabel(data.createdAt) }}
            </template>
          </Column>

          <Column
            header="Acoes"
            class="actions-column"
          >
            <template #body="{ data }">
              <div class="actions-row">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  severity="info"
                  aria-label="Detalhes"
                  @click="openViewSaleDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Excluir"
                  @click="openDeleteConfirmDialog(data.id)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <Paginator
          v-if="pagination.total > 0"
          :rows="pagination.perPage"
          :total-records="pagination.total"
          :first="firstRecordIndex"
          :rows-per-page-options="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          @page="handlePageChange"
        />
      </template>
    </Card>

    <Dialog
      v-model:visible="showSaleDialog"
      modal
      header="Adicionar venda"
      :style="{ width: '60rem' }"
      :breakpoints="{ '960px': '95vw' }"
      @hide="closeSaleDialog"
    >
      <Message
        v-if="modalErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in modalErrorMessages"
            :key="`sales-modal-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="sale-form"
        @submit.prevent="saveSale"
      >
        <div class="form-grid form-grid--two">
          <div class="field-block">
            <label
              class="field-label"
              for="sale-client"
            >Cliente</label>
            <Select
              id="sale-client"
              v-model="currentSale.clientId"
              :options="clients"
              option-label="name"
              option-value="id"
              placeholder="Selecione um cliente"
              filter
              show-clear
              :invalid="Boolean(formErrors.clientId)"
            />
            <small
              v-if="formErrors.clientId"
              class="field-error"
            >
              {{ formErrors.clientId }}
            </small>
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="sale-payment-method"
            >Metodo de pagamento</label>
            <Select
              id="sale-payment-method"
              v-model="currentSale.paymentMethod"
              :options="paymentMethods"
              option-label="text"
              option-value="value"
              placeholder="Selecione um metodo"
              :invalid="Boolean(formErrors.paymentMethod)"
            />
            <small
              v-if="formErrors.paymentMethod"
              class="field-error"
            >
              {{ formErrors.paymentMethod }}
            </small>
          </div>
        </div>

        <div class="form-grid form-grid--one">
          <div class="field-block">
            <label
              class="field-label"
              for="sale-buy-date"
            >Data da compra</label>
            <InputText
              id="sale-buy-date"
              v-model="currentSale.buyDate"
              type="date"
              :invalid="Boolean(formErrors.buyDate)"
            />
            <small
              v-if="formErrors.buyDate"
              class="field-error"
            >
              {{ formErrors.buyDate }}
            </small>
          </div>
        </div>

        <Divider />

        <div class="items-section">
          <div class="items-section__header">
            <div>
              <h3 class="items-section__title">
                Itens da venda
              </h3>
              <p class="items-section__subtitle">
                Adicione produtos e quantidades para montar a venda.
              </p>
            </div>
          </div>

          <div class="form-grid form-grid--items">
            <div class="field-block">
              <label
                class="field-label"
                for="sale-product"
              >Produto</label>
              <Select
                id="sale-product"
                v-model="newItem.productId"
                :options="products"
                option-label="display"
                option-value="id"
                placeholder="Selecione um produto"
                filter
                show-clear
              />
            </div>

            <div class="field-block">
              <label
                class="field-label"
                for="sale-quantity"
              >Quantidade</label>
              <InputNumber
                id="sale-quantity"
                v-model="newItem.quantity"
                :min="1"
                :min-fraction-digits="0"
                :max-fraction-digits="0"
                show-buttons
                button-layout="horizontal"
                increment-button-icon="pi pi-plus"
                decrement-button-icon="pi pi-minus"
                fluid
              />
            </div>

            <div class="items-section__add-button">
              <Button
                label="Adicionar item"
                severity="secondary"
                :disabled="!newItem.productId || newItem.quantity <= 0"
                @click="addItemToSale"
              />
            </div>
          </div>

          <DataTable
            :value="currentSale.items"
            data-key="productId"
            class="sale-items-table"
          >
            <template #empty>
              <div class="empty-state empty-state--small">
                <i class="pi pi-list" />
                <span>Nenhum item adicionado a venda.</span>
              </div>
            </template>

            <Column
              field="productName"
              header="Produto"
            />

            <Column
              field="quantity"
              header="Qtd."
            />

            <Column
              field="price"
              header="Preco unitario"
            >
              <template #body="{ data }">
                {{ currency(data.price) }}
              </template>
            </Column>

            <Column
              header="Subtotal"
            >
              <template #body="{ data }">
                {{ currency(Number(data.price) * Number(data.quantity)) }}
              </template>
            </Column>

            <Column
              header="Acoes"
              class="actions-column actions-column--small"
            >
              <template #body="{ index }">
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Remover item"
                  @click="removeItemFromSale(index)"
                />
              </template>
            </Column>
          </DataTable>

          <div class="sale-total">
            <span>Total da venda</span>
            <strong>{{ currency(saleTotalAmount) }}</strong>
          </div>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeSaleDialog"
          />
          <Button
            label="Salvar venda"
            type="submit"
            :loading="saving"
            :disabled="!currentSale.items.length"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsDialog"
      modal
      header="Detalhes da transacao"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '90vw' }"
      @hide="closeDetailsDialog"
    >
      <div class="details-grid">
        <div class="details-item">
          <span class="details-item__label">ID</span>
          <strong>{{ saleToView.id || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Cliente</span>
          <strong>{{ saleToView.clientName || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Descricao</span>
          <strong>{{ saleToView.description || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Metodo de pagamento</span>
          <Tag
            :value="getPaymentMethodText(saleToView.paymentMethod)"
            :severity="getPaymentMethodSeverity(saleToView.paymentMethod)"
          />
        </div>
        <div class="details-item">
          <span class="details-item__label">Valor</span>
          <strong>{{ currency(saleToView.amount) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Data da compra</span>
          <strong>{{ formatDateLabel(saleToView.purchasedAt || saleToView.createdAt) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Criado em</span>
          <strong>{{ formatDateLabel(saleToView.createdAt) }}</strong>
        </div>
        <div
          v-if="saleToView.payedAt"
          class="details-item"
        >
          <span class="details-item__label">Pago em</span>
          <strong>{{ formatDateLabel(saleToView.payedAt) }}</strong>
        </div>
      </div>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="closeDetailsDialog"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteConfirmDialog"
      modal
      header="Confirmar exclusao"
      :style="{ width: '28rem' }"
      :breakpoints="{ '960px': '90vw' }"
      @hide="closeDeleteConfirmDialog"
    >
      <p class="delete-text">
        Tem certeza que deseja excluir esta venda? Esta acao nao pode ser desfeita.
      </p>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="closeDeleteConfirmDialog"
        />
        <Button
          label="Excluir"
          severity="danger"
          :loading="deleting"
          @click="executeDelete"
        />
      </template>
    </Dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/formatDate';

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const sales = ref([]);
const products = ref([]);
const clients = ref([]);
const showSaleDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteConfirmDialog = ref(false);
const saleToDeleteId = ref(null);
const saleToView = ref({});
const errorMessages = ref([]);
const modalErrorMessages = ref([]);
const searchQuery = ref('');
const sortField = ref('created_at');
const sortOrder = ref(-1);

const pagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
});

const filters = reactive({
  clientId: null,
  purchasedAt: '',
});

const paymentMethods = [
  { text: 'Dinheiro', value: 'CASH' },
  { text: 'Cartao de credito', value: 'CREDIT_CARD' },
  { text: 'PIX', value: 'PIX' },
  { text: 'A receber', value: 'TO_RECEIVE' },
];

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialSaleData = () => ({
  items: [],
  clientId: null,
  paymentMethod: null,
  buyDate: getTodayString(),
});

const getInitialNewItemData = () => ({
  productId: null,
  quantity: 1,
});

const currentSale = reactive(getInitialSaleData());
const newItem = reactive(getInitialNewItemData());
const formErrors = reactive({
  clientId: '',
  paymentMethod: '',
  buyDate: '',
});

const firstRecordIndex = computed(() => (pagination.page - 1) * pagination.perPage);

const saleTotalAmount = computed(() => currentSale.items.reduce(
  (sum, item) => sum + (Number(item.price) * Number(item.quantity)),
  0,
));

const normalizeMessages = (errorData, fallbackMessage = 'Ocorreu um erro.') => {
  if (!errorData) {
    return [fallbackMessage];
  }

  if (errorData.message) {
    return Array.isArray(errorData.message) ? errorData.message : [errorData.message];
  }

  if (typeof errorData === 'string') {
    return [errorData];
  }

  return [fallbackMessage];
};

const resetFormErrors = () => {
  formErrors.clientId = '';
  formErrors.paymentMethod = '';
  formErrors.buyDate = '';
};

const resetCurrentSale = () => {
  Object.assign(currentSale, getInitialSaleData());
  Object.assign(newItem, getInitialNewItemData());
};

const getInitials = (value) => (
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VD'
);

const currency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'R$ 0,00';
  }

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDateLabel = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    return formatDate(dateString);
  } catch (error) {
    return 'Data invalida';
  }
};

const getPaymentMethodText = (methodValue) => {
  const method = paymentMethods.find((item) => item.value === methodValue);
  return method ? method.text : methodValue;
};

const getPaymentMethodSeverity = (methodValue) => {
  switch (methodValue) {
    case 'CASH':
      return 'success';
    case 'PIX':
      return 'info';
    case 'CREDIT_CARD':
      return 'contrast';
    case 'TO_RECEIVE':
      return 'warn';
    default:
      return 'secondary';
  }
};

const getOrderDir = () => (sortOrder.value === 1 ? 'asc' : 'desc');

const buildSalesQuery = () => {
  const params = new URLSearchParams({
    page: String(pagination.page),
    perPage: String(pagination.perPage),
    orderBy: sortField.value,
    orderDir: getOrderDir(),
  });

  if (searchQuery.value) {
    params.append('search', searchQuery.value);
  }

  if (filters.clientId) {
    params.append('clientId', filters.clientId);
  }

  if (filters.purchasedAt) {
    params.append('purchasedAt', filters.purchasedAt);
  }

  return params.toString();
};

const fetchSales = async () => {
  loading.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.get(`/sales?${buildSalesQuery()}`);
    const data = await response.json();

    if (!response.ok) {
      sales.value = [];
      pagination.total = 0;
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar vendas.');
      throw new Error(errorMessages.value[0]);
    }

    sales.value = data.data || [];
    pagination.page = Number(data.meta?.page || pagination.page);
    pagination.perPage = Number(data.meta?.perPage || pagination.perPage);
    pagination.total = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Fetch Sales Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao buscar as vendas.'];
    }
  } finally {
    loading.value = false;
  }
};

const fetchProducts = async () => {
  try {
    const response = await apiService.get('/products?perPage=500&orderBy=name&orderDir=asc');

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }

    const payload = await response.json();
    products.value = (payload.data || []).map((product) => ({
      ...product,
      display: `${product.name} - ${currency(product.price)}`,
    }));
  } catch (error) {
    console.error('Fetch Products Error:', error);
    errorMessages.value.push('Erro ao carregar lista de produtos.');
  }
};

const fetchClients = async () => {
  try {
    const response = await apiService.get('/clients?perPage=500&sortBy=name&orderDir=asc');

    if (!response.ok) {
      throw new Error('Erro ao buscar clientes');
    }

    const payload = await response.json();
    clients.value = payload.data || [];
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    errorMessages.value.push('Erro ao carregar lista de clientes.');
  }
};

const validateSaleForm = () => {
  resetFormErrors();

  if (!currentSale.clientId) {
    formErrors.clientId = 'Cliente e obrigatorio.';
  }

  if (!currentSale.paymentMethod) {
    formErrors.paymentMethod = 'Metodo de pagamento e obrigatorio.';
  }

  if (!currentSale.buyDate) {
    formErrors.buyDate = 'Data da compra e obrigatoria.';
  }

  return !formErrors.clientId && !formErrors.paymentMethod && !formErrors.buyDate;
};

const openAddSaleDialog = () => {
  resetCurrentSale();
  resetFormErrors();
  modalErrorMessages.value = [];
  showSaleDialog.value = true;
};

const addItemToSale = () => {
  modalErrorMessages.value = [];

  if (!newItem.productId) {
    modalErrorMessages.value.push('Selecione um produto.');
    return;
  }

  if (!newItem.quantity || Number(newItem.quantity) <= 0) {
    modalErrorMessages.value.push('A quantidade deve ser maior que zero.');
    return;
  }

  const product = products.value.find((item) => item.id === newItem.productId);

  if (!product) {
    modalErrorMessages.value.push('Produto nao encontrado.');
    return;
  }

  currentSale.items.push({
    productId: product.id,
    price: product.price,
    quantity: Number(newItem.quantity),
    productName: product.name,
  });

  Object.assign(newItem, getInitialNewItemData());
};

const removeItemFromSale = (index) => {
  currentSale.items.splice(index, 1);
};

const saveSale = async () => {
  modalErrorMessages.value = [];

  if (!validateSaleForm()) {
    modalErrorMessages.value.push('Por favor, corrija os erros do formulario.');
    return;
  }

  if (!currentSale.items.length) {
    modalErrorMessages.value.push('Adicione pelo menos um item a venda.');
    return;
  }

  saving.value = true;

  try {
    const payload = {
      items: currentSale.items.map((item) => ({
        productId: item.productId,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      clientId: currentSale.clientId,
      paymentMethod: currentSale.paymentMethod,
      buyDate: currentSale.buyDate,
    };

    const response = await apiService.post('/sales', payload);
    const responseData = await response.json();

    if (!response.ok) {
      modalErrorMessages.value = normalizeMessages(responseData, 'Erro ao salvar a venda.');
      throw new Error(modalErrorMessages.value[0]);
    }

    closeSaleDialog();
    await fetchSales();
  } catch (error) {
    console.error('Save Sale Error:', error);
    if (!modalErrorMessages.value.length) {
      modalErrorMessages.value = ['Ocorreu um erro inesperado ao salvar a venda.'];
    }
  } finally {
    saving.value = false;
  }
};

const openViewSaleDialog = (sale) => {
  saleToView.value = { ...sale };
  showDetailsDialog.value = true;
};

const openDeleteConfirmDialog = (id) => {
  saleToDeleteId.value = id;
  showDeleteConfirmDialog.value = true;
};

const executeDelete = async () => {
  if (!saleToDeleteId.value) {
    return;
  }

  deleting.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.delete(`/sales/${saleToDeleteId.value}`);
    let errorData = null;

    if (response.headers.get('content-type')?.includes('application/json')) {
      errorData = await response.json();
    }

    if (!response.ok) {
      errorMessages.value = normalizeMessages(errorData, 'Erro ao excluir a venda.');
      throw new Error(errorMessages.value[0]);
    }

    closeDeleteConfirmDialog();

    if (sales.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }

    await fetchSales();
  } catch (error) {
    console.error('Delete Sale Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao excluir a venda.'];
    }
  } finally {
    deleting.value = false;
  }
};

const closeSaleDialog = () => {
  showSaleDialog.value = false;
  resetCurrentSale();
  modalErrorMessages.value = [];
  resetFormErrors();
};

const closeDetailsDialog = () => {
  showDetailsDialog.value = false;
  saleToView.value = {};
};

const closeDeleteConfirmDialog = () => {
  showDeleteConfirmDialog.value = false;
  saleToDeleteId.value = null;
};

const handlePageChange = (event) => {
  pagination.page = event.page + 1;
  pagination.perPage = event.rows;
  fetchSales();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'created_at';
  sortOrder.value = event.sortOrder || -1;
  pagination.page = 1;
  fetchSales();
};

let searchDebounce = null;
watch(searchQuery, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.page = 1;
    fetchSales();
  }, 400);
});

watch(
  () => [filters.clientId, filters.purchasedAt],
  () => {
    pagination.page = 1;
    fetchSales();
  },
);

onMounted(() => {
  fetchSales();
  fetchProducts();
  fetchClients();
});
</script>

<style scoped>
.sales-page {
  display: grid;
  gap: 22px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: var(--app-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  margin: 0;
  color: var(--app-text);
  font-size: 2rem;
}

.page-subtitle {
  margin: 10px 0 0;
  color: var(--app-text-muted);
}

.page-message,
.dialog-message {
  margin: 0;
}

.message-list {
  margin: 0;
  padding-left: 18px;
}

.sales-card {
  border: 1px solid var(--app-border);
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.card-title {
  margin: 0;
  color: var(--app-text);
  font-size: 1.1rem;
}

.card-subtitle {
  margin: 8px 0 0;
  color: var(--app-text-muted);
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.sales-search {
  width: 100%;
  align-self: end;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  color: var(--app-text);
  font-size: 0.92rem;
  font-weight: 600;
}

.field-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.sales-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.sale-client {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sale-client__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.sale-client__name {
  display: block;
}

.sale-client__meta {
  color: var(--app-text-muted);
}

.actions-column {
  width: 120px;
}

.actions-column--small {
  width: 90px;
}

.actions-row {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  color: var(--app-text-muted);
}

.empty-state--small {
  padding: 18px 12px;
}

.sale-form,
.details-grid,
.items-section {
  display: grid;
  gap: 18px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid--one {
  grid-template-columns: 1fr;
}

.form-grid--items {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  align-items: end;
}

.items-section__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.items-section__title {
  margin: 0;
  color: var(--app-text);
  font-size: 1.05rem;
}

.items-section__subtitle {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.items-section__add-button {
  display: flex;
  align-items: flex-end;
}

.sale-items-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 20px;
}

.sale-total {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  align-items: center;
  color: var(--app-text);
  font-size: 1.05rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.details-item {
  display: grid;
  gap: 6px;
}

.details-item__label {
  color: var(--app-text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.delete-text {
  margin: 0;
  color: var(--app-text);
  line-height: 1.6;
}

@media (max-width: 959px) {
  .page-header,
  .card-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-grid,
  .form-grid--two,
  .form-grid--items {
    grid-template-columns: 1fr;
  }

  .items-section__add-button :deep(.p-button) {
    width: 100%;
  }
}
</style>
