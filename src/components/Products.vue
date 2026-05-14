<template>
  <section class="products-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Catalogo
        </p>
        <h1 class="page-title">
          Gerenciar produtos
        </h1>
        <p class="page-subtitle">
          Organize o catalogo com busca, ordenacao e manutencao rapida.
        </p>
      </div>

      <Button
        label="Adicionar produto"
        icon="pi pi-plus"
        @click="openAddProductDialog"
      />
    </header>

    <Message
      v-if="pageErrorMessages.length"
      severity="error"
      class="page-message"
    >
      <ul class="message-list">
        <li
          v-for="(error, index) in pageErrorMessages"
          :key="`product-page-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="products-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Lista principal
            </h2>
            <p class="card-subtitle">
              Use a busca para localizar produtos e atualizar o catalogo.
            </p>
          </div>

          <IconField class="products-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por nome do produto"
            />
          </IconField>
        </div>

        <DataTable
          :value="products"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="products-table"
          @sort="handleSort"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox" />
              <span>Nenhuma informacao para ser exibida.</span>
            </div>
          </template>

          <Column
            field="name"
            header="Produto"
            sortable
          >
            <template #body="{ data }">
              <div class="product-cell">
                <Avatar
                  :label="getInitials(data.name)"
                  shape="circle"
                  class="product-cell__avatar"
                />
                <div>
                  <strong class="product-cell__name">{{ data.name }}</strong>
                  <small class="product-cell__meta">ID {{ data.id }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column
            field="price"
            header="Preco"
            sortable
          >
            <template #body="{ data }">
              {{ currency(data.price) }}
            </template>
          </Column>

          <Column
            field="created_at"
            header="Criado em"
            sortable
            sort-field="created_at"
          >
            <template #body="{ data }">
              {{ formatDateWithHour(data.createdAt) }}
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
                  @click="openViewProductDialog(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  severity="warning"
                  aria-label="Editar"
                  @click="openEditProductDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Excluir"
                  @click="openDeleteProductDialog(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <Paginator
          v-if="totalRecords > 0"
          :rows="pageSize"
          :total-records="totalRecords"
          :first="firstRecordIndex"
          :rows-per-page-options="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          @page="handlePageChange"
        />
      </template>
    </Card>

    <Dialog
      v-model:visible="showProductDialog"
      modal
      :header="isEditing ? 'Editar produto' : 'Adicionar produto'"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '90vw' }"
      @hide="closeProductDialog"
    >
      <Message
        v-if="modalErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in modalErrorMessages"
            :key="`product-modal-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="product-form"
        @submit.prevent="saveProduct"
      >
        <div class="field-block">
          <label
            class="field-label"
            for="product-name"
          >Nome</label>
          <InputText
            id="product-name"
            v-model.trim="currentProduct.name"
            :invalid="Boolean(formErrors.name)"
            placeholder="Nome do produto"
          />
          <small
            v-if="formErrors.name"
            class="field-error"
          >
            {{ formErrors.name }}
          </small>
        </div>

        <div class="field-block">
          <label
            class="field-label"
            for="product-price"
          >Preco</label>
          <InputNumber
            id="product-price"
            v-model="currentProduct.price"
            mode="currency"
            currency="BRL"
            currency-display="symbol"
            locale="pt-BR"
            :use-grouping="true"
            :min="0"
            :min-fraction-digits="2"
            :max-fraction-digits="2"
            :invalid="Boolean(formErrors.price)"
            class="price-input"
          />
          <small
            v-if="formErrors.price"
            class="field-error"
          >
            {{ formErrors.price }}
          </small>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeProductDialog"
          />
          <Button
            :label="isEditing ? 'Atualizar' : 'Salvar'"
            type="submit"
            :loading="saving"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsDialog"
      modal
      header="Detalhes do produto"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <div class="details-grid">
        <div class="details-item">
          <span class="details-item__label">ID</span>
          <strong>{{ currentProduct.id || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Nome</span>
          <strong>{{ currentProduct.name || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Preco</span>
          <strong>{{ currency(currentProduct.price) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Criado em</span>
          <strong>{{ formatDateWithHour(currentProduct.createdAt) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Ultima atualizacao</span>
          <strong>{{ formatDateWithHour(currentProduct.updatedAt) }}</strong>
        </div>
      </div>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="showDetailsDialog = false"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Confirmar exclusao"
      :style="{ width: '28rem' }"
      :breakpoints="{ '960px': '90vw' }"
    >
      <p class="delete-text">
        Tem certeza que deseja excluir o produto <strong>{{ currentProduct.name }}</strong>? Esta acao nao pode ser desfeita.
      </p>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          variant="text"
          @click="showDeleteDialog = false"
        />
        <Button
          label="Excluir"
          severity="danger"
          :loading="deleting"
          @click="executeDeleteProduct"
        />
      </template>
    </Dialog>
  </section>
</template>

<script>
export default {
  name: 'ProductsPage',
};
</script>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const products = ref([]);
const showProductDialog = ref(false);
const showDetailsDialog = ref(false);
const showDeleteDialog = ref(false);
const isEditing = ref(false);
const pageErrorMessages = ref([]);
const modalErrorMessages = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);
const searchQuery = ref('');
const sortField = ref('name');
const sortOrder = ref(1);

const getEmptyProduct = () => ({
  id: null,
  name: '',
  price: null,
  createdAt: null,
  updatedAt: null,
});

const currentProduct = reactive(getEmptyProduct());
const formErrors = reactive({
  name: '',
  price: '',
});

const firstRecordIndex = computed(() => (currentPage.value - 1) * pageSize.value);

const normalizeMessages = (error, fallbackMessage) => {
  if (Array.isArray(error)) {
    return error;
  }

  if (error?.message) {
    return Array.isArray(error.message) ? error.message : [error.message];
  }

  return [fallbackMessage];
};

const resetFormErrors = () => {
  formErrors.name = '';
  formErrors.price = '';
};

const resetCurrentProduct = () => {
  Object.assign(currentProduct, getEmptyProduct());
};

const getOrderDir = () => (sortOrder.value === -1 ? 'desc' : 'asc');

const getInitials = (value) => (
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PR'
);

const currency = (value) => {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 'R$ 0,00';
  }

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDateWithHour = (dateString) => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    return formatDateHour(dateString);
  } catch (error) {
    return 'Data invalida';
  }
};

const validateForm = () => {
  resetFormErrors();

  if (!currentProduct.name) {
    formErrors.name = 'Nome e obrigatorio.';
  }

  const priceValue = Number(currentProduct.price);
  if (currentProduct.price === null || currentProduct.price === undefined || currentProduct.price === '') {
    formErrors.price = 'Preco e obrigatorio.';
  } else if (Number.isNaN(priceValue) || priceValue <= 0) {
    formErrors.price = 'O valor deve ser maior que zero.';
  }

  return !formErrors.name && !formErrors.price;
};

const fetchProducts = async () => {
  loading.value = true;
  pageErrorMessages.value = [];

  try {
    const params = new URLSearchParams({
      page: String(currentPage.value),
      perPage: String(pageSize.value),
      orderBy: sortField.value,
      orderDir: getOrderDir(),
    });

    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const response = await apiService.get(`/products?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw data.message || `Erro ${response.status}: Nao foi possivel buscar os produtos.`;
    }

    products.value = data.data || [];
    currentPage.value = Number(data.meta?.page || 1);
    totalRecords.value = Number(data.meta?.total || 0);
    pageSize.value = Number(data.meta?.perPage || pageSize.value);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    pageErrorMessages.value = normalizeMessages(
      error,
      'Ocorreu um erro inesperado ao buscar os produtos.',
    );
  } finally {
    loading.value = false;
  }
};

let debounceTimer = null;
watch(searchQuery, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchProducts();
  }, 400);
});

const handlePageChange = (event) => {
  currentPage.value = event.page + 1;
  pageSize.value = event.rows;
  fetchProducts();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'name';
  sortOrder.value = event.sortOrder || 1;
  currentPage.value = 1;
  fetchProducts();
};

const openAddProductDialog = () => {
  isEditing.value = false;
  resetCurrentProduct();
  resetFormErrors();
  modalErrorMessages.value = [];
  showProductDialog.value = true;
};

const openEditProductDialog = (product) => {
  isEditing.value = true;
  Object.assign(currentProduct, {
    ...product,
    price: Number(product.price) || 0,
  });
  resetFormErrors();
  modalErrorMessages.value = [];
  showProductDialog.value = true;
};

const closeProductDialog = () => {
  showProductDialog.value = false;
  modalErrorMessages.value = [];
};

const saveProduct = async () => {
  modalErrorMessages.value = [];

  if (!validateForm()) {
    return;
  }

  saving.value = true;

  try {
    const method = isEditing.value ? 'patch' : 'post';
    const endpoint = isEditing.value
      ? `/products/${currentProduct.id}`
      : '/products';
    const payload = {
      name: currentProduct.name,
      price: Number(currentProduct.price),
    };

    const response = await apiService[method](endpoint, payload);
    const data = await response.json();

    if (!response.ok) {
      throw data.message || 'Erro ao salvar o produto.';
    }

    closeProductDialog();
    await fetchProducts();
  } catch (error) {
    console.error('Save Product Error:', error);
    modalErrorMessages.value = normalizeMessages(
      error,
      'Ocorreu um erro inesperado ao salvar o produto.',
    );
  } finally {
    saving.value = false;
  }
};

const openDeleteProductDialog = (product) => {
  Object.assign(currentProduct, product);
  pageErrorMessages.value = [];
  showDeleteDialog.value = true;
};

const executeDeleteProduct = async () => {
  deleting.value = true;
  pageErrorMessages.value = [];

  try {
    const response = await apiService.delete(`/products/${currentProduct.id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData.message || `Erro ${response.status} ao excluir o produto.`;
    }

    showDeleteDialog.value = false;

    if (products.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1;
    }

    await fetchProducts();
  } catch (error) {
    console.error('Delete Product Error:', error);
    pageErrorMessages.value = normalizeMessages(
      error,
      'Ocorreu um erro inesperado ao excluir o produto.',
    );
    showDeleteDialog.value = false;
  } finally {
    deleting.value = false;
  }
};

const openViewProductDialog = (product) => {
  Object.assign(currentProduct, product);
  showDetailsDialog.value = true;
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.products-page {
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

.products-card {
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

.products-search {
  width: min(100%, 360px);
}

.products-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-cell__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.product-cell__name {
  display: block;
}

.product-cell__meta {
  color: var(--app-text-muted);
}

.actions-column {
  width: 140px;
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

.product-form,
.details-grid {
  display: grid;
  gap: 18px;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
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

.price-input :deep(.p-inputnumber) {
  width: 100%;
}

.price-input :deep(.p-inputtext) {
  width: 100%;
  text-align: left;
}

@media (max-width: 959px) {
  .page-header,
  .card-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .products-search {
    width: 100%;
  }
}
</style>
