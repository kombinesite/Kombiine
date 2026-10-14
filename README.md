# 🌸 KOMBINE — E-commerce Pink Power

E-commerce moderno, rápido e totalmente responsivo construído com **React 19 + Vite + TypeScript + Tailwind CSS v4**, com identidade visual baseada na logo oficial enviada pelo proprietário (Kombi rosa + panda no coração + lettering *Kombine*), aplicada nos componentes, favicon e ícones PWA.

## ✨ Recursos

- **Loja completa**: home com hero animado, cards promocionais, catálogo interativo (filtros, busca, ordenação), páginas de produto com galeria ampliada (lightbox + zoom), carrinho drawer + página e checkout em 3 etapas.
- **Checkout com Mercado Pago**: Pix oficial (QR Code + copia-e-cola), cartão com tokenização no navegador e consulta de status no Worker. Sem chaves configuradas, o pedido permanece pendente em **modo demonstração**, sem fingir pagamento aprovado.
- **Painel administrativo** (`/admin`): dashboard com KPIs e gráfico de 7 dias, CRUD de produtos, ajuste de estoque inline, gestão de pedidos com status, relatórios de vendas e configurações da loja.
- **PWA instalável**: manifest + ícones + service worker com cache inteligente e suporte offline. Banner "Instalar app".
- **SEO**: meta tags, Open Graph, JSON-LD `OnlineStore`, `robots.txt`, `sitemap.xml`, títulos dinâmicos por página.
- **Acessibilidade**: skip link, foco visível, labels ARIA, `prefers-reduced-motion`, contraste AA.

## 🚀 Começando

```bash
npm install
cp .env.example .env     # preencha as chaves (ver abaixo)
npm run icons            # gera os ícones PNG do PWA a partir de public/logo.png
npm run dev              # http://localhost:3000
```

Outros comandos:

```bash
npm run build    # build de produção (tsc + vite)
npm run preview  # pré-visualiza o build
```

## 🔐 Painel administrativo e segurança

O endereço `/admin` não aparece nos menus públicos. O acesso é validado pelo Cloudflare Worker, com cookie `HttpOnly`, sessão assinada e armazenada no D1, expiração de 8 horas e limitação de tentativas.

- Primeiro acesso: senha temporária `123456` **somente quando a tabela administrativa estiver vazia**.
- A primeira autenticação exige criar uma senha definitiva de 12+ caracteres com maiúsculas, minúsculas e números.
- Senhas são derivadas com PBKDF2-SHA-256 e salt aleatório; a senha não é armazenada em texto puro.
- As alterações de catálogo/configurações são sincronizadas ao D1 enquanto houver sessão administrativa.
- Nunca publique `.env`, `.dev.vars`, Access Token ou segredo de sessão.

A senha inicial é conhecida por definição e deve ser trocada imediatamente. O primeiro acesso deve ocorrer em um ambiente sob seu controle.

## 💳 Mercado Pago — integração pronta, só faltam as chaves

A arquitetura já está implementada conforme a documentação oficial:

```
Navegador (VITE_MP_PUBLIC_KEY)          Worker (MP_ACCESS_TOKEN)         Mercado Pago
────────────────────────────           ────────────────────────         ────────────
tokeniza o cartão (SDK MP.js v2)  ──►   POST /api/payments/card    ──►   POST /v1/payments
                                          POST /api/payments/pix    ──►   POST /v1/payments (pix)
                                          GET  /api/payments/:id    ──►   GET  /v1/payments/{id}
                                          POST /api/webhooks/...    ◄──   notificações
```

### 1. Obter as credenciais

Em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → sua aplicação → **Credenciais**:

| Chave | Onde usar | Sensível? |
|---|---|---|
| **Public Key** | frontend (`VITE_MP_PUBLIC_KEY`) | não (pública) |
| **Access Token** | Worker secret (`MP_ACCESS_TOKEN`) | **sim — nunca no frontend** |
| **Webhook secret** | Worker secret (`MP_WEBHOOK_SECRET`) | **sim** |

### 2. Configurar o frontend

```env
VITE_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_MP_API_URL=http://localhost:8787        # dev
# VITE_MP_API_URL=https://api.kombine.shop   # produção, domínio personalizado da API recomendado
```

### 3. Subir o backend (Cloudflare Worker)

```bash
npx wrangler login
npx wrangler dev                                  # testa em http://localhost:8787
npx wrangler secret put MP_ACCESS_TOKEN           # cole o Access Token
npx wrangler secret put MP_WEBHOOK_SECRET         # cole o segredo do webhook
npx wrangler deploy
```

Ajuste `ALLOWED_ORIGIN` em `wrangler.toml` para o domínio da loja (a API rejeita origens não autorizadas com HTTP 403).

### 4. Cadastrar o webhook

No painel do Mercado Pago, em **Suas integrações → Notificações**, cadastre a URL:

```
https://api.kombine.shop/api/webhooks/mercadopago
```

O Worker valida a assinatura (`x-signature` + `x-request-id`, HMAC-SHA256) e consulta o pagamento real antes de confirmar — como recomenda a documentação.

### 5. Testar

Cartões de teste oficiais:

| Bandeira | Número | CVV | Validade |
|---|---|---|---|
| Mastercard | 5031 4332 1540 6351 | 123 | 11/30 |
| Visa | 4235 6477 2802 5682 | 123 | 11/30 |
| Amex | 3753 651535 56885 | 1234 | 11/30 |
| Débito Elo | 5067 7667 8388 8311 | 123 | 11/30 |

Para simular recusa, use o nome do titular `OTHE`; `APRO` aprova o pagamento.

> 📌 **Antes de vender de verdade:** o Worker agora cria pedidos no D1 e confere o total contra o catálogo do servidor antes de aceitar o pagamento. Ainda é obrigatório testar todo o fluxo com credenciais de teste do Mercado Pago e validar concorrência/estoque antes de habilitar produção.

## 🗂️ Estrutura

```
├── public/           # manifest PWA, service worker, logo.svg, robots, sitemap, ícones
├── scripts/          # gen-icons.mjs (gera os PNGs do PWA a partir do logo)
├── worker/           # Cloudflare Worker: /api/payments/* e webhook do Mercado Pago
├── wrangler.toml     # config do Worker (segredos via `wrangler secret`)
└── src/
    ├── components/   # Header, Footer, CartDrawer, ProductCard, Logo, Icons, Toasts…
    ├── data/         # seed do catálogo + configurações padrão
    ├── lib/          # pix (BR Code/CRC16), card (Luhn/bandeira), mercadopago, seo, install
    ├── pages/        # Home, Catalog, Product, Cart, Checkout, OrderSuccess, admin/*
    └── store/        # Zustand: carrinho, catálogo/pedidos/config (persist localStorage)
```

## 📄 Licença

Projeto privado da KOMBINE. Todos os direitos reservados.


## ☁️ Preparação da Cloudflare (sem R2)

1. Configure o binding D1 `DB` no Worker `kombiine`, apontando para o banco existente `kombine-db`. O UUID real não está neste repositório; não invente um ID nem crie outro banco sem necessidade.
2. Aplique o esquema ao banco remoto existente, se ainda não tiver sido aplicado: `npm run db:remote`.
3. Configure os segredos do Worker: `ADMIN_SESSION_SECRET`, `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`.
4. Confira `ALLOWED_ORIGIN` e mantenha `ALLOW_LOCAL = "false"` em produção.
5. Configure `VITE_MP_PUBLIC_KEY` e `VITE_MP_API_URL` com os valores reais do Mercado Pago e do Worker.
6. Publique com `npm run deploy` ou pelo Cloudflare Builds usando `npx wrangler deploy`.
7. No painel administrativo, cadastre a mídia por link HTTPS público. Imagens, GIFs e vídeos permanecem hospedados no serviço de origem; o catálogo guarda apenas a URL e o tipo de mídia. Este projeto não usa R2 para mídia de produto.

### Limitações conhecidas antes de vendas reais

- O frontend ainda mantém carrinho e parte do fluxo de pedidos localmente; o checkout de demonstração cria pedido pendente e **não comprova pagamento**.
- O Worker vincula a intenção de pagamento a um pedido persistido e valida o total/método no servidor. A integração real ainda não foi testada com credenciais do Mercado Pago neste ambiente.
- A reserva de estoque usa pedidos pendentes recentes, mas ainda não é uma transação de inventário normalizada; teste cenários simultâneos e implemente reserva transacional antes de alto volume.
- O catálogo que acompanha o projeto é conteúdo inicial ilustrativo: revise produtos, descrições, preços, estoque e substitua as ilustrações por fotos reais no painel antes de vender.
- Categorias, ícones de seção, rotas principais e parte do layout continuam definidos no código; a área administrativa permite editar os principais textos/cards, políticas, preços, estoque e imagens, mas não é ainda um editor visual genérico de cada componente da página.
