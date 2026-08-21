import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_KEY,

    // CRM DB — server only
    crmDatabaseUrl: process.env.CRM_DATABASE_URL,
    crmQuizId: process.env.CRM_QUIZ_ID,
  },
});
