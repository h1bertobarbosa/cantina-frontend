import { createStore } from 'vuex';

export default createStore({
  state: {
    loadingCount: 0,
  },
  mutations: {
    incrementLoading(state) {
      state.loadingCount++;
    },
    decrementLoading(state) {
      if (state.loadingCount > 0) {
        state.loadingCount--;
      }
    },
  },
  actions: {
    startLoading({ commit }) {
      commit('incrementLoading');
    },
    stopLoading({ commit }) {
      commit('decrementLoading');
    },
  },
  getters: {
    isLoading: (state) => state.loadingCount > 0,
  },
});

