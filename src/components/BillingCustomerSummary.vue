<template>
  <section class="billing-summary-page">
    <div v-if="errorMessages.length" class="p-message p-message-error billing-summary-alert">
      <div class="billing-summary-alert-content">
        <i class="pi pi-exclamation-circle"></i>
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>

    <div class="billing-summary-actions">
      <Button
        icon="pi pi-arrow-left"
        label="Voltar para faturas"
        text
        @click="goBack"
      />
      <Button
        icon="pi pi-print"
        label="Imprimir"
        @click="printSummary"
      />
    </div>

    <Card class="billing-summary-card surface-card">
      <template #content>
        <div class="billing-summary-header">
          <div>
            <span class="billing-summary-eyebrow">Resumo da fatura</span>
            <h1>{{ billing.clientName || 'Cliente' }}</h1>
            <p>{{ billing.description || 'Resumo para envio ao cliente' }}</p>
          </div>

          <div class="billing-summary-meta">
            <div>
              <small>Fatura</small>
              <strong>#{{ billing.id ? billing.id.slice(0, 8) : '--' }}</strong>
            </div>
            <div>
              <small>Gerado em</small>
              <strong>{{ formatDate(billing.createdAt) }}</strong>
            </div>
          </div>
        </div>

        <div class="billing-summary-totals">
          <div>
            <small>Total da fatura</small>
            <strong>{{ currency(invoiceTotal) }}</strong>
          </div>
          <div>
            <small>Itens considerados</small>
            <strong>{{ items.length }}</strong>
          </div>
        </div>

        <DataTable
          :value="sortedItems"
          responsiveLayout="scroll"
          class="billing-summary-table"
        >
          <template #empty>
            <div class="billing-summary-empty">
              <i class="pi pi-list"></i>
              <strong>Nenhum item encontrado</strong>
            </div>
          </template>

          <Column field="description" header="Item"></Column>

          <Column header="Data da venda">
            <template #body="{ data }">
              {{ formatDate(data.saleDate || data.createdAt) }}
            </template>
          </Column>

          <Column header="Valor">
            <template #body="{ data }">
              <strong :class="data.type === 'CREDIT' ? 'billing-summary-credit' : 'billing-summary-debit'">
                {{ formatAmount(data.amount, data.type) }}
              </strong>
            </template>
          </Column>
        </DataTable>

        <div class="billing-summary-footer">
          <div>
            <small>Total consolidado</small>
            <strong>{{ currency(invoiceTotal) }}</strong>
          </div>
        </div>
      </template>
    </Card>
  </section>
</template>

<script>
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/formatDate';

export default {
  name: 'BillingCustomerSummary',
  components: {
    Button,
    Card,
    Column,
    DataTable
  },
  data() {
    return {
      billing: {},
      items: [],
      errorMessages: []
    };
  },
  computed: {
    sortedItems() {
      return [...this.items].sort((a, b) => {
        const first = new Date(a.saleDate || a.createdAt).getTime();
        const second = new Date(b.saleDate || b.createdAt).getTime();
        return first - second;
      });
    },
    invoiceTotal() {
      if (this.items.length) {
        return this.items.reduce((total, item) => {
          const amount = Number(item.amount || 0);
          return item.type === 'CREDIT' ? total - Math.abs(amount) : total + amount;
        }, 0);
      }

      return Number(this.billing.amount || 0);
    }
  },
  created() {
    this.fetchSummary();
  },
  methods: {
    async fetchSummary() {
      this.errorMessages = [];

      try {
        const [billingResponse, itemsResponse] = await Promise.all([
          apiService.get(`/billings/${this.$route.params.id}`),
          apiService.get(`/billings/${this.$route.params.id}/items`)
        ]);

        if (!billingResponse.ok) {
          const errorData = await billingResponse.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar resumo da fatura'];
          return;
        }

        if (!itemsResponse.ok) {
          const errorData = await itemsResponse.json();
          this.errorMessages = Array.isArray(errorData.message)
            ? errorData.message
            : [errorData.message || 'Erro ao buscar itens da fatura'];
          return;
        }

        this.billing = await billingResponse.json();
        this.items = await itemsResponse.json();
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao carregar o resumo da fatura'];
      }
    },
    goBack() {
      this.$router.push('/dashboard/billings');
    },
    printSummary() {
      window.print();
    },
    formatDate(dateString) {
      if (!dateString) {
        return '--';
      }

      return formatDate(dateString);
    },
    currency(value) {
      return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
    },
    formatAmount(amount, type) {
      let adjustedAmount = Number(amount || 0);

      if (type === 'CREDIT') {
        adjustedAmount = -Math.abs(adjustedAmount);
      }

      return this.currency(adjustedAmount);
    }
  }
};
</script>

<style scoped>
.billing-summary-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.billing-summary-alert {
  border-radius: 18px;
  padding: 14px 18px;
}

.billing-summary-alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.billing-summary-alert-content ul {
  margin: 0;
  padding-left: 18px;
}

.billing-summary-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.billing-summary-card :deep(.p-card-body) {
  padding: 32px;
}

.billing-summary-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.billing-summary-eyebrow {
  color: var(--app-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  font-weight: 700;
}

.billing-summary-header h1 {
  margin: 10px 0 8px;
  font-size: 2rem;
}

.billing-summary-header p,
.billing-summary-meta small {
  color: var(--app-surface-muted);
  margin: 0;
}

.billing-summary-meta {
  display: grid;
  gap: 14px;
  min-width: 220px;
}

.billing-summary-meta strong,
.billing-summary-totals strong,
.billing-summary-footer strong {
  display: block;
  margin-top: 6px;
}

.billing-summary-totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 18px;
  margin-bottom: 24px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.billing-summary-totals small,
.billing-summary-footer small {
  color: var(--app-surface-muted);
}

.billing-summary-table :deep(.p-datatable-table-container) {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(219, 228, 240, 0.9);
}

.billing-summary-table :deep(th) {
  background: #f8fbff;
  color: #48607f;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 18px 20px;
}

.billing-summary-table :deep(td) {
  padding: 20px;
  vertical-align: middle;
}

.billing-summary-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.billing-summary-footer > div {
  min-width: 240px;
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.08) 0%, rgba(96, 165, 250, 0.16) 100%);
  border: 1px solid rgba(59, 130, 246, 0.16);
}

.billing-summary-credit {
  color: var(--app-danger);
}

.billing-summary-debit {
  color: var(--app-success);
}

.billing-summary-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 38px 20px;
  color: var(--app-surface-muted);
}

@media (max-width: 768px) {
  .billing-summary-actions,
  .billing-summary-header,
  .billing-summary-totals {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .billing-summary-footer {
    justify-content: stretch;
  }

  .billing-summary-footer > div {
    width: 100%;
    min-width: 0;
  }
}

@media print {
  .billing-summary-actions {
    display: none;
  }

  .billing-summary-page {
    gap: 0;
  }

  .billing-summary-card {
    box-shadow: none;
    border: none;
  }
}
</style>
