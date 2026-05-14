<template>
  <section class="dashboard-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Indicadores
        </p>
        <h1 class="page-title">
          Resumo financeiro e operacional
        </h1>
        <p class="page-subtitle">
          Filtre o periodo e acompanhe os totais principais da operacao sem perder os cards atuais.
        </p>
      </div>

      <Button
        label="Atualizar dados"
        icon="pi pi-sync"
        :loading="loading"
        @click="updateData"
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
          :key="`dashboard-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="filters-card">
      <template #content>
        <div class="filters-card__header">
          <div>
            <h2 class="filters-card__title">
              Filtro por periodo
            </h2>
            <p class="filters-card__subtitle">
              Atualize os cards com base no intervalo desejado.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="dashboard-start-date"
            >Data inicial</label>
            <InputText
              id="dashboard-start-date"
              v-model="startDate"
              type="date"
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="dashboard-end-date"
            >Data final</label>
            <InputText
              id="dashboard-end-date"
              v-model="endDate"
              type="date"
            />
          </div>

          <div class="filters-actions">
            <Button
              label="Buscar"
              icon="pi pi-search"
              :loading="loading"
              @click="updateData"
            />
          </div>
        </div>
      </template>
    </Card>

    <div class="metrics-grid">
      <Card
        v-for="metric in metrics"
        :key="metric.title"
        class="metric-card"
      >
        <template #content>
          <div class="metric-card__content">
            <div
              class="metric-card__icon"
              :class="metric.accentClass"
            >
              <i
                class="pi"
                :class="metric.icon"
              />
            </div>

            <div>
              <span class="metric-card__label">{{ metric.title }}</span>
              <strong class="metric-card__value">{{ formatMetricValue(metric) }}</strong>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { format } from 'date-fns';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import { apiService } from '../services/apiService';

const startDate = ref('');
const endDate = ref('');
const summary = ref({
  totalReceivablePeriod: 0,
  totalReceivedPeriod: 0,
  totalReceivableAllTime: 0,
  grossSalesPeriod: 0,
  salesCountPeriod: 0,
  clientsCount: 0,
  productsCount: 0,
});
const errorMessages = ref([]);
const loading = ref(false);

const metrics = computed(() => [
  {
    title: 'Total a receber no periodo',
    value: summary.value.totalReceivablePeriod,
    type: 'currency',
    icon: 'pi-wallet',
    accentClass: 'metric-card__icon--warning',
  },
  {
    title: 'Total recebido no periodo',
    value: summary.value.totalReceivedPeriod,
    type: 'currency',
    icon: 'pi-check-circle',
    accentClass: 'metric-card__icon--success',
  },
  {
    title: 'Total a receber geral',
    value: summary.value.totalReceivableAllTime,
    type: 'currency',
    icon: 'pi-exclamation-circle',
    accentClass: 'metric-card__icon--danger',
  },
  {
    title: 'Faturamento no periodo',
    value: summary.value.grossSalesPeriod,
    type: 'currency',
    icon: 'pi-chart-line',
    accentClass: 'metric-card__icon--primary',
  },
  {
    title: 'Vendas no periodo',
    value: summary.value.salesCountPeriod,
    type: 'count',
    icon: 'pi-shopping-cart',
    accentClass: 'metric-card__icon--contrast',
  },
  {
    title: 'Clientes cadastrados',
    value: summary.value.clientsCount,
    type: 'count',
    icon: 'pi-users',
    accentClass: 'metric-card__icon--info',
  },
  {
    title: 'Produtos cadastrados',
    value: summary.value.productsCount,
    type: 'count',
    icon: 'pi-box',
    accentClass: 'metric-card__icon--success-soft',
  },
]);

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

const count = (value) => Number(value || 0).toLocaleString('pt-BR');

const formatMetricValue = (metric) => (
  metric.type === 'count' ? count(metric.value) : currency(metric.value)
);

const buildDateParams = () => {
  const params = new URLSearchParams();

  if (startDate.value) {
    params.set('startDate', format(new Date(startDate.value), 'yyyy-MM-dd'));
  }

  if (endDate.value) {
    params.set('endDate', format(new Date(endDate.value), 'yyyy-MM-dd'));
  }

  return params.toString();
};

const getEmptySummary = () => ({
  totalReceivablePeriod: 0,
  totalReceivedPeriod: 0,
  totalReceivableAllTime: 0,
  grossSalesPeriod: 0,
  salesCountPeriod: 0,
  clientsCount: 0,
  productsCount: 0,
});

async function fetchSummary() {
  try {
    let url = '/dashboard/summary';
    const dateParams = buildDateParams();

    if (dateParams) {
      url += `?${dateParams}`;
    }

    const response = await apiService.get(url);

    if (!response) {
      throw new Error('Resumo do dashboard: resposta invalida da API.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao buscar resumo do dashboard.');
    }

    summary.value = {
      ...getEmptySummary(),
      ...data,
    };
  } catch (error) {
    console.error(error);
    const message = error?.message || 'Erro ao buscar resumo do dashboard.';

    if (!errorMessages.value.includes(message)) {
      errorMessages.value.push(message);
    }

    summary.value = getEmptySummary();
  }
}

const updateData = async () => {
  errorMessages.value = [];
  loading.value = true;

  if (startDate.value && endDate.value && new Date(startDate.value) > new Date(endDate.value)) {
    errorMessages.value.push('A data inicial nao pode ser posterior a data final.');
    loading.value = false;
    return;
  }

  try {
    await fetchSummary();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  updateData();
});
</script>

<style scoped>
.dashboard-page {
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

.page-message {
  margin: 0;
}

.message-list {
  margin: 0;
  padding-left: 18px;
}

.filters-card {
  border: 1px solid var(--app-border);
}

.filters-card__header {
  margin-bottom: 22px;
}

.filters-card__title {
  margin: 0;
  color: var(--app-text);
  font-size: 1.1rem;
}

.filters-card__subtitle {
  margin: 8px 0 0;
  color: var(--app-text-muted);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: end;
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

.filters-actions {
  display: flex;
  justify-content: flex-end;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  border: 1px solid var(--app-border);
}

.metric-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  font-size: 1.2rem;
}

.metric-card__icon--warning {
  background: #fff4db;
  color: #c17b00;
}

.metric-card__icon--success {
  background: #dff5e8;
  color: #16834a;
}

.metric-card__icon--danger {
  background: #fee2e2;
  color: #c53030;
}

.metric-card__icon--primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.metric-card__icon--contrast {
  background: #e5e7eb;
  color: #111827;
}

.metric-card__icon--info {
  background: #cffafe;
  color: #0f766e;
}

.metric-card__icon--success-soft {
  background: #dcfce7;
  color: #166534;
}

.metric-card__label {
  display: block;
  color: var(--app-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-card__value {
  display: block;
  margin-top: 8px;
  color: var(--app-text);
  font-size: 1.6rem;
}

@media (max-width: 959px) {
  .page-header,
  .filters-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-grid,
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
