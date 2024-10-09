<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import Datepicker from 'vue3-datepicker'
import { ref } from 'vue'
const picked = ref(new Date())
</script>

<template>
  <Datepicker v-model="picked" />
</template>