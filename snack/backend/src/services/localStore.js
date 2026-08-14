const defaultUserProfile = {
  id: 'me',
  name: 'Gabriel Rodrigues',
  role: 'Organizador de Meetups',
  city: 'São Paulo, BR',
  avatar: '🧑‍💻',
  connections: 128,
  eventsCount: 24,
  rating: 4.9,
  bio: 'Curador de encontros de tecnologia e produto.',
  savedItems: [],
  favoriteIds: [],
  history: [],
  creations: [],
  taggedPosts: [],
  participatedMeets: [],
  participatedRooms: [],
};

const localState = {
  users: {
    me: { ...defaultUserProfile },
  },
  posts: [],
  commentsByPost: {},
  shares: [],
  meets: [],
  rooms: [],
  history: [],
};

export function ensureLocalUser(userId) {
  const uid = userId || 'me';
  if (!localState.users[uid]) {
    localState.users[uid] = {
      ...defaultUserProfile,
      id: uid,
      name: `Usuário ${uid}`,
      role: 'Usuário local',
      city: 'Local',
      avatar: '👤',
      savedItems: [],
      favoriteIds: [],
      history: [],
      creations: [],
      taggedPosts: [],
      participatedMeets: [],
      participatedRooms: [],
    };
  }

  return localState.users[uid];
}

export function getLocalUser(userId) {
  return ensureLocalUser(userId);
}

export function upsertLocalUser(userId, payload = {}) {
  const current = ensureLocalUser(userId);
  const next = {
    ...current,
    ...payload,
    id: userId || current.id || 'me',
    savedItems: Array.isArray(payload.savedItems) ? payload.savedItems : current.savedItems || [],
    favoriteIds: Array.isArray(payload.favoriteIds) ? payload.favoriteIds : current.favoriteIds || [],
    history: Array.isArray(payload.history) ? payload.history : current.history || [],
    creations: Array.isArray(payload.creations) ? payload.creations : current.creations || [],
    taggedPosts: Array.isArray(payload.taggedPosts) ? payload.taggedPosts : current.taggedPosts || [],
    participatedMeets: Array.isArray(payload.participatedMeets) ? payload.participatedMeets : current.participatedMeets || [],
    participatedRooms: Array.isArray(payload.participatedRooms) ? payload.participatedRooms : current.participatedRooms || [],
  };

  localState.users[userId || 'me'] = next;
  return next;
}

export function listLocalPosts() {
  return [...localState.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function upsertLocalPost(post) {
  const index = localState.posts.findIndex((item) => item.id === post.id);
  if (index >= 0) {
    localState.posts[index] = { ...localState.posts[index], ...post };
    return localState.posts[index];
  }
  localState.posts.push(post);
  return post;
}

export function getLocalPostById(postId) {
  return localState.posts.find((item) => item.id === postId) || null;
}

export function getLocalComments(postId) {
  return Array.isArray(localState.commentsByPost[postId]) ? localState.commentsByPost[postId] : [];
}

export function addLocalComment(postId, comment) {
  const current = getLocalComments(postId);
  localState.commentsByPost[postId] = [comment, ...current];
  return comment;
}

export function addLocalShare(share) {
  localState.shares.push(share);
  return share;
}

export function listLocalMeets() {
  return [...localState.meets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function upsertLocalMeet(meet) {
  const index = localState.meets.findIndex((item) => item.id === meet.id);
  if (index >= 0) {
    localState.meets[index] = { ...localState.meets[index], ...meet };
    return localState.meets[index];
  }
  localState.meets.push(meet);
  return meet;
}

export function listLocalRooms() {
  return [...localState.rooms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function upsertLocalRoom(room) {
  const index = localState.rooms.findIndex((item) => item.id === room.id);
  if (index >= 0) {
    localState.rooms[index] = { ...localState.rooms[index], ...room };
    return localState.rooms[index];
  }
  localState.rooms.push(room);
  return room;
}

export function recordHistoryEntry(userId, entry) {
  const user = ensureLocalUser(userId);
  const nextEntry = {
    id: entry.id || `history-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  user.history = [nextEntry, ...(user.history || [])].slice(0, 50);
  localState.history = [nextEntry, ...localState.history].slice(0, 200);
  return nextEntry;
}

export function getHistoryForUser(userId) {
  const user = ensureLocalUser(userId);
  return Array.isArray(user.history) ? [...user.history] : [];
}

export function toggleFavoriteForUser(userId, item) {
  const user = ensureLocalUser(userId);
  const favoriteKey = item?.id || item?.creationId || item?.postId || `${item?.type || 'item'}-${Date.now()}`;
  const current = Array.isArray(user.favoriteIds) ? user.favoriteIds.slice() : [];
  const alreadySaved = current.includes(favoriteKey);

  const nextFavorites = alreadySaved ? current.filter((entry) => entry !== favoriteKey) : [favoriteKey, ...current];

  user.favoriteIds = nextFavorites;
  user.savedItems = Array.isArray(user.savedItems) ? user.savedItems.filter((entry) => (entry?.id || entry?.creationId || entry?.postId) !== favoriteKey) : [];

  if (!alreadySaved && item) {
    user.savedItems = [
      {
        id: `favorite-${Date.now()}`,
        creationId: item.id || item.creationId || item.postId || favoriteKey,
        creation: item,
        folderName: 'Favoritos',
        savedAt: new Date().toISOString(),
      },
      ...user.savedItems,
    ];
  }

  return { favorited: !alreadySaved, favorites: nextFavorites, savedItems: user.savedItems };
}

export function getLocalSnapshot() {
  return localState;
}

export function clearLocalState() {
  localState.users = { me: { ...defaultUserProfile } };
  localState.posts = [];
  localState.commentsByPost = {};
  localState.shares = [];
  localState.meets = [];
  localState.rooms = [];
  localState.history = [];
}
