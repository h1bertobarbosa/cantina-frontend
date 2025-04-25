<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-card elevation="2" class="pa-4">
          <v-card-title class="text-h5 text-center mb-4">
            Cadastro
          </v-card-title>

          <v-card-text>
            <!-- Error Messages -->
            <v-alert
              v-if="errorMessages.length"
              type="error"
              variant="tonal"
              border="start"
              prominent
              closable
              density="compact"
              class="mb-4"
              @update:modelValue="errorMessages = []"
            >
              <ul>
                <li v-for="(error, index) in errorMessages" :key="`err-${index}`">{{ error }}</li>
              </ul>
            </v-alert>

            <!-- Success Message -->
             <v-alert
                v-if="successMessage"
                type="success"
                variant="tonal"
                border="start"
                density="compact"
                class="mb-4"
                closable
                @update:modelValue="successMessage = ''"
              >
               {{ successMessage }}
              </v-alert>

            <v-form ref="signUpForm" v-model="isFormValid" @submit.prevent="submitForm">
              <!-- Company Section -->
              <div class="text-subtitle-1 mb-2">Dados da Empresa</div>
              <v-text-field
                v-model="companyName"
                label="Nome da Empresa"
                :rules="[rules.required]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="companyEmail"
                label="Email da Empresa"
                type="email"
                :rules="[rules.required, rules.email]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="companyDocument"
                label="Documento da Empresa (CNPJ/CPF)"
                :rules="[rules.required]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
                hint="Apenas números"
                persistent-hint
                @input="formatDocument"
              ></v-text-field>

              <v-divider class="my-4"></v-divider>

              <!-- User Section -->
              <div class="text-subtitle-1 mb-2">Dados do Usuário Principal</div>
              <v-text-field
                v-model="name"
                label="Nome Completo"
                :rules="[rules.required]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="email"
                label="Seu Email (para login)"
                type="email"
                :rules="[rules.required, rules.email]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Senha"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :rules="[rules.required, rules.passwordLength]"
                required
                variant="outlined"
                density="compact"
                class="mb-3"
                hint="Mínimo 8 caracteres"
                persistent-hint
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                block
                large
                :loading="loading"
                :disabled="!isFormValid || loading"
                class="mt-4"
              >
                Cadastrar
              </v-btn>
            </v-form>
          </v-card-text>

           <v-card-actions class="justify-center">
             <v-btn variant="text" color="primary" @click="goToLogin">
               Já tem uma conta? Faça Login
             </v-btn>
           </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for general feedback (alternative to inline alert) -->
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="3000"
        location="top right"
     >
       {{ snackbar.text }}
       <template v-slot:actions>
         <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
       </template>
     </v-snackbar>

  </v-container>
</template>

<script>
import { apiService } from '../services/apiService'; // Assuming apiService is correctly set up
import { useRouter } from 'vue-router'; // Import for Vue 3 routing

export default {
  name: 'SignUp',
  setup() {
    // Use Vue Router programmatically in setup
    const router = useRouter();
    const goToLogin = () => {
      router.push('/signin'); // Adjust '/login' to your actual login route
    };
    return { router, goToLogin };
  },
  data() {
    return {
      // Form Models
      companyName: '',
      companyEmail: '',
      companyDocument: '',
      name: '',
      email: '',
      password: '',

      // UI State
      loading: false,
      isFormValid: false, // Tracks v-form validity
      showPassword: false,
      errorMessages: [],
      successMessage: '', // For inline success message after signup

      // Snackbar State
       snackbar: {
         show: false,
         text: '',
         color: 'info', // Default color
       },

      // Validation Rules
      rules: {
        required: value => !!value || 'Este campo é obrigatório.',
        email: value => /.+@.+\..+/.test(value) || 'E-mail inválido.',
        passwordLength: value => (value && value.length >= 8) || 'A senha deve ter no mínimo 8 caracteres.',
        // Basic document validation (only numbers) - enhance if needed
        document: value => /^\d+$/.test(value) || 'Documento deve conter apenas números.'
      }
    };
  },
  methods: {
    // Helper to show snackbar
    showSnackbar(text, color = 'info') {
        this.snackbar.text = text;
        this.snackbar.color = color;
        this.snackbar.show = true;
    },

    // Basic document formatter (removes non-digits)
    formatDocument() {
       this.companyDocument = this.companyDocument.replace(/\D/g, '');
    },

    async login(payload) {
      this.loading = true; // Keep loading active during login attempt
      this.errorMessages = []; // Clear previous errors
      try {
        const response = await apiService.post('/signin', payload);

        if (!response.ok) {
          const errorData = await response.json();
           this.handleApiError(errorData, 'Erro ao realizar o login automático.');
          return false; // Indicate login failure
        }

        const data = await response.json();
        const accessToken = data.accessToken;
        localStorage.setItem('accessToken', accessToken);
        this.showSnackbar('Login automático realizado com sucesso!', 'success');

        // Wait a bit for snackbar visibility then redirect
        setTimeout(() => {
            this.router.push('/dashboard'); // Use injected router
        }, 1000);

        return true; // Indicate login success

      } catch (error) {
        console.error("Login Error:", error);
        this.errorMessages = ['Ocorreu um erro inesperado durante o login. Verifique sua conexão.'];
        return false; // Indicate login failure
      } finally {
         // Don't turn off loading here if redirecting immediately
         // this.loading = false;
      }
    },

    async submitForm() {
      // Trigger validation using the ref
      const { valid } = await this.$refs.signUpForm.validate();

      if (!valid) {
        this.showSnackbar('Por favor, corrija os erros no formulário.', 'warning');
        return;
      }

      // Passed validation, proceed with submission
      this.loading = true;
      this.errorMessages = [];
      this.successMessage = ''; // Clear previous success

      const payload = {
        companyName: this.companyName,
        companyEmail: this.companyEmail,
        // Send only digits for document
        companyDocument: this.companyDocument.replace(/\D/g, ''),
        name: this.name,
        email: this.email,
        password: this.password
      };

      try {
        const response = await apiService.post('/signup', payload);
        const responseData = await response.json(); // Try to read body even on error

        if (!response.ok) {
           this.handleApiError(responseData, 'Erro ao realizar o cadastro.');
           return; // Stop execution on signup error
        }

        // Signup Success
        this.successMessage = 'Cadastro realizado com sucesso! Tentando login automático...';
        // Optional: Reset form fields here if desired
        // this.$refs.signUpForm.reset();

        // Attempt automatic login after successful signup
        const loggedIn = await this.login({
          email: this.email,
          password: this.password,
        });

        if (!loggedIn) {
           // Login failed after signup, keep loading false but maybe show a message
           this.loading = false; // Turn off loading if login failed
           this.showSnackbar('Cadastro realizado, mas o login automático falhou. Por favor, faça login manualmente.', 'warning');
           // Optionally redirect to login page anyway
           // setTimeout(() => this.goToLogin(), 2000);
        }
        // If login succeeds, it handles redirect and keeps loading true until then

      } catch (error) {
        console.error("Signup Error:", error);
        this.errorMessages = ['Ocorreu um erro inesperado durante o cadastro. Verifique sua conexão.'];
        this.loading = false; // Ensure loading is off on unexpected errors
      }
       // No finally block here for loading, as login handles it
    },

    // Helper function to handle API error messages
     handleApiError(errorData, defaultMessage) {
        if (errorData && errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
         } else {
            this.errorMessages = [defaultMessage];
         }
         this.loading = false; // Stop loading on error
     }
  }
};
</script>

<style scoped>
/* Add any specific custom styles here if needed */
.v-card-actions .v-btn {
  text-transform: none; /* Prevent uppercase button text if desired */
}
</style>