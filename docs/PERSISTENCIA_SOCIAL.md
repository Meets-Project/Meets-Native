# Persistência social do Meets

Este documento descreve a estrutura de persistência usada para posts, comentários, estrelas, compartilhamentos, histórico, meets e salas virtuais.

## Estrutura principal do Firestore

### Usuários
- `users/{userId}`
- Campos típicos: `name`, `role`, `city`, `avatar`, `savedItems`, `favoriteIds`, `history`, `creations`, `participatedMeets`, `participatedRooms`.

### Posts
- `posts/{postId}`
- Campos principais: `id`, `title`, `content`, `authorId`, `authorName`, `avatar`, `attachment`, `createdAt`, `stars`, `commentsCount`, `shareCount`.

### Comentários por post
- `posts/{postId}/comments/{commentId}`
- Campos: `authorId`, `authorName`, `avatar`, `message`, `createdAt`.

### Estrelas
- `stars/{starId}` ou `posts/{postId}` com campo `starredBy`
- Armazena quem marcou a postagem.

### Compartilhamentos
- `shares/{shareId}`
- Campos: `postId`, `userId`, `channel`, `createdAt`.

### Meets presenciais
- `meets/{meetId}`
- Campos: `title`, `date`, `time`, `location`, `details`, `creatorId`, `creatorName`, `participants`, `createdAt`.

### Salas virtuais
- `rooms/{roomId}`
- Campos: `title`, `topic`, `duration`, `summary`, `creatorId`, `creatorName`, `participants`, `status`, `createdAt`.

### Histórico
- `users/{userId}/history/{historyId}`
- Registra ações do usuário, como criação de post, meet, sala, estrela, comentário, compartilhamento, participação e entrada em sala.

## Endpoints principais

### Posts
- `GET /api/posts`
- `POST /api/posts`
- `POST /api/posts/:id/star`
- `GET /api/posts/:id/comments`
- `POST /api/posts/:id/comments`
- `POST /api/posts/:id/share`

### Meets e salas
- `GET /api/meets`
- `POST /api/meets`
- `POST /api/meets/:id/join`
- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/:id/join`

### Histórico
- `GET /api/history`

## Fallback local para desenvolvimento

Quando o backend não tem Firebase configurado, o app usa um identificador de desenvolvimento enviado pelo header `X-Dev-User-Id` e o backend persiste em memória. Isso permite testar o cadastro e as ações sociais sem exigir o Firebase Auth do frontend.

## Observações

- Em produção, o Firebase ID Token continua sendo obrigatório para rotas autenticadas.
- O fluxo atual pode preservar anexos em `data:` URL dentro do documento; para produção, o ideal é migrar os arquivos para Firebase Storage e guardar apenas a URL.
