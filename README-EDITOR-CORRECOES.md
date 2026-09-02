# Correções do editor de imagens

## Editor

O editor web agora possui:

- Corte personalizado com seleção arrastável.
- Aplicar corte usando `cv.Rect` + ROI do OpenCV.js.
- Histórico de alterações.
- Voltar alteração (Undo).
- Refazer alteração (Redo).
- Redefinir tudo.
- Filtros OpenCV existentes.
- Rotação, espelhamento, brilho, contraste e zoom.
- Exportação da imagem final para o fluxo de criação.

## Erro "Registro relacionado não encontrado"

O backend agora valida se o usuário do JWT ainda existe no PostgreSQL antes de permitir operações autenticadas. Isso evita tentar inserir `author_id` inexistente em `events`/`posts` e retorna `401` para sessão antiga.

O app remove o token inválido e leva o usuário novamente ao Login.

## Migrações

As migrações idempotentes são executadas sempre que o backend inicia, garantindo que instalações antigas recebam a coluna `events.image` e a alteração de `posts.image` para `TEXT`.

## OpenCV.js

A dependência continua sendo local via npm:

```bash
npm install
```

O editor importa:

```js
import('@opencvjs/web')
```

Não há dependência de CDN para o processamento.
