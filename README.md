<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Estúdio Gerador de Conteúdo

Aplicação de IA para geração estratégica de conteúdo, utilizando Google Gemini e React.

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js instalado (v18+ recomendado).

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd estudio-gerador-de-conteudo
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Preencha o `.env` com sua `GOOGLE_API_KEY` (obtenha em [Google AI Studio](https://aistudio.google.com/)).
   - Se estiver usando banco de dados (Neon), preencha `DATABASE_URL`.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   - O frontend estará em: `http://localhost:3000`
   - O backend (API) estará em: `http://localhost:3001`

---

## ☁️ Deploy na Vercel

Esta aplicação está configurada para deploy fácil na Vercel (Frontend Vite + Serverless Functions).

1. Faça um **Fork** deste repositório no seu GitHub.
2. Acesse [Vercel Dashboard](https://vercel.com/dashboard) e clique em **"Add New..."** > **"Project"**.
3. Importe o repositório do GitHub.
4. A Vercel deve detectar automaticamente como **Vite**.
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Configuração de Variáveis de Ambiente (Environment Variables):**
   Adicione as seguintes chaves nas configurações do projeto na Vercel:
   - `GOOGLE_API_KEY`: Sua chave da API do Gemini.
   - `DATABASE_URL`: Sua string de conexão PostgreSQL (se aplicável).
6. Clique em **Deploy**.

**Nota:** O arquivo `vercel.json` na raiz já configura as rotas para que `/api/*` seja tratado pelas Serverless Functions e o restante pelo React Router.

---

## 🛠️ Estrutura do Projeto

- **/api**: Funções Serverless (Backend) que rodam na Vercel ou via `server/index.js` localmente.
- **/src** (ou raiz): Código Frontend React.
- **/server**: Servidor Express para desenvolvimento local (simula o ambiente serverless).
