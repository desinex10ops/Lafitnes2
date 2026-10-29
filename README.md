# 🏋️‍♀️ LA FITNESS — Sistema PDV & Gestão Comercial Profissional

Sistema completo e profissional de Ponto de Venda (PDV) e ERP comercial desenvolvido especificamente para o segmento de moda fitness, vestuário esportivo e varejo de alta rotatividade.

Desenvolvido como **Progressive Web App (PWA)** instalável no computador e dispositivos móveis, com suporte offline, leitor de código de barras USB/óptico, atalhos de teclado de frente de caixa, matriz de variações (cores e tamanhos) com estoque independente, controle estrito de caixa e cobrança em duplicata mercantil.

---

## 🏛️ Arquitetura e Tecnologias

- **Interface:** React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Compilador & Bundler:** Vite 6
- **PWA:** Web App Manifest, Service Worker nativo para instalação standalone e cache de assets
- **Banco de Dados & Nuvem:** PostgreSQL estruturado com RLS, foreign keys, triggers e RPCs no **Supabase** (`supabase/schema.sql`)
- **Modo Offline-First:** Camada de serviço de dados transacional com fallback transparente local, garantindo funcionamento ininterrupto mesmo sem internet imediata
- **Impressão:** Geração de comprovante de venda em bobina térmica padrão 80mm, 58mm ou folha A4 com recortes para duplicatas

---

## 📋 Menu Principal (15 Módulos em Letras Maiúsculas)

O sistema conta com navegação lateral fixa estruturada rigorosamente na ordem comercial exigida:

1. **INÍCIO** — Dashboard analítico com filtros (Hoje, Últimos 7 dias, Mês, Todo Período), faturamento bruto, descontos, vendas líquidas, ticket médio, lucro bruto estimado, segregação contábil de dinheiro recebido vs. a receber em duplicatas, e alertas de estoque crítico.
2. **VENDAS** — Frente de Caixa (PDV) de alta velocidade:
   - Leitura direta de código de barras via leitor USB com foco automático contínuo
   - Matriz de variações de tamanho e cor com saldos independentes (ex: Legging Suplex / Preto / M)
   - Atalhos de teclado: `[F2]` Pesquisa, `[F4]` Seleção de Cliente, `[F10]` Finalizar Venda, `[Esc]` Fechar/Cancelar
   - Pagamentos: Dinheiro (cálculo automático de troco), PIX, Cartão Débito, Cartão Crédito, A Prazo e **DUPLICATA MERCANTIL** com parcelamento
   - Pagamento dividido (Split Payment entre múltiplas modalidades)
   - Suspensão e retomada de vendas no caixa
   - Emissão e impressão de comprovante térmico não-fiscal
   - Histórico completo de vendas com cancelamento auditado e estorno compensatório de estoque
3. **ESTOQUE** — Cadastro de produtos com matriz de variações, markup e margem calculados em tempo real, controle de estoque mínimo, inativação segura (sem exclusão física de itens com movimentações), histórico de movimentações e ajustes manuais com justificativa obrigatória.
4. **COMPRAS** — Lançamento de notas fiscais de entrada, produtos, tamanhos/cores, rateio de frete e despesas, atualização do custo e estoque, e geração automática de parcelas no Contas a Pagar.
5. **CLIENTES** — Cadastro completo com CPF/CNPJ, controle de limite de crédito, crédito utilizado e histórico unificado de compras e duplicatas vinculadas.
6. **FORNECEDORES** — Cadastro de indústrias e confecções têxteis, condições de pagamento, histórico de notas fiscais e catálogo de produtos fornecidos.
7. **CAIXA** — Controle de caixa por operador e turno:
   - Abertura com registro de fundo de troco em dinheiro (bloqueia abertura duplicada)
   - Movimentações de Suprimento (reforço) e Sangria (retirada) com justificativa
   - Fechamento detalhado com conferência física do dinheiro contado pelo operador, cálculo de diferença (quebra/sobra) e segregação de cartões e PIX
   - Consulta e reimpressão de comprovantes de fechamento anteriores
8. **DESPESAS** — Registro de contas e custos operacionais com opção de pagamento direto pelo dinheiro do caixa (sangria automática) ou pagamento programado.
9. **CONTAS A PAGAR** — Controle de títulos de fornecedores e compromissos com vencimentos, alertas de boletos atrasados, baixa parcial e total com histórico.
10. **CONTAS A RECEBER** — Centralização de duplicatas mercantis e parcelamentos a prazo, baixa de parcelas individuais (recebimento em espécie já alimenta o caixa aberto) e liberação de limite do cliente.
11. **RELATÓRIOS** — Relatórios gerenciais com filtros de período:
    - Vendas por período com totais e descontos
    - Vendas por forma de pagamento
    - Curva ABC dos produtos mais vendidos
    - Produtos em estoque crítico ou zerados
    - Duplicatas vencidas e a receber
    - Despesas por categoria
    - Exportação universal para formato **CSV** e impressão direta
12. **INVENTÁRIO** — Módulo de conferência física de estoque:
    - Iniciar inventário por categoria ou loja completa
    - Opção de **Contagem Cega** (oculta o saldo do sistema para garantir auditoria fidedigna)
    - Bipagem contínua por leitor de código de barras
    - Apuração automática de divergências e justificativas
    - Confirmação com aplicação atômica dos ajustes de estoque
13. **BACKUP** — Exportação completa em formato JSON estruturado, histórico de backups com tamanho e data, e restauração validada restrita ao Administrador (sem expor senhas ou chaves).
14. **USUÁRIOS** — Gestão de operadores, gerentes e administradores com permissões granulares para desconto máximo, cancelamento de vendas e ajustes de estoque.
15. **CONFIGURAÇÕES** — Dados cadastrais da empresa (CNPJ, IE, endereço), formato de impressora (80mm/58mm/A4), mensagem de rodapé, markup padrão e personalização das tags de categorias, tamanhos (PP ao GG) e cores da grade.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js versão 18 ou superior instalado.

### 1. Iniciar o Servidor de Desenvolvimento
```bash
# Na pasta d:\projetos\LaFitnes
npm run dev
```
O Vite iniciará o servidor local (ex: `http://localhost:5173`). Abra o link no navegador.

### 2. Perfis de Acesso de Demonstração (Já Configurados)
Na tela de login, há um seletor rápido para alternar entre os perfis:
- **Administrador:** `admin@lafitness.com.br` | Senha: `admin123`
- **Gerente:** `gerente@lafitness.com.br` | Senha: `gerente123`
- **Operador de Caixa:** `caixa@lafitness.com.br` | Senha: `caixa123`

---

## 🗄️ Integração com Supabase PostgreSQL

O banco de dados está pronto para ser conectado a qualquer momento:

1. Acesse o painel do Supabase ([https://supabase.com](https://supabase.com)) e crie um novo projeto.
2. No menu lateral **SQL Editor**, cole e execute todo o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Project Settings > API**, copie:
   - **Project URL**
   - **anon / public key**
4. Para testes locais, crie o arquivo `.env` na raiz:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```
*(Caso não preenchido, o sistema funciona 100% no modo local seguro / Offline-First)*.

---

## 🚢 Como Fazer o Deploy (GitHub + Vercel)

### 1. Subir para o GitHub

O repositório Git local já está inicializado na branch `main` com commit inicial e workflow de CI configurado.

Para publicar no seu GitHub:
```bash
# 1. Crie um novo repositório vazio no GitHub (ex: lafitnes-pdv)
# 2. Conecte o repositório remoto (substitua pelo seu link do GitHub):
git remote add origin https://github.com/SEU_USUARIO/lafitnes-pdv.git

# 3. Envie o código:
git push -u origin main
```

### 2. Deploy na Vercel (Hospedagem em Produção)

O projeto já contém o arquivo [`vercel.json`](vercel.json) configurado para suporte completo a SPA (Single Page Application), cabeçalhos de segurança e cache otimizado.

1. Acesse [https://vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique no botão **"Add New..."** > **"Project"**.
3. Selecione o repositório `lafitnes-pdv` que acabou de subir no GitHub.
4. As configurações de compilação são detectadas automaticamente:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Na seção **Environment Variables**, adicione as variáveis do Supabase (se for usar o banco remoto):
   - `VITE_SUPABASE_URL` = `https://seu-projeto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sua-chave-anonima`
6. Clique em **"Deploy"**. Em menos de 1 minuto, seu PDV estará online com HTTPS gratuito e CDN global!

---

## 📱 Instalação como PWA (Computador e Celular)

- **No Google Chrome / Edge (Desktop):** Clique no ícone de instalação na barra de endereços (ao lado do favorito) ou em *Menu > Instalar LA FITNESS PDV*. O aplicativo abrirá em janela própria sem barras do navegador.
- **No Celular (Android / iOS):** Acesse pelo navegador, clique em *Compartilhar* ou *Menu do Navegador* e selecione **Adicionar à Tela de Início**.

