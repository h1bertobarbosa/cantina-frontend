<template>
    <nav aria-label="Pagination">
        <ul class="pagination">
            <!-- Botão para ir para a primeira página -->
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(1)">Primeiro</button>
            </li>

            <!-- Botão para ir para a página anterior -->
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="goToPage(currentPage - 1)">
                    Anterior
                </button>
            </li>

            <!-- Renderiza cada página; aqui você pode refinar para mostrar um range menor de páginas -->
            <li v-for="page in pagesArray" :key="page" class="page-item" :class="{ active: page === currentPage }">
                <button class="page-link" @click="goToPage(page)">
                    {{ page }}
                </button>
            </li>

            <!-- Botão para ir para a página seguinte -->
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="goToPage(currentPage + 1)">
                    Próximo
                </button>
            </li>

            <!-- Botão para ir para a última página -->
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="goToPage(totalPages)">Último</button>
            </li>
        </ul>
    </nav>
</template>

<script>
export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: 'Pagination',
    props: {
        // Página atual
        currentPage: {
            type: Number,
            required: true
        },
        // Total de páginas
        totalPages: {
            type: Number,
            required: true
        },
    },
    emits: ['page-changed'],
    computed: {
        /**
         * Aqui, criamos um array de páginas [1,2,3,..., totalPages]
         * Se preferir um range menor (ex: mostrar apenas 5 páginas ao redor da atual),
         * basta ajustar a lógica aqui.
         */
        pagesArray() {
            const range = 3; // Mostra 3 páginas para trás e para frente
            const pages = [];
            const start = Math.max(1, this.currentPage - range);
            const end = Math.min(this.totalPages, this.currentPage + range);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            return pages;
        }
    },
    methods: {
        goToPage(page) {
            // Evita ir para fora dos limites
            if (page < 1 || page > this.totalPages) return;
            this.$emit('page-changed', page);
        }
    }
};
</script>

<style scoped>
/* Ajuste de estilos conforme necessidade do seu projeto */
</style>