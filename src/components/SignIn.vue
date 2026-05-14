<template>
  <div class="auth-shell">
    <div class="auth-container">
      <section class="auth-panel auth-panel--brand">
        <div class="brand-chip">
          <i class="pi pi-shop" />
          <span>Plataforma Cantina</span>
        </div>

        <div>
          <p class="auth-eyebrow">
            Acesso administrativo
          </p>
          <h1 class="auth-title">
            Entre e acompanhe a operacao da sua cantina.
          </h1>
          <p class="auth-description">
            Consulte vendas, clientes, faturas e cadastros em um painel organizado, com o mesmo padrao visual do sistema.
          </p>
        </div>

        <div class="auth-feature-list">
          <div class="auth-feature">
            <i class="pi pi-chart-bar" />
            <span>Visao rapida das rotinas administrativas.</span>
          </div>
          <div class="auth-feature">
            <i class="pi pi-shield" />
            <span>Acesso seguro para sua equipe principal.</span>
          </div>
          <div class="auth-feature">
            <i class="pi pi-mobile" />
            <span>Layout ajustado para desktop e mobile.</span>
          </div>
        </div>
      </section>

      <Card class="auth-panel auth-panel--form">
        <template #content>
          <div class="form-header">
            <div>
              <p class="auth-eyebrow">
                Bem-vindo
              </p>
              <h2 class="form-title">
                Fazer login
              </h2>
              <p class="form-subtitle">
                Use seu e-mail principal para acessar o dashboard.
              </p>
            </div>

            <Button
              class="auth-link-btn"
              label="Criar conta"
              variant="text"
              @click="$router.push('/signup')"
            />
          </div>

          <Message
            v-if="errorMessages.length"
            severity="error"
            class="form-message"
          >
            <ul class="alert-list">
              <li
                v-for="(error, index) in errorMessages"
                :key="`signin-error-${index}`"
              >
                {{ error }}
              </li>
            </ul>
          </Message>

          <form
            class="auth-form"
            @submit.prevent="submitForm"
          >
            <div class="field-block">
              <label
                class="field-label"
                for="signin-email"
              >E-mail</label>
              <InputText
                id="signin-email"
                v-model.trim="email"
                type="email"
                placeholder="voce@empresa.com"
                :invalid="Boolean(fieldErrors.email)"
              />
              <small
                v-if="fieldErrors.email"
                class="field-error"
              >
                {{ fieldErrors.email }}
              </small>
            </div>

            <div class="field-block">
              <label
                class="field-label"
                for="signin-password"
              >Senha</label>
              <Password
                id="signin-password"
                v-model="password"
                placeholder="Digite sua senha"
                :feedback="false"
                toggle-mask
                fluid
                :invalid="Boolean(fieldErrors.password)"
                input-class="auth-password-input"
              />
              <small
                v-if="fieldErrors.password"
                class="field-error"
              >
                {{ fieldErrors.password }}
              </small>
            </div>

            <Button
              type="submit"
              label="Entrar no painel"
              class="auth-submit"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            />
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script>
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import { apiService } from '../services/apiService';

export default {
  name: 'SignIn',
  components: {
    Button,
    Card,
    InputText,
    Message,
    Password,
  },
  data() {
    return {
      email: '',
      password: '',
      errorMessages: [],
      fieldErrors: {
        email: '',
        password: '',
      },
      isSubmitting: false,
    };
  },
  methods: {
    validateForm() {
      const errors = {
        email: '',
        password: '',
      };

      if (!this.email) {
        errors.email = 'E-mail e obrigatorio.';
      } else if (!/.+@.+\..+/.test(this.email)) {
        errors.email = 'E-mail deve ser valido.';
      }

      if (!this.password) {
        errors.password = 'Senha e obrigatoria.';
      }

      this.fieldErrors = errors;
      return !errors.email && !errors.password;
    },

    normalizeApiMessages(responseData, fallback) {
      if (responseData && responseData.message) {
        return Array.isArray(responseData.message)
          ? responseData.message
          : [responseData.message];
      }

      return [fallback];
    },

    async submitForm() {
      this.errorMessages = [];

      if (!this.validateForm()) {
        return;
      }

      this.isSubmitting = true;

      try {
        const response = await apiService.post('/signin', {
          email: this.email,
          password: this.password,
        });
        const responseData = await response.json();

        if (!response.ok) {
          this.errorMessages = this.normalizeApiMessages(
            responseData,
            `Erro ${response.status}: Falha ao autenticar.`,
          );
          return;
        }

        localStorage.setItem('accessToken', responseData.accessToken);
        this.$router?.push('/dashboard');
      } catch (error) {
        console.error('Login API Error:', error);
        this.errorMessages = ['Ocorreu um erro de comunicacao. Tente novamente.'];
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  padding: 32px 16px;
}

.auth-container {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(320px, 520px);
  gap: 24px;
  align-items: stretch;
  justify-content: center;
  min-height: calc(100vh - 64px);
}

.auth-panel {
  width: 100%;
  border-radius: var(--app-card-radius);
}

.auth-panel--brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 32px;
  background: linear-gradient(160deg, var(--app-sidebar) 0%, #1e4f91 100%);
  color: #fff;
  box-shadow: var(--app-shadow);
}

.auth-panel--form {
  padding: 32px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--app-border);
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.9rem;
  font-weight: 600;
}

.auth-eyebrow {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.72;
}

.auth-title,
.form-title {
  margin: 0;
  line-height: 1.1;
}

.auth-title {
  color: #fff;
  font-size: clamp(2rem, 3vw, 3rem);
}

.auth-description,
.form-subtitle {
  margin: 14px 0 0;
  opacity: 0.78;
}

.form-title {
  color: var(--app-text);
  font-size: 2rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 28px;
}

.auth-feature-list {
  display: grid;
  gap: 14px;
}

.auth-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
}

.auth-feature .pi {
  font-size: 1rem;
}

.auth-form {
  display: grid;
  gap: 20px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--app-text);
}

.field-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.form-message {
  margin-bottom: 24px;
}

.auth-submit {
  width: 100%;
  margin-top: 4px;
}

.alert-list {
  padding-left: 18px;
  margin: 0;
}

:deep(.auth-link-btn.p-button) {
  min-height: auto;
  padding-right: 0;
  padding-left: 0;
}

:deep(.p-password-toggle-mask-icon) {
  color: var(--app-text-muted);
}

@media (max-width: 959px) {
  .auth-shell {
    padding: 20px 12px;
  }

  .auth-container {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .auth-panel--brand,
  .auth-panel--form {
    padding: 24px;
  }

  .form-header {
    flex-direction: column;
  }
}
</style>
