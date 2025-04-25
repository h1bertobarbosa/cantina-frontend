<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="mb-4">Dashboard</h1>
      </v-col>
    </v-row>

    <!-- Seleção do Período e Botão de Busca -->
    <v-row align="center" class="mb-3">
      <v-col cols="12" sm="4" md="3">
        <v-text-field
          v-model="startDate"
          label="Data Inicial"
          type="date"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <v-text-field
          v-model="endDate"
          label="Data Final"
          type="date"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="4" md="2">
        <v-btn color="primary" @click="updateData" :loading="loading">
          Buscar
          <template v-slot:loader>
             <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
          </template>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Exibição das Mensagens de Erro -->
    <v-row v-if="errorMessages.length">
      <v-col cols="12">
        <v-alert
          v-model="showErrorAlert"
          type="error"
          variant="tonal"
          closable
          border="start"
          class="mb-4"
          title="Erros Encontrados"
        >
          <ul>
            <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Layout dos Cards -->
    <v-row class="mb-3">
      <!-- Card 1: Total a Receber (Período Selecionado) -->
      <v-col cols="12" sm="6" xl="4">
        <v-card color="warning" variant="tonal" class="h-100">
          <v-card-text>
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-icon size="large" class="mr-3">mdi-currency-usd-off</v-icon> <!-- Ícone para 'a receber' -->
              </v-col>
              <v-col>
                <div class="text-overline text-warning">Total a Receber (Período)</div>
                <div class="text-h5 font-weight-bold">{{ currency(totalReceivablePeriod) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Card 2: Total Recebido (Período Selecionado) -->
      <v-col cols="12" sm="6" xl="4">
        <v-card color="success" variant="tonal" class="h-100">
           <v-card-text>
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-icon size="large" class="mr-3">mdi-check-circle-outline</v-icon>
              </v-col>
              <v-col>
                <div class="text-overline text-success">Total Recebido (Período)</div>
                <div class="text-h5 font-weight-bold">{{ currency(totalReceivedPeriod) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Card 3: Total a Receber (Geral) -->
      <v-col cols="12" sm="6" xl="4">
         <v-card color="error" variant="tonal" class="h-100">
           <v-card-text>
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-icon size="large" class="mr-3">mdi-alert-circle-outline</v-icon> <!-- Ícone para 'geral/alerta' -->
              </v-col>
              <v-col>
                <div class="text-overline text-error">Total a Receber (Geral)</div>
                <div class="text-h5 font-weight-bold">{{ currency(totalReceivableAllTime) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { format } from 'date-fns'; // Certifique-se que date-fns está instalado (npm install date-fns)
import { apiService } from '../services/apiService'; // Mantenha seu serviço de API

// --- Estado Reativo ---
const startDate = ref(''); // Data inicial selecionada pelo usuário
const endDate = ref('');   // Data final selecionada pelo usuário
const totalReceivablePeriod = ref(0);
const totalReceivableAllTime = ref(0);
const totalReceivedPeriod = ref(0);
const errorMessages = ref([]);
const loading = ref(false); // Estado de carregamento para o botão e/ou cards

// --- Computeds ---
// Para controlar a visibilidade do v-alert de forma reativa
const showErrorAlert = computed({
  get: () => errorMessages.value.length > 0,
  set: (value) => {
    if (!value) {
      errorMessages.value = [];
    }
  }
});

// --- Métodos ---
const currency = (value) => {
  // Verifica se o valor é numérico antes de formatar
  const numberValue = Number(value);
  if (isNaN(numberValue)) {
    return 'R$ 0,00'; // Ou algum valor padrão/indicador de erro
  }
  return 'R$ ' + numberValue.toFixed(2).replace('.', ',');
};

// Função auxiliar para lidar com chamadas API e erros
async function fetchData(url, targetRef, errorMessagePrefix) {
  try {
    const response = await apiService.get(url); // Assumindo que apiService.get retorna a resposta bruta ou lança erro

    if (response === null || response === undefined) { // Exemplo: apiService retorna null em caso de erro
       throw new Error(`${errorMessagePrefix}: Resposta inválida da API.`);
    }

    const data = await response.json()
    if (data && data.total !== undefined) {
      targetRef.value = data.total;
    } else {
      console.warn(`${errorMessagePrefix}: Resposta da API não contém 'total'. Resposta:`, data);
      targetRef.value = 0; // Define um valor padrão
    }

  } catch (error) {
    console.error(error);
    // Tenta extrair uma mensagem mais específica do erro, se disponível
    const message = error?.response?.data?.message || error?.message || `Erro ao buscar ${errorMessagePrefix.toLowerCase()}.`;
    if (!errorMessages.value.includes(message)) {
        errorMessages.value.push(message);
    }
    targetRef.value = 0; // Reseta o valor em caso de erro
  }
}

const fetchTotalReceivablePeriod = async () => {
  let url = `/dashboard/total-sales?paymentMethod=TO_RECEIVE`;
  if (startDate.value) {
    // Formatar a data *antes* de adicionar à URL
    try {
      const formattedStartDate = format(new Date(startDate.value), 'yyyy-MM-dd');
      url += `&startDate=${formattedStartDate}`;
    } catch (e) { console.error("Data inicial inválida:", startDate.value); /* Tratar erro? */ }
  }
  if (endDate.value) {
     try {
       const formattedEndDate = format(new Date(endDate.value), 'yyyy-MM-dd');
       url += `&endDate=${formattedEndDate}`;
     } catch (e) { console.error("Data final inválida:", endDate.value); /* Tratar erro? */ }
  }
  await fetchData(url, totalReceivablePeriod, 'Total a receber no período');
};

const fetchTotalReceivableAllTime = async () => {
  const url = `/dashboard/total-sales?paymentMethod=TO_RECEIVE`;
  await fetchData(url, totalReceivableAllTime, 'Total a receber geral');
};

const fetchTotalReceivedPeriod = async () => {
  let url = `/dashboard/total-sales?paymentMethod=PIX`; // Ou outra forma de identificar recebidos
  if (startDate.value) {
     try {
       const formattedStartDate = format(new Date(startDate.value), 'yyyy-MM-dd');
       url += `&startDate=${formattedStartDate}`;
     } catch (e) { console.error("Data inicial inválida:", startDate.value); }
  }
  if (endDate.value) {
    try {
      const formattedEndDate = format(new Date(endDate.value), 'yyyy-MM-dd');
      url += `&endDate=${formattedEndDate}`;
    } catch (e) { console.error("Data final inválida:", endDate.value); }
  }
  await fetchData(url, totalReceivedPeriod, 'Total recebido no período');
};

const updateData = async () => {
  errorMessages.value = []; // Limpa erros anteriores
  loading.value = true;

  // Valida as datas
  if (startDate.value && endDate.value && new Date(startDate.value) > new Date(endDate.value)) {
    errorMessages.value.push('A data inicial não pode ser posterior à data final.');
    loading.value = false;
    return;
  }

  // Chama os métodos para buscar os dados em paralelo
  try {
    await Promise.all([
      fetchTotalReceivablePeriod(),
      fetchTotalReceivableAllTime(), // Geralmente não precisa ser atualizado com o período, mas mantendo a lógica original
      fetchTotalReceivedPeriod()
    ]);
  } finally {
    loading.value = false; // Garante que o loading termine mesmo se houver erros
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // Define datas padrão se necessário (ex: mês atual)
  // const today = new Date();
  // const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  // startDate.value = format(firstDayOfMonth, 'yyyy-MM-dd');
  // endDate.value = format(today, 'yyyy-MM-dd');

  updateData(); // Busca os dados iniciais ao montar o componente
});

// A função logout não estava sendo usada no template original,
// mas pode ser adicionada a um botão no layout principal se necessário.
// import { useRouter } from 'vue-router';
// const router = useRouter();
// const logout = () => {
//   localStorage.removeItem('accessToken');
//   router.push('/signin');
// };

</script>

<style scoped>
/* Estilos específicos podem ser adicionados aqui se necessário, mas Vuetify deve cobrir a maioria */
.h-100 {
  height: 100%; /* Garante que os cards tenham a mesma altura na linha */
}

/* Ajuste fino de espaçamento se necessário */
.v-card-text .v-row {
  min-height: 60px; /* Exemplo: Altura mínima para alinhar conteúdo verticalmente */
}
</style>