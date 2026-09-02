# Meets — versão fundida e funcional

Esta versão funde a base `Meets-Native-main` (PostgreSQL, Docker, autenticação, persistência e editor OpenCV) com a base `Meets-Native-snack-expo` (fluxo de avaliações e perfis públicos).

## Entregas

- PostgreSQL persistente com migração incremental `003_ratings_events_history.sql`.
- Avaliação de apresentações de 1 a 5 estrelas.
- Avaliação opcional de seis habilidades do apresentador.
- Média de estrelas e quantidade de avaliações no perfil.
- Média pública das seis habilidades e últimas avaliações.
- Controle de duplicidade: um usuário atualiza a própria avaliação em vez de criar várias para a mesma apresentação/apresentador.
- Bloqueio de autoavaliação.
- Histórico persistente de publicações, apresentações, eventos, curtidas, salvos, favoritos, avaliações e exclusões.
- Eventos com data, horário e local persistidos.
- Eventos e publicações do usuário aparecem no perfil.
- Eventos também entram no feed.
- Apresentações reais podem ser criadas pelo fluxo Criar e ficam avaliáveis no feed.
- Exclusão controlada de posts e eventos somente pelo próprio autor.
- Adminer adicionado ao Docker Compose para visualizar/controlar o PostgreSQL.
- Editor de imagem/OpenCV da versão principal preservado.
- Autenticação JWT e sessão AsyncStorage preservadas.

## Como iniciar

```bash
docker compose up -d --build
```

Frontend: `http://localhost:8080`
API: `http://localhost:3334`
Adminer: `http://localhost:8081`

Adminer:
- Servidor: `postgres`
- Banco: `meets`
- Usuário: `postgres`
- Senha: `postgres`
