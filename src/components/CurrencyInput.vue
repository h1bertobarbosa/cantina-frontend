<template>
  <input ref="inputRef" type="text" />
</template>

<script>
import { watch } from 'vue';
import { useCurrencyInput } from 'vue-currency-input';

export default {
  name: 'CurrencyInput',
  props: {
    modelValue: Number, // Vue 2: value
    options: Object
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { inputRef, numberValue, setValue, setOptions } = useCurrencyInput(props.options);

    watch(
      () => props.modelValue,
      (value) => {
        setValue(value ?? null);
      },
      { immediate: true }
    );

    watch(
      () => props.options,
      (value) => {
        setOptions(value);
      },
      { deep: true }
    );

    watch(numberValue, (value) => {
      emit('update:modelValue', value ?? 0);
    });

    return { inputRef };
  }
};
</script>
