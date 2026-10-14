# KOMBINE — Auditoria técnica e correções (13/10/2026)

## Falhas e incoerências identificadas no ZIP original

1. Autenticação administrativa era verificada no navegador por hash SHA-256, com sessão em `sessionStorage`; isso podia ser contornado e não protegia APIs/dados.
2. Produtos, pedidos e configurações eram armazenados principalmente no `localStorage`, sem persistência central.
3. O Worker aceitava valores enviados pelo navegador sem confirmar um pedido persistido ou comparar o total com preços autoritativos.
4. O webhook não persistia o estado do pedido, não deduplicava eventos e podia aceitar a ausência de segredo.
5. O checkout de demonstração podia aparentar pagamento aprovado e exibia QR Pix gerado localmente que não representava uma cobrança real.
6. Pedidos pendentes consumiam estoque localmente; status repetidos podiam duplicar vendas/alterações de estoque.
7. O PWA referenciava ícones PNG que não existiam no ZIP; o service worker também podia armazenar respostas de API.
8. Havia afirmações não comprovadas de vendas, avaliações, prazos de envio, parcelamento sem juros, troca e CNPJ.
9. Cards da home e a faixa animada continham textos hardcoded, impossibilitando a edição no painel.
10. O deploy dependia de um binding R2 inexistente; a mídia do catálogo não deve ser armazenada no SaaS, e sim referenciada por URLs públicas.

## Alterações implementadas

- Autenticação no Worker: PBKDF2-SHA-256 com salt aleatório, senha inicial `123456` apenas na inicialização do banco vazio, troca obrigatória no primeiro login, cookie HttpOnly assinado por HMAC, sessão de 8 horas e limitação de tentativas.
- Schema D1 em `worker/schema.sql` para usuários administrativos, sessões, estado da loja, pedidos, tentativas e eventos de webhook.
- Catálogo/configurações persistíveis via D1, com rota pública que não expõe pedidos nem dados pessoais e rota privada para administração.
- Criação de pedido no servidor com preços/estoque do catálogo D1, frete e descontos calculados no backend, cupons limitados a códigos permitidos e associação do pagamento a um pedido real.
- Pagamentos de cartão/Pix recusam pedido inexistente, total divergente, método divergente ou e-mail divergente; aprovação/cancelamento atualiza status e estoque no estado persistido.
- Webhook exige segredo, valida assinatura e registra eventos para deduplicação; consulta de status não retorna QR Pix.
- O painel usa URLs HTTPS de imagens, GIFs e vídeos; não faz upload de mídia nem depende de R2.
- Painel removido da navegação pública; a rota direta `/admin` continua disponível para o administrador.
- Edição no painel de faixa animada, hero, cards promocionais, banner, cards de diferenciais, políticas, frete/desconto e dados de contato.
- Checkout de demonstração deixa pedidos pendentes, não simula aprovação e não exibe QR Pix fictício nem solicita cartão sem gateway.
- Ícones PNG do PWA adicionados; service worker atualizado para ignorar `/api/` no cache.
- Removidas métricas/alegações de vendas, avaliações, CNPJ, prazos e parcelamento que não eram comprovadas.

## Testes executados

- `node --check worker/index.js`: aprovado.
- `node --test worker/worker.test.mjs`: 5 testes aprovados (health, CORS, ausência de D1, pedido inexistente e ausência de D1 na autenticação).
- Execução do `worker/schema.sql` em SQLite em memória: aprovada; todas as tabelas esperadas foram criadas.
- Verificação de dimensões dos ícones PWA: 192×192, 512×512 e 512×512 maskable, aprovada.
- Transpilação sintática de 38 arquivos TypeScript/TSX com o compilador TypeScript: aprovada.
- `node --check worker/index.js`: aprovado.
- `node --test worker/worker.test.mjs`: 7 testes aprovados na auditoria atual.
- **Build completo de Vite/TypeScript não confirmado**: `npm install` excedeu o tempo limite neste ambiente. É obrigatório executar `npm install` e `npm run build` no PC antes de publicar.

## Configuração obrigatória antes de produção

1. Confirmar o binding D1 `DB` apontando para o banco existente `kombine-db` e aplicar `worker/schema.sql` remotamente.
2. Não é necessário criar ou configurar R2.
3. Configurar `ADMIN_SESSION_SECRET`, `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` como secrets no Worker.
4. Configurar `ALLOWED_ORIGIN` para o domínio real e usar um domínio de API do mesmo site (ex.: `api.kombine.shop`) para evitar bloqueio de cookies de terceiros.
5. Configurar `VITE_MP_PUBLIC_KEY` e `VITE_MP_API_URL` no build frontend.
6. Fazer primeiro login com `123456` e imediatamente criar senha definitiva forte.
7. Substituir catálogo ilustrativo por produtos, fotos, preços, estoque e políticas reais.
8. Executar compra de teste ponta a ponta e validar webhook/estoque antes de aceitar pagamentos reais.

## Limitações restantes conhecidas

- Não há integração com transportadora/rastreio, envio de e-mails transacionais, contas de clientes, gestão fiscal ou emissão de nota.
- Categorias, navegação, ícones e partes da composição visual permanecem definidas no código; o painel já edita os principais conteúdos comerciais, mas ainda não é um construtor visual universal de todas as seções.
- A reserva de estoque usa pedidos pendentes recentes no D1, mas um volume alto de compras simultâneas exige uma tabela de inventário normalizada e transações/atualizações condicionais mais robustas.
- Não houve teste de integração real com credenciais Mercado Pago nem build Vite completo neste ambiente.


## Correção do erro de implantação de 14/10/2026

O log real mostrou que Cloudflare Builds esperava o Worker `kombiine`, enquanto o arquivo usava `kombinee`, e que `database_id = "REPLACE_WITH_D1_DATABASE_ID"` era um placeholder inválido. O arquivo `wrangler.toml` foi ajustado para `name = "kombiine"` e a declaração D1 com ID fictício foi removida para não sobrescrever o binding D1 já configurado no painel. **Antes do deploy, confirme que o painel do Worker `kombiine` injeta o binding `DB` apontando para o banco existente `kombine-db`; sem isso, o backend não terá acesso ao banco.** O UUID real não consta nos arquivos recebidos e não deve ser inventado. Consulte `DEPLOY-CLOUDFLARE-URGENTE.md`.


## Estado atual: catálogo por URL de mídia, sem R2

- Removido o binding R2 `IMAGES` do `wrangler.toml`, além dos endpoints de upload e leitura de arquivos do R2 no Worker.
- O painel administrativo cadastra URL HTTPS pública e tipo de mídia (imagem, GIF ou vídeo), com pré-visualização.
- O catálogo exibe imagens/GIFs por `<img>` e vídeos por `<video>`; os arquivos permanecem hospedados no serviço de origem.
- `wrangler` foi fixado como dependência de desenvolvimento e foi adicionado o script `npm run deploy`.
- **Bloqueio externo ao ZIP:** o UUID real do banco D1 não está presente nos arquivos. O log de deploy também não lista `DB`; antes de produção, configure esse binding com o banco `kombine-db` no painel ou inclua seu UUID real no `wrangler.toml`. Sem `DB`, login administrativo, catálogo persistido e checkout não funcionam no Worker.
