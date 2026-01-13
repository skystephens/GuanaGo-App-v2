/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_API_KEY: string;
  readonly VITE_AIRTABLE_API_KEY: string;
  readonly VITE_AIRTABLE_BASE_ID: string;
  readonly VITE_API_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
