<template>
  <div id="app">
    <GlobalLoading />
    <RouterView />
  </div>
</template>

<script>
import GlobalLoading from './components/GlobalLoading.vue';

export default {
  name: 'App',
  components: {
    GlobalLoading,
  },
};
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
