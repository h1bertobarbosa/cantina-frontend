import { computed, reactive } from 'vue';

const BREAKPOINT_MD = 960;
const BREAKPOINT_SM = 600;

const displayState = reactive({
  width: typeof window !== 'undefined' ? window.innerWidth : 1280,
});

let isListening = false;

const syncWidth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  displayState.width = window.innerWidth;
};

const ensureListener = () => {
  if (typeof window === 'undefined' || isListening) {
    return;
  }

  syncWidth();
  window.addEventListener('resize', syncWidth);
  isListening = true;
};

export const useDisplay = () => {
  ensureListener();

  return {
    width: computed(() => displayState.width),
    mobile: computed(() => displayState.width < BREAKPOINT_SM),
    smAndDown: computed(() => displayState.width < BREAKPOINT_MD),
    mdAndUp: computed(() => displayState.width >= BREAKPOINT_MD),
  };
};

export const display = useDisplay();
