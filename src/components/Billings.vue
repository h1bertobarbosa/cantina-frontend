<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <section class="billings-page">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">
          Financeiro
        </p>
        <h1 class="page-title">
          Gerenciar faturas
        </h1>
        <p class="page-subtitle">
          Acompanhe cobrancas, pagamentos, itens vinculados e historico manual em um unico lugar.
        </p>
      </div>

      <Button
        label="Historico de cobranca"
        icon="pi pi-plus"
        @click="openManualBillingDialog"
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
          :key="`billing-page-error-${index}`"
        >
          {{ error }}
        </li>
      </ul>
    </Message>

    <Card class="billings-card">
      <template #content>
        <div class="card-toolbar">
          <div>
            <h2 class="card-title">
              Lista principal
            </h2>
            <p class="card-subtitle">
              Filtre por cliente, status, metodo ou texto para localizar faturas rapidamente.
            </p>
          </div>
        </div>

        <div class="filters-grid">
          <IconField class="billing-search">
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar por cliente ou descricao"
            />
          </IconField>

          <div class="field-block">
            <label
              class="field-label"
              for="billings-client-filter"
            >Cliente</label>
            <Select
              id="billings-client-filter"
              v-model="filters.clientId"
              :options="clients"
              option-label="name"
              option-value="id"
              placeholder="Todos os clientes"
              filter
              show-clear
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="billings-method-filter"
            >Metodo de pagamento</label>
            <Select
              id="billings-method-filter"
              v-model="filters.paymentMethod"
              :options="paymentMethodFilterOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos os metodos"
              show-clear
            />
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="billings-status-filter"
            >Status</label>
            <Select
              id="billings-status-filter"
              v-model="filters.status"
              :options="billingStatusOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos os status"
              show-clear
            />
          </div>
        </div>

        <DataTable
          :value="billings"
          :loading="loading"
          data-key="id"
          striped-rows
          removable-sort
          :sort-field="sortField"
          :sort-order="sortOrder"
          class="billings-table"
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
              <div class="billing-client">
                <Avatar
                  :label="getInitials(data.clientName)"
                  shape="circle"
                  class="billing-client__avatar"
                />
                <div>
                  <strong class="billing-client__name">{{ data.clientName }}</strong>
                  <small class="billing-client__meta">ID {{ data.id }}</small>
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
            field="amount"
            header="Valor em aberto"
            sortable
          >
            <template #body="{ data }">
              {{ currency(data.amount) }}
            </template>
          </Column>

          <Column
            field="amount_payed"
            header="Valor pago"
            sortable
            sort-field="amount_payed"
          >
            <template #body="{ data }">
              {{ currency(data.amountPayed) }}
            </template>
          </Column>

          <Column header="Status">
            <template #body="{ data }">
              <Tag
                :value="getBillingStatusMeta(data).label"
                :severity="getBillingStatusMeta(data).severity"
              />
            </template>
          </Column>

          <Column
            field="payment_method"
            header="Metodo"
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
            field="payed_at"
            header="Pago em"
            sortable
            sort-field="payed_at"
          >
            <template #body="{ data }">
              {{ formatDateTimeLabel(data.payedAt, 'Nao pago') }}
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
                  @click="openDetailsDialog(data)"
                />
                <Button
                  v-if="isBillingPayable(data)"
                  icon="pi pi-wallet"
                  text
                  rounded
                  severity="success"
                  aria-label="Pagar"
                  @click="openPayDialog(data)"
                />
                <Button
                  icon="pi pi-list"
                  text
                  rounded
                  severity="secondary"
                  aria-label="Itens"
                  @click="openItemsDialog(data)"
                />
                <Button
                  icon="pi pi-receipt"
                  text
                  rounded
                  severity="contrast"
                  aria-label="Resumo"
                  @click="openReceiptDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  aria-label="Excluir"
                  @click="openDeleteDialog(data)"
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
      v-model:visible="showDetailsDialog"
      modal
      header="Detalhes da fatura"
      :style="{ width: '36rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closeDetailsDialog"
    >
      <div class="details-grid">
        <div class="details-item">
          <span class="details-item__label">ID</span>
          <strong>{{ currentBilling.id || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Cliente</span>
          <strong>{{ currentBilling.clientName || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Descricao</span>
          <strong>{{ currentBilling.description || 'N/A' }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Status</span>
          <Tag
            :value="getBillingStatusMeta(currentBilling).label"
            :severity="getBillingStatusMeta(currentBilling).severity"
          />
        </div>
        <div class="details-item">
          <span class="details-item__label">Valor em aberto</span>
          <strong>{{ currency(currentBilling.amount) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Valor pago</span>
          <strong>{{ currency(currentBilling.amountPayed) }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Metodo de pagamento</span>
          <Tag
            :value="getPaymentMethodText(currentBilling.paymentMethod)"
            :severity="getPaymentMethodSeverity(currentBilling.paymentMethod)"
          />
        </div>
        <div class="details-item">
          <span class="details-item__label">Pago em</span>
          <strong>{{ formatDateTimeLabel(currentBilling.payedAt, 'Nao pago') }}</strong>
        </div>
        <div class="details-item">
          <span class="details-item__label">Criado em</span>
          <strong>{{ formatDateTimeLabel(currentBilling.createdAt) }}</strong>
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
      v-model:visible="showPayDialog"
      modal
      header="Pagar fatura"
      :style="{ width: '32rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closePayDialog"
    >
      <Message
        v-if="payErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in payErrorMessages"
            :key="`billing-pay-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="dialog-form"
        @submit.prevent="confirmPayBilling"
      >
        <div class="details-grid details-grid--compact">
          <div class="details-item">
            <span class="details-item__label">Fatura</span>
            <strong>{{ currentBilling.description || 'N/A' }}</strong>
          </div>
          <div class="details-item">
            <span class="details-item__label">Saldo atual</span>
            <strong>{{ currency(currentBilling.amount) }}</strong>
          </div>
        </div>

        <div class="form-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="billing-pay-method"
            >Metodo de pagamento</label>
            <Select
              id="billing-pay-method"
              v-model="payForm.paymentMethod"
              :options="paymentMethodDialogOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecione um metodo"
              :invalid="Boolean(payFormErrors.paymentMethod)"
            />
            <small
              v-if="payFormErrors.paymentMethod"
              class="field-error"
            >
              {{ payFormErrors.paymentMethod }}
            </small>
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="billing-pay-amount"
            >Valor a pagar</label>
            <InputNumber
              id="billing-pay-amount"
              v-model="payForm.amount"
              mode="currency"
              currency="BRL"
              currency-display="symbol"
              locale="pt-BR"
              :min="0"
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              fluid
              :invalid="Boolean(payFormErrors.amount)"
            />
            <small
              v-if="payFormErrors.amount"
              class="field-error"
            >
              {{ payFormErrors.amount }}
            </small>
          </div>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closePayDialog"
          />
          <Button
            label="Confirmar pagamento"
            type="submit"
            :loading="savingPay"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showItemsDialog"
      modal
      header="Itens da fatura"
      :style="{ width: '60rem' }"
      :breakpoints="{ '960px': '95vw' }"
      @hide="closeItemsDialog"
    >
      <Message
        v-if="itemsErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in itemsErrorMessages"
            :key="`billing-items-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <div class="dialog-header-copy">
        <strong>{{ currentBilling.clientName || 'Cliente' }}</strong>
        <span>{{ currentBilling.description || 'Sem descricao' }}</span>
      </div>

      <DataTable
        :value="billingItems"
        :loading="loadingItems"
        data-key="id"
        class="dialog-table"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-list" />
            <span>Nenhum item encontrado para esta fatura.</span>
          </div>
        </template>

        <Column
          field="description"
          header="Descricao"
        />

        <Column
          field="amount"
          header="Valor"
        >
          <template #body="{ data }">
            {{ formatAmount(data.amount, data.type) }}
          </template>
        </Column>

        <Column
          field="paymentMethod"
          header="Metodo"
        >
          <template #body="{ data }">
            {{ getPaymentMethodText(data.paymentMethod) }}
          </template>
        </Column>

        <Column header="Data da compra">
          <template #body="{ data }">
            <InputText
              type="date"
              :model-value="formatInputDate(data.purchasedAt || data.createdAt)"
              @change="event => updatePurchaseDate(data, event.target.value)"
            />
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="closeItemsDialog"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showReceiptDialog"
      modal
      header="Resumo da fatura"
      :style="{ width: '52rem' }"
      :breakpoints="{ '960px': '95vw' }"
      @hide="closeReceiptDialog"
    >
      <Message
        v-if="receiptErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in receiptErrorMessages"
            :key="`billing-receipt-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <div
        v-if="loadingReceipt"
        class="loading-state"
      >
        <i class="pi pi-spin pi-spinner" />
        <span>Carregando resumo...</span>
      </div>

      <div
        v-else-if="receiptData.client"
        class="receipt-grid"
      >
        <div class="receipt-client">
          <h3 class="receipt-title">
            Dados do cliente
          </h3>
          <p><strong>Nome:</strong> {{ receiptData.client.name || 'N/A' }}</p>
          <p><strong>Email:</strong> {{ receiptData.client.email || 'N/A' }}</p>
          <p><strong>Telefone:</strong> {{ receiptData.client.phone || 'N/A' }}</p>
        </div>

        <Divider />

        <div class="receipt-items">
          <h3 class="receipt-title">
            Itens inclusos
          </h3>

          <DataTable
            :value="receiptData.items || []"
            data-key="id"
            class="dialog-table"
          >
            <template #empty>
              <div class="empty-state">
                <i class="pi pi-inbox" />
                <span>Nenhum item encontrado.</span>
              </div>
            </template>

            <Column
              field="description"
              header="Descricao"
            />

            <Column header="Data">
              <template #body="{ data }">
                {{ formatDateLabel(data.purchasedAt) }}
              </template>
            </Column>

            <Column header="Valor">
              <template #body="{ data }">
                {{ currency(data.amount) }}
              </template>
            </Column>
          </DataTable>
        </div>

        <div class="receipt-total">
          <span>Total</span>
          <strong>{{ currency(receiptTotal) }}</strong>
        </div>
      </div>

      <template #footer>
        <Button
          label="Fechar"
          severity="secondary"
          variant="text"
          @click="closeReceiptDialog"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Confirmar exclusao"
      :style="{ width: '34rem' }"
      :breakpoints="{ '960px': '92vw' }"
      @hide="closeDeleteDialog"
    >
      <Message
        v-if="deleteErrorMessages.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in deleteErrorMessages"
            :key="`billing-delete-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="dialog-form"
        @submit.prevent="confirmDeleteBilling"
      >
        <div class="details-grid details-grid--compact">
          <div class="details-item">
            <span class="details-item__label">Cliente</span>
            <strong>{{ billingToDelete.clientName || 'N/A' }}</strong>
          </div>
          <div class="details-item">
            <span class="details-item__label">Valor</span>
            <strong>{{ currency(billingToDelete.amount) }}</strong>
          </div>
        </div>

        <p class="delete-text">
          Esta acao nao pode ser desfeita. Informe uma observacao para registrar a exclusao.
        </p>

        <div class="field-block">
          <label
            class="field-label"
            for="billing-delete-obs"
          >Observacao</label>
          <Textarea
            id="billing-delete-obs"
            v-model="deleteObservation"
            rows="4"
            auto-resize
            :invalid="Boolean(deleteFormError)"
          />
          <small
            v-if="deleteFormError"
            class="field-error"
          >
            {{ deleteFormError }}
          </small>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeDeleteDialog"
          />
          <Button
            label="Excluir fatura"
            severity="danger"
            type="submit"
            :loading="deletingBilling"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="showManualBillingDialog"
      modal
      header="Registrar cobranca no historico"
      :style="{ width: '42rem' }"
      :breakpoints="{ '960px': '95vw' }"
      @hide="closeManualBillingDialog"
    >
      <Message
        v-if="manualBillingErrors.length"
        severity="error"
        class="dialog-message"
      >
        <ul class="message-list">
          <li
            v-for="(error, index) in manualBillingErrors"
            :key="`billing-manual-error-${index}`"
          >
            {{ error }}
          </li>
        </ul>
      </Message>

      <form
        class="dialog-form"
        @submit.prevent="saveManualBilling"
      >
        <div class="form-grid">
          <div class="field-block">
            <label
              class="field-label"
              for="manual-billing-client"
            >Cliente</label>
            <Select
              id="manual-billing-client"
              v-model="manualBilling.clientId"
              :options="clients"
              option-label="name"
              option-value="id"
              placeholder="Selecione um cliente"
              filter
              show-clear
              :invalid="Boolean(manualBillingFormErrors.clientId)"
            />
            <small
              v-if="manualBillingFormErrors.clientId"
              class="field-error"
            >
              {{ manualBillingFormErrors.clientId }}
            </small>
          </div>

          <div class="field-block">
            <label
              class="field-label"
              for="manual-billing-description"
            >Descricao</label>
            <Textarea
              id="manual-billing-description"
              v-model="manualBilling.description"
              rows="4"
              auto-resize
              :invalid="Boolean(manualBillingFormErrors.description)"
            />
            <small
              v-if="manualBillingFormErrors.description"
              class="field-error"
            >
              {{ manualBillingFormErrors.description }}
            </small>
          </div>

          <div class="form-grid form-grid--two">
            <div class="field-block">
              <label
                class="field-label"
                for="manual-billing-amount"
              >Valor cobrado</label>
              <InputNumber
                id="manual-billing-amount"
                v-model="manualBilling.amount"
                mode="currency"
                currency="BRL"
                currency-display="symbol"
                locale="pt-BR"
                :min="0"
                :min-fraction-digits="2"
                :max-fraction-digits="2"
                fluid
                :invalid="Boolean(manualBillingFormErrors.amount)"
              />
              <small
                v-if="manualBillingFormErrors.amount"
                class="field-error"
              >
                {{ manualBillingFormErrors.amount }}
              </small>
            </div>

            <div class="field-block">
              <label
                class="field-label"
                for="manual-billing-date"
              >Data da ocorrencia</label>
              <InputText
                id="manual-billing-date"
                v-model="manualBilling.createdAt"
                type="date"
                :invalid="Boolean(manualBillingFormErrors.createdAt)"
              />
              <small
                v-if="manualBillingFormErrors.createdAt"
                class="field-error"
              >
                {{ manualBillingFormErrors.createdAt }}
              </small>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <Button
            label="Cancelar"
            severity="secondary"
            variant="text"
            type="button"
            @click="closeManualBillingDialog"
          />
          <Button
            label="Salvar"
            type="submit"
            :loading="savingManualBilling"
          />
        </div>
      </form>
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
import Textarea from 'primevue/textarea';
import { apiService } from '../services/apiService';
import { formatDate, formatDateHour } from '../utils/formatDate';

defineOptions({
  name: 'BillingsPage',
});

const paymentMethodLabelMap = Object.freeze({
  PIX: 'PIX',
  CREDIT_CARD: 'Cartao de credito',
  DEBIT_CARD: 'Cartao de debito',
  BOLETO: 'Boleto',
  CASH: 'Dinheiro',
  TO_RECEIVE: 'A receber',
});

const paymentMethodFilterOptions = [
  { label: 'PIX', value: 'PIX' },
  { label: 'Cartao de credito', value: 'CREDIT_CARD' },
  { label: 'Cartao de debito', value: 'DEBIT_CARD' },
  { label: 'Boleto', value: 'BOLETO' },
  { label: 'Dinheiro', value: 'CASH' },
  { label: 'A receber', value: 'TO_RECEIVE' },
];

const paymentMethodDialogOptions = paymentMethodFilterOptions.filter(
  (option) => option.value !== 'TO_RECEIVE',
);

const billingStatusOptions = [
  { label: 'Em aberto', value: 'open' },
  { label: 'Parcial', value: 'partial' },
  { label: 'Paga', value: 'paid' },
];

const loading = ref(false);
const loadingItems = ref(false);
const loadingReceipt = ref(false);
const savingPay = ref(false);
const deletingBilling = ref(false);
const savingManualBilling = ref(false);

const billings = ref([]);
const clients = ref([]);
const billingItems = ref([]);
const receiptData = ref({ client: null, items: [] });

const currentBilling = ref({});
const billingToDelete = ref({});

const showDetailsDialog = ref(false);
const showPayDialog = ref(false);
const showItemsDialog = ref(false);
const showReceiptDialog = ref(false);
const showDeleteDialog = ref(false);
const showManualBillingDialog = ref(false);

const errorMessages = ref([]);
const itemsErrorMessages = ref([]);
const receiptErrorMessages = ref([]);
const deleteErrorMessages = ref([]);
const payErrorMessages = ref([]);
const manualBillingErrors = ref([]);

const deleteObservation = ref('');
const deleteFormError = ref('');
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
  paymentMethod: null,
  status: null,
});

const payForm = reactive({
  paymentMethod: null,
  amount: null,
});

const payFormErrors = reactive({
  paymentMethod: '',
  amount: '',
});

const manualBilling = reactive({
  clientId: null,
  description: '',
  amount: null,
  createdAt: getTodayString(),
});

const manualBillingFormErrors = reactive({
  clientId: '',
  description: '',
  amount: '',
  createdAt: '',
});

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const firstRecordIndex = computed(() => (pagination.page - 1) * pagination.perPage);

const receiptTotal = computed(() => (receiptData.value.items || []).reduce((sum, item) => {
  const isCredit = String(item.description || '').toLowerCase().includes('credito');
  const amount = Number(item.amount) || 0;
  return isCredit ? sum - amount : sum + amount;
}, 0));

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

const currency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'R$ 0,00';
  }

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDateLabel = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  try {
    return formatDate(value);
  } catch (error) {
    return fallback;
  }
};

const formatDateTimeLabel = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  try {
    return formatDateHour(value);
  } catch (error) {
    return fallback;
  }
};

const formatInputDate = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new Date(value).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

const getInitials = (value) => (
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'FT'
);

const getPaymentMethodText = (methodValue) => (
  paymentMethodLabelMap[methodValue] || methodValue || 'N/A'
);

const getPaymentMethodSeverity = (methodValue) => {
  switch (methodValue) {
    case 'PIX':
      return 'info';
    case 'CASH':
      return 'success';
    case 'CREDIT_CARD':
      return 'contrast';
    case 'DEBIT_CARD':
      return 'help';
    case 'BOLETO':
      return 'warn';
    case 'TO_RECEIVE':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getBillingStatusKey = (billing) => {
  if (billing?.payedAt) {
    return 'paid';
  }

  if (Number(billing?.amountPayed || 0) > 0) {
    return 'partial';
  }

  return 'open';
};

const getBillingStatusMeta = (billing) => {
  switch (getBillingStatusKey(billing)) {
    case 'paid':
      return { label: 'Paga', severity: 'success' };
    case 'partial':
      return { label: 'Parcial', severity: 'warn' };
    default:
      return { label: 'Em aberto', severity: 'danger' };
  }
};

const formatAmount = (amount, type) => {
  let normalizedAmount = Number(amount) || 0;

  if (type === 'CREDIT' && normalizedAmount > 0) {
    normalizedAmount *= -1;
  }

  return currency(normalizedAmount);
};

const isBillingPayable = (billing) => (
  getBillingStatusKey(billing) !== 'paid' && Number(billing?.amount || 0) > 0
);

const getOrderDir = () => (sortOrder.value === 1 ? 'asc' : 'desc');

const buildBillingsQuery = () => {
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

  if (filters.paymentMethod) {
    params.append('paymentMethod', filters.paymentMethod);
  }

  if (filters.status) {
    params.append('status', filters.status);
  }

  return params.toString();
};

const fetchBillings = async () => {
  loading.value = true;
  errorMessages.value = [];

  try {
    const response = await apiService.get(`/billings?${buildBillingsQuery()}`);
    const data = await response.json();

    if (!response.ok) {
      billings.value = [];
      pagination.total = 0;
      errorMessages.value = normalizeMessages(data, 'Erro ao buscar faturas.');
      throw new Error(errorMessages.value[0]);
    }

    billings.value = data.data || [];
    pagination.page = Number(data.meta?.page || pagination.page);
    pagination.perPage = Number(data.meta?.perPage || pagination.perPage);
    pagination.total = Number(data.meta?.total || 0);
  } catch (error) {
    console.error('Fetch Billings Error:', error);
    if (!errorMessages.value.length) {
      errorMessages.value = ['Ocorreu um erro inesperado ao buscar as faturas.'];
    }
  } finally {
    loading.value = false;
  }
};

const fetchClients = async () => {
  try {
    const response = await apiService.get('/clients?perPage=500&sortBy=name&orderDir=asc');

    if (!response.ok) {
      throw new Error('Erro ao buscar clientes');
    }

    const data = await response.json();
    clients.value = data.data || [];
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    errorMessages.value.push('Erro ao carregar lista de clientes.');
  }
};

const resetPayFormErrors = () => {
  payFormErrors.paymentMethod = '';
  payFormErrors.amount = '';
};

const validatePayForm = () => {
  resetPayFormErrors();

  if (!payForm.paymentMethod) {
    payFormErrors.paymentMethod = 'Metodo de pagamento e obrigatorio.';
  }

  if (!payForm.amount || Number(payForm.amount) <= 0) {
    payFormErrors.amount = 'Informe um valor maior que zero.';
  }

  return !payFormErrors.paymentMethod && !payFormErrors.amount;
};

const openDetailsDialog = (billing) => {
  currentBilling.value = { ...billing };
  showDetailsDialog.value = true;
};

const closeDetailsDialog = () => {
  showDetailsDialog.value = false;
  currentBilling.value = {};
};

const openPayDialog = (billing) => {
  currentBilling.value = { ...billing };
  payForm.paymentMethod = null;
  payForm.amount = Number(billing.amount || 0);
  payErrorMessages.value = [];
  resetPayFormErrors();
  showPayDialog.value = true;
};

const closePayDialog = () => {
  showPayDialog.value = false;
  payErrorMessages.value = [];
  currentBilling.value = {};
  payForm.paymentMethod = null;
  payForm.amount = null;
  resetPayFormErrors();
};

const confirmPayBilling = async () => {
  payErrorMessages.value = [];

  if (!validatePayForm()) {
    payErrorMessages.value.push('Por favor, corrija os erros do formulario.');
    return;
  }

  savingPay.value = true;

  try {
    const response = await apiService.patch(`/billings/${currentBilling.value.id}/pay`, {
      amount: Number(payForm.amount),
      paymentMethod: payForm.paymentMethod,
    });
    const responseData = await response.json();

    if (!response.ok) {
      payErrorMessages.value = normalizeMessages(responseData, 'Erro ao processar pagamento.');
      throw new Error(payErrorMessages.value[0]);
    }

    closePayDialog();
    await fetchBillings();
  } catch (error) {
    console.error('Pay Billing Error:', error);
    if (!payErrorMessages.value.length) {
      payErrorMessages.value = ['Ocorreu um erro inesperado ao processar o pagamento.'];
    }
  } finally {
    savingPay.value = false;
  }
};

const openItemsDialog = async (billing) => {
  currentBilling.value = { ...billing };
  billingItems.value = [];
  itemsErrorMessages.value = [];
  showItemsDialog.value = true;
  loadingItems.value = true;

  try {
    const response = await apiService.get(`/billings/${billing.id}/items`);
    const data = await response.json();

    if (!response.ok) {
      itemsErrorMessages.value = normalizeMessages(data, 'Erro ao buscar itens da fatura.');
      throw new Error(itemsErrorMessages.value[0]);
    }

    billingItems.value = data || [];
  } catch (error) {
    console.error('Fetch Billing Items Error:', error);
    if (!itemsErrorMessages.value.length) {
      itemsErrorMessages.value = ['Ocorreu um erro inesperado ao buscar os itens da fatura.'];
    }
  } finally {
    loadingItems.value = false;
  }
};

const closeItemsDialog = () => {
  showItemsDialog.value = false;
  billingItems.value = [];
  itemsErrorMessages.value = [];
};

const updatePurchaseDate = async (item, nextDate) => {
  if (!nextDate) {
    return;
  }

  const originalDate = item.purchasedAt;
  item.purchasedAt = `${nextDate}T12:00:00.000Z`;
  itemsErrorMessages.value = [];

  try {
    const response = await apiService.patch(`/billings/items/${item.id}/update-purchase-date`, {
      purchaseDate: nextDate,
    });
    const data = await response.json();

    if (!response.ok) {
      item.purchasedAt = originalDate;
      itemsErrorMessages.value = normalizeMessages(data, 'Erro ao atualizar data da compra.');
      throw new Error(itemsErrorMessages.value[0]);
    }
  } catch (error) {
    item.purchasedAt = originalDate;
    console.error('Update Purchase Date Error:', error);
    if (!itemsErrorMessages.value.length) {
      itemsErrorMessages.value = ['Ocorreu um erro inesperado ao atualizar a data da compra.'];
    }
  }
};

const openReceiptDialog = async (billing) => {
  currentBilling.value = { ...billing };
  receiptData.value = { client: null, items: [] };
  receiptErrorMessages.value = [];
  showReceiptDialog.value = true;
  loadingReceipt.value = true;

  try {
    const response = await apiService.get(`/billings/${billing.id}/receipt-details`);
    const data = await response.json();

    if (!response.ok) {
      receiptErrorMessages.value = normalizeMessages(data, 'Erro ao buscar resumo da fatura.');
      throw new Error(receiptErrorMessages.value[0]);
    }

    receiptData.value = data;
  } catch (error) {
    console.error('Receipt Details Error:', error);
    if (!receiptErrorMessages.value.length) {
      receiptErrorMessages.value = ['Ocorreu um erro inesperado ao carregar o resumo da fatura.'];
    }
  } finally {
    loadingReceipt.value = false;
  }
};

const closeReceiptDialog = () => {
  showReceiptDialog.value = false;
  receiptData.value = { client: null, items: [] };
  receiptErrorMessages.value = [];
};

const openDeleteDialog = (billing) => {
  billingToDelete.value = { ...billing };
  deleteObservation.value = '';
  deleteFormError.value = '';
  deleteErrorMessages.value = [];
  showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
  showDeleteDialog.value = false;
  billingToDelete.value = {};
  deleteObservation.value = '';
  deleteFormError.value = '';
  deleteErrorMessages.value = [];
};

const confirmDeleteBilling = async () => {
  deleteErrorMessages.value = [];
  deleteFormError.value = '';

  if (!deleteObservation.value.trim()) {
    deleteFormError.value = 'Observacao e obrigatoria.';
    return;
  }

  deletingBilling.value = true;

  try {
    const response = await apiService.delete(`/billings/${billingToDelete.value.id}`, {
      obs: deleteObservation.value.trim(),
    });

    let responseData = null;
    if (response.headers.get('content-type')?.includes('application/json')) {
      responseData = await response.json();
    }

    if (!response.ok) {
      deleteErrorMessages.value = normalizeMessages(responseData, 'Erro ao excluir fatura.');
      throw new Error(deleteErrorMessages.value[0]);
    }

    closeDeleteDialog();

    if (billings.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1;
    }

    await fetchBillings();
  } catch (error) {
    console.error('Delete Billing Error:', error);
    if (!deleteErrorMessages.value.length) {
      deleteErrorMessages.value = ['Ocorreu um erro inesperado ao excluir a fatura.'];
    }
  } finally {
    deletingBilling.value = false;
  }
};

const resetManualBillingFormErrors = () => {
  manualBillingFormErrors.clientId = '';
  manualBillingFormErrors.description = '';
  manualBillingFormErrors.amount = '';
  manualBillingFormErrors.createdAt = '';
};

const validateManualBillingForm = () => {
  resetManualBillingFormErrors();

  if (!manualBilling.clientId) {
    manualBillingFormErrors.clientId = 'Cliente e obrigatorio.';
  }

  if (!String(manualBilling.description || '').trim()) {
    manualBillingFormErrors.description = 'Descricao e obrigatoria.';
  }

  if (!manualBilling.amount || Number(manualBilling.amount) <= 0) {
    manualBillingFormErrors.amount = 'Informe um valor maior que zero.';
  }

  if (!manualBilling.createdAt) {
    manualBillingFormErrors.createdAt = 'Data da ocorrencia e obrigatoria.';
  }

  return !manualBillingFormErrors.clientId
    && !manualBillingFormErrors.description
    && !manualBillingFormErrors.amount
    && !manualBillingFormErrors.createdAt;
};

const openManualBillingDialog = () => {
  manualBilling.clientId = null;
  manualBilling.description = '';
  manualBilling.amount = null;
  manualBilling.createdAt = getTodayString();
  manualBillingErrors.value = [];
  resetManualBillingFormErrors();
  showManualBillingDialog.value = true;
};

const closeManualBillingDialog = () => {
  showManualBillingDialog.value = false;
  manualBillingErrors.value = [];
  resetManualBillingFormErrors();
};

const saveManualBilling = async () => {
  manualBillingErrors.value = [];

  if (!validateManualBillingForm()) {
    manualBillingErrors.value.push('Por favor, corrija os erros do formulario.');
    return;
  }

  savingManualBilling.value = true;

  try {
    const response = await apiService.post(`/clients/${manualBilling.clientId}/register-charge`, {
      description: String(manualBilling.description).trim(),
      amount: Number(manualBilling.amount),
      createdAt: new Date(`${manualBilling.createdAt}T12:00:00Z`).toISOString(),
    });
    const data = await response.json();

    if (!response.ok) {
      manualBillingErrors.value = normalizeMessages(data, 'Erro ao registrar cobranca manual.');
      throw new Error(manualBillingErrors.value[0]);
    }

    closeManualBillingDialog();
    await fetchBillings();
  } catch (error) {
    console.error('Manual Billing Error:', error);
    if (!manualBillingErrors.value.length) {
      manualBillingErrors.value = ['Ocorreu um erro inesperado ao registrar a cobranca manual.'];
    }
  } finally {
    savingManualBilling.value = false;
  }
};

const handlePageChange = (event) => {
  pagination.page = event.page + 1;
  pagination.perPage = event.rows;
  fetchBillings();
};

const handleSort = (event) => {
  sortField.value = event.sortField || 'created_at';
  sortOrder.value = event.sortOrder || -1;
  pagination.page = 1;
  fetchBillings();
};

let searchDebounce = null;
watch(searchQuery, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.page = 1;
    fetchBillings();
  }, 400);
});

watch(
  () => [filters.clientId, filters.paymentMethod, filters.status],
  () => {
    pagination.page = 1;
    fetchBillings();
  },
);

onMounted(() => {
  fetchBillings();
  fetchClients();
});
</script>

<style scoped>
.billings-page {
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

.billings-card {
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
  grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.billing-search {
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

.billings-table,
.dialog-table {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 22px;
}

.billing-client {
  display: flex;
  align-items: center;
  gap: 12px;
}

.billing-client__avatar {
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
}

.billing-client__name {
  display: block;
}

.billing-client__meta {
  color: var(--app-text-muted);
}

.actions-column {
  width: 220px;
}

.actions-row {
  display: flex;
  justify-content: center;
  gap: 2px;
}

.empty-state,
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 12px;
  color: var(--app-text-muted);
}

.dialog-form,
.details-grid,
.receipt-grid {
  display: grid;
  gap: 18px;
}

.details-grid--compact {
  gap: 12px;
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

.dialog-header-copy {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
  color: var(--app-text-muted);
}

.receipt-title {
  margin: 0 0 10px;
  color: var(--app-text);
  font-size: 1.02rem;
}

.receipt-client p {
  margin: 0 0 8px;
  color: var(--app-text);
}

.receipt-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  color: var(--app-text);
  font-size: 1.05rem;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  .form-grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
