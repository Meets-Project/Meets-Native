# Avaliações do Meets — persistência real

As avaliações deixaram de ser somente estado local. O fluxo agora usa PostgreSQL por meio da API Express.

## Regras

- Nota obrigatória de 1 a 5 estrelas.
- A tela inicia com 1 estrela.
- Avaliação de apresentador é opcional.
- Habilidades: Clareza, Domínio do conteúdo, Engajamento, Storytelling, Gestão de tempo e Recursos visuais.
- Score de habilidades: média simples de 0 a 99.
- Média pública de estrelas: média das avaliações recebidas, de 1 a 5.
- Um usuário não pode avaliar a si mesmo.
- A mesma pessoa pode atualizar sua avaliação da mesma apresentação/apresentador; não são criadas duplicatas.
- Avaliações e ações relevantes entram no histórico persistente.

## API

- `POST /ratings/presentations`
- `GET /ratings/speakers/:speakerId`
- `GET /history`
- `GET /users/me`

A tela pública do apresentador mostra média de estrelas, quantidade de avaliações, média das seis habilidades e as últimas avaliações.

## Banco

A estrutura está em `backend/migrations/003_ratings_events_history.sql`.
