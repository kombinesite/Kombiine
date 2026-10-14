# Correção de implantação Cloudflare — KOMBINE

## Configuração atual

- Worker: `kombiine`, conforme o nome esperado pelo Cloudflare Builds.
- Mídia de produto: links HTTPS públicos de imagens, GIFs e vídeos. A KOMBINE não faz upload desses arquivos e não usa R2.
- Banco: o binding D1 `DB` deve apontar para o banco existente `kombine-db`. O UUID real não consta no ZIP; confirme-o no painel Cloudflare e não use placeholders.
- Origem permitida: `https://kombine.shop`; `ALLOW_LOCAL = "false"` em produção.

## Passos

1. No painel Cloudflare, abra Workers & Pages → `kombiine` → Settings → Bindings. Confirme o binding D1 `DB` ligado ao banco `kombine-db`.
2. Se o binding estiver ausente, configure-o no painel ou copie o UUID verdadeiro do banco D1 para uma declaração `[[d1_databases]]` em `wrangler.toml`. Não invente o UUID.
3. Confirme os secrets `ADMIN_SESSION_SECRET`, `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`.
4. Faça commit dos arquivos e execute `npm run build`, `npm test` e `npm run deploy`.
5. Teste `/api/health`, login administrativo, cadastro de produto com link de imagem/GIF/vídeo, carrinho, checkout e notificações do gateway em ambiente de teste.

Não é necessário criar bucket R2 nem configurar binding `IMAGES`.
