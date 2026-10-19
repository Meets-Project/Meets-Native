// Acesso a dados das funções de administração (Manter Usuários e registro de ações).
export function makeAdminRepository(db) {
  const one = async (sql, params = []) => (await db.query(sql, params)).rows[0] || null;
  const many = async (sql, params = []) => (await db.query(sql, params)).rows;

  const ADMIN_USER_COLUMNS = `u.id,u.name,u.email,u.email_verified,u.account_type,u.status,
    u.deactivated_at,u.deactivated_by,u.deactivation_reason,u.created_at,u.updated_at,
    COALESCE(up.role,'Membro') AS role, COALESCE(up.city,'') AS city,
    COALESCE(up.avatar,'👤') AS avatar, COALESCE(up.bio,'') AS bio`;

  return {
    async logAction(adminId, { action, targetType, targetId, note = '' }) {
      return one(`INSERT INTO admin_actions(admin_id,action,target_type,target_id,note)
        VALUES($1,$2,$3,$4,$5) RETURNING id,admin_id,action,target_type,target_id,note,created_at`,
        [adminId || null, action, targetType, String(targetId), String(note || '').slice(0, 1000)]);
    },

    async listActions({ targetType = null, targetId = null, limit = 50 } = {}) {
      return many(`SELECT a.id,a.action,a.target_type,a.target_id,a.note,a.created_at,
          a.admin_id, COALESCE(u.name,'Sistema') AS admin_name
        FROM admin_actions a LEFT JOIN users u ON u.id = a.admin_id
        WHERE ($1::text IS NULL OR a.target_type = $1) AND ($2::text IS NULL OR a.target_id = $2)
        ORDER BY a.created_at DESC LIMIT $3`, [targetType, targetId ? String(targetId) : null, Math.min(Number(limit) || 50, 200)]);
    },

    // Lista para a tela Manter Usuários, com busca por nome/e-mail e filtros.
    async listUsers({ q = '', status = 'all', type = 'all', limit = 100 } = {}) {
      const term = `%${String(q || '').trim()}%`;
      return many(`SELECT ${ADMIN_USER_COLUMNS},
          (SELECT count(*)::int FROM posts p WHERE p.author_id = u.id) AS posts_count,
          (SELECT count(*)::int FROM events e WHERE e.author_id = u.id) AS events_count
        FROM users u LEFT JOIN profiles up ON up.user_id = u.id
        WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
          AND ($2 = 'all' OR u.status = $2)
          AND ($3 = 'all' OR u.account_type = $3)
        ORDER BY u.created_at DESC LIMIT $4`, [term, status, type, Math.min(Number(limit) || 100, 500)]);
    },

    async getUser(id) {
      const user = await one(`SELECT ${ADMIN_USER_COLUMNS},
          (SELECT count(*)::int FROM posts p WHERE p.author_id = u.id) AS posts_count,
          (SELECT count(*)::int FROM events e WHERE e.author_id = u.id) AS events_count
        FROM users u LEFT JOIN profiles up ON up.user_id = u.id WHERE u.id=$1`, [id]);
      if (!user) return null;
      const actions = await this.listActions({ targetType: 'user', targetId: id, limit: 20 });
      return { ...user, actions };
    },

    async findByEmail(email, exceptId = null) {
      return one(`SELECT id FROM users WHERE lower(email)=lower($1) AND ($2::uuid IS NULL OR id <> $2)`, [email, exceptId]);
    },

    async updateAccount(id, { name, email, accountType }) {
      return one(`UPDATE users SET name=COALESCE($2,name), email=COALESCE($3,email),
          account_type=COALESCE($4,account_type), updated_at=NOW()
        WHERE id=$1 RETURNING id`, [id, name ?? null, email ? email.toLowerCase() : null, accountType ?? null]);
    },

    async setAccountType(id, accountType) {
      return one(`UPDATE users SET account_type=$2, updated_at=NOW() WHERE id=$1 RETURNING id,account_type`, [id, accountType]);
    },

    async countActiveAdmins() {
      return Number((await one(`SELECT count(*)::int AS total FROM users WHERE account_type='admin' AND status='active'`))?.total || 0);
    },

    // Remoção de conteúdo por moderação (qualquer autor).
    async getPost(id) {
      return one(`SELECT id,author_id,title,content FROM posts WHERE id=$1`, [id]);
    },
    async getEvent(id) {
      return one(`SELECT id,author_id,title,description FROM events WHERE id=$1`, [id]);
    },
    async deletePost(id) {
      return Boolean((await db.query(`DELETE FROM posts WHERE id=$1 RETURNING id`, [id])).rows[0]);
    },
    async deleteEvent(id) {
      return Boolean((await db.query(`DELETE FROM events WHERE id=$1 RETURNING id`, [id])).rows[0]);
    },
  };
}
