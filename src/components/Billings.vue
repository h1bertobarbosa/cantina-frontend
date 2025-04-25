<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h2>Gerenciar Faturas</h2>
      </v-col>
    </v-row>

    <!-- Filtro de Cliente -->
    <v-row align="center">
      <v-col cols="12" md="4">
        <!-- Assumindo que ClientCombo se adapta ou será refatorado para Vuetify -->
        <!-- Se ClientCombo for simples, poderia ser substituído por v-select -->
        <ClientCombo :clients="clients" label="Filtrar por Cliente" @selected="onClientSelected" variant="outlined"
          density="compact" clearable />
        <!-- Alternativa se ClientCombo for apenas um select:
        <v-select
          label="Filtrar por Cliente"
          :items="clients"
          item-title="name" // Ajuste conforme a propriedade do nome do cliente
          item-value="id" // Ajuste conforme a propriedade do ID do cliente
          v-model="selectedClientId"
          @update:modelValue="onClientChange"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
         -->
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
              <td>{{ billing.paymentMethod }}</td>
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
          <p><strong>Método de Pagamento:</strong> {{ currentBilling.paymentMethod }}</p>
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
            <!-- Alternativa com v-text-field (requer formatação manual/biblioteca externa para máscara de moeda) -->
            <!--
               <v-text-field
                 label="Valor a Pagar"
                 v-model="amount"
                 required
                 type="number"
                 prefix="R$"
                 :rules="[v => !!v || 'Valor é obrigatório']"
                 variant="outlined"
                 density="compact"
                 class="mt-3"
               ></v-text-field>
                -->

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
          Itens da Fatura ({{ currentBilling.clientName }} - {{ currentBilling.description }})
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showItemsDialog = false"></v-btn>
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
                <th class="text-left">Cliente</th>
                <th class="text-left">Descrição</th>
                <th class="text-left">Valor</th>
                <th class="text-left">Método Pag.</th>
                <th class="text-left">Data Compra</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in billingItems" :key="item.id">
                <td>{{ item.clientName }}</td>
                <td>{{ item.description }}</td>
                <td>{{ formatAmount(item.amount, item.type) }}</td>
                <td>{{ item.paymentMethod }}</td>
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
// REMOVIDO: import Pagination from '@/components/Pagination.vue';

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
    };
  },
  computed: {
    totalPages() {
      if (!this.totalRows || this.totalRows <= 0) return 0;
      return Math.ceil(this.totalRows / this.pageSize);
    }
  },
  created() {
    this.fetchBillings(this.currentPage, this.pageSize); // Passa os parâmetros iniciais
    this.fetchClients();
  },
  methods: {
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

    // Ação quando a página muda na paginação
    handlePageChange(newPage) {
      // O v-model="currentPage" já atualiza o valor
      // A chamada @update:modelValue="handlePageChange" garante que buscamos os dados
      this.fetchBillings(newPage, this.pageSize);
    }
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