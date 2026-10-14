# Publicação KOMBINE em Cloudflare Workers (workers.dev)

Endereço esperado: https://kombiine.mariliaschmidt9.workers.dev/

## Publicação
1. Instale Node.js LTS e execute `npm install`.
2. Confirme no painel Cloudflare que o Worker tem o nome `kombiine` e que `workers.dev` está habilitado.
3. Confirme o binding D1 chamado `DB` apontando para o banco já usado pela aplicação. Não crie nem substitua o banco sem backup.
4. Execute `npm test` e `npm run build`.
5. Faça login no Wrangler com a conta correta e execute `npm run deploy`.
6. Teste `/`, `/api/health`, login administrativo, catálogo e criação de pedido pendente.

## Pagamentos ainda sem credenciais
- Não é necessário cadastrar secrets de pagamento agora.
- Sem `MP_ACCESS_TOKEN`, as rotas de cobrança respondem indisponível (503), sem confirmar pagamento.
- Deixe `VITE_MP_PUBLIC_KEY` e `VITE_MP_API_URL` vazias até a integração oficial ser configurada.
- Checkout em modo demonstração pode registrar pedidos pendentes, mas não gera cobrança real, QR Code Pix válido nem aprovação.
- Nunca mude manualmente um pedido para pago para contornar a falta de credenciais.

## Importante
Este ZIP configura o frontend e API no mesmo Worker, mas não contém as configurações privadas da conta Cloudflare. O binding D1 e os secrets administrativos existentes devem ser preservados no painel. Não execute migrações remotas sem backup.
