<template>
  <div class="auth-shell">
    <div class="auth-container">
      <section class="auth-panel auth-panel--brand">
        <div class="brand-chip">
          <i class="pi pi-user-plus" />
          <span>Novo ambiente</span>
        </div>

        <div>
          <p class="auth-eyebrow">
            Cadastro inicial
          </p>
          <h1 class="auth-title">
            Estruture a sua cantina em poucos passos.
          </h1>
          <p class="auth-description">
            Cadastre a empresa e o usuario principal no mesmo fluxo, mantendo a mesma organizacao visual das telas administrativas.
          </p>
        </div>

        <div class="auth-feature-list">
          <div class="auth-feature">
            <i class="pi pi-building" />
            <span>Dados da empresa e do responsavel no mesmo formulario.</span>
          </div>
          <div class="auth-feature">
            <i class="pi pi-bolt" />
            <span>Login automatico logo apos o cadastro.</span>
          </div>
          <div class="auth-feature">
            <i class="pi pi-th-large" />
            <span>Layout responsivo com agrupamento claro dos campos.</span>
          </div>
        </div>
      </section>

      <Card class="auth-panel auth-panel--form">
        <template #content>
          <div class="form-header">
            <div>
              <p class="auth-eyebrow">
                Criar acesso
              </p>
              <h2 class="form-title">
                Abrir conta
              </h2>
              <p class="form-subtitle">
                Preencha os dados abaixo para criar seu ambiente inicial.
              </p>
            </div>

            <Button
              class="auth-link-btn"
              label="Ja tenho conta"
              variant="text"
              @click="goToLogin"
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
                :key="`signup-error-${index}`"
              >
                {{ error }}
              </li>
            </ul>
          </Message>

          <Message
            v-if="successMessage"
            severity="success"
            class="form-message"
          >
            {{ successMessage }}
          </Message>

          <form
            class="auth-form"
            @submit.prevent="submitForm"
          >
            <section class="form-section">
              <div class="section-header">
                <div>
                  <h3 class="section-title">
                    Dados da empresa
                  </h3>
                  <p class="section-subtitle">
                    Informacoes principais do estabelecimento.
                  </p>
                </div>
              </div>

              <div class="fields-grid fields-grid--two">
                <div class="field-block">
                  <label
                    class="field-label"
                    for="company-name"
                  >Nome da empresa</label>
                  <InputText
                    id="company-name"
                    v-model.trim="companyName"
                    placeholder="Cantina Exemplo"
                    :invalid="Boolean(fieldErrors.companyName)"
                  />
                  <small
                    v-if="fieldErrors.companyName"
                    class="field-error"
                  >
                    {{ fieldErrors.companyName }}
                  </small>
                </div>

                <div class="field-block">
                  <label
                    class="field-label"
                    for="company-email"
                  >E-mail da empresa</label>
                  <InputText
                    id="company-email"
                    v-model.trim="companyEmail"
                    type="email"
                    placeholder="contato@cantina.com"
                    :invalid="Boolean(fieldErrors.companyEmail)"
                  />
                  <small
                    v-if="fieldErrors.companyEmail"
                    class="field-error"
                  >
                    {{ fieldErrors.companyEmail }}
                  </small>
                </div>
              </div>

              <div class="field-block">
                <label
                  class="field-label"
                  for="company-document"
                >Documento da empresa</label>
                <InputText
                  id="company-document"
                  v-model="companyDocument"
                  placeholder="Digite apenas numeros"
                  :invalid="Boolean(fieldErrors.companyDocument)"
                  @input="formatDocument"
                />
                <small class="field-hint">Informe CNPJ ou CPF somente com numeros.</small>
                <small
                  v-if="fieldErrors.companyDocument"
                  class="field-error"
                >
                  {{ fieldErrors.companyDocument }}
                </small>
              </div>
            </section>

            <section class="form-section">
              <div class="section-header">
                <div>
                  <h3 class="section-title">
                    Usuario principal
                  </h3>
                  <p class="section-subtitle">
                    Esse usuario sera usado no primeiro acesso ao painel.
                  </p>
                </div>
              </div>

              <div class="fields-grid fields-grid--two">
                <div class="field-block">
                  <label
                    class="field-label"
                    for="owner-name"
                  >Nome completo</label>
                  <InputText
                    id="owner-name"
                    v-model.trim="name"
                    placeholder="Seu nome"
                    :invalid="Boolean(fieldErrors.name)"
                  />
                  <small
                    v-if="fieldErrors.name"
                    class="field-error"
                  >
                    {{ fieldErrors.name }}
                  </small>
                </div>

                <div class="field-block">
                  <label
                    class="field-label"
                    for="owner-email"
                  >E-mail para login</label>
                  <InputText
                    id="owner-email"
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
              </div>

              <div class="field-block">
                <label
                  class="field-label"
                  for="owner-password"
                >Senha</label>
                <Password
                  id="owner-password"
                  v-model="password"
                  placeholder="Crie uma senha segura"
                  toggle-mask
                  fluid
                  :feedback="true"
                  :invalid="Boolean(fieldErrors.password)"
                />
                <small class="field-hint">Minimo de 8 caracteres.</small>
                <small
                  v-if="fieldErrors.password"
                  class="field-error"
                >
                  {{ fieldErrors.password }}
                </small>
              </div>
            </section>

            <div class="actions-row">
              <Button
                class="auth-link-btn"
                label="Voltar para login"
                variant="text"
                @click="goToLogin"
              />

              <Button
                type="submit"
                label="Criar conta"
                class="auth-submit"
                :loading="loading"
                :disabled="loading"
              />
            </div>
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
  name: 'SignUp',
  components: {
    Button,
    Card,
    InputText,
    Message,
    Password,
  },
  data() {
    return {
      companyName: '',
      companyEmail: '',
      companyDocument: '',
      name: '',
      email: '',
      password: '',
      loading: false,
      errorMessages: [],
      successMessage: '',
      fieldErrors: {
        companyName: '',
        companyEmail: '',
        companyDocument: '',
        name: '',
        email: '',
        password: '',
      },
    };
  },
  methods: {
    goToLogin() {
      this.$router.push('/signin');
    },

    showToast(detail, severity = 'info') {
      this.$toast.add({
        severity,
        summary: severity === 'success' ? 'Sucesso' : 'Aviso',
        detail,
        life: 3000,
      });
    },

    formatDocument() {
      this.companyDocument = this.companyDocument.replace(/\D/g, '');
    },

    validateEmail(value) {
      return /.+@.+\..+/.test(value);
    },

    validateForm() {
      const errors = {
        companyName: '',
        companyEmail: '',
        companyDocument: '',
        name: '',
        email: '',
        password: '',
      };

      if (!this.companyName) {
        errors.companyName = 'Nome da empresa e obrigatorio.';
      }

      if (!this.companyEmail) {
        errors.companyEmail = 'E-mail da empresa e obrigatorio.';
      } else if (!this.validateEmail(this.companyEmail)) {
        errors.companyEmail = 'E-mail da empresa invalido.';
      }

      if (!this.companyDocument) {
        errors.companyDocument = 'Documento da empresa e obrigatorio.';
      } else if (!/^\d+$/.test(this.companyDocument)) {
        errors.companyDocument = 'Documento deve conter apenas numeros.';
      }

      if (!this.name) {
        errors.name = 'Nome completo e obrigatorio.';
      }

      if (!this.email) {
        errors.email = 'E-mail para login e obrigatorio.';
      } else if (!this.validateEmail(this.email)) {
        errors.email = 'E-mail para login invalido.';
      }

      if (!this.password) {
        errors.password = 'Senha e obrigatoria.';
      } else if (this.password.length < 8) {
        errors.password = 'A senha deve ter no minimo 8 caracteres.';
      }

      this.fieldErrors = errors;

      return !Object.values(errors).some(Boolean);
    },

    normalizeApiMessages(errorData, defaultMessage) {
      if (errorData && errorData.message) {
        return Array.isArray(errorData.message)
          ? errorData.message
          : [errorData.message];
      }

      return [defaultMessage];
    },

    async login(payload) {
      this.loading = true;
      this.errorMessages = [];

      try {
        const response = await apiService.post('/signin', payload);

        if (!response.ok) {
          const errorData = await response.json();
          this.errorMessages = this.normalizeApiMessages(
            errorData,
            'Erro ao realizar o login automatico.',
          );
          return false;
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        this.showToast('Login automatico realizado com sucesso.', 'success');

        setTimeout(() => {
          this.$router.push('/dashboard');
        }, 1000);

        return true;
      } catch (error) {
        console.error('Login Error:', error);
        this.errorMessages = ['Ocorreu um erro inesperado durante o login. Verifique sua conexao.'];
        return false;
      }
    },

    async submitForm() {
      this.errorMessages = [];
      this.successMessage = '';

      if (!this.validateForm()) {
        this.showToast('Por favor, corrija os erros no formulario.', 'warn');
        return;
      }

      this.loading = true;

      try {
        const response = await apiService.post('/signup', {
          companyName: this.companyName,
          companyEmail: this.companyEmail,
          companyDocument: this.companyDocument.replace(/\D/g, ''),
          name: this.name,
          email: this.email,
          password: this.password,
        });
        const responseData = await response.json();

        if (!response.ok) {
          this.errorMessages = this.normalizeApiMessages(
            responseData,
            'Erro ao realizar o cadastro.',
          );
          this.loading = false;
          return;
        }

        this.successMessage = 'Cadastro realizado com sucesso. Tentando login automatico...';

        const loggedIn = await this.login({
          email: this.email,
          password: this.password,
        });

        if (!loggedIn) {
          this.loading = false;
          this.showToast(
            'Cadastro realizado, mas o login automatico falhou. Faca login manualmente.',
            'warn',
          );
        }
      } catch (error) {
        console.error('Signup Error:', error);
        this.errorMessages = ['Ocorreu um erro inesperado durante o cadastro. Verifique sua conexao.'];
        this.loading = false;
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
  grid-template-columns: minmax(280px, 420px) minmax(320px, 640px);
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
  background: linear-gradient(165deg, var(--app-sidebar) 0%, #1c4e92 100%);
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
  margin-bottom: 24px;
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
  gap: 24px;
}

.form-section {
  display: grid;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--app-border);
  border-radius: 22px;
  background: var(--app-surface-muted);
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--app-text);
}

.section-subtitle {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 0.94rem;
}

.fields-grid {
  display: grid;
  gap: 18px;
}

.fields-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.field-hint {
  color: var(--app-text-muted);
  font-size: 0.82rem;
}

.field-error {
  color: #dc2626;
  font-size: 0.82rem;
}

.form-message {
  margin-bottom: 16px;
}

.actions-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.auth-submit {
  min-width: 180px;
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

  .fields-grid--two {
    grid-template-columns: 1fr;
  }

  .actions-row,
  .form-header {
    flex-direction: column;
    align-items: stretch;
  }

  .auth-submit {
    width: 100%;
  }
}
</style>
