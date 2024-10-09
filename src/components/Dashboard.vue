<template>
  <div>
    <h1>Dashboard</h1>

    <!-- Seleção do Período e Botão de Busca -->
    <div class="form-inline mb-3">
      <label for="startDate" class="mr-2">Data Inicial:</label>
      <input type="date" id="startDate" v-model="startDate" class="form-control mr-3" />

      <label for="endDate" class="mr-2">Data Final:</label>
      <input type="date" id="endDate" v-model="endDate" class="form-control mr-3" />

      <button class="btn btn-primary" @click="updateData">Buscar</button>
    </div>

    <!-- Exibição das Mensagens de Erro -->
    <div v-if="errorMessages.length" class="alert alert-danger">
      <ul>
        <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
      </ul>
    </div>

    <!-- Layout dos Cards -->
    <div class="row mb-3">
      <!-- Card 1: Total a Receber (Período Selecionado) -->
      <div class="col-xl-4 col-sm-6 py-2">
        <div class="card bg-warning text-white h-100">
          <div class="card-body bg-warning">
            <div class="rotate">
              <i class="fa fa-money fa-4x"></i>
            </div>
            <h6 class="text-uppercase">Total a Receber (Período)</h6>
            <h1 class="display-4">{{ currency(totalReceivablePeriod) }}</h1>
          </div>
        </div>
      </div>
      <!-- Card 2: Total Recebido (Período Selecionado) -->
      <div class="col-xl-4 col-sm-6 py-2">
        <div class="card bg-success text-white h-100">
          <div class="card-body bg-success">
            <div class="rotate">
              <i class="fa fa-check fa-4x"></i>
            </div>
            <h6 class="text-uppercase">Total Recebido (Período)</h6>
            <h1 class="display-4">{{ currency(totalReceivedPeriod) }}</h1>
          </div>
        </div>
      </div>
      <!-- Card 3: Total a Receber (Geral) -->
      <div class="col-xl-4 col-sm-6 py-2">
        <div class="card bg-danger text-white h-100">
          <div class="card-body bg-danger">
            <div class="rotate">
              <i class="fa fa-exclamation-triangle fa-4x"></i>
            </div>
            <h6 class="text-uppercase">Total a Receber (Geral)</h6>
            <h1 class="display-4">{{ currency(totalReceivableAllTime) }}</h1>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script>
import { format } from 'date-fns';
import { apiService } from '../services/apiService';
export default {
  name: 'DashBoard',

  data() {
    return {
      startDate: '', // Data inicial selecionada pelo usuário
      endDate: '',   // Data final selecionada pelo usuário
      totalReceivablePeriod: 0,
      totalReceivableAllTime: 0,
      totalReceivedPeriod: 0,
      errorMessages: [],
    };
  },
  created() {
    this.updateData();
  },
  methods: {
    currency(value) {
      return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    },
    logout() {
      localStorage.removeItem('accessToken');
      this.$router.push('/signin');
    },
    async fetchTotalReceivablePeriod() {
      try {
        let url = `/dashboard/total-sales?paymentMethod=TO_RECEIVE`;
        if (this.startDate) {
          const formattedStartDate = format(this.startDate, 'yyyy-MM-dd');
          url += `&startDate=${formattedStartDate}`;
        }
        if (this.endDate) {
          const formattedEndDate = format(this.endDate, 'yyyy-MM-dd');
          url += `&endDate=${formattedEndDate}`;
        }
        const response = await apiService.get(url);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages.push(errorData.message || 'Erro ao buscar total a receber no período.');
          return;
        }
        const data = await response.json();
        this.totalReceivablePeriod = data.total;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar total a receber no período.');
      }
    },
    async fetchTotalReceivableAllTime() {
      try {
        const url = `/dashboard/total-sales?paymentMethod=TO_RECEIVE`;
        const response = await apiService.get(url);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages.push(errorData.message || 'Erro ao buscar total a receber geral.');
          return;
        }
        const data = await response.json();
        this.totalReceivableAllTime = data.total;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar total a receber geral.');
      }
    },
    async fetchTotalReceivedPeriod() {
      try {
        let url = `/dashboard/total-sales?paymentMethod=PIX`;
        if (this.startDate) {
          url += `&startDate=${this.startDate}`;
        }
        if (this.endDate) {
          url += `&endDate=${this.endDate}`;
        }
        const response = await apiService.get(url);
        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages.push(errorData.message || 'Erro ao buscar total recebido no período.');
          return;
        }
        const data = await response.json();
        this.totalReceivedPeriod = data.total;
      } catch (error) {
        console.error(error);
        this.errorMessages.push('Erro ao buscar total recebido no período.');
      }
    },

    updateData() {
      this.errorMessages = [];
      // Valida as datas
      if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.errorMessages.push('A data inicial deve ser anterior à data final.');
        return;
      }
      // Chama os métodos para buscar os dados
      this.fetchTotalReceivablePeriod();
      this.fetchTotalReceivableAllTime();
      this.fetchTotalReceivedPeriod();
    },
  }
};
</script>

<style scoped>
.rotate {
  float: left;
  height: 100%;
}

.rotate i {
  display: block;
  transform: rotate(-20deg);
}

.card-body {
  position: relative;
}

.card-body h6 {
  font-size: 16px;
}

.card-body .display-4 {
  font-size: 2.5rem;
}

.form-inline label {
  margin-right: 5px;
}

.form-inline .form-control {
  margin-right: 15px;
}
</style>
