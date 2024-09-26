<template>
  <div>
    <div>
      <div v-if="errorMessages.length" class="alert alert-danger">
        <ul>
          <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
        </ul>
      </div>
    </div>
    <h2>Gerenciar Produtos</h2>
    <button class="btn btn-primary mb-3" @click="addProduct()">Adicionar Produto</button>

    <!-- Tabela de Produtos -->
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Preço</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.name }}</td>
          <td>{{ product.price }}</td>
          <td>
            <button class="btn btn-info btn-sm" @click="viewProduct(product)">Detalhes</button>
            <button class="btn btn-warning btn-sm" @click="editProduct(product)">Editar</button>
            <button class="btn btn-danger btn-sm" @click="deleteProduct(product.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>



    <!-- Modal para Adicionar/Editar Produto -->
    <div class="modal" tabindex="-1" role="dialog" v-if="showProductModal">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <form @submit.prevent="saveProduct">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Editar Produto' : 'Adicionar Produto' }}</h5>
              <button type="button" class="close" @click="closeProductModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <!-- Exibição das mensagens de erro -->
              <div v-if="errorMessages.length" class="alert alert-danger">
                <ul>
                  <li v-for="(error, index) in errorMessages" :key="index">{{ error }}</li>
                </ul>
              </div>
              <!-- Campos do formulário -->
              <div class="form-group">
                <label for="productName">Nome</label>
                <input type="text" class="form-control" id="productName" v-model="currentProduct.name" required />
              </div>
              <div class="form-group">
                <label for="productPrice">Preço</label>
                <input type="number" class="form-control" id="productPrice" v-model="currentProduct.price" required />
              </div>
              <!-- Outros campos do produto podem ser adicionados aqui -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeProductModal">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Atualizar' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { authHeader } from '../helper/authHeader';

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Products',
  data() {
    return {
      products: [],
      showProductModal: false,
      showDetailsModal: false,
      isEditing: false,
      currentProduct: {
        id: null,
        name: '',
        price: 0
      },
      errorMessages: []
    };
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    // Busca a lista de produtos do backend
    async fetchProducts() {
      try {
        console.log(process.env.BASE_URL)
        const response = await fetch('http://localhost:3000/products', {
          method: 'GET',
          headers: authHeader()
        });
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.message) {
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            this.errorMessages = ['Erro ao buscar produtos'];
          }
          return;
        }
        const products = await response.json();
        this.products = products.data;
      } catch (error) {
        console.error(error);
        this.errorMessages = ['Erro ao buscar produtos'];
      }
    },
    // Abre o modal para adicionar um novo produto
    addProduct() {
      this.isEditing = false;
      this.currentProduct = {
        id: null,
        name: '',
        price: 0
      };
      this.showProductModal = true;
    },
    // Abre o modal para editar um produto existente
    editProduct(product) {
      this.isEditing = true;
      this.currentProduct = { ...product };
      this.showProductModal = true;
    },
    // Salva o produto (adiciona ou atualiza)
    async saveProduct() {
      this.errorMessages = [];
      try {
        const method = this.isEditing ? 'PATCH' : 'POST';
        const url = this.isEditing
          ? `http://localhost:3000/products/${this.currentProduct.id}`
          : 'http://localhost:3000/products';

        const response = await fetch(url, {
          method: method,
          headers: authHeader(),
          body: JSON.stringify({...this.currentProduct,price: Number(this.currentProduct.price)})
        });

        if (!response.ok) {
          // Captura o corpo da resposta de erro
          const errorData = await response.json();

          // Verifica se há uma propriedade 'message' na resposta
          if (errorData.message) {
            // Se 'message' for um array, usa diretamente; se for uma string, coloca em um array
            this.errorMessages = Array.isArray(errorData.message)
              ? errorData.message
              : [errorData.message];
          } else {
            // Mensagem genérica caso não haja 'message' na resposta
            this.errorMessages = ['Erro ao salvar o produto.'];
          }
          return; // Encerra a execução se houver erro
        }
        this.fetchProducts();
        this.closeProductModal();
      } catch (error) {
        console.error(error);
        alert('Erro ao salvar o produto2');
      }
    },
    // Deleta um produto
    async deleteProduct(id) {
      if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
          const response = await fetch(`http://localhost:3000/products/${id}`, {
            method: 'DELETE',
            headers: authHeader()
          });
          if (!response.ok) {
            throw new Error('Erro ao excluir o produto');
          }
          this.fetchProducts();
        } catch (error) {
          console.error(error);
          alert('Erro ao excluir o produto');
        }
      }
    },
    // Visualiza detalhes de um produto
    viewProduct(product) {
      this.currentProduct = { ...product };
      this.showDetailsModal = true;
    },
    // Fecha o modal de adicionar/editar produto
    closeProductModal() {
      this.showProductModal = false;
    },
    // Fecha o modal de detalhes do produto
    closeDetailsModal() {
      this.showDetailsModal = false;
    }
  },
  filters: {
    // Filtro para formatar o valor como moeda
    currency(value) {
      return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    }
  }
};
</script>

<style scoped>
/* Estilos para os modais */
.modal {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin-top: 10%;
}
</style>
