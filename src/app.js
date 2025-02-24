// src/app.js
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import App from "./App.vue";

// Import styles directly - they will be bundled by Vite
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import "./style.css"; // This will be our main CSS file

document.addEventListener("DOMContentLoaded", () => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: "light",
    },
    icons: {
      defaultSet: "mdi",
    },
  });

  const app = createApp(App);
  app.use(vuetify);
  app.mount("#app");
});
