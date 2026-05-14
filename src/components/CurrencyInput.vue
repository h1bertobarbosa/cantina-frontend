<template>
  <v-text-field ref="inputRef" />
</template>

<script>
import { useCurrencyInput } from 'vue-currency-input';

export default {
  name: 'CurrencyInput',
  props: {
    modelValue: {
      type: Number, // Vue 2: value
      default: 0,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const { inputRef } = useCurrencyInput(props.options);

    return { inputRef };
  },
};
</script>
