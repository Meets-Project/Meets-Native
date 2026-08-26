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
    async createUser({ name, email, passwordHash }) {
      return one(`INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3)
        RETURNING id,name,email,role,city,avatar,bio,created_at,updated_at`, [name, email, passwordHash]);
    },

    async findUserByEmail(email) {
      return one(`SELECT * FROM users WHERE lower(email)=lower($1)`, [email]);
    },

    async getUser(id) {
      return one(`SELECT id,name,email,role,city,avatar,bio,created_at,updated_at,
        (SELECT count(*) FROM events e WHERE e.author_id=u.id)::int events_count,
        (SELECT count(*) FROM chat_members cm WHERE cm.user_id=u.id)::int connections,
        COALESCE((SELECT ROUND(AVG(pr.stars),1) FROM presentation_ratings pr WHERE pr.speaker_id=u.id),0)::numeric rating,
        (SELECT count(*) FROM presentation_ratings pr WHERE pr.speaker_id=u.id)::int ratings_count
        FROM users u WHERE u.id=$1`, [id]);
    },

    async updateUser(id, data) {
      return one(`UPDATE users SET name=COALESCE($2,name), role=COALESCE($3,role),
        city=COALESCE($4,city), avatar=COALESCE($5,avatar), bio=COALESCE($6,bio), updated_at=NOW()
        WHERE id=$1 RETURNING id,name,email,role,city,avatar,bio,created_at,updated_at`,
        [id, data.name ?? null, data.role ?? null, data.city ?? null, data.avatar ?? null, data.bio ?? null]);
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

    async listChats(userId) {
      return many(`SELECT c.id,c.name,c.preview,cm.unread
        FROM chats c JOIN chat_members cm ON cm.chat_id=c.id
        WHERE cm.user_id=$1 ORDER BY c.created_at DESC`, [userId]);
    },

    async listPosts(limit = 50) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.type,p.title,p.presentation_id,
        json_build_object('id',u.id,'name',u.name,'avatar',u.avatar) author,
        COALESCE((
          SELECT json_agg(json_build_object('id',s.id,'name',s.name,'avatar',s.avatar)
          ORDER BY s.name)
          FROM presentation_speakers ps JOIN users s ON s.id=ps.speaker_id
          WHERE ps.presentation_id=p.presentation_id
        ), '[]'::json) speakers
        FROM posts p JOIN users u ON u.id=p.author_id
        ORDER BY p.created_at DESC LIMIT $1`, [limit]);
    },

    async listFeed(limit = 50) {
      const posts = await this.listPosts(limit);
      const events = await many(`SELECT e.id,e.title,e.description AS content,e.image,e.created_at,
          'event'::varchar AS type,''::varchar AS presentation_id,
          json_build_object('id',u.id,'name',u.name,'avatar',u.avatar) author,
          '[]'::json AS speakers,
          e.event_date,e.event_time,e.location
        FROM events e JOIN users u ON u.id=e.author_id
        ORDER BY e.created_at DESC LIMIT $1`, [limit]);
      return [...posts, ...events].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    },

    async createPost(userId, { content, image, title = '', type = 'default', presentationId = null }) {
      return one(`INSERT INTO posts(author_id,content,image,title,type,presentation_id)
        VALUES($1,$2,$3,$4,$5,$6)
        RETURNING id,content,image,likes,created_at,type,title,presentation_id`,
        [userId, content, image || null, title || content.slice(0, 160), type, presentationId]);
    },

    async createPresentation(userId, { title, description = '', image = null, presentationId, speakerIds = [] }) {
      const id = presentationId || `presentation-${crypto.randomUUID()}`;
      const post = await this.createPost(userId, {
        content: description || title,
        image,
        title,
        type: 'presentation',
        presentationId: id,
      });
      const ids = [...new Set([userId, ...speakerIds])];
      for (const speakerId of ids) {
        await db.query(`INSERT INTO presentation_speakers(presentation_id,speaker_id)
          VALUES($1,$2) ON CONFLICT DO NOTHING`, [id, speakerId]);
      }
      return this.getPostById(post.id);
    },

    async getPostById(id) {
      return one(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.type,p.title,p.presentation_id,
        json_build_object('id',u.id,'name',u.name,'avatar',u.avatar) author,
        COALESCE((
          SELECT json_agg(json_build_object('id',s.id,'name',s.name,'avatar',s.avatar) ORDER BY s.name)
          FROM presentation_speakers ps JOIN users s ON s.id=ps.speaker_id
          WHERE ps.presentation_id=p.presentation_id
        ), '[]'::json) speakers
        FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=$1`, [id]);
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

    async toggleSave(userId, postId) {
      const existing = await one(`SELECT 1 FROM saved_posts WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
      if (existing) {
        await db.query(`DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2`, [userId, postId]);
        await addHistory(userId, { type: 'unsave', title: 'Removeu um item dos salvos', subtitle: `Post ${postId}` });
      } else {
        await db.query(`INSERT INTO saved_posts(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [userId, postId]);
        await addHistory(userId, { type: 'save', title: 'Salvou uma publicação', subtitle: `Post ${postId}` });
      }
      return !existing;
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

    async listSaved(userId) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,p.title,p.type,u.name author_name
        FROM saved_posts s JOIN posts p ON p.id=s.post_id JOIN users u ON u.id=p.author_id
        WHERE s.user_id=$1 ORDER BY s.created_at DESC`, [userId]);
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
        return one(`INSERT INTO events(author_id,title,description,image,event_date,event_time,location)
          VALUES($1,$2,$3,$4,$5,$6,$7)
          RETURNING id,title,description,image,event_date,event_time,location,created_at`,
          [userId, data.title, data.description || '', data.image || null,
           data.eventDate || null, data.eventTime || null, data.location || '']);
      }
      if (mode === 'live') {
        return one(`INSERT INTO live_rooms(author_id,title,description)
          VALUES($1,$2,$3) RETURNING id,title,description,created_at`,
          [userId, data.title, data.description || '']);
      }
      if (mode === 'post') {
        return this.createPost(userId, {
          content: data.description ? `${data.title}\n${data.description}` : data.title,
          image: data.image,
        });
      }
      if (mode === 'presentation') {
        return this.createPresentation(userId, data);
      }
      throw new Error('Modo de criação inválido.');
    },

    async listUserPosts(userId) {
      return many(`SELECT p.id,p.title,p.content,p.image,p.likes,p.type,p.created_at
        FROM posts p WHERE p.author_id=$1 ORDER BY p.created_at DESC LIMIT 20`, [userId]);
    },

    async listEvents(userId) {
      return many(`SELECT e.id,e.title,e.description,e.image,e.event_date,e.event_time,e.location,e.created_at,
        u.id author_id,u.name author_name,u.avatar author_avatar
        FROM events e JOIN users u ON u.id=e.author_id
        WHERE e.author_id=$1 ORDER BY COALESCE(e.event_date,e.created_at::date) DESC,e.created_at DESC`, [userId]);
    },

    async createRating(raterId, payload) {
      const speaker = await one(`SELECT id,name FROM users WHERE id=$1`, [payload.speakerId]);
      if (!speaker) {
        const err = new Error('Apresentador não encontrado.');
        err.code = '23503';
        throw err;
      }
      if (speaker.id === raterId) {
        const err = new Error('Você não pode avaliar a si mesmo.');
        err.code = 'SELF_RATING';
        throw err;
      }
      const post = payload.postId ? await one(`SELECT id,author_id,type,presentation_id,title FROM posts WHERE id=$1`, [payload.postId]) : null;
      if (payload.postId && !post) {
        const err = new Error('Publicação da apresentação não encontrada.');
        err.code = '23503';
        throw err;
      }
      const presentationId = payload.presentationId || post?.presentation_id;
      if (!presentationId) {
        const err = new Error('Apresentação não informada.');
        err.code = 'PRESENTATION_REQUIRED';
        throw err;
      }
      const linked = await one(`SELECT 1 FROM presentation_speakers WHERE presentation_id=$1 AND speaker_id=$2`,
        [presentationId, speaker.id]);
      if (!linked) {
        const err = new Error('Este apresentador não está vinculado à apresentação.');
        err.code = 'SPEAKER_NOT_LINKED';
        throw err;
      }
      const skills = payload.includeSpeakerSkills ? safeSkills(payload.skills) : {};
      const row = await one(`INSERT INTO presentation_ratings
        (presentation_id,post_id,rater_id,speaker_id,stars,skills,comment)
        VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)
        ON CONFLICT(presentation_id,rater_id,speaker_id)
        DO UPDATE SET stars=EXCLUDED.stars,skills=CASE WHEN EXCLUDED.skills <> '{}'::jsonb THEN EXCLUDED.skills ELSE presentation_ratings.skills END,comment=EXCLUDED.comment,updated_at=NOW()
        RETURNING id,presentation_id,post_id,rater_id,speaker_id,stars,skills,comment,created_at,updated_at`,
        [presentationId, payload.postId || null, raterId, speaker.id, payload.stars, JSON.stringify(skills), payload.comment || '']);
      await addHistory(raterId, {
        type: 'rating',
        title: 'Avaliou uma apresentação',
        subtitle: `${row.stars} estrelas · ${speaker.name}`,
      });
      return row;
    },

    async getSpeakerRatingSummary(speakerId) {
      const total = await one(`SELECT count(*)::int total_ratings,
        COALESCE(ROUND(AVG(stars),1),0)::numeric average_stars
        FROM presentation_ratings WHERE speaker_id=$1`, [speakerId]);
      const skillRows = await many(`SELECT
        COALESCE(ROUND(AVG((skills->>'clarity')::numeric),0),0)::int clarity,
        COALESCE(ROUND(AVG((skills->>'content')::numeric),0),0)::int content,
        COALESCE(ROUND(AVG((skills->>'engagement')::numeric),0),0)::int engagement,
        COALESCE(ROUND(AVG((skills->>'storytelling')::numeric),0),0)::int storytelling,
        COALESCE(ROUND(AVG((skills->>'timing')::numeric),0),0)::int timing,
        COALESCE(ROUND(AVG((skills->>'visuals')::numeric),0),0)::int visuals
        FROM presentation_ratings WHERE speaker_id=$1 AND skills <> '{}'::jsonb`, [speakerId]);
      const recent = await many(`SELECT pr.id,pr.stars,pr.comment,pr.created_at,
        p.title AS presentation_title,u.name AS rater_name
        FROM presentation_ratings pr
        LEFT JOIN posts p ON p.id=pr.post_id
        JOIN users u ON u.id=pr.rater_id
        WHERE pr.speaker_id=$1 ORDER BY pr.created_at DESC LIMIT 5`, [speakerId]);
      const skills = skillRows[0] || {};
      const values = ['clarity','content','engagement','storytelling','timing','visuals'].map(k => Number(skills[k] || 0));
      const overall = values.length ? Math.round(values.reduce((a,b) => a+b,0)/values.length) : 0;
      return {
        totalRatings: Number(total?.total_ratings || 0),
        averageStars: Number(total?.average_stars || 0),
        overall,
        averageSkills: skills,
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
