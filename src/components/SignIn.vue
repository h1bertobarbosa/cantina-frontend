<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="4" class="pa-4">
          <v-card-title class="text-h5 text-center mb-4">Login</v-card-title>

          <v-card-text>
            <!-- Error Messages -->
            <v-alert
              v-if="errorMessages.length"
              type="error"
              variant="tonal"
              border="start"
              density="compact"
              class="mb-4"
              closable
              @update:modelValue="errorMessages = []"
            >
              <ul>
                <li v-for="(error, index) in errorMessages" :key="`err-${index}`">
                  {{ error }}
                </li>
              </ul>
            </v-alert>

            <!-- Login Form -->
            <v-form ref="loginForm" @submit.prevent="submitForm">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="emailRules"
                required
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-email-outline"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Senha"
                :type="isPasswordVisible ? 'text' : 'password'"
                :rules="passwordRules"
                required
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="togglePasswordVisibility"
                class="mb-3"
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                :loading="isSubmitting"
                :disabled="isSubmitting"
                block
                class="mt-2"
              >
                Entrar
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Optional: Add links like "Forgot Password?" or "Sign Up" here in v-card-actions if needed -->
          <!--
          <v-card-actions class="justify-center">
            <v-btn text small color="primary">Esqueci minha senha</v-btn>
          </v-card-actions>
          -->
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { apiService } from '../services/apiService'; // Assuming this path is correct

export default {
  name: 'SignIn',
  data() {
    return {
      email: '',
      password: '',
      errorMessages: [],
      isSubmitting: false,
      isPasswordVisible: false, // For password visibility toggle

      // Validation Rules
      emailRules: [
        (v) => !!v || 'E-mail é obrigatório',
        (v) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
      ],
      passwordRules: [
        (v) => !!v || 'Senha é obrigatória',
        // Add more rules like minimum length if needed
        // (v) => (v && v.length >= 6) || 'Senha deve ter pelo menos 6 caracteres',
      ],
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
    },

    async submitForm() {
      this.errorMessages = []; // Clear previous errors

      // Validate form using Vuetify's built-in validation
      // $refs is available in Options API
      const { valid } = await this.$refs.loginForm.validate();

      if (!valid) {
        return; // Stop submission if form is invalid
      }

      // If valid, proceed with submission
      this.isSubmitting = true;
      const payload = {
        email: this.email,
        password: this.password,
      };

      try {
        const response = await apiService.post('/signin', payload);
        const responseData = await response.json(); // Try to parse JSON regardless of status

        if (!response.ok) {
          if (responseData && responseData.message) {
            this.errorMessages = Array.isArray(responseData.message)
              ? responseData.message
              : [responseData.message];
          } else {
             // Generic error if no message from API
            this.errorMessages = [`Erro ${response.status}: Falha ao autenticar.`];
          }
          // Optionally, reset form validation state if desired after server error
          // this.$refs.loginForm.resetValidation();
          return; // Stop execution
        }

        // SUCCESS
        const accessToken = responseData.accessToken;
        localStorage.setItem('accessToken', accessToken); // Store token

        // Redirect (ensure vue-router is configured)
        // Use optional chaining in case $router is not available during testing etc.
        this.$router?.push('/dashboard'); // Use named route if available

      } catch (error) {
        console.error('Login API Error:', error);
        // Handle network errors or other exceptions during fetch/JSON parsing
        this.errorMessages = ['Ocorreu um erro de comunicação. Tente novamente.'];
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
/* Optional: Add custom styles if needed, but Vuetify handles most */
.fill-height {
  min-height: 90vh; /* Adjust as needed to vertically center */
}

/* Override default list style in alert if needed */
.v-alert ul {
  padding-left: 20px; /* Add some padding */
  margin-bottom: 0; /* Remove default bottom margin */
}
</style>