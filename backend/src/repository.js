export function makeRepository(db) {
  const one = async (sql, params = []) => (await db.query(sql, params)).rows[0] || null;
  const many = async (sql, params = []) => (await db.query(sql, params)).rows;

  const addHistory = async (userId, { type, title, subtitle = '' }) =>
    one(`INSERT INTO history(user_id,type,title,subtitle)
         VALUES($1,$2,$3,$4)
         RETURNING id,type,title,subtitle,created_at`, [userId, type, title, subtitle]);

  const safeSkills = (skills = {}) => ({
    clarity: Math.max(0, Math.min(99, Number(skills.clarity ?? 70))),
    content: Math.max(0, Math.min(99, Number(skills.content ?? 70))),
    engagement: Math.max(0, Math.min(99, Number(skills.engagement ?? 70))),
    storytelling: Math.max(0, Math.min(99, Number(skills.storytelling ?? 70))),
    timing: Math.max(0, Math.min(99, Number(skills.timing ?? 70))),
    visuals: Math.max(0, Math.min(99, Number(skills.visuals ?? 70))),
  });

  return {
    async createUser({ name, email, passwordHash, avatar }) {
      return one(`INSERT INTO users(name,email,password_hash,avatar) VALUES($1,$2,$3,$4)
        RETURNING id,name,email,role,city,avatar,bio,created_at,updated_at`, [name, email, passwordHash, avatar || null]);
    },

    async findUserByEmail(email) {
      return one(`SELECT * FROM users WHERE lower(email)=lower($1)`, [email]);
    },

    async getUser(id) {
      const user = await one(`SELECT id,name,email,role,city,address_number,avatar,bio,created_at,updated_at FROM users WHERE id=$1`, [id]);
      if (!user) return null;
      const [events, connections, ratings] = await Promise.all([
        one(`SELECT count(*)::int total FROM events WHERE author_id=$1`, [id]),
        one(`SELECT count(*)::int total FROM user_connections WHERE user_id=$1`, [id]),
        many(`SELECT stars FROM presentation_ratings WHERE speaker_id=$1`, [id]),
      ]);
      const ratingsList = ratings || [];
      const totalRatings = ratingsList.length;
      const avgRating = totalRatings > 0
        ? Number((ratingsList.reduce((acc, r) => acc + Number(r.stars || 0), 0) / totalRatings).toFixed(1))
        : 0;

      return {
        ...user,
        events_count: Number(events?.total || 0),
        connections: Number(connections?.total || 0),
        rating: avgRating,
        ratings_count: totalRatings,
      };
    },

    async updateUser(id, data) {
      return one(`UPDATE users SET name=COALESCE($2,name), role=COALESCE($3,role),
        city=COALESCE($4,city), address_number=COALESCE($5,address_number), avatar=COALESCE($6,avatar), bio=COALESCE($7,bio), updated_at=NOW()
        WHERE id=$1 RETURNING id,name,email,role,city,address_number,avatar,bio,created_at,updated_at`,
        [id, data.name ?? null, data.role ?? null, data.city ?? null, data.addressNumber ?? null, data.avatar ?? null, data.bio ?? null]);
    },

    async search(term) {
      const q = `%${term}%`;
      return many(`SELECT 'user' type,id,name title,role subtitle,avatar FROM users
        WHERE name ILIKE $1 OR role ILIKE $1
        UNION ALL
        SELECT 'post' type,p.id,p.content title,u.name subtitle,u.avatar
        FROM posts p JOIN users u ON u.id=p.author_id
        WHERE p.content ILIKE $1
        ORDER BY title LIMIT 50`, [q]);
    },

    // --- CHAT SYSTEM ---
    async listChats(userId) {
      return many(`SELECT c.id,
        CASE
          WHEN (SELECT count(*) FROM chat_members WHERE chat_id=c.id) = 2 THEN
            COALESCE((SELECT u.name FROM chat_members cm2 JOIN users u ON u.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id <> $1 LIMIT 1), c.name)
          ELSE c.name
        END AS name,
        CASE
          WHEN (SELECT count(*) FROM chat_members WHERE chat_id=c.id) = 2 THEN
            COALESCE((SELECT u.avatar FROM chat_members cm2 JOIN users u ON u.id=cm2.user_id WHERE cm2.chat_id=c.id AND cm2.user_id <> $1 LIMIT 1), '👤')
          ELSE '💬'
        END AS avatar,
        c.preview,
        COALESCE(cm.unread, 0) AS unread,
        c.created_at
        FROM chats c JOIN chat_members cm ON cm.chat_id=c.id
        WHERE cm.user_id=$1 ORDER BY c.created_at DESC`, [userId]);
    },

    async getOrCreateDirectChat(userId, recipientId) {
      if (userId === recipientId) {
        throw new Error('Não é possível criar um chat consigo mesmo.');
      }
      const recipient = await one(`SELECT id,name,avatar FROM users WHERE id=$1`, [recipientId]);
      if (!recipient) throw new Error('Usuário destinatário não encontrado.');

      // Check if a direct chat between these two users already exists
      const directChats = await many(`
        SELECT cm1.chat_id AS id, c.name, c.preview, c.created_at
        FROM chat_members cm1
        JOIN chat_members cm2 ON cm2.chat_id = cm1.chat_id AND cm2.user_id = $2
        JOIN chats c ON c.id = cm1.chat_id
        WHERE cm1.user_id = $1
      `, [userId, recipientId]);

      if (directChats && directChats.length > 0) {
        return {
          ...directChats[0],
          name: recipient.name,
          avatar: recipient.avatar,
        };
      }

      // Create new chat
      const chat = await one(`INSERT INTO chats(name, preview) VALUES($1, $2) RETURNING id, name, preview, created_at`,
        [recipient.name, 'Conversa iniciada']);

      await db.query(`INSERT INTO chat_members(chat_id, user_id, unread) VALUES($1, $2, 0), ($1, $3, 0)`,
        [chat.id, userId, recipientId]);

      return {
        ...chat,
        name: recipient.name,
        avatar: recipient.avatar,
      };
    },

    async listChatMessages(chatId, userId) {
      // Ensure user is member
      const member = await one(`SELECT 1 FROM chat_members WHERE chat_id=$1 AND user_id=$2`, [chatId, userId]);
      if (!member) {
        const err = new Error('Você não tem acesso a esta conversa.');
        err.code = 'FORBIDDEN';
        throw err;
      }

      // Mark unread as 0 for this user
      await db.query(`UPDATE chat_members SET unread=0 WHERE chat_id=$1 AND user_id=$2`, [chatId, userId]);

      return many(`
        SELECT m.id, m.chat_id, m.sender_id, m.content, m.created_at,
          u.name AS sender_name, u.avatar AS sender_avatar
        FROM chat_messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.chat_id = $1
        ORDER BY m.created_at ASC
        LIMIT 200
      `, [chatId]);
    },

    async sendChatMessage(chatId, senderId, content) {
      const member = await one(`SELECT 1 FROM chat_members WHERE chat_id=$1 AND user_id=$2`, [chatId, senderId]);
      if (!member) {
        const err = new Error('Você não tem permissão para enviar mensagens neste chat.');
        err.code = 'FORBIDDEN';
        throw err;
      }

      const sender = await one(`SELECT id,name,avatar FROM users WHERE id=$1`, [senderId]);

      const msg = await one(`
        INSERT INTO chat_messages(chat_id, sender_id, content)
        VALUES($1, $2, $3)
        RETURNING id, chat_id, sender_id, content, created_at
      `, [chatId, senderId, content]);

      // Update chat preview and timestamp
      await db.query(`UPDATE chats SET preview=$1, created_at=NOW() WHERE id=$2`, [content.slice(0, 500), chatId]);

      // Increment unread for all other members
      await db.query(`UPDATE chat_members SET unread = unread + 1 WHERE chat_id=$1 AND user_id <> $2`, [chatId, senderId]);

      // Notify other members
      const otherMembers = await many(`SELECT user_id FROM chat_members WHERE chat_id=$1 AND user_id <> $2`, [chatId, senderId]);
      for (const m of otherMembers) {
        await this.createNotification(m.user_id, {
          title: `Mensagem de ${sender?.name || 'Usuário'}`,
          body: content.slice(0, 120),
        });
      }

      await addHistory(senderId, {
        type: 'chat_message',
        title: 'Enviou uma mensagem',
        subtitle: content.slice(0, 100),
      });

      return {
        ...msg,
        sender_name: sender?.name,
        sender_avatar: sender?.avatar,
      };
    },

    async markChatRead(chatId, userId) {
      return db.query(`UPDATE chat_members SET unread=0 WHERE chat_id=$1 AND user_id=$2`, [chatId, userId]);
    },

    // --- COMMENTS SYSTEM ---
    async listComments(targetId) {
      return many(`
        SELECT c.id, c.post_id, c.event_id, c.content, c.created_at,
          u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar, u.role AS user_role
        FROM post_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = $1 OR c.event_id = $1
        ORDER BY c.created_at ASC
        LIMIT 200
      `, [targetId]);
    },

    async createComment(userId, { postId = null, eventId = null, content }) {
      if (!postId && !eventId) throw new Error('Post ou evento não informado.');
      const user = await one(`SELECT id, name, avatar, role FROM users WHERE id=$1`, [userId]);
      const comment = await one(`
        INSERT INTO post_comments(post_id, event_id, user_id, content)
        VALUES($1, $2, $3, $4)
        RETURNING id, post_id, event_id, user_id, content, created_at
      `, [postId || null, eventId || null, userId, content]);

      await addHistory(userId, {
        type: 'comment',
        title: 'Comentou em uma publicação',
        subtitle: content.slice(0, 100),
      });

      return {
        ...comment,
        user_name: user?.name,
        user_avatar: user?.avatar,
        user_role: user?.role,
      };
    },

    async deleteComment(userId, commentId) {
      const result = await db.query(`DELETE FROM post_comments WHERE id=$1 AND user_id=$2 RETURNING id`, [commentId, userId]);
      return Boolean(result.rows[0]);
    },

    // --- FEED & POSTS ---
    async listPosts(limit = 50) {
      const rows = await many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.type,p.title,p.presentation_id,p.mentioned_event_id,
        u.id author_id, u.name author_name, u.avatar author_avatar,
        COALESCE(c.comments_count, 0)::int AS comments_count,
        e.title AS mentioned_event_title, e.event_date AS mentioned_event_date, e.event_time AS mentioned_event_time, e.location AS mentioned_event_location
        FROM posts p
        JOIN users u ON u.id=p.author_id
        LEFT JOIN (SELECT post_id, count(*)::int AS comments_count FROM post_comments GROUP BY post_id) c ON c.post_id=p.id
        LEFT JOIN events e ON e.id=p.mentioned_event_id
        ORDER BY p.created_at DESC LIMIT $1`, [limit]);

      return rows.map((p) => ({
        id: p.id,
        content: p.content,
        image: p.image,
        likes: p.likes,
        created_at: p.created_at,
        type: p.type,
        title: p.title,
        presentation_id: p.presentation_id,
        comments_count: Number(p.comments_count || 0),
        mentioned_event: p.mentioned_event_id ? {
          id: p.mentioned_event_id,
          title: p.mentioned_event_title,
          event_date: p.mentioned_event_date,
          event_time: p.mentioned_event_time,
          location: p.mentioned_event_location,
        } : null,
        author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
        speakers: [],
      }));
    },

    async listFeed(userId = null, filter = 'all', limit = 50) {
      let savedPostSet = new Set();
      let likedPostSet = new Set();
      let connectedSet = new Set();
      let savedEventSet = new Set();
      let partEventSet = new Set();

      if (userId) {
        const [savedPosts, likedPosts, connections, savedEvents, partEvents] = await Promise.all([
          many(`SELECT post_id FROM saved_posts WHERE user_id=$1`, [userId]),
          many(`SELECT post_id FROM post_likes WHERE user_id=$1`, [userId]),
          many(`SELECT connected_user_id FROM user_connections WHERE user_id=$1`, [userId]),
          many(`SELECT event_id FROM saved_events WHERE user_id=$1`, [userId]),
          many(`SELECT event_id FROM event_participants WHERE user_id=$1`, [userId]),
        ]);
        savedPostSet = new Set((savedPosts || []).map(r => r.post_id));
        likedPostSet = new Set((likedPosts || []).map(r => r.post_id));
        connectedSet = new Set((connections || []).map(r => r.connected_user_id));
        savedEventSet = new Set((savedEvents || []).map(r => r.event_id));
        partEventSet = new Set((partEvents || []).map(r => r.event_id));
      }

      const posts = await many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.type,p.title,p.presentation_id,p.event_date,p.event_time,p.event_end_time,p.mentioned_event_id,
        u.id author_id, u.name author_name, u.avatar author_avatar,
        COALESCE(c.comments_count, 0)::int AS comments_count,
        e.title AS mentioned_event_title, e.event_date AS mentioned_event_date, e.event_time AS mentioned_event_time, e.location AS mentioned_event_location
        FROM posts p
        JOIN users u ON u.id=p.author_id
        LEFT JOIN (SELECT post_id, count(*)::int AS comments_count FROM post_comments GROUP BY post_id) c ON c.post_id=p.id
        LEFT JOIN events e ON e.id=p.mentioned_event_id
        ORDER BY p.created_at DESC LIMIT $1`, [limit]);

      let formattedPosts = posts.map((p) => ({
        id: p.id,
        content: p.content,
        image: p.image,
        likes: p.likes,
        created_at: p.created_at,
        type: p.type,
        title: p.title,
        presentation_id: p.presentation_id,
        event_date: p.event_date,
        event_time: p.event_time,
        event_end_time: p.event_end_time,
        comments_count: Number(p.comments_count || 0),
        mentioned_event: p.mentioned_event_id ? {
          id: p.mentioned_event_id,
          title: p.mentioned_event_title,
          event_date: p.mentioned_event_date,
          event_time: p.mentioned_event_time,
          location: p.mentioned_event_location,
        } : null,
        author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
        speakers: [],
        is_saved: savedPostSet.has(p.id),
        is_liked: likedPostSet.has(p.id),
        is_connected: connectedSet.has(p.author_id),
      }));

      if (filter === 'connections' && userId) {
        formattedPosts = formattedPosts.filter(p => connectedSet.has(p.author.id));
      }

      // Fetch speakers for any presentations in feed
      const presIds = formattedPosts.filter((p) => p.presentation_id).map((p) => p.presentation_id);
      if (presIds.length > 0) {
        const speakers = await many(`SELECT ps.presentation_id, s.id, s.name, s.avatar
          FROM presentation_speakers ps JOIN users s ON s.id=ps.speaker_id
          WHERE ps.presentation_id = ANY($1) ORDER BY s.name`, [presIds]);
        const speakersByPres = {};
        speakers.forEach((s) => {
          if (!speakersByPres[s.presentation_id]) speakersByPres[s.presentation_id] = [];
          speakersByPres[s.presentation_id].push({ id: s.id, name: s.name, avatar: s.avatar });
        });
        formattedPosts.forEach((p) => {
          if (p.presentation_id && speakersByPres[p.presentation_id]) {
            p.speakers = speakersByPres[p.presentation_id];
          }
        });
      }

      const [events, partCounts] = await Promise.all([
        many(`SELECT e.id,e.title,e.description AS content,e.image,e.created_at,
          'event'::varchar AS type,''::varchar AS presentation_id,
          u.id author_id, u.name author_name, u.avatar author_avatar,
          e.event_date,e.event_time,e.event_end_time,e.location,
          COALESCE(c.comments_count, 0)::int AS comments_count
        FROM events e JOIN users u ON u.id=e.author_id
        LEFT JOIN (SELECT event_id, count(*)::int AS comments_count FROM post_comments GROUP BY event_id) c ON c.event_id=e.id
        ORDER BY e.created_at DESC LIMIT $1`, [limit]),
        many(`SELECT event_id, count(*)::int AS count FROM event_participants GROUP BY event_id`),
      ]);

      const partCountMap = {};
      (partCounts || []).forEach((p) => {
        partCountMap[p.event_id] = Number(p.count || 0);
      });

      let formattedEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        image: e.image,
        created_at: e.created_at,
        type: e.type,
        presentation_id: e.presentation_id,
        author: { id: e.author_id, name: e.author_name, avatar: e.author_avatar },
        speakers: [],
        event_date: e.event_date,
        event_time: e.event_time,
        event_end_time: e.event_end_time,
        location: e.location,
        participants_count: partCountMap[e.id] || 0,
        comments_count: Number(e.comments_count || 0),
        is_participating: partEventSet.has(e.id),
        is_saved: savedEventSet.has(e.id),
        is_connected: connectedSet.has(e.author_id),
      }));

      if (filter === 'connections' && userId) {
        formattedEvents = formattedEvents.filter(e => connectedSet.has(e.author.id));
      }

      return [...formattedPosts, ...formattedEvents].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    },

    async createPost(userId, { content, image, title = '', type = 'default', presentationId = null, mentionedEventId = null, eventDate = null, eventTime = null, eventEndTime = null }) {
      return one(`INSERT INTO posts(author_id,content,image,title,type,presentation_id,mentioned_event_id,event_date,event_time,event_end_time)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING id,content,image,likes,created_at,type,title,presentation_id,mentioned_event_id,event_date,event_time,event_end_time`,
        [userId, content, image || null, title || content.slice(0, 160), type, presentationId, mentionedEventId || null, eventDate || null, eventTime || null, eventEndTime || null]);
    },

    async updatePost(userId, postId, data) {
      const post = await one(`SELECT id, author_id FROM posts WHERE id=$1 AND author_id=$2`, [postId, userId]);
      if (!post) {
        const err = new Error('Publicação não encontrada ou sem permissão para editar.');
        err.code = 'FORBIDDEN';
        throw err;
      }
      return one(`
        UPDATE posts SET
          title = COALESCE($3, title),
          content = COALESCE($4, content),
          image = COALESCE($5, image),
          mentioned_event_id = COALESCE($6, mentioned_event_id)
        WHERE id = $1 AND author_id = $2
        RETURNING id, title, content, image, mentioned_event_id, type, presentation_id, likes, created_at
      `, [postId, userId, data.title ?? null, data.content ?? null, data.image ?? null, data.mentionedEventId ?? null]);
    },

    async createPresentation(userId, { title, description = '', image = null, presentationId, speakerIds = [], eventDate, eventTime, eventEndTime }) {
      const id = presentationId || `presentation-${crypto.randomUUID()}`;
      const post = await this.createPost(userId, {
        content: description || title,
        image,
        title,
        type: 'presentation',
        presentationId: id,
        eventDate,
        eventTime,
        eventEndTime,
      });
      const ids = [...new Set([userId, ...(speakerIds || [])])];
      for (const speakerId of ids) {
        await db.query(`INSERT INTO presentation_speakers(presentation_id,speaker_id)
          VALUES($1,$2) ON CONFLICT DO NOTHING`, [id, speakerId]);
      }
      return this.getPostById(post.id);
    },

    async getPostById(id) {
      const p = await one(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.type,p.title,p.presentation_id,p.event_date,p.event_time,p.event_end_time,p.mentioned_event_id,
        u.id author_id, u.name author_name, u.avatar author_avatar,
        COALESCE(c.comments_count, 0)::int AS comments_count,
        e.title AS mentioned_event_title, e.event_date AS mentioned_event_date, e.event_time AS mentioned_event_time, e.location AS mentioned_event_location
        FROM posts p
        JOIN users u ON u.id=p.author_id
        LEFT JOIN (SELECT post_id, count(*)::int AS comments_count FROM post_comments GROUP BY post_id) c ON c.post_id=p.id
        LEFT JOIN events e ON e.id=p.mentioned_event_id
        WHERE p.id=$1`, [id]);
      if (!p) return null;
      let speakers = [];
      if (p.presentation_id) {
        speakers = await many(`SELECT s.id,s.name,s.avatar FROM presentation_speakers ps JOIN users s ON s.id=ps.speaker_id WHERE ps.presentation_id=$1 ORDER BY s.name`, [p.presentation_id]);
      }
      return {
        id: p.id,
        content: p.content,
        image: p.image,
        likes: p.likes,
        created_at: p.created_at,
        type: p.type,
        title: p.title,
        presentation_id: p.presentation_id,
        event_date: p.event_date,
        event_time: p.event_time,
        event_end_time: p.event_end_time,
        comments_count: Number(p.comments_count || 0),
        mentioned_event: p.mentioned_event_id ? {
          id: p.mentioned_event_id,
          title: p.mentioned_event_title,
          event_date: p.mentioned_event_date,
          event_time: p.mentioned_event_time,
          location: p.mentioned_event_location,
        } : null,
        author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
        speakers,
      };
    },

    async toggleLike(userId, postId) {
      const existing = await one(`SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
      if (existing) {
        await db.query(`DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
        await addHistory(userId, { type: 'like_removed', title: 'Removeu uma curtida', subtitle: `Post ${postId}` });
      } else {
        await db.query(`INSERT INTO post_likes(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [userId, postId]);
        await addHistory(userId, { type: 'like', title: 'Curtiu uma publicação', subtitle: `Post ${postId}` });
      }
      return one(`UPDATE posts SET likes=(SELECT count(*) FROM post_likes WHERE post_id=$1)
        WHERE id=$1 RETURNING id,likes`, [postId]);
    },

    // --- SAVED POSTS & EVENTS ---
    async toggleSave(userId, itemId) {
      // Check if this itemId is an event
      const isEvent = await one(`SELECT id, title FROM events WHERE id=$1`, [itemId]);
      if (isEvent) {
        return this.toggleSaveEvent(userId, itemId);
      }

      // Otherwise assume post
      const isPost = await one(`SELECT id, title FROM posts WHERE id=$1`, [itemId]);
      const existing = await one(`SELECT 1 FROM saved_posts WHERE user_id=$1 AND post_id=$2`, [userId, itemId]);
      if (existing) {
        await db.query(`DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2`, [userId, itemId]);
        await addHistory(userId, { type: 'unsave', title: 'Removeu um item dos salvos', subtitle: isPost?.title || `Post ${itemId}` });
        return false;
      } else {
        await db.query(`INSERT INTO saved_posts(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [userId, itemId]);
        await addHistory(userId, { type: 'save', title: 'Salvou uma publicação', subtitle: isPost?.title || `Post ${itemId}` });
        return true;
      }
    },

    async toggleSaveEvent(userId, eventId) {
      const ev = await one(`SELECT id, title FROM events WHERE id=$1`, [eventId]);
      const existing = await one(`SELECT 1 FROM saved_events WHERE user_id=$1 AND event_id=$2`, [userId, eventId]);
      if (existing) {
        await db.query(`DELETE FROM saved_events WHERE user_id=$1 AND event_id=$2`, [userId, eventId]);
        await addHistory(userId, { type: 'unsave_event', title: 'Removeu evento dos salvos', subtitle: ev?.title || `Evento ${eventId}` });
        return false;
      } else {
        await db.query(`INSERT INTO saved_events(user_id,event_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [userId, eventId]);
        await addHistory(userId, { type: 'save_event', title: 'Salvou um evento', subtitle: ev?.title || `Evento ${eventId}` });
        return true;
      }
    },

    async listSaved(userId) {
      return many(`
        SELECT 'post'::varchar AS type, p.id, p.content, p.image, p.likes, p.created_at, p.title,
          u.name AS author_name, u.avatar AS author_avatar, s.created_at AS saved_at,
          NULL::date AS event_date, NULL::time AS event_time, ''::varchar AS location
        FROM saved_posts s
        JOIN posts p ON p.id=s.post_id
        JOIN users u ON u.id=p.author_id
        WHERE s.user_id=$1

        UNION ALL

        SELECT 'event'::varchar AS type, e.id, e.description AS content, e.image, 0 AS likes, e.created_at, e.title,
          u.name AS author_name, u.avatar AS author_avatar, se.created_at AS saved_at,
          e.event_date, e.event_time, e.location
        FROM saved_events se
        JOIN events e ON e.id=se.event_id
        JOIN users u ON u.id=e.author_id
        WHERE se.user_id=$1

        ORDER BY saved_at DESC
      `, [userId]);
    },

    async toggleFavorite(userId, postId) {
      const existing = await one(`SELECT 1 FROM favorites WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
      if (existing) {
        await db.query(`DELETE FROM favorites WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
        await addHistory(userId, { type: 'favorite_removed', title: 'Removeu dos favoritos', subtitle: `Post ${postId}` });
      } else {
        await db.query(`INSERT INTO favorites(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [userId, postId]);
        await addHistory(userId, { type: 'favorite', title: 'Adicionou aos favoritos', subtitle: `Post ${postId}` });
      }
      return !existing;
    },

    async listFavorites(userId) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.title,p.type,u.name author_name
        FROM favorites f JOIN posts p ON p.id=f.post_id JOIN users u ON u.id=p.author_id
        WHERE f.user_id=$1 ORDER BY f.created_at DESC`, [userId]);
    },

    // --- EVENT PARTICIPANTS & REUNIONS ---
    async toggleEventParticipation(userId, eventId) {
      const ev = await one(`SELECT id, title, author_id FROM events WHERE id=$1`, [eventId]);
      if (!ev) {
        const err = new Error('Evento / reunião não encontrado.');
        err.code = '23503';
        throw err;
      }

      const existing = await one(`SELECT 1 FROM event_participants WHERE event_id=$1 AND user_id=$2`, [eventId, userId]);
      let participating = false;
      if (existing) {
        await db.query(`DELETE FROM event_participants WHERE event_id=$1 AND user_id=$2`, [eventId, userId]);
        await addHistory(userId, { type: 'event_left', title: 'Cancelou presença em reunião', subtitle: ev.title });
        participating = false;
      } else {
        await db.query(`INSERT INTO event_participants(event_id, user_id, status) VALUES($1, $2, 'confirmed') ON CONFLICT DO NOTHING`, [eventId, userId]);
        await addHistory(userId, { type: 'event_joined', title: 'Confirmou presença em reunião', subtitle: ev.title });
        participating = true;

        if (ev.author_id !== userId) {
          const user = await one(`SELECT name FROM users WHERE id=$1`, [userId]);
          await this.createNotification(ev.author_id, {
            title: 'Novo participante na reunião',
            body: `${user?.name || 'Um participante'} confirmou presença em "${ev.title}".`,
          });
        }
      }

      const count = await one(`SELECT count(*)::int AS count FROM event_participants WHERE event_id=$1`, [eventId]);
      return {
        participating,
        participantsCount: Number(count?.count || 0),
      };
    },

    async listEventParticipants(eventId) {
      return many(`
        SELECT u.id, u.name, u.avatar, u.role, ep.status, ep.created_at
        FROM event_participants ep
        JOIN users u ON u.id = ep.user_id
        WHERE ep.event_id = $1
        ORDER BY ep.created_at ASC
      `, [eventId]);
    },

    async addHistory(userId, data) { return addHistory(userId, data); },

    async listHistory(userId) {
      return many(`SELECT id,type,title,subtitle,created_at
        FROM history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, [userId]);
    },

    async createNotification(userId, { title, body }) {
      return one(`INSERT INTO notifications(user_id,title,body)
        VALUES($1,$2,$3) RETURNING id,title,body,read_at,created_at`, [userId, title, body || '']);
    },

    async createEventRating(userId, { eventId, stars, comment }) {
      const event = await one(`SELECT id FROM events WHERE id=$1 AND event_date + event_end_time <= NOW()`, [eventId]);
      if (!event) {
        const error = new Error('Evento não encontrado ou ainda não terminou.');
        error.code = 'FORBIDDEN';
        throw error;
      }
      return one(`INSERT INTO event_ratings(event_id,rater_id,stars,comment)
        VALUES($1,$2,$3,$4)
        ON CONFLICT(event_id,rater_id) DO UPDATE SET stars=EXCLUDED.stars,comment=EXCLUDED.comment,updated_at=NOW()
        RETURNING id,event_id,rater_id,stars,comment,created_at,updated_at`,
        [eventId, userId, stars, comment || '']);
    },

    async listNotifications(userId) {
      return many(`SELECT id,title,body,read_at,created_at FROM notifications
        WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [userId]);
    },

    async markNotificationRead(userId, id) {
      return one(`UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2
        RETURNING id,title,body,read_at,created_at`, [id, userId]);
    },

    async listSettings(userId) {
      return one(`SELECT notifications_enabled,dark_mode,updated_at FROM settings WHERE user_id=$1`, [userId]);
    },

    async updateSettings(userId, data) {
      return one(`INSERT INTO settings(user_id,notifications_enabled,dark_mode)
        VALUES($1,COALESCE($2,TRUE),COALESCE($3,FALSE))
        ON CONFLICT(user_id) DO UPDATE SET
          notifications_enabled=COALESCE($2,settings.notifications_enabled),
          dark_mode=COALESCE($3,settings.dark_mode),updated_at=NOW()
        RETURNING notifications_enabled,dark_mode,updated_at`,
        [userId, data.notificationsEnabled ?? null, data.darkMode ?? null]);
    },

    async createContent(userId, mode, data) {
      if (mode === 'event') {
        // Auto-add author as participant
        const event = await one(`INSERT INTO events(author_id,title,description,image,event_date,event_time,event_end_time,location)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)
          RETURNING id,title,description,image,event_date,event_time,event_end_time,location,created_at`,
          [userId, data.title, data.description || '', data.image || null,
           data.eventDate || null, data.eventTime || null, data.eventEndTime || null, data.location || '']);

        await db.query(`INSERT INTO event_participants(event_id, user_id, status) VALUES($1, $2, 'host') ON CONFLICT DO NOTHING`, [event.id, userId]);
        return event;
      }
      if (mode === 'live') {
        return one(`INSERT INTO live_rooms(author_id,title,description)
          VALUES($1,$2,$3) RETURNING id,title,description,created_at`,
          [userId, data.title, data.description || '']);
      }
      if (mode === 'post') {
        return this.createPost(userId, {
          title: data.title,
          content: data.description ? `${data.title}\n${data.description}` : data.title,
          image: data.image,
          mentionedEventId: data.mentionedEventId || null,
        });
      }
      if (mode === 'presentation') {
        return this.createPresentation(userId, data);
      }
      throw new Error('Modo de criação inválido.');
    },

    async listUserPosts(userId) {
      const rows = await many(`SELECT p.id,p.title,p.content,p.image,p.likes,p.type,p.created_at,p.mentioned_event_id,
        (SELECT count(*)::int FROM post_comments c WHERE c.post_id=p.id) AS comments_count,
        e.title AS mentioned_event_title, e.event_date AS mentioned_event_date, e.event_time AS mentioned_event_time, e.location AS mentioned_event_location
        FROM posts p
        LEFT JOIN events e ON e.id=p.mentioned_event_id
        WHERE p.author_id=$1 ORDER BY p.created_at DESC LIMIT 50`, [userId]);

      return rows.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        image: p.image,
        likes: p.likes,
        type: p.type,
        created_at: p.created_at,
        comments_count: Number(p.comments_count || 0),
        mentioned_event: p.mentioned_event_id ? {
          id: p.mentioned_event_id,
          title: p.mentioned_event_title,
          event_date: p.mentioned_event_date,
          event_time: p.mentioned_event_time,
          location: p.mentioned_event_location,
        } : null,
      }));
    },

    async updateEvent(userId, eventId, data) {
      const ev = await one(`SELECT id, author_id FROM events WHERE id=$1 AND author_id=$2`, [eventId, userId]);
      if (!ev) {
        const err = new Error('Evento não encontrado ou sem permissão para editar.');
        err.code = 'FORBIDDEN';
        throw err;
      }
      return one(`
        UPDATE events SET
          title = COALESCE($3, title),
          description = COALESCE($4, description),
          image = COALESCE($5, image),
          event_date = COALESCE($6, event_date),
          event_time = COALESCE($7, event_time),
          event_end_time = COALESCE($8, event_end_time),
          location = COALESCE($9, location)
        WHERE id = $1 AND author_id = $2
        RETURNING id, title, description, image, event_date, event_time, event_end_time, location, created_at
      `, [eventId, userId, data.title ?? null, data.description ?? null, data.image ?? null, data.eventDate ?? null, data.eventTime ?? null, data.eventEndTime ?? null, data.location ?? null]);
    },

    async getEventById(eventId, userId = null) {
      const ev = await one(`
        SELECT e.id, e.title, e.description, e.image, e.event_date, e.event_time, e.event_end_time, e.location, e.created_at,
          u.id AS author_id, u.name AS author_name, u.avatar AS author_avatar, u.role AS author_role
        FROM events e
        JOIN users u ON u.id = e.author_id
        WHERE e.id = $1
      `, [eventId]);
      if (!ev) return null;

      const [partCount, participants, commentsCount, isPart, isSaved] = await Promise.all([
        one(`SELECT count(*)::int AS count FROM event_participants WHERE event_id=$1`, [eventId]),
        many(`SELECT u.id, u.name, u.avatar, u.role, ep.status FROM event_participants ep JOIN users u ON u.id=ep.user_id WHERE ep.event_id=$1 ORDER BY ep.created_at ASC`, [eventId]),
        one(`SELECT count(*)::int AS count FROM post_comments WHERE event_id=$1`, [eventId]),
        userId ? one(`SELECT 1 FROM event_participants WHERE event_id=$1 AND user_id=$2`, [eventId, userId]) : null,
        userId ? one(`SELECT 1 FROM saved_events WHERE event_id=$1 AND user_id=$2`, [eventId, userId]) : null,
      ]);

      return {
        id: ev.id,
        title: ev.title,
        content: ev.description,
        description: ev.description,
        image: ev.image,
        event_date: ev.event_date,
        event_time: ev.event_time,
        event_end_time: ev.event_end_time,
        location: ev.location,
        created_at: ev.created_at,
        type: 'event',
        author: {
          id: ev.author_id,
          name: ev.author_name,
          avatar: ev.author_avatar,
          role: ev.author_role,
        },
        participants_count: Number(partCount?.count || 0),
        participants: participants || [],
        comments_count: Number(commentsCount?.count || 0),
        is_participating: Boolean(isPart),
        is_saved: Boolean(isSaved),
      };
    },

    async listEvents(userId) {
      return many(`SELECT e.id,e.title,e.description,e.image,e.event_date,e.event_time,e.location,e.created_at,
        u.id author_id,u.name author_name,u.avatar author_avatar,
        COALESCE(ep.participants_count, 0)::int AS participants_count,
        COALESCE(c.comments_count, 0)::int AS comments_count
        FROM events e
        JOIN users u ON u.id=e.author_id
        LEFT JOIN (SELECT event_id, count(*)::int AS participants_count FROM event_participants GROUP BY event_id) ep ON ep.event_id=e.id
        LEFT JOIN (SELECT event_id, count(*)::int AS comments_count FROM post_comments GROUP BY event_id) c ON c.event_id=e.id
        WHERE e.author_id=$1 ORDER BY COALESCE(e.event_date,e.created_at::date) DESC,e.created_at DESC`, [userId]);
    },

    // --- USER CONNECTIONS (NETWORK / FOLLOW) ---
    async toggleConnection(userId, targetUserId) {
      if (userId === targetUserId) {
        throw new Error('Não é possível conectar-se a si mesmo.');
      }
      const targetUser = await one(`SELECT id, name FROM users WHERE id=$1`, [targetUserId]);
      if (!targetUser) {
        const err = new Error('Usuário não encontrado.');
        err.code = '23503';
        throw err;
      }

      const existing = await one(`SELECT 1 FROM user_connections WHERE user_id=$1 AND connected_user_id=$2`, [userId, targetUserId]);
      if (existing) {
        await db.query(`DELETE FROM user_connections WHERE user_id=$1 AND connected_user_id=$2`, [userId, targetUserId]);
        await addHistory(userId, { type: 'connection_removed', title: 'Desconectou de um membro', subtitle: targetUser.name });
        const count = await one(`SELECT count(*)::int AS total FROM user_connections WHERE user_id=$1`, [userId]);
        return { connected: false, connectionsCount: Number(count?.total || 0) };
      } else {
        await db.query(`INSERT INTO user_connections(user_id, connected_user_id) VALUES($1, $2) ON CONFLICT DO NOTHING`, [userId, targetUserId]);
        await addHistory(userId, { type: 'connection_added', title: 'Conectou-se com um membro', subtitle: targetUser.name });

        const user = await one(`SELECT name FROM users WHERE id=$1`, [userId]);
        await this.createNotification(targetUserId, {
          title: 'Nova conexão no Meets',
          body: `${user?.name || 'Um membro'} conectou-se com você.`,
        });

        const count = await one(`SELECT count(*)::int AS total FROM user_connections WHERE user_id=$1`, [userId]);
        return { connected: true, connectionsCount: Number(count?.total || 0) };
      }
    },

    async getConnectionStatus(userId, targetUserId) {
      if (!userId || !targetUserId || userId === targetUserId) return false;
      const existing = await one(`SELECT 1 FROM user_connections WHERE user_id=$1 AND connected_user_id=$2`, [userId, targetUserId]);
      return Boolean(existing);
    },

    async listConnections(userId) {
      return many(`
        SELECT u.id, u.name, u.avatar, u.role, u.city, uc.created_at AS connected_at
        FROM user_connections uc
        JOIN users u ON u.id = uc.connected_user_id
        WHERE uc.user_id = $1
        ORDER BY uc.created_at DESC
      `, [userId]);
    },

    // --- AVAILABLE PRESENTATIONS / EVENTS TO RATE ---
    async listAvailablePresentations(userId) {
      const presentations = await many(`
        SELECT p.id AS post_id, p.presentation_id, p.title, p.content, p.created_at,
          u.id AS author_id, u.name AS author_name, u.avatar AS author_avatar,
          'presentation' AS type
        FROM posts p
        JOIN users u ON u.id=p.author_id
        WHERE p.type='presentation' OR p.presentation_id IS NOT NULL
        ORDER BY p.created_at DESC
        LIMIT 50
      `);

      const formattedPresentations = presentations.map((p) => ({
        postId: p.post_id,
        presentationId: p.presentation_id || `presentation-${p.post_id}`,
        title: p.title || p.content || 'Apresentação',
        author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
        speakers: [{ id: p.author_id, name: p.author_name, avatar: p.author_avatar }],
        created_at: p.created_at,
      }));

      // Fetch any multi-speakers
      const presIds = formattedPresentations.map((p) => p.presentationId);
      if (presIds.length > 0) {
        const speakers = await many(`
          SELECT ps.presentation_id, s.id, s.name, s.avatar
          FROM presentation_speakers ps JOIN users s ON s.id=ps.speaker_id
          WHERE ps.presentation_id = ANY($1) ORDER BY s.name
        `, [presIds]);
        const map = {};
        speakers.forEach((s) => {
          if (!map[s.presentation_id]) map[s.presentation_id] = [];
          map[s.presentation_id].push({ id: s.id, name: s.name, avatar: s.avatar });
        });
        formattedPresentations.forEach((p) => {
          if (map[p.presentationId] && map[p.presentationId].length > 0) {
            p.speakers = map[p.presentationId];
          }
        });
      }

      const events = await many(`
        SELECT e.id AS post_id, ('presentation-event-' || e.id) AS presentation_id, e.title, e.description AS content, e.created_at,
          u.id AS author_id, u.name AS author_name, u.avatar AS author_avatar,
          'event' AS type
        FROM events e
        JOIN users u ON u.id=e.author_id
        ORDER BY e.created_at DESC
        LIMIT 50
      `);

      const formattedEvents = events.map((e) => ({
        postId: e.post_id,
        presentationId: e.presentation_id,
        title: e.title || 'Evento / Reunião',
        author: { id: e.author_id, name: e.author_name, avatar: e.author_avatar },
        speakers: [{ id: e.author_id, name: e.author_name, avatar: e.author_avatar }],
        created_at: e.created_at,
      }));

      return [...formattedPresentations, ...formattedEvents].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // --- RATINGS WITH AUTO SPEAKER & PRESENTATION RESOLUTION ---
    async createRating(raterId, payload) {
      let post = payload.postId ? await one(`SELECT id,author_id,type,presentation_id,title FROM posts WHERE id=$1`, [payload.postId]) : null;
      let presentationId = payload.presentationId || post?.presentation_id;

      // If post exists without presentation_id, auto-link it
      if (post && !presentationId) {
        presentationId = `presentation-${post.id}`;
        await db.query(`UPDATE posts SET presentation_id=$1, type='presentation' WHERE id=$2`, [presentationId, post.id]);
        await db.query(`INSERT INTO presentation_speakers(presentation_id, speaker_id) VALUES($1, $2) ON CONFLICT DO NOTHING`, [presentationId, post.author_id]);
      }

      // If presentationId was provided as an event presentation ID (e.g. presentation-event-<id>), link the event author
      if (presentationId && presentationId.startsWith('presentation-event-')) {
        const eventId = presentationId.replace('presentation-event-', '');
        const ev = await one(`SELECT id, author_id FROM events WHERE id=$1`, [eventId]);
        if (ev) {
          await db.query(`INSERT INTO presentation_speakers(presentation_id, speaker_id) VALUES($1, $2) ON CONFLICT DO NOTHING`, [presentationId, ev.author_id]);
        }
      }

      if (!presentationId) {
        const err = new Error('Apresentação não informada.');
        err.code = 'PRESENTATION_REQUIRED';
        throw err;
      }

      // If speakerId was not provided, auto-resolve it
      let targetSpeakerId = payload.speakerId;
      if (!targetSpeakerId) {
        const speakerRow = await one(`SELECT speaker_id FROM presentation_speakers WHERE presentation_id=$1 LIMIT 1`, [presentationId]);
        targetSpeakerId = speakerRow?.speaker_id || post?.author_id || raterId;
      }

      if (!targetSpeakerId) {
        const err = new Error('Apresentador não identificado para esta apresentação.');
        err.code = 'SPEAKER_NOT_LINKED';
        throw err;
      }

      const speaker = await one(`SELECT id,name FROM users WHERE id=$1`, [targetSpeakerId]);
      if (!speaker) {
        const err = new Error('Apresentador não encontrado.');
        err.code = '23503';
        throw err;
      }

      // Ensure presentation_speaker relation exists so foreign integrity holds
      await db.query(`INSERT INTO presentation_speakers(presentation_id, speaker_id) VALUES($1, $2) ON CONFLICT DO NOTHING`, [presentationId, speaker.id]);

      const skills = payload.includeSpeakerSkills ? safeSkills(payload.skills) : {};
      const row = await one(`INSERT INTO presentation_ratings
        (presentation_id,post_id,rater_id,speaker_id,stars,skills,comment)
        VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)
        ON CONFLICT(presentation_id,rater_id,speaker_id)
        DO UPDATE SET stars=EXCLUDED.stars,skills=CASE WHEN EXCLUDED.skills <> '{}'::jsonb THEN EXCLUDED.skills ELSE presentation_ratings.skills END,comment=EXCLUDED.comment,updated_at=NOW()
        RETURNING id,presentation_id,post_id,rater_id,speaker_id,stars,skills,comment,created_at,updated_at`,
        [presentationId, post?.id || null, raterId, speaker.id, payload.stars, JSON.stringify(skills), payload.comment || '']);

      await addHistory(raterId, {
        type: 'rating',
        title: 'Avaliou uma apresentação',
        subtitle: `${row.stars} estrelas · ${speaker.name}`,
      });

      return row;
    },

    async getSpeakerRatingSummary(speakerId) {
      const allRatings = await many(`SELECT stars, skills, comment, created_at, post_id, rater_id
        FROM presentation_ratings WHERE speaker_id=$1 ORDER BY created_at DESC`, [speakerId]);

      const totalRatings = allRatings.length;
      let averageStars = 0;
      const skillsSum = { clarity: 0, content: 0, engagement: 0, storytelling: 0, timing: 0, visuals: 0 };
      let skillsCount = 0;

      if (totalRatings > 0) {
        const starSum = allRatings.reduce((acc, r) => acc + Number(r.stars || 0), 0);
        averageStars = Number((starSum / totalRatings).toFixed(1));

        allRatings.forEach((r) => {
          const s = typeof r.skills === 'string' ? JSON.parse(r.skills || '{}') : (r.skills || {});
          if (s && Object.keys(s).length > 0) {
            skillsCount++;
            ['clarity', 'content', 'engagement', 'storytelling', 'timing', 'visuals'].forEach((k) => {
              skillsSum[k] += Number(s[k] || 0);
            });
          }
        });
      }

      const averageSkills = {};
      ['clarity', 'content', 'engagement', 'storytelling', 'timing', 'visuals'].forEach((k) => {
        averageSkills[k] = skillsCount > 0 ? Math.round(skillsSum[k] / skillsCount) : 0;
      });

      const values = Object.values(averageSkills);
      const overall = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

      const recent = await many(`SELECT pr.id, pr.stars, pr.comment, pr.created_at,
        p.title AS presentation_title, u.name AS rater_name
        FROM presentation_ratings pr
        LEFT JOIN posts p ON p.id=pr.post_id
        JOIN users u ON u.id=pr.rater_id
        WHERE pr.speaker_id=$1 ORDER BY pr.created_at DESC LIMIT 5`, [speakerId]);

      return {
        totalRatings,
        averageStars,
        overall,
        averageSkills,
        recentRatings: recent,
      };
    },

    async deleteOwnPost(userId, postId) {
      const result = await db.query(`DELETE FROM posts WHERE id=$1 AND author_id=$2 RETURNING id`, [postId, userId]);
      return Boolean(result.rows[0]);
    },

    async deleteOwnEvent(userId, eventId) {
      const result = await db.query(`DELETE FROM events WHERE id=$1 AND author_id=$2 RETURNING id`, [eventId, userId]);
      return Boolean(result.rows[0]);
    },
  };
}
