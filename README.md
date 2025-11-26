<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Z7SiQ3WQjygACy1C0IOCLUZPtMtQfqEZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure a server-side API key (não exponha no frontend):
   - Crie um arquivo `.env` na raiz com `GOOGLE_API_KEY=<sua_chave>` ou `GEMINI_API_KEY=<sua_chave>`.
   - Alternativamente, defina a variável de ambiente no seu sistema.
   - Referência oficial de segurança: https://ai.google.dev/gemini-api/docs/api-key?hl=pt-br#security
3. Run the app:
   `npm run dev`

O frontend chama o backend proxy (`/api/...`) que injeta a chave do ambiente. Assim a sua chave não é carregada no bundle nem exposta no navegador.
