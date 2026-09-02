# Implementacao Front-end: Avaliacao de Apresentacoes e Apresentadores

## Objetivo

Adicionar uma funcionalidade no app para:

1. Avaliar uma apresentacao com nota de 1 a 5 estrelas.
2. Opcionalmente avaliar o apresentador com 6 habilidades no estilo FIFA Skill.
3. Disponibilizar as avaliacoes do apresentador de forma publica no perfil.

Escopo atual: somente front-end, com dados mockados/local state.

## Experiencia de Uso (UX)

### Fluxo principal

1. Usuario visualiza o feed de posts.
2. Apenas posts marcados como apresentacao exibem acao "Avaliar apresentacao" ao lado dos outros interativos do post.
3. Ao tocar, abre fluxo de avaliacao da apresentacao ja com 1 estrela selecionada por padrao.
4. Usuario pode ajustar de 1 a 5 estrelas (nao existe nota 0).
5. No mesmo fluxo, o post exibe a lista de apresentadores para avaliacao individual.
6. Usuario seleciona um apresentador da lista e, opcionalmente, preenche as 6 habilidades.
7. Envia avaliacao.
8. Vê feedback visual de sucesso e resumo da avaliacao enviada.

### Regras de UX

1. Nota em estrelas sempre obrigatoria para enviar.
2. Toda avaliacao inicia com 1 estrela pre-selecionada.
3. Componente de estrelas permite apenas faixa de 1 a 5.
4. Bloco de habilidades so aparece quando a opcao de avaliar apresentador estiver ativa.
5. Cada habilidade inicia com valor padrao (ex.: 70) para reduzir friccao.
6. Mostrar score geral do apresentador calculado em tempo real.
7. Exibir microcopy deixando claro que a avaliacao de habilidades e opcional.
8. Em posts de apresentacao, a lista de apresentadores deve ser sempre visivel no card ou no fluxo de avaliacao.

## Modelo de Dados (front-end)

Criar dados em [snack/data/presentationRatings.js](snack/data/presentationRatings.js):

```js
export const postTypes = {
  DEFAULT: 'default',
  PRESENTATION: 'presentation',
};

export const presentationSkills = [
  { id: 'clarity', label: 'Clareza', short: 'CLR' },
  { id: 'content', label: 'Dominio do conteudo', short: 'CNT' },
  { id: 'engagement', label: 'Engajamento da audiencia', short: 'ENG' },
  { id: 'storytelling', label: 'Storytelling', short: 'STY' },
  { id: 'timing', label: 'Gestao de tempo', short: 'TMP' },
  { id: 'visuals', label: 'Recursos visuais', short: 'VIS' },
];

export const defaultSkillScores = {
  clarity: 70,
  content: 70,
  engagement: 70,
  storytelling: 70,
  timing: 70,
  visuals: 70,
};

export const defaultPresentationRating = {
  stars: 1,
  includeSpeakerSkills: false,
};
```

Formato sugerido para payload local:

```js
{
  postId: 'post-888',
  postType: 'presentation',
  presentationId: 'talk-123',
  stars: 1,
  speakers: [
    { id: 'speaker-1', name: 'Ana Lima' },
    { id: 'speaker-2', name: 'Carlos Souza' },
  ],
  selectedSpeakerId: 'speaker-1',
  includeSpeakerSkills: true,
  skills: {
    clarity: 82,
    content: 88,
    engagement: 76,
    storytelling: 79,
    timing: 80,
    visuals: 74,
  },
  speakerOverall: 80,
  comment: 'Conteudo excelente e didatica forte.'
}
```

## Componentes Novos

### 1) Componente de estrelas

Arquivo: [snack/components/StarRatingInput.js](snack/components/StarRatingInput.js)

Responsabilidade:

1. Renderizar 5 estrelas clicaveis.
2. Permitir selecionar de 1 a 5.
3. Emitir `onChange(value)`.

### 2) Componente de skill por atributo

Arquivo: [snack/components/SkillAttributeSlider.js](snack/components/SkillAttributeSlider.js)

Responsabilidade:

1. Mostrar nome da habilidade.
2. Slider de 0 a 99.
3. Badge com score atual.

Observacao tecnica:

1. Em Snack/Expo, usar `@react-native-community/slider` se o ambiente permitir.
2. Se nao for possivel, usar controles `-` e `+` com `TouchableOpacity` como fallback.

### 3) Bloco de avaliacao de habilidades

Arquivo: [snack/components/SpeakerSkillsCard.js](snack/components/SpeakerSkillsCard.js)

Responsabilidade:

1. Renderizar as 6 habilidades.
2. Calcular e mostrar score geral (`media simples`, arredondado).
3. Entregar alteracoes para tela pai.

## Tela Nova

Arquivo: [snack/screens/PresentationRatingScreen.js](snack/screens/PresentationRatingScreen.js)

Estrutura da tela:

1. Header da apresentacao (titulo, categoria e tag "Apresentacao").
2. Card "Avaliacao da apresentacao" com estrelas.
3. Lista de apresentadores vinculados ao post.
4. Toggle "Avaliar este apresentador tambem" (opcional).
5. Card de habilidades (condicional).
6. Campo opcional de comentario.
7. Botao "Enviar avaliacao".

Estados locais:

1. `stars` (number, default 1).
2. `includeSpeakerSkills` (boolean).
3. `selectedSpeakerId` (string).
4. `skillScoresBySpeaker` (mapa por speakerId).
5. `comment` (string).
6. `isSubmitting` (boolean).

Validacao front-end:

1. Garantir `stars >= 1` e `stars <= 5`.
2. Se `includeSpeakerSkills` for true, exigir `selectedSpeakerId` valido.
3. Se `includeSpeakerSkills` for true, garantir que os 6 campos existam para o apresentador selecionado.

## Navegacao

Alterar [snack/navigation/AppNavigation.js](snack/navigation/AppNavigation.js):

1. Registrar rota `PresentationRating` no Stack.
2. Titulo sugerido no header: "Avaliar apresentacao".

Ponto de entrada da feature (MVP):

1. Adicionar CTA em [snack/screens/HomeScreen.js](snack/screens/HomeScreen.js), dentro de cada card/feed:
  1. Exibir botao "Avaliar apresentacao" ao lado dos outros interativos (curtir, comentar, compartilhar etc.).
  2. Renderizar esse botao somente quando `post.type === 'presentation'`.
  3. Navegar com `postId`, `presentationId`, `presentationTitle`, `speakers[]`.

2. Atualizar modelo de post em [snack/data/feedItems.js](snack/data/feedItems.js):
  1. Acrescentar campo `type` (`default` ou `presentation`).
  2. Para `presentation`, incluir `presentationId` e lista `speakers`.

3. Ajustar card do feed em [snack/components/FeedCard.js](snack/components/FeedCard.js):
  1. Mostrar selo visual de "Apresentacao" para posts do tipo `presentation`.
  2. Exibir mini lista de apresentadores no proprio post.

## Estilos

Adicionar em [snack/styles/screenStyles.js](snack/styles/screenStyles.js):

1. `ratingCard`
2. `starRow`
3. `starButton`
4. `skillRow`
5. `skillLabel`
6. `skillValueBadge`
7. `overallSkillWrap`
8. `commentInput`
9. `submitRatingButton`

Opcional: tokens novos em [snack/styles/colors.js](snack/styles/colors.js)

1. `ratingGold` para estrela ativa.
2. `ratingMuted` para estrela inativa.
3. `skillTrack` para barra de skill.

## Simulacao de Persistencia (sem backend)

Criar service local: [snack/services/ratingsStorage.js](snack/services/ratingsStorage.js)

Abordagem simples:

1. Armazenar em memoria com array local para MVP de navegacao.
2. Opcao melhor: `AsyncStorage` para manter dados apos fechar app.
3. Salvar avaliacoes por apresentador para exibir dados publicos no perfil.

API sugerida:

```js
export async function savePresentationRating(rating) {}
export async function listPresentationRatings() {}
export async function getSpeakerAverageSkills(speakerId) {}
export async function listPublicSpeakerRatings(speakerId) {}
```

## Exibicao dos Resultados no Front

Adicionar resumo em [snack/screens/ProfileScreen.js](snack/screens/ProfileScreen.js):

1. Card publico "Score de apresentador".
2. Score geral (0-99).
3. Mini lista com as 6 habilidades e medias.
4. Quantidade total de avaliacoes recebidas.
5. Historico resumido das ultimas avaliacoes (ex.: ultimas 5).

Adicionar resumo em um detalhe de apresentacao (futuro):

1. Media de estrelas da apresentacao.
2. Contagem total de avaliacoes.
3. Lista de apresentadores com score publico agregado.

## Calculo de Pontuacao

Sugestao inicial:

1. `speakerOverall = Math.round((soma das 6 skills) / 6)`
2. Faixa de skills: `0` a `99`
3. Estrelas: `1` a `5` (default inicial `1`)

## Acessibilidade

1. Definir `accessibilityLabel` em estrelas e sliders.
2. Garantir tamanho de toque minimo de 44px para botoes.
3. Nao depender so de cor para indicar estado ativo/inativo.

## Plano de Entrega (em etapas)

### Etapa 1 - Base visual

1. Criar `StarRatingInput`.
2. Criar `SkillAttributeSlider`.
3. Criar `SpeakerSkillsCard`.

### Etapa 2 - Tela e navegacao

1. Criar `PresentationRatingScreen`.
2. Registrar rota em `AppNavigation`.
3. Adicionar CTA "Avaliar apresentacao" ao lado dos interativos do feed.
4. Marcar posts de apresentacao e listar apresentadores no card.

### Etapa 3 - Persistencia local e resumo

1. Criar `ratingsStorage`.
2. Salvar submissao localmente.
3. Exibir score agregado no perfil publico do apresentador.

### Etapa 4 - Refinos de UX

1. Mensagens de erro/sucesso.
2. Loading state no envio.
3. Ajustes de acessibilidade.

## Critérios de Aceite (front-end)

1. Usuario consegue avaliar uma apresentacao com 1-5 estrelas.
2. Toda avaliacao inicia com 1 estrela pre-selecionada.
3. Apenas posts marcados como apresentacao exibem CTA de avaliacao.
4. Posts de apresentacao exibem lista de apresentadores para avaliacao individual.
5. Usuario consegue optar por avaliar o apresentador com 6 habilidades.
6. Score geral do apresentador e calculado e exibido em tempo real.
7. Envio da avaliacao funciona localmente sem backend.
8. Dados de avaliacao do apresentador ficam visiveis publicamente no perfil.
9. Fluxo e navegavel via app atual sem quebrar telas existentes.

## Fora de Escopo Agora

1. API real para salvar avaliacoes.
2. Regras anti-fraude (voto unico por usuario, moderacao).
3. Ranking global de apresentadores.

## Evolucao Natural para Backend

Quando for conectar no backend:

1. Substituir `ratingsStorage` por chamadas em [snack/services/userApi.js](snack/services/userApi.js) ou um novo `ratingsApi.js`.
2. Enviar payload com `presentationId`, `userId`, `stars`, `skills`, `comment`.
3. Buscar agregados para exibir medias e distribuicoes.
