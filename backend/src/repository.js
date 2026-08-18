export function makeRepository(db) {
  const one = async (sql, params=[]) => (await db.query(sql, params)).rows[0] || null;
  const many = async (sql, params=[]) => (await db.query(sql, params)).rows;

  return {
    async createUser({name,email,passwordHash}) {
      return one(`INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3)
        RETURNING id,name,email,role,city,avatar,bio,created_at,updated_at`, [name,email,passwordHash]);
    },
    async findUserByEmail(email) {
      return one(`SELECT * FROM users WHERE lower(email)=lower($1)`, [email]);
    },
    async getUser(id) {
      return one(`SELECT id,name,email,role,city,avatar,bio,created_at,updated_at,
        (SELECT count(*) FROM events e WHERE e.author_id=u.id)::int events_count,
        (SELECT count(*) FROM chat_members cm WHERE cm.user_id=u.id)::int connections,
        0::numeric rating FROM users u WHERE u.id=$1`, [id]);
    },
    async updateUser(id, data) {
      return one(`UPDATE users SET name=COALESCE($2,name), role=COALESCE($3,role),
        city=COALESCE($4,city), avatar=COALESCE($5,avatar), bio=COALESCE($6,bio), updated_at=NOW()
        WHERE id=$1 RETURNING id,name,email,role,city,avatar,bio,created_at,updated_at`,
        [id,data.name ?? null,data.role ?? null,data.city ?? null,data.avatar ?? null,data.bio ?? null]);
    },
    async search(term) {
      const q=`%${term}%`;
      return many(`SELECT 'user' type,id,name title,role subtitle,avatar FROM users WHERE name ILIKE $1 OR role ILIKE $1
        UNION ALL
        SELECT 'post' type,p.id,p.content title,u.name subtitle,u.avatar FROM posts p JOIN users u ON u.id=p.author_id
        WHERE p.content ILIKE $1 ORDER BY title LIMIT 50`,[q]);
    },
    async listChats(userId) {
      return many(`SELECT c.id,c.name,c.preview,cm.unread FROM chats c JOIN chat_members cm ON cm.chat_id=c.id WHERE cm.user_id=$1 ORDER BY c.created_at DESC`,[userId]);
    },
    async listPosts(limit=50) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,
        json_build_object('id',u.id,'name',u.name,'avatar',u.avatar) author
        FROM posts p JOIN users u ON u.id=p.author_id ORDER BY p.created_at DESC LIMIT $1`, [limit]);
    },
    async createPost(userId,{content,image}) {
      return one(`INSERT INTO posts(author_id,content,image) VALUES($1,$2,$3)
        RETURNING id,content,image,likes,created_at`, [userId,content,image||null]);
    },
    async toggleLike(userId,postId) {
      const existing = await one(`SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      if (existing) {
        await db.query(`DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      } else {
        await db.query(`INSERT INTO post_likes(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[userId,postId]);
      }
      return one(`UPDATE posts SET likes=(SELECT count(*) FROM post_likes WHERE post_id=$1) WHERE id=$1
        RETURNING id,likes`,[postId]);
    },
    async toggleSave(userId,postId) {
      const existing=await one(`SELECT 1 FROM saved_posts WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      if(existing) await db.query(`DELETE FROM saved_posts WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      else await db.query(`INSERT INTO saved_posts(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[userId,postId]);
      return !existing;
    },
    async toggleFavorite(userId,postId) {
      const existing=await one(`SELECT 1 FROM favorites WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      if(existing) await db.query(`DELETE FROM favorites WHERE user_id=$1 AND post_id=$2`,[userId,postId]);
      else await db.query(`INSERT INTO favorites(user_id,post_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[userId,postId]);
      return !existing;
    },
    async listFavorites(userId) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,u.name author_name
        FROM favorites f JOIN posts p ON p.id=f.post_id JOIN users u ON u.id=p.author_id
        WHERE f.user_id=$1 ORDER BY f.created_at DESC`,[userId]);
    },
    async listSaved(userId) {
      return many(`SELECT p.id,p.content,p.image,p.likes,p.created_at,u.name author_name
        FROM saved_posts s JOIN posts p ON p.id=s.post_id JOIN users u ON u.id=p.author_id
        WHERE s.user_id=$1 ORDER BY s.created_at DESC`,[userId]);
    },
    async addHistory(userId,{type,title,subtitle}) {
      return one(`INSERT INTO history(user_id,type,title,subtitle) VALUES($1,$2,$3,$4)
        RETURNING id,type,title,subtitle,created_at`,[userId,type,title,subtitle||'']);
    },
    async listHistory(userId) {
      return many(`SELECT id,type,title,subtitle,created_at FROM history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[userId]);
    },
    async createNotification(userId,{title,body}) {
      return one(`INSERT INTO notifications(user_id,title,body) VALUES($1,$2,$3) RETURNING id,title,body,read_at,created_at`,[userId,title,body||'']);
    },
    async listNotifications(userId) {
      return many(`SELECT id,title,body,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,[userId]);
    },
    async markNotificationRead(userId,id) {
      return one(`UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2
        RETURNING id,title,body,read_at,created_at`,[id,userId]);
    },
    async listSettings(userId) {
      return one(`SELECT notifications_enabled,dark_mode,updated_at FROM settings WHERE user_id=$1`,[userId]);
    },
    async updateSettings(userId,data) {
      return one(`INSERT INTO settings(user_id,notifications_enabled,dark_mode) VALUES($1,COALESCE($2,TRUE),COALESCE($3,FALSE))
        ON CONFLICT(user_id) DO UPDATE SET notifications_enabled=COALESCE($2,settings.notifications_enabled),
        dark_mode=COALESCE($3,settings.dark_mode),updated_at=NOW()
        RETURNING notifications_enabled,dark_mode,updated_at`,[userId,data.notificationsEnabled ?? null,data.darkMode ?? null]);
    },
    async createContent(userId,mode,{title,description,image}) {
      if(mode==='event') return one(`INSERT INTO events(author_id,title,description,image) VALUES($1,$2,$3,$4)
        RETURNING id,title,description,image,created_at`,[userId,title,description||'',image||null]);
      if(mode==='live') return one(`INSERT INTO live_rooms(author_id,title,description) VALUES($1,$2,$3)
        RETURNING id,title,description,created_at`,[userId,title,description||'']);
      if(mode==='post') return this.createPost(userId,{content:description ? `${title}\n${description}` : title,image});
      throw new Error('Modo de criação inválido.');
    }
  };
}
