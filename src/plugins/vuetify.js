import { display } from "../composables/useDisplay";

export default {
  install(app) {
    app.config.globalProperties.$vuetify = {
      display,
      theme: {
        current: {
          value: {
            colors: {},
          },
        },
      },
    };
  },
};
