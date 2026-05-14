const applyPhoneMask = (rawValue, maskConfig) => {
  const digits = String(rawValue || '').replace(/\D/g, '');
  const masks = Array.isArray(maskConfig) ? maskConfig : [maskConfig].filter(Boolean);
  const fallbackMask = digits.length > 10 ? '(##) #####-####' : '(##) ####-####';
  const mask = masks.find((item) => {
    const slots = String(item || '').match(/#/g)?.length || 0;
    return digits.length <= slots;
  }) || fallbackMask;

  let index = 0;
  return mask.replace(/#/g, () => digits[index++] || '').replace(/[^\d)]$/, '').trim();
};

const resolveMaskConfig = (binding) => {
  if (binding.arg && typeof binding.arg === 'object' && binding.arg.mask) {
    return binding.arg.mask;
  }

  if (binding.value && typeof binding.value === 'object' && binding.value.mask) {
    return binding.value.mask;
  }

  return null;
};

const updateElementValue = (el, binding) => {
  const input = el instanceof HTMLInputElement ? el : el.querySelector('input');

  if (!input) {
    return;
  }

  const mask = resolveMaskConfig(binding);

  if (!mask) {
    return;
  }

  const nextValue = applyPhoneMask(input.value, mask);

  if (input.value !== nextValue) {
    input.value = nextValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

export const vMaska = {
  mounted(el, binding) {
    const input = el instanceof HTMLInputElement ? el : el.querySelector('input');

    if (!input) {
      return;
    }

    const listener = () => updateElementValue(el, binding);
    input.__maskaListener__ = listener;
    input.addEventListener('input', listener);
    updateElementValue(el, binding);
  },
  updated(el, binding) {
    updateElementValue(el, binding);
  },
  unmounted(el) {
    const input = el instanceof HTMLInputElement ? el : el.querySelector('input');

    if (input && input.__maskaListener__) {
      input.removeEventListener('input', input.__maskaListener__);
      delete input.__maskaListener__;
    }
  },
};
