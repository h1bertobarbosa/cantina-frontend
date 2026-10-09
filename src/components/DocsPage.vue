<template>
  <article class="docs-page">
    <header class="docs-hero">
      <div class="docs-hero__copy">
        <p class="docs-kicker">
          Guia operacional · Clientes e faturas
        </p>
        <h1>Uma fatura para toda a família.</h1>
        <p class="docs-hero__lead">
          Aprenda a definir um responsável financeiro, vincular dependentes e
          acompanhar todas as compras em uma única fatura, sem perder quem fez
          cada consumo.
        </p>
        <div class="docs-hero__actions">
          <RouterLink
            class="docs-primary-link"
            to="/dashboard/clients"
          >
            <i class="pi pi-users" />
            Ir para clientes
          </RouterLink>
          <a
            class="docs-text-link"
            href="#passo-a-passo"
          >Ver passo a passo <i class="pi pi-arrow-down" /></a>
        </div>
      </div>

      <div
        class="docs-hero__diagram"
        aria-label="Fluxo da fatura consolidada"
      >
        <div class="diagram-person diagram-person--primary">
          <span>R</span>
          <div>
            <small>Responsável</small>
            <strong>Fatura única</strong>
          </div>
        </div>
        <div class="diagram-line" />
        <div class="diagram-dependents">
          <div class="diagram-person">
            <span>D1</span>
            <div>
              <small>Dependente</small>
              <strong>Compras identificadas</strong>
            </div>
          </div>
          <div class="diagram-person">
            <span>D2</span>
            <div>
              <small>Dependente</small>
              <strong>Compras identificadas</strong>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="docs-layout">
      <nav
        class="docs-index"
        aria-label="Nesta página"
      >
        <p>Nesta página</p>
        <a href="#como-funciona">Como funciona</a>
        <a href="#passo-a-passo">Vincular dependente</a>
        <a href="#fatura">Fatura consolidada</a>
        <a href="#remover">Remover vínculo</a>
        <a href="#regras">Regras importantes</a>
      </nav>

      <div class="docs-content">
        <section
          id="como-funciona"
          class="docs-section docs-intro"
        >
          <div class="section-number">
            01
          </div>
          <div>
            <p class="section-eyebrow">
              Como funciona
            </p>
            <h2>O cliente continua sendo quem consome. O responsável é quem paga.</h2>
            <p>
              Ao vincular um cliente como dependente, as novas compras dele
              passam a compor a fatura do responsável financeiro. Na fatura,
              cada lançamento mantém o nome do consumidor para facilitar a
              conferência.
            </p>
          </div>

          <div class="behavior-strip">
            <div>
              <i class="pi pi-shopping-bag" />
              <span>Venda registrada para</span>
              <strong>o dependente</strong>
            </div>
            <i class="pi pi-arrow-right behavior-strip__arrow" />
            <div>
              <i class="pi pi-file" />
              <span>Cobrança incluída na</span>
              <strong>fatura do responsável</strong>
            </div>
          </div>
        </section>

        <section
          id="passo-a-passo"
          class="docs-section"
        >
          <div class="section-number">
            02
          </div>
          <div>
            <p class="section-eyebrow">
              Configuração
            </p>
            <h2>Como vincular um dependente</h2>
          </div>

          <ol class="steps-list">
            <li>
              <span>1</span>
              <div>
                <strong>Abra Clientes</strong>
                <p>Localize na lista a pessoa que será o responsável financeiro.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Abra Gerenciar dependentes</strong>
                <p>Na coluna Ações, clique no botão com o ícone de pessoas.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Selecione e adicione</strong>
                <p>Escolha um cliente disponível e clique em Adicionar.</p>
              </div>
            </li>
          </ol>

          <figure class="docs-figure">
            <a
              href="/docs/gerenciar-dependentes.png"
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir imagem em tamanho original"
            >
              <img
                src="/docs/gerenciar-dependentes.png"
                alt="Janela Gerenciar dependentes com seletor para adicionar um cliente"
              >
            </a>
            <figcaption>
              <span>Print 01</span>
              Use o seletor para adicionar e a lista inferior para conferir os
              vínculos atuais.
            </figcaption>
          </figure>
        </section>

        <section
          id="fatura"
          class="docs-section docs-section--split"
        >
          <div class="section-number">
            03
          </div>
          <div class="docs-section__copy">
            <p class="section-eyebrow">
              Cobrança
            </p>
            <h2>Como conferir a fatura consolidada</h2>
            <p>
              Registre a venda normalmente para o cliente que realizou a
              compra. Se ele for dependente, o sistema direciona o débito para
              o responsável automaticamente.
            </p>
            <ul class="check-list">
              <li><i class="pi pi-check" /> O topo mostra o titular financeiro.</li>
              <li><i class="pi pi-check" /> A coluna Consumidor identifica cada compra.</li>
              <li><i class="pi pi-check" /> Crédito, débito, pagamento e estorno atuam na fatura consolidada.</li>
            </ul>
            <RouterLink
              class="docs-inline-link"
              to="/dashboard/billings"
            >
              Abrir faturas <i class="pi pi-arrow-right" />
            </RouterLink>
          </div>

          <figure class="docs-figure docs-figure--compact">
            <a
              href="/docs/fatura-consolidada.png"
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir imagem em tamanho original"
            >
              <img
                src="/docs/fatura-consolidada.png"
                alt="Janela Gerenciar fatura mostrando titular financeiro e consumidor dos lançamentos"
              >
            </a>
            <figcaption>
              <span>Print 02</span>
              O consumidor permanece visível em cada lançamento.
            </figcaption>
          </figure>
        </section>

        <section
          id="remover"
          class="docs-section docs-remove"
        >
          <div class="section-number">
            04
          </div>
          <div>
            <p class="section-eyebrow">
              Desvinculação
            </p>
            <h2>Como remover um dependente</h2>
            <p>
              Abra novamente <strong>Gerenciar dependentes</strong> no cadastro
              do responsável e clique no <i class="pi pi-times" /> ao lado do
              nome que deseja remover. Confirme em <strong>Remover</strong>.
            </p>
          </div>
          <aside class="history-note">
            <i class="pi pi-history" />
            <div>
              <strong>O histórico não é reescrito</strong>
              <p>Compras e faturas anteriores permanecem como foram registradas.</p>
            </div>
          </aside>
        </section>

        <section
          id="regras"
          class="docs-section"
        >
          <div class="section-number">
            05
          </div>
          <div>
            <p class="section-eyebrow">
              Antes de começar
            </p>
            <h2>Regras importantes</h2>
          </div>

          <div class="rules-grid">
            <div>
              <span class="rules-grid__mark">A</span>
              <h3>Clientes sem dependentes</h3>
              <p>Continuam usando vendas e faturas normalmente, sem qualquer mudança.</p>
            </div>
            <div>
              <span class="rules-grid__mark">B</span>
              <h3>Um responsável por vez</h3>
              <p>Um cliente dependente não pode estar ligado a dois responsáveis.</p>
            </div>
            <div>
              <span class="rules-grid__mark">C</span>
              <h3>Sem cadeias de dependência</h3>
              <p>Quem já é dependente precisa ser desvinculado antes de receber dependentes.</p>
            </div>
            <div>
              <span class="rules-grid__mark">D</span>
              <h3>Consumidor sempre visível</h3>
              <p>Mesmo na fatura única, cada compra informa quem realizou o consumo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </article>
</template>

<script setup>
</script>

<style scoped>
.docs-page {
  --docs-ink: #102a43;
  --docs-blue: #1d4ed8;
  --docs-sky: #dbeafe;
  --docs-warm: #f3ead7;
  max-width: 1220px;
  margin: 0 auto;
  color: var(--docs-ink);
}

.docs-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
  gap: clamp(3rem, 7vw, 7rem);
  align-items: center;
  min-height: 530px;
  padding: clamp(3rem, 7vw, 6.75rem) clamp(1.5rem, 4vw, 4.5rem);
  overflow: hidden;
  border-radius: 2rem;
  background: #102a43;
  color: #f7fbff;
}

.docs-hero::before {
  content: "";
  position: absolute;
  width: 26rem;
  height: 26rem;
  right: -9rem;
  top: -12rem;
  border: 1px solid rgba(219, 234, 254, 0.2);
  border-radius: 50%;
  box-shadow: 0 0 0 5rem rgba(219, 234, 254, 0.035), 0 0 0 10rem rgba(219, 234, 254, 0.025);
}

.docs-hero__copy,
.docs-hero__diagram {
  position: relative;
  z-index: 1;
}

.docs-kicker,
.section-eyebrow {
  margin: 0 0 0.9rem;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.docs-kicker {
  color: #93c5fd;
}

.docs-hero h1 {
  max-width: 660px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3rem, 6.2vw, 5.7rem);
  font-weight: 500;
  line-height: 0.96;
  letter-spacing: -0.055em;
}

.docs-hero__lead {
  max-width: 650px;
  margin: 1.8rem 0 0;
  color: #cbdced;
  font-size: clamp(1.05rem, 1.8vw, 1.25rem);
  line-height: 1.7;
}

.docs-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.4rem;
  align-items: center;
  margin-top: 2.2rem;
}

.docs-primary-link,
.docs-text-link,
.docs-inline-link {
  display: inline-flex;
  gap: 0.65rem;
  align-items: center;
  font-weight: 750;
  text-decoration: none;
}

.docs-primary-link {
  min-height: 50px;
  padding: 0 1.25rem;
  border-radius: 12px;
  background: #f7fbff;
  color: #102a43;
}

.docs-text-link {
  color: #bfdbfe;
}

.docs-hero__diagram {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.diagram-person {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid rgba(219, 234, 254, 0.18);
  border-radius: 1rem;
  background: rgba(247, 251, 255, 0.07);
}

.diagram-person > span {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  border-radius: 50%;
  background: #dbeafe;
  color: #1e3a8a;
  font-size: 0.78rem;
  font-weight: 850;
}

.diagram-person small,
.diagram-person strong {
  display: block;
}

.diagram-person small {
  margin-bottom: 0.25rem;
  color: #9fb7cc;
}

.diagram-person--primary {
  max-width: 310px;
  margin: 0 auto;
  background: #f3ead7;
  color: #102a43;
}

.diagram-person--primary small {
  color: #766b57;
}

.diagram-line {
  width: 1px;
  height: 62px;
  margin: 0 auto;
  background: #6fa4db;
}

.diagram-dependents {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.docs-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  padding: clamp(3.5rem, 7vw, 7rem) clamp(0.5rem, 2vw, 1.5rem);
}

.docs-index {
  position: sticky;
  top: 2rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-left: 1rem;
  border-left: 1px solid #c6d6e6;
}

.docs-index p {
  margin: 0 0 0.65rem;
  color: #6b7f93;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.docs-index a {
  padding: 0.5rem 0;
  color: #506981;
  font-size: 0.9rem;
  text-decoration: none;
}

.docs-index a:hover {
  color: var(--docs-blue);
}

.docs-content {
  min-width: 0;
}

.docs-section {
  position: relative;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 0.5rem 1.5rem;
  padding: 0 0 clamp(5rem, 10vw, 8.5rem);
  scroll-margin-top: 2rem;
}

.section-number {
  grid-row: 1 / span 4;
  padding-top: 0.35rem;
  color: #8aa0b5;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.section-eyebrow {
  color: var(--docs-blue);
}

.docs-section h2 {
  max-width: 760px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.15rem, 4vw, 3.8rem);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.docs-section p {
  max-width: 730px;
  color: #536b82;
  font-size: 1.03rem;
  line-height: 1.75;
}

.behavior-strip {
  grid-column: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.2rem;
  align-items: center;
  margin-top: 2.2rem;
  padding: 1.4rem;
  border-top: 1px solid #cad9e7;
  border-bottom: 1px solid #cad9e7;
}

.behavior-strip > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.15rem 0.8rem;
}

.behavior-strip > div > i {
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--docs-blue);
  font-size: 1.4rem;
}

.behavior-strip span {
  color: #6d8194;
  font-size: 0.78rem;
}

.steps-list {
  grid-column: 2;
  display: grid;
  gap: 0;
  margin: 2.4rem 0 3rem;
  padding: 0;
  list-style: none;
  counter-reset: docs-steps;
}

.steps-list li {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 1.1rem;
  padding: 1.35rem 0;
  border-bottom: 1px solid #d5e0ea;
}

.steps-list li > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  background: var(--docs-sky);
  color: #1e40af;
  font-weight: 850;
}

.steps-list p {
  margin: 0.25rem 0 0;
  font-size: 0.92rem;
  line-height: 1.5;
}

.docs-figure {
  grid-column: 2;
  margin: 0;
  padding: clamp(1rem, 3vw, 2rem);
  border-radius: 1.5rem;
  background: #e4edf6;
}

.docs-figure a {
  display: block;
}

.docs-figure img {
  display: block;
  width: 100%;
  max-height: 720px;
  object-fit: contain;
  border-radius: 0.8rem;
  box-shadow: 0 18px 45px rgba(16, 42, 67, 0.18);
}

.docs-figure figcaption {
  display: flex;
  gap: 1rem;
  margin-top: 1.2rem;
  color: #536b82;
  font-size: 0.87rem;
  line-height: 1.5;
}

.docs-figure figcaption span {
  flex: 0 0 auto;
  color: #1e40af;
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.docs-section--split {
  grid-template-columns: 54px minmax(280px, 0.8fr) minmax(340px, 1.2fr);
  align-items: start;
}

.docs-section--split .section-number {
  grid-column: 1;
}

.docs-section__copy {
  grid-column: 2;
}

.docs-section--split .docs-figure {
  grid-column: 3;
  grid-row: 1 / span 4;
}

.check-list {
  display: grid;
  gap: 0.9rem;
  margin: 1.8rem 0;
  padding: 0;
  list-style: none;
  color: #405d77;
  line-height: 1.5;
}

.check-list li {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
}

.check-list i {
  margin-top: 0.2rem;
  color: #15803d;
}

.docs-inline-link {
  color: var(--docs-blue);
}

.docs-remove {
  grid-template-columns: 54px minmax(0, 1fr) minmax(250px, 0.55fr);
  align-items: center;
}

.history-note {
  display: flex;
  gap: 1rem;
  padding: 1.4rem;
  border-radius: 1rem;
  background: var(--docs-warm);
}

.history-note > i {
  color: #9a620c;
  font-size: 1.5rem;
}

.history-note p {
  margin: 0.4rem 0 0;
  color: #74654b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.rules-grid {
  grid-column: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 2.4rem;
  border-top: 1px solid #cad9e7;
  border-left: 1px solid #cad9e7;
}

.rules-grid > div {
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-right: 1px solid #cad9e7;
  border-bottom: 1px solid #cad9e7;
}

.rules-grid__mark {
  color: var(--docs-blue);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.7rem;
  font-style: italic;
}

.rules-grid h3 {
  margin: 1.6rem 0 0.45rem;
  font-size: 1.05rem;
}

.rules-grid p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 980px) {
  .docs-hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .docs-hero__diagram {
    max-width: 620px;
  }

  .docs-layout {
    grid-template-columns: 1fr;
  }

  .docs-index {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 1rem 0;
    border-top: 1px solid #c6d6e6;
    border-bottom: 1px solid #c6d6e6;
    border-left: 0;
  }

  .docs-index p {
    grid-column: 1 / -1;
  }

  .docs-section--split,
  .docs-remove {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .docs-section--split .docs-figure,
  .history-note {
    grid-column: 2;
    grid-row: auto;
    margin-top: 2rem;
  }
}

@media (max-width: 620px) {
  .docs-hero {
    grid-template-columns: minmax(0, 1fr);
    padding: 2.6rem 1.25rem;
    border-radius: 1.35rem;
  }

  .docs-hero h1 {
    font-size: clamp(2.7rem, 15vw, 4rem);
  }

  .diagram-dependents,
  .rules-grid {
    grid-template-columns: 1fr;
  }

  .diagram-line {
    height: 34px;
  }

  .docs-layout {
    padding-inline: 0;
  }

  .docs-index {
    grid-template-columns: 1fr 1fr;
  }

  .docs-section,
  .docs-section--split,
  .docs-remove {
    grid-template-columns: 1fr;
  }

  .section-number {
    grid-row: auto;
  }

  .behavior-strip,
  .steps-list,
  .docs-figure,
  .docs-section--split .docs-figure,
  .docs-section__copy,
  .history-note,
  .rules-grid {
    grid-column: 1;
  }

  .behavior-strip {
    grid-template-columns: 1fr;
  }

  .behavior-strip__arrow {
    transform: rotate(90deg);
    justify-self: center;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .docs-hero__copy,
  .docs-hero__diagram {
    animation: docs-enter 650ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .docs-hero__diagram {
    animation-delay: 120ms;
  }
}

@keyframes docs-enter {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
