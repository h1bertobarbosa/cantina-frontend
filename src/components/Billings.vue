<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2>Gerenciar Faturas</h2>
        <v-btn color="primary" prepend-icon="mdi-plus-box" @click="openManualBillingDialog" class="ma-2">
          Histórico de cobrança
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtro de Cliente -->
    <v-row align="center">
      <v-col cols="12" md="4">
        <!-- Assumindo que ClientCombo se adapta ou será refatorado para Vuetify -->
        <!-- Se ClientCombo for simples, poderia ser substituído por v-select -->
        <ClientCombo :clients="clients" label="Filtrar por Cliente" @selected="onClientSelected" variant="outlined"
          density="compact" clearable />
      </v-col>
      <!-- Novo Filtro de Método de Pagamento -->
      <v-col cols="12" md="4">
        <v-select label="Filtrar por Método de Pagamento" :items="paymentMethodFilterOptions" item-title="text"
          item-value="value" v-model="selectedPaymentMethod" @update:modelValue="onPaymentMethodChange"
          variant="outlined" density="compact" clearable></v-select>
      </v-col>
    </v-row>

    <!-- Mensagens de Erro Gerais -->
    <v-row v-if="errorMessages.length">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" border="start" prominent closable @update:modelValue="errorMessages = []">
          <ul>
            <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Mensagem de Nenhuma Informação -->
    <v-row v-if="!loading && !billings.length">
      <v-col cols="12">
        <v-alert type="info" variant="tonal" border="start">
          Nenhuma informação para ser exibida
        </v-alert>
      </v-col>
    </v-row>

    <!-- Tabela de Faturas -->
    <v-row v-if="billings.length">
      <v-col cols="12">
        <v-table hover density="compact">
          <thead class="bg-grey-lighten-4">
            <tr>
              <th class="text-left">Cliente</th>
              <th class="text-left">Descrição</th>
              <th class="text-left">Valor</th>
              <th class="text-left">Método Pag.</th>
              <th class="text-left">Pago em</th>
              <th class="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="billing in billings" :key="billing.id">
              <td>{{ billing.clientName }}</td>
              <td>{{ billing.description }}</td>
              <td>{{ currency(billing.amount) }}</td>
              <td>{{ formatPaymentMethod(billing.paymentMethod) }}</td>
              <td>{{ formatDateWithHour(billing.payedAt) }}</td>
              <td class="text-center">
                <v-tooltip text="Detalhes">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" color="info" variant="text" size="small"
                      @click="viewBilling(billing.id)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Pagar" v-if="!billing.payedAt && billing.amount > 0">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-currency-usd" color="success" variant="text" size="small"
                      @click="payBilling(billing.id)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Ver Itens">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-format-list-bulleted" color="primary" variant="text" size="small"
                      @click="viewBillingItems(billing.id)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Resumo da Fatura">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-receipt-text" color="deep-purple" variant="text" size="small"
                      @click="openReceiptDialog(billing)"></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Excluir">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-delete" color="error" variant="text" size="small"
                      @click="openDeleteDialog(billing)"></v-btn>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Paginação -->
        <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" :total-visible="5"
          @update:modelValue="handlePageChange" density="compact" class="mt-4"></v-pagination>
      </v-col>
    </v-row>

    <!-- Dialog para Visualizar Detalhes da Fatura -->
    <v-dialog v-model="showDetailsDialog" max-width="600px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Detalhes da Fatura
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showDetailsDialog = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <p><strong>ID:</strong> {{ currentBilling.id }}</p>
          <p><strong>Cliente:</strong> {{ currentBilling.clientName }}</p>
          <p><strong>Descrição:</strong> {{ currentBilling.description }}</p>
          <p><strong>Valor:</strong> {{ currency(currentBilling.amount) }}</p>
          <p><strong>Valor Pago:</strong> {{ currency(currentBilling.amountPayed) }}</p>
          <p><strong>Método de Pagamento:</strong> {{ formatPaymentMethod(currentBilling.paymentMethod) }}</p>
          <p><strong>Pago em:</strong> {{ formatDateWithHour(currentBilling.payedAt) }}</p>
          <p><strong>Criado em:</strong> {{ formatDateWithHour(currentBilling.createdAt) }}</p>
          <!-- Outros detalhes -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showDetailsDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para Pagar Fatura -->
    <v-dialog v-model="showPayDialog" max-width="500px" persistent>
      <v-card>
        <v-form @submit.prevent="confirmPayBilling">
          <v-card-title class="headline grey lighten-2">
            Pagar Fatura
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closePayModal"></v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Mensagens de Erro no Modal -->
            <v-alert v-if="errorMessages.length" type="error" variant="tonal" border="start" density="compact"
              class="mb-3">
              <ul>
                <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
              </ul>
            </v-alert>

            <p>Deseja realmente pagar esta fatura?</p>
            <p><strong>ID:</strong> {{ currentBilling.id }}</p>
            <p><strong>Descrição:</strong> {{ currentBilling.description }}</p>
            <p><strong>Valor:</strong> {{ currency(currentBilling.amount) }}</p>

            <v-select label="Método de Pagamento" v-model="paymentMethod" :items="paymentMethods" item-title="text"
              item-value="value" :rules="[v => !!v || 'Método de pagamento é obrigatório']" required variant="outlined"
              density="compact" class="mt-3"></v-select>

            <!-- Mantendo seu CurrencyInput, adicione props Vuetify como label, variant, density se o componente suportar -->
            <CurrencyInput label="Valor a Pagar" v-model.lazy="amount" required
              :options="{ currency: 'BRL', precision: 2 }" variant="outlined" density="compact" class="mt-3"
              :rules="[v => !!v || 'Valor é obrigatório', v => parseFloat(v) > 0 || 'Valor deve ser maior que zero']" />

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closePayModal">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit"> Pagar </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Dialog para Visualizar Itens da Fatura -->
    <v-dialog v-model="showItemsDialog" max-width="900px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Itens da Fatura
          <v-spacer></v-spacer>
          <b>{{ currentBilling.clientName }}</b> - {{ currentBilling.description }}
        </v-card-title>
        <v-card-text style="max-height: 500px; overflow-y: auto;">
          <!-- Mensagens de Erro no Modal -->
          <v-alert v-if="errorMessagesItems.length" type="error" variant="tonal" border="start" density="compact"
            class="mb-3">
            <ul>
              <li v-for="(error, index) in errorMessagesItems" :key="`item-err-${index}`">{{ error }}</li>
            </ul>
          </v-alert>
          <!-- Indicador de Carregamento -->
          <div v-if="loadingItems" class="text-center my-5">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <p>Carregando itens...</p>
          </div>
          <!-- Tabela de Itens -->
          <v-table v-if="!loadingItems && billingItems.length" hover density="compact">
            <thead>
              <tr>
                <th class="text-left">Descrição</th>
                <th class="text-left">Valor</th>
                <th class="text-left">Método Pag.</th>
                <th class="text-left">Data Compra</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in billingItems" :key="item.id">
                <td>{{ item.description }}</td>
                <td>{{ formatAmount(item.amount, item.type) }}</td>
                <td>{{ formatPaymentMethod(item.paymentMethod) }}</td>
                <td>
                  <v-menu :close-on-content-click="false" location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-text-field v-bind="props"
                        :model-value="formatDateWithoutHour(item.purchasedAt || item.createdAt)" readonly
                        density="compact" variant="underlined" hide-details
                        append-inner-icon="mdi-calendar"></v-text-field>
                    </template>
                    <v-date-picker :model-value="parseInputDate(item.purchasedAt || item.createdAt)"
                      @update:model-value="date => updatePurchaseDate(item, date)" hide-actions title="Selecione a Data"
                      color="primary"></v-date-picker>
                  </v-menu>
                  <!-- Input antigo, mantido comentado para referência -->
                  <!-- <input type="date" :value="formatInputDate(item.purchasedAt || item.createdAt)" @change="updatePurchaseDate(item, $event)" /> -->
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-if="!loadingItems && !billingItems.length" type="info" variant="tonal" border="start" class="mt-3">
            Nenhum item encontrado para esta fatura.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showItemsDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteDialog" max-width="500px" persistent>
      <v-card>
        <!-- Add ref="deleteBillingForm" to the v-form -->
        <v-form @submit.prevent="confirmDeleteBilling" ref="deleteBillingForm">
          <v-card-title class="headline grey lighten-2">
            Confirmar Exclusão
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="closeDeleteDialog" :disabled="deletingBilling"></v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Mensagens de Erro no Modal de Exclusão -->
            <v-alert v-if="deleteErrorMessages.length" type="error" variant="tonal" border="start" density="compact"
              class="mb-3">
              <ul>
                <li v-for="(error, index) in deleteErrorMessages" :key="`del-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <p>Você tem certeza que deseja excluir a seguinte fatura?</p>
            <div v-if="billingToDelete" class="mb-3">
              <p><strong>ID:</strong> {{ billingToDelete.id }}</p>
              <p><strong>Cliente:</strong> {{ billingToDelete.clientName }}</p>
              <p><strong>Descrição:</strong> {{ billingToDelete.description }}</p>
              <p><strong>Valor:</strong> {{ currency(billingToDelete.amount) }}</p>
            </div>
            <p class="font-weight-medium text-error">Esta ação não poderá ser desfeita.</p>

            <v-textarea v-model="deleteObservation" label="Observação (obrigatório)" rows="3" variant="outlined"
              density="compact" class="mt-4" clearable :rules="[rules.requiredField]" required></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeDeleteDialog" :disabled="deletingBilling">
              Cancelar
            </v-btn>
            <v-btn color="error" type="submit" :loading="deletingBilling">
              Excluir Fatura
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showReceiptDialog" max-width="800px">
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Resumo da Fatura
        </v-card-title>
        <v-card-text>
          <div v-if="loadingReceipt" class="text-center my-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4">Carregando resumo...</p>
          </div>

          <v-alert v-if="receiptErrorMessages.length" type="error" variant="tonal" border="start" class="mb-4">
            <ul>
              <li v-for="(error, index) in receiptErrorMessages" :key="`receipt-err-${index}`">{{ error }}</li>
            </ul>
          </v-alert>

          <div v-if="!loadingReceipt && receiptData.client">
            <h3 class="text-h6 mb-2">Dados do Cliente</h3>
            <p><strong>Nome:</strong> {{ receiptData.client.name }}</p>
            <p><strong>Email:</strong> {{ receiptData.client.email }}</p>
            <p><strong>Telefone:</strong> {{ receiptData.client.phone }}</p>

            <v-divider class="my-4"></v-divider>

            <h3 class="text-h6 mb-2">Itens Inclusos</h3>
            <v-table v-if="receiptData.items.length" density="compact" class="mb-4">
              <thead class="bg-grey-lighten-5">
                <tr>
                  <th class="text-left">Descrição</th>
                  <th class="text-left">Data</th>
                  <th class="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in receiptData.items" :key="item.id">
                  <td>{{ item.description }}</td>
                  <td>{{ formatDateWithoutHour(item.purchasedAt) }}</td>
                  <td class="text-right">{{ currency(item.amount) }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert v-else type="info" variant="tonal">Nenhum item encontrado.</v-alert>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-end text-h6">
              <strong>Total:</strong>
              <span class="ml-4 font-weight-bold text-primary">{{ currency(receiptTotal) }}</span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="showReceiptDialog = false">
            Fechar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showManualBillingDialog" max-width="700px" persistent>
      <v-card>
        <v-form ref="manualBillingForm" @submit.prevent="saveManualBilling">
          <v-card-title class="headline grey lighten-2">
            Registrar Cobrança no Histórico
          </v-card-title>
          <v-card-text class="pt-4">
            <v-alert v-if="manualBillingErrors.length" type="error" variant="tonal" border="start" density="compact"
              class="mb-4" closable @update:modelValue="manualBillingErrors = []">
              <ul>
                <li v-for="(error, index) in manualBillingErrors" :key="`man-err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <v-row>
              <v-col cols="12">
                <ClientCombo v-model="manualBilling.clientId" :clients="clients" label="Selecione o Cliente"
                  :rules="[rules.required]" variant="outlined" density="compact" required />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="manualBilling.description" label="Descrição (Ex: Cobrança via WhatsApp)" rows="3"
                  variant="outlined" density="compact" :rules="[rules.requiredField]" required></v-textarea>
              </v-col>

              <v-col cols="12" md="6">
                <CurrencyInput label="Valor cobrado" v-model="manualBilling.amount" :options="{ currency: 'BRL' }"
                  :rules="[rules.requiredField, rules.positiveValue]" variant="outlined" density="compact" required />
              </v-col>

              <v-col cols="12" md="6">
                <v-menu :close-on-content-click="false" location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-text-field v-bind="props" :model-value="formatDateWithoutHour(manualBilling.createdAt)"
                      label="Data da Ocorrência" prepend-inner-icon="mdi-calendar" readonly variant="outlined"
                      density="compact" :rules="[rules.requiredField]"></v-text-field>
                  </template>
                  <v-date-picker v-model="manualBilling.createdAt"
                    @update:model-value="newDate => manualBilling.createdAt = newDate" hide-actions
                    title="Selecione a Data" color="primary"></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey darken-1" text @click="closeManualBillingDialog" :disabled="savingManualBilling">
              Cancelar
            </v-btn>
            <v-btn color="primary" type="submit" :loading="savingManualBilling">
              Salvar
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
    <!-- Loading Overlay (Opcional, para feedback geral) -->
    <v-overlay :model-value="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>

  </v-container>
</template>

<script>
import { apiService } from '../services/apiService'; // Mantenha seu serviço de API
import { formatDateHour, formatDate } from '../utils/formatDate'; // Mantenha seus utils
import CurrencyInput from './CurrencyInput'; // Mantenha seu componente
import ClientCombo from '@/components/ClientCombo.vue'; // Mantenha seu componente
const TransactionPaymentMethodEnum = Object.freeze({
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BOLETO: 'BOLETO',
  CASH: 'CASH',
  TO_RECEIVE: 'TO_RECEIVE',
});

const paymentMethodDisplayMap = Object.freeze({
  [TransactionPaymentMethodEnum.PIX]: 'PIX',
  [TransactionPaymentMethodEnum.CREDIT_CARD]: 'Cartão de Crédito',
  [TransactionPaymentMethodEnum.DEBIT_CARD]: 'Cartão de Débito',
  [TransactionPaymentMethodEnum.BOLETO]: 'Boleto',
  [TransactionPaymentMethodEnum.CASH]: 'Dinheiro',
  [TransactionPaymentMethodEnum.TO_RECEIVE]: 'A Receber',
});
export default {
  name: 'BillingsManager', // Renomeado para seguir convenção PascalCase
  components: { CurrencyInput, ClientCombo }, // Removido Pagination
  data() {
    return {
      loading: false, // Flag de loading geral
      loadingItems: false, // Flag de loading para itens
      billings: [],
      currentBilling: {},
      showDetailsDialog: false, // Controla o dialog de detalhes
      showPayDialog: false, // Controla o dialog de pagamento
      showItemsDialog: false, // Controla o dialog de itens
      errorMessages: [],
      errorMessagesItems: [], // Erros específicos do modal de itens
      paymentMethod: '',
      amount: 0,
      paymentMethods: [ // Opções para o v-select
        { text: 'PIX', value: 'PIX' },
        { text: 'Dinheiro', value: 'CASH' },
        { text: 'Cartão de Crédito', value: 'CREDIT_CARD' },
        { text: 'Cartão de Débito', value: 'DEBIT_CARD' },
      ],
      clients: [],
      selectedClientId: null, // Use null para o estado "não selecionado" do v-select
      billingItems: [],
      currentPage: 1,
      totalRows: 0, // Inicia com 0
      pageSize: 10,
      selectedPaymentMethod: null,
      showDeleteDialog: false,
      rules: {
  // Regra genérica para campos obrigatórios (seleções, números, etc.)
  required: value => !!value || 'Este campo é obrigatório.',
  
  // Regra específica para campos de TEXTO obrigatórios (impede apenas espaços em branco)
  requiredField: value => (!!value && !!String(value).trim()) || 'Este campo é obrigatório.',
  
  positiveValue: value => (value && parseFloat(value) > 0) || 'O valor deve ser maior que zero.',
},
      deleteErrorMessages: [],
      deleteObservation: '',
      deletingBilling: false,
      showReceiptDialog: false,
      loadingReceipt: false,
      receiptData: { // Inicializado para evitar erros no template
        client: {},
        items: []
      },
      receiptErrorMessages: [],
      showManualBillingDialog: false,
      savingManualBilling: false,
      manualBilling: {
        clientId: null,
        description: '',
        amount: 0,
        createdAt: new Date(), // Inicia com a data atual
      },
      manualBillingErrors: [],
    };
  },
  computed: {
    receiptTotal() {
      if (!this.receiptData || !this.receiptData.items) {
        return 0;
      }
      // Exclude items whose description contains 'Crédito'
      return this.receiptData.items
    .reduce((sum, item) => {
      const isCredito = String(item.description)
        .toLowerCase()
        .includes('crédito');
      const amount = parseFloat(item.amount) || 0;
      return isCredito ? sum - amount : sum + amount;
    }, 0);
    },
    totalPages() {
      if (!this.totalRows || this.totalRows <= 0) return 0;
      return Math.ceil(this.totalRows / this.pageSize);
    },
    paymentMethodFilterOptions() {
      return Object.values(TransactionPaymentMethodEnum).map(value => ({
        text: this.getPaymentMethodText(value),
        value: value,
      }));
    },
    paymentMethodDialogOptions() {
      return Object.values(TransactionPaymentMethodEnum)
        .filter(value => value !== TransactionPaymentMethodEnum.TO_RECEIVE) // 'A Receber' usually isn't a payment option
        .map(value => ({
          text: this.getPaymentMethodText(value),
          value: value,
        }));
    }
  },
  created() {
    this.fetchBillings(this.currentPage, this.pageSize); // Passa os parâmetros iniciais
    this.fetchClients();
  },
  methods: {
    openManualBillingDialog() {
      // Reseta o formulário para um novo lançamento
      this.manualBilling = {
        clientId: null,
        description: '',
        amount: 0,
        createdAt: new Date(), // Garante que a data é um objeto Date para o v-date-picker
      };
      this.manualBillingErrors = [];
      // Aguarda o DOM ser atualizado para resetar a validação
      this.$nextTick(() => {
        this.$refs.manualBillingForm?.resetValidation();
      });
      this.showManualBillingDialog = true;
    },

    closeManualBillingDialog() {
      this.showManualBillingDialog = false;
    },

    async saveManualBilling() {
      this.manualBillingErrors = [];
      const { valid } = await this.$refs.manualBillingForm.validate();
      if (!valid) {
        return;
      }

      this.savingManualBilling = true;
      try {
        const payload = {
          ...this.manualBilling,
          // Garante que a data seja enviada em um formato padrão (ISO String)
          createdAt: this.manualBilling.createdAt.toISOString(),
        };

        // A API deve ser capaz de receber este payload para criar uma nova fatura
        const response = await apiService.post(`/clients/${this.manualBilling.clientId.id}/register-charge`, payload);
        const data = await response.json();

        if (!response.ok) {
          throw (data.message || 'Erro ao salvar a cobrança.');
        }

        // Sucesso
        this.closeManualBillingDialog();
        await this.fetchBillings(); // Atualiza a lista de faturas na tela
        // Opcional: Exibir um snackbar de sucesso aqui.

      } catch (error) {
        console.error("Erro ao registrar cobrança manual:", error);
        this.manualBillingErrors = Array.isArray(error) ? error : [String(error)];
      } finally {
        this.savingManualBilling = false;
      }
    },
    async openReceiptDialog(billing) {
      this.showReceiptDialog = true;
      this.loadingReceipt = true;
      this.receiptErrorMessages = [];
      this.receiptData = { client: {}, items: [] }; // Limpa dados anteriores

      try {
        // Chamada ao novo endpoint da API
        const response = await apiService.get(`/billings/${billing.id}/receipt-details`);
        const data = await response.json();

        if (!response.ok) {
          this.receiptErrorMessages = Array.isArray(data?.message) ? data.message : [data?.message || `Erro ${response.status} ao buscar o resumo.`];
          throw new Error(this.receiptErrorMessages[0]);
        }

        // Sucesso
        this.receiptData = data;

      } catch (error) {
        console.error('Erro ao buscar resumo da fatura:', error);
        if (!this.receiptErrorMessages.length) {
          this.receiptErrorMessages = ['Ocorreu um erro inesperado ao carregar os dados.'];
        }
      } finally {
        this.loadingReceipt = false;
      }
    },
    getPaymentMethodText(methodValue) {
      return paymentMethodDisplayMap[methodValue] || methodValue;
    },
    formatInputDate(date) {
      if (!date) return null;
      // Retorna no formato YYYY-MM-DD que o <input type="date"> espera
      try {
        return new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return null; // Retorna null se a data for inválida
      }
    },
    parseInputDate(dateString) {
      // Tenta converter uma string YYYY-MM-DD ou timestamp para um objeto Date
      if (!dateString) return null;
      const date = new Date(dateString);
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        // Tenta adicionar hora se for só data para evitar problemas de fuso
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const fixedDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // Usa meio-dia para evitar fuso
          if (!isNaN(fixedDate.getTime())) return fixedDate;
        }
        return null;
      }
      return date;
    },

    async updatePurchaseDate(item, newDateObj) {
      if (!newDateObj) return; // Não faz nada se a data for nula/inválida
      // Formata a data para YYYY-MM-DD para enviar à API
      const year = newDateObj.getFullYear();
      const month = (newDateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = newDateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Otimistic update (opcional, mas melhora a UX)
      const originalDate = item.purchasedAt;
      item.purchasedAt = newDateObj.toISOString(); // Atualiza localmente com o objeto Date ou ISO string

      this.errorMessagesItems = []; // Limpa erros anteriores

      try {
        const response = await apiService.patch(`/billings/items/${item.id}/update-purchase-date`, {
          purchaseDate: formattedDate
        });

        const responseData = await response.json(); // Tenta ler o corpo da resposta

        if (!response.ok) {
          // Reverte a atualização otimista
          item.purchasedAt = originalDate;
          this.errorMessagesItems = Array.isArray(responseData?.message) ? responseData.message : [responseData?.message || 'Erro desconhecido ao atualizar data.'];
          console.error('Erro API:', responseData);
          throw new Error(responseData?.message || 'Erro ao atualizar a data');
        }
        // Sucesso - a data já foi atualizada otimisticamente
        // console.log('Data atualizada com sucesso:', responseData);
      } catch (error) {
        // Reverte a atualização otimista em caso de erro de rede/fetch
        if (item.purchasedAt !== originalDate) {
          item.purchasedAt = originalDate;
        }
        if (!this.errorMessagesItems.length) { // Não sobrescreve mensagens de erro da API
          this.errorMessagesItems = ['Erro de comunicação ao atualizar a data de compra.'];
        }
        console.error('Erro ao atualizar data:', error);
      }
    },

    async fetchClients() {
      // Não precisa de loading aqui, geralmente é rápido
      try {
        const response = await apiService.get('/clients?perPage=500'); // Considerar paginação se muitos clientes
        if (!response.ok) {
          throw new Error('Erro ao buscar clientes');
        }
        const data = await response.json();
        // Adiciona uma opção "Todos" se necessário ou deixa o clearable do v-select fazer o trabalho
        this.clients = data.data; // Ajuste mapeamento se necessário: data.data.map(c => ({ text: c.name, value: c.id }))
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao carregar a lista de clientes.'); // Adiciona erro à lista principal
      }
    },

    async fetchBillings(page = 1, perPage = 10) {
      this.loading = true;
      this.errorMessages = []; // Limpa erros anteriores
      try {
        let url = `/billings?page=${page}&perPage=${perPage}`;
        if (this.selectedClientId) {
          url += `&clientId=${this.selectedClientId}`;
        }
        if (this.selectedPaymentMethod) { // Added filter
          url += `&paymentMethod=${this.selectedPaymentMethod}`;
        }
        const response = await apiService.get(url);
        const data = await response.json(); // Lê a resposta mesmo se não for ok

        if (!response.ok) {
          this.billings = []; // Limpa os dados em caso de erro
          this.totalRows = 0;
          if (data && data.message) {
            this.errorMessages = Array.isArray(data.message) ? data.message : [data.message];
          } else {
            this.errorMessages = [`Erro ${response.status}: Não foi possível buscar as faturas.`];
          }
          throw new Error(this.errorMessages[0]); // Lança erro para cair no catch
        }

        this.billings = data.data;
        this.currentPage = parseInt(data.meta?.page || page);
        this.totalRows = parseInt(data.meta?.total || 0);
        this.pageSize = parseInt(data.meta?.perPage || perPage);

      } catch (error) {
        console.error(error);
        if (!this.errorMessages.length) { // Adiciona erro genérico se nenhum foi pego da API
          this.errorMessages = ['Ocorreu um erro inesperado ao buscar as faturas.'];
        }
      } finally {
        this.loading = false;
      }
    },

    async viewBilling(id) {
      // Idealmente, buscaria da API para ter os dados mais recentes,
      // mas podemos usar o local para economizar requests se os dados da tabela forem suficientes.
      const billing = this.billings.find(b => b.id === id);
      if (billing) {
        this.currentBilling = { ...billing }; // Cria cópia para evitar mutação
        this.showDetailsDialog = true;
      } else {
        this.errorMessages = ['Fatura não encontrada na lista atual.'];
        // Opcional: Buscar da API se não encontrar
        // await this.fetchSingleBilling(id);
      }
    },
    // Função separada caso precise buscar um único item (opcional)
    // async fetchSingleBilling(id) { ... }

    payBilling(id) {
      const billing = this.billings.find(billing => billing.id === id);
      if (billing) {
        this.currentBilling = { ...billing };
        this.amount = billing.amount; // Usa o valor total como padrão
        this.paymentMethod = ''; // Reseta o método de pagamento
        this.errorMessages = []; // Limpa erros no modal de pagamento
        this.showPayDialog = true;
      } else {
        this.errorMessages = ['Fatura não encontrada para pagamento.'];
      }
    },

    async confirmPayBilling() {
      // Validação básica (Vuetify <v-form> pode fazer mais)
      if (!this.paymentMethod || !this.amount || parseFloat(this.amount) <= 0) {
        this.errorMessages = ['Por favor, preencha o método de pagamento e um valor válido.'];
        return;
      }
      this.loading = true; // Poderia ter um loading específico para o botão/dialog
      this.errorMessages = []; // Limpa erros

      try {
        const payload = {
          // Garante que o valor seja numérico
          amount: parseFloat(this.amount) || 0,
          paymentMethod: this.paymentMethod
        };
        const response = await apiService.patch(
          `/billings/${this.currentBilling.id}/pay`,
          payload
        );
        const responseData = await response.json(); // Lê mesmo se não OK

        if (!response.ok) {
          if (responseData && responseData.message) {
            this.errorMessages = Array.isArray(responseData.message) ? responseData.message : [responseData.message];
          } else {
            this.errorMessages = [`Erro ${response.status} ao tentar pagar a fatura.`];
          }
          throw new Error(this.errorMessages[0]);
        }

        this.closePayModal(); // Fecha o modal em caso de sucesso
        await this.fetchBillings(this.currentPage, this.pageSize); // Recarrega a lista
        // Opcional: Exibir mensagem de sucesso (e.g., usando v-snackbar)

      } catch (error) {
        console.error(error);
        // A mensagem de erro já deve ter sido definida no bloco de erro da resposta
        if (!this.errorMessages.length) {
          this.errorMessages = ['Ocorreu um erro inesperado ao processar o pagamento.'];
        }
      } finally {
        this.loading = false; // Desativa loading geral (ou específico)
      }
    },

    async viewBillingItems(id) {
      const billing = this.billings.find(b => b.id === id);
      if (!billing) {
        this.errorMessages = ['Fatura não encontrada para visualizar itens.'];
        return;
      }
      this.currentBilling = { ...billing }; // Guarda a fatura atual para contexto no título
      this.loadingItems = true;
      this.billingItems = []; // Limpa itens anteriores
      this.errorMessagesItems = []; // Limpa erros do modal de itens
      this.showItemsDialog = true; // Abre o modal imediatamente

      try {
        const response = await apiService.get(`/billings/${id}/items`);
        const data = await response.json();

        if (!response.ok) {
          this.errorMessagesItems = Array.isArray(data?.message) ? data.message : [data?.message || `Erro ${response.status} ao buscar itens.`];
          throw new Error(this.errorMessagesItems[0]);
        }
        this.billingItems = data; // Assume que a resposta é um array de itens

      } catch (error) {
        console.error(error);
        if (!this.errorMessagesItems.length) {
          this.errorMessagesItems = ['Ocorreu um erro inesperado ao buscar os itens da fatura.'];
        }
      } finally {
        this.loadingItems = false;
      }
    },

    // Métodos para fechar modals (agora apenas alteram o v-model)
    closeItemsModal() {
      this.showItemsDialog = false;
      // É bom limpar os dados ao fechar para não mostrar dados antigos brevemente na próxima abertura
      this.billingItems = [];
      this.errorMessagesItems = [];
      this.currentBilling = {}; // Limpa fatura atual
    },
    closeDetailsModal() {
      this.showDetailsDialog = false;
      this.currentBilling = {};
    },
    closePayModal() {
      this.showPayDialog = false;
      this.errorMessages = []; // Limpa erros do modal de pagamento ao fechar
      this.currentBilling = {};
    },

    // Funções de formatação (mantidas como estavam)
    formatDateWithHour(dateString) {
      if (!dateString) return 'Não pago'; // Ou 'N/A'
      return formatDateHour(dateString);
    },
    formatDateWithoutHour(dateString) {
      if (!dateString) return 'N/A';
      return formatDate(dateString);
    },
    currency(value) {
      if (value === null || value === undefined || isNaN(Number(value))) {
        return 'R$ 0,00'; // Ou 'Inválido'
      }
      // Garante que é um número antes de formatar
      return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
    },
    formatAmount(amount, type) {
      let adjustedAmount = parseFloat(amount);
      if (isNaN(adjustedAmount)) return this.currency(0); // Retorna R$ 0,00 se inválido

      // Considera o tipo 'CREDIT' como negativo apenas se ele explicitamente existir
      // Se o valor já vier negativo da API, não inverte novamente.
      if (type === 'CREDIT' && adjustedAmount > 0) {
        adjustedAmount = -Math.abs(adjustedAmount);
      }
      // Se não for 'CREDIT', garante que seja positivo (ou zero)
      else if (type !== 'CREDIT' && adjustedAmount < 0) {
        adjustedAmount = Math.abs(adjustedAmount); // Ou talvez manter como está, depende da regra de negócio
      }
      return this.currency(adjustedAmount);
    },

    // Ação quando o cliente é selecionado no combo/select
    onClientSelected(clientId) {
      // O v-select já atualiza o v-model (selectedClientId)
      // Se estiver usando o ClientCombo customizado, garanta que ele emita o ID
      this.selectedClientId = clientId; // Garante que está atualizado
      this.currentPage = 1; // Reseta para a primeira página ao mudar o filtro
      this.fetchBillings(this.currentPage, this.pageSize);
    },
    // Chamado quando o v-select é limpo (clearable) ou se usar um @change manual
    onClientChange() {
      this.currentPage = 1;
      this.fetchBillings(this.currentPage, this.pageSize);
    },
    onPaymentMethodChange() { // Handler for the new filter
      this.currentPage = 1;
      this.fetchBillings(this.currentPage, this.pageSize);
    },
    // Ação quando a página muda na paginação
    handlePageChange(newPage) {
      // O v-model="currentPage" já atualiza o valor
      // A chamada @update:modelValue="handlePageChange" garante que buscamos os dados
      this.fetchBillings(newPage, this.pageSize);
    },
    formatPaymentMethod(methodKey) {
      return this.getPaymentMethodText(methodKey);
    },
    openDeleteDialog(billing) {
      this.billingToDelete = { ...billing };
      this.deleteObservation = '';
      this.deleteErrorMessages = [];
      // Reset validation if form exists (it should after first open)
      if (this.$refs.deleteBillingForm) {
        this.$refs.deleteBillingForm.resetValidation();
      }
      this.showDeleteDialog = true;
    },

    closeDeleteDialog() {
      //if (this.deletingBilling) return;
      this.showDeleteDialog = false;
      this.billingToDelete = null;
      this.deleteObservation = '';
      this.deleteErrorMessages = [];
      // Reset validation state of the form
      if (this.$refs.deleteBillingForm) {
        this.$refs.deleteBillingForm.resetValidation();
      }
    },

    async confirmDeleteBilling() {
      this.deleteErrorMessages = []; // Clear API error messages

      // Validate the form using the ref
      const { valid } = await this.$refs.deleteBillingForm.validate();
      if (!valid) {
        // Vuetify will show error messages next to the fields.
        // You could add a general message to deleteErrorMessages if you want one in the v-alert too.
        this.deleteErrorMessages.push('Por favor, preencha os campos obrigatórios.');
        return;
      }

      if (!this.billingToDelete || !this.billingToDelete.id) {
        this.deleteErrorMessages = ['Nenhuma fatura selecionada para exclusão.'];
        return;
      }

      this.deletingBilling = true;

      try {
        const payload = {
          obs: this.deleteObservation.trim(), // Send as 'obs' and trim whitespace
        };

        // The API expects 'obs' in the payload for the DELETE request
        const response = await apiService.delete(`/billings/${this.billingToDelete.id}`, payload);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json(); // Try to parse error response

          } catch (e) {
            // Fallback if response is not JSON or some other network error
            errorData = { message: `Erro ${response.status} ao excluir a fatura. Detalhes: ${response.statusText}` };
          }
          // The API returns message as an array
          this.deleteErrorMessages = Array.isArray(errorData?.message) ? errorData.message : [errorData?.message || `Erro desconhecido ao excluir.`];
          throw new Error(this.deleteErrorMessages.join(', ') || 'Erro ao excluir fatura.');
        }

        // Success
        this.closeDeleteDialog(); // This will also reset validation
        // Consider showing a success snackbar here

        await this.fetchBillings(this.currentPage, this.pageSize);

        if (this.billings.length === 0 && this.currentPage > 1) {
          this.currentPage--;
          await this.fetchBillings(this.currentPage, this.pageSize);
        }

      } catch (error) {
        console.error('Erro ao excluir fatura:', error);
        // Ensure deleteErrorMessages has something if it's still empty
        if (this.deleteErrorMessages.length === 0) {
          this.deleteErrorMessages = ['Ocorreu um erro inesperado ao tentar excluir a fatura.'];
        }
      } finally {
        this.deletingBilling = false;
      }
    },
  }
};
</script>

<style scoped>
/* Estilos específicos do Bootstrap podem ser removidos */
/* Exemplo: remover estilos de .modal se não forem mais necessários */

/* Adicionar estilos específicos do Vuetify, se necessário */
.v-table tbody tr:hover {
  background-color: #f5f5f5;
  /* Exemplo de hover suave */
}

/* Garante que o texto no input de data fique alinhado se necessário */
.v-date-picker+.v-text-field input {
  text-align: center;
}
</style>