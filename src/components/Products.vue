<template>
  <section class="products-page">
    <div v-if="errorMessages.length" class="p-message p-message-error products-alert">
      <div class="products-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <Card class="products-card surface-card">
      <template #content>
        <div class="products-toolbar">
          <div>
            <span class="products-eyebrow">Catálogo</span>
            <h2>Gerenciar produtos</h2>
            <p>Organize o cardápio, ajuste preços e acompanhe o catálogo ativo.</p>
          </div>

          <Button
            label="Adicionar Produto"
            icon="pi pi-plus"
            class="products-add-button"
            @click="addProduct"
          />
        </div>

        <div class="products-filters">
          <IconField iconPosition="left" class="products-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchTerm"
              type="text"
              placeholder="Buscar por nome do produto"
              @input="onSearchInput"
            />
          </IconField>
        </div>

        <DataTable
          :value="products"
          :loading="isLoading"
          responsiveLayout="scroll"
          class="products-table"
        >
          <template #empty>
            <div class="products-empty">
              <i class="pi pi-box"></i>
              <strong>Nenhum produto encontrado</strong>
              <span>Ajuste a busca ou adicione um novo item ao catálogo.</span>
            </div>
          </template>

          <Column header="Produto">
            <template #body="{ data }">
              <div class="product-identity">
                <div class="product-badge">{{ getInitials(data.name) }}</div>
                <div>
                  <strong>{{ data.name }}</strong>
                  <span>ID {{ data.id.slice(0, 8) }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Preço">
            <template #body="{ data }">
              <strong class="product-price">{{ currency(data.price) }}</strong>
            </template>
          </Column>

          <Column header="Criado em">
            <template #body="{ data }">
              {{ formatDateHour(data.createdAt) }}
            </template>
          </Column>

          <Column header="Ações" bodyClass="products-actions-cell" headerClass="products-actions-header">
            <template #body="{ data }">
              <div class="products-actions">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  rounded
                  text
                  aria-label="Ver detalhes"
                  @click="viewProduct(data)"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  rounded
                  text
                  aria-label="Editar produto"
                  @click="editProduct(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  text
                  aria-label="Excluir produto"
                  @click="confirmDeleteProduct(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div class="products-pagination">
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
      v-model:visible="showProductModal"
      modal
      :header="isEditing ? 'Editar produto' : 'Adicionar produto'"
      class="products-dialog"
    >
      <form class="products-form" @submit.prevent="saveProduct">
        <div v-if="errorMessages.length" class="p-message p-message-error">
          <div class="products-alert-content">
            <i class="pi pi-exclamation-circle"></i>
            <ul>
              <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="products-form-grid">
          <div class="products-field products-field-full">
            <label for="product-name">Nome</label>
            <InputText id="product-name" v-model="currentProduct.name" required />
          </div>

          <div class="products-field products-field-full">
            <label for="product-price">Preço</label>
            <CurrencyInput
              id="product-price"
              class="form-control"
              v-model="currentProduct.price"
              required
              :options="currencyOptions"
            />
          </div>
        </div>

        <div class="products-form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            @click="closeProductModal"
          />
          <Button type="submit" :label="isEditing ? 'Atualizar' : 'Salvar'" />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showDetailsModal"
      modal
      header="Detalhes do produto"
      class="products-dialog"
    >
      <div class="product-details">
        <div class="product-details-header">
          <div class="product-badge product-badge-large">{{ getInitials(currentProduct.name) }}</div>
          <div>
            <strong>{{ currentProduct.name }}</strong>
            <span>{{ currency(currentProduct.price) }}</span>
          </div>
        </div>

        <div class="product-details-grid">
          <div>
            <small>Criado em</small>
            <strong>{{ formatDateHour(currentProduct.createdAt) }}</strong>
          </div>
          <div>
            <small>Atualizado em</small>
            <strong>{{ formatDateHour(currentProduct.updatedAt) }}</strong>
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteModal"
      modal
      header="Excluir produto"
      class="products-dialog products-dialog-compact"
    >
      <p class="products-delete-copy">
        Tem certeza que deseja excluir <strong>{{ currentProduct.name }}</strong>?
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
          @click="deleteProduct"
        />
      </template>
    </Dialog>
  </section>
</template>

<script>
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import CurrencyInput from './CurrencyInput';
import { apiService } from '../services/apiService';
import { formatDateHour } from '../utils/formatDate';

const emptyProduct = () => ({
  id: null,
  name: '',
  price: 0,
  createdAt: '',
  updatedAt: ''
});

export default {
  name: 'ProductsPage',
  components: {
    Button,
    Card,
    Column,
    CurrencyInput,
    DataTable,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Paginator
  },
  data() {
    return {
      products: [],
      showProductModal: false,
      showDeleteModal: false,
      showDetailsModal: false,
      isEditing: false,
      isLoading: false,
      currentProduct: emptyProduct(),
      errorMessages: [],
      searchTerm: '',
      searchDebounceId: null,
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
    }
  },
  created() {
    this.fetchProducts();
  },
  beforeUnmount() {
    clearTimeout(this.searchDebounceId);
  },
  methods: {
    formatDateHour,
    currency(value) {
      return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    },
    async fetchProducts() {
      this.isLoading = true;
      this.errorMessages = [];

      try {
        const params = new URLSearchParams({
          page: String(this.pagination.page),
          perPage: String(this.pagination.perPage),
          orderBy: 'name',
          orderDir: 'asc'
        });

        if (this.searchTerm.trim()) {
          params.set('search', this.searchTerm.trim());
        }

        const response = await apiService.get(`/products?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar produtos'];
          return;
        }

        const result = await response.json();
        this.products = result.data;
        this.pagination = {
          page: Number(result.meta.page),
          perPage: Number(result.meta.perPage),
          total: Number(result.meta.total)
        };
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar produtos'];
      } finally {
        this.isLoading = false;
      }
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceId);
      this.searchDebounceId = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchProducts();
      }, 300);
    },
    onPageChange(event) {
      this.pagination.page = Math.floor(event.first / event.rows) + 1;
      this.fetchProducts();
    },
    addProduct() {
      this.isEditing = false;
      this.errorMessages = [];
      this.currentProduct = emptyProduct();
      this.showProductModal = true;
    },
    editProduct(product) {
      this.isEditing = true;
      this.errorMessages = [];
      this.currentProduct = { ...product };
      this.showProductModal = true;
    },
    viewProduct(product) {
      this.currentProduct = { ...product };
      this.showDetailsModal = true;
    },
    confirmDeleteProduct(product) {
      this.currentProduct = { ...product };
      this.showDeleteModal = true;
    },
    async saveProduct() {
      this.errorMessages = [];

      try {
        const method = this.isEditing ? 'patch' : 'post';
        const url = this.isEditing ? `/products/${this.currentProduct.id}` : '/products';
        const payload = {
          name: this.currentProduct.name,
          price: Number(this.currentProduct.price)
        };

        const response = await apiService[method](url, payload);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao salvar o produto'];
          return;
        }

        this.closeProductModal();
        await this.fetchProducts();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao salvar o produto'];
      }
    },
    async deleteProduct() {
      try {
        const response = await apiService.delete(`/products/${this.currentProduct.id}`);

        if (!response.ok) {
          throw new Error('Erro ao excluir o produto');
        }

        this.showDeleteModal = false;

        if (this.products.length === 1 && this.pagination.page > 1) {
          this.pagination.page -= 1;
        }

        await this.fetchProducts();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao excluir o produto'];
      }
    },
    closeProductModal() {
      this.showProductModal = false;
      this.currentProduct = emptyProduct();
      this.errorMessages = [];
    },
    getInitials(name) {
      return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    }
  }
};
</script>

<style scoped>
.products-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.products-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.products-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.products-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.products-card :deep(.p-card-body) {
  padding: 28px;
}

.products-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.products-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.products-toolbar h2 {
  margin: 10px 0 8px;
  font-size: 1.8rem;
}

.products-toolbar p {
  margin: 0;
  color: var(--app-surface-muted);
}

.products-add-button {
  background: linear-gradient(135deg, var(--app-primary) 0%, #3b82f6 100%);
  border: none;
  border-radius: 14px;
  padding-inline: 1.2rem;
  box-shadow: 0 16px 30px rgba(29, 78, 216, 0.22);
}

.products-filters {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 18px;
}

.products-search {
  width: min(100%, 360px);
}

.products-search :deep(.p-inputtext) {
  width: 100%;
  border-radius: 14px;
}

.products-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.products-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.products-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.product-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.product-identity strong,
.product-details-header strong {
  display: block;
}

.product-identity span,
.product-details-header span,
.product-details-grid small {
  color: var(--app-surface-muted);
}

.product-identity span,
.product-details-header span {
  display: block;
  margin-top: 4px;
}

.product-badge {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--app-primary-dark);
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.18) 0%, rgba(96, 165, 250, 0.32) 100%);
}

.product-badge-large {
  width: 64px;
  height: 64px;
  font-size: 1.35rem;
}

.product-price {
  color: var(--app-primary-dark);
}

.products-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.products-actions-cell,
.products-actions-header {
  width: 140px;
}

.products-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
  color: var(--app-surface-muted);
}

.products-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.products-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.products-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.products-field label {
  font-weight: 600;
}

.products-field-full {
  grid-column: 1 / -1;
}

.products-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-details-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.product-details-grid strong {
  display: block;
  margin-top: 6px;
}

.products-delete-copy {
  margin: 0;
  color: var(--app-text);
}

.products-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

.products-empty i {
  font-size: 2rem;
  color: var(--app-primary);
}

.products-dialog :deep(.p-dialog-content) {
  padding-top: 4px;
}

@media (max-width: 768px) {
  .products-toolbar,
  .products-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .products-form-grid,
  .product-details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
