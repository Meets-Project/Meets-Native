// Acesso a dados das denúncias (caso de uso #013 Analisar Denúncias).
export const REPORT_REASONS = ['spam', 'ofensivo', 'assedio', 'falso', 'improprio', 'outro'];
export const REPORT_ACTIONS = ['remove_content', 'warn_author', 'deactivate_user'];

export function makeReportsRepository(db) {
  const one = async (sql, params = []) => (await db.query(sql, params)).rows[0] || null;
  const many = async (sql, params = []) => (await db.query(sql, params)).rows;

  const REPORT_COLUMNS = `r.id,r.reporter_id,r.target_type,r.target_id,r.target_owner_id,r.target_preview,
    r.reason,r.details,r.status,r.action,r.decision_note,r.reviewed_by,r.review_started_at,r.decided_at,r.created_at,
    COALESCE(rep.name,'Conta removida') AS reporter_name,
    COALESCE(own.name,'—') AS target_owner_name,
    own.status AS target_owner_status,
    COALESCE(adm.name,'') AS reviewer_name`;
  const REPORT_JOINS = `LEFT JOIN users rep ON rep.id = r.reporter_id
    LEFT JOIN users own ON own.id = r.target_owner_id
    LEFT JOIN users adm ON adm.id = r.reviewed_by`;

  return {
    // Descobre o dono e um resumo do alvo, para guardar junto da denúncia.
    async describeTarget(type, id) {
      if (type === 'post') {
        const p = await one(`SELECT id,author_id AS owner_id,COALESCE(NULLIF(title,''),content) AS preview FROM posts WHERE id=$1`, [id]);
        return p;
      }
      if (type === 'event') {
        return one(`SELECT id,author_id AS owner_id,title || ' — ' || description AS preview FROM events WHERE id=$1`, [id]);
      }
      if (type === 'user') {
        return one(`SELECT u.id,u.id AS owner_id,u.name || COALESCE(' — ' || NULLIF(up.bio,''),'') AS preview
          FROM users u LEFT JOIN profiles up ON up.user_id = u.id WHERE u.id=$1`, [id]);
      }
      return null;
    },

    async findOpenByReporter(reporterId, type, id) {
      return one(`SELECT id FROM reports WHERE reporter_id=$1 AND target_type=$2 AND target_id=$3
        AND status IN ('pending','in_review')`, [reporterId, type, id]);
    },

    async create({ reporterId, targetType, targetId, ownerId, preview, reason, details }) {
      return one(`INSERT INTO reports(reporter_id,target_type,target_id,target_owner_id,target_preview,reason,details)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,target_type,target_id,reason,details,status,created_at`,
        [reporterId, targetType, targetId, ownerId, String(preview || '').slice(0, 500), reason, String(details || '').slice(0, 1000)]);
    },

    async list({ status = 'open', limit = 100 } = {}) {
      const filter = {
        open: `r.status IN ('pending','in_review')`,
        pending: `r.status = 'pending'`,
        in_review: `r.status = 'in_review'`,
        closed: `r.status IN ('dismissed','upheld')`,
        all: 'TRUE',
      }[status] || `r.status IN ('pending','in_review')`;
      return many(`SELECT ${REPORT_COLUMNS},
          (SELECT count(*)::int FROM reports r2 WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id) AS reports_on_target
        FROM reports r ${REPORT_JOINS}
        WHERE ${filter}
        ORDER BY (r.status = 'pending') DESC, r.created_at DESC LIMIT $1`, [Math.min(Number(limit) || 100, 300)]);
    },

    async get(id) {
      return one(`SELECT ${REPORT_COLUMNS} FROM reports r ${REPORT_JOINS} WHERE r.id=$1`, [id]);
    },

    async listForTarget(type, id, exceptId = null) {
      return many(`SELECT ${REPORT_COLUMNS} FROM reports r ${REPORT_JOINS}
        WHERE r.target_type=$1 AND r.target_id=$2 AND ($3::uuid IS NULL OR r.id <> $3)
        ORDER BY r.created_at DESC`, [type, id, exceptId]);
    },

    async startReview(id, adminId) {
      return one(`UPDATE reports SET status='in_review', reviewed_by=$2, review_started_at=NOW()
        WHERE id=$1 AND status='pending' RETURNING id,status`, [id, adminId]);
    },

    async decide(id, { adminId, status, action = null, note = '' }) {
      return one(`UPDATE reports SET status=$2, action=$3, decision_note=$4, reviewed_by=$5,
          review_started_at=COALESCE(review_started_at,NOW()), decided_at=NOW()
        WHERE id=$1 AND status IN ('pending','in_review') RETURNING id,status,action`,
        [id, status, action, String(note || '').slice(0, 1000), adminId]);
    },

    // Fecha as outras denúncias abertas sobre o mesmo alvo, com a mesma decisão.
    async closeOthersOnTarget(type, targetId, exceptId, { adminId, status, action, note }) {
      return many(`UPDATE reports SET status=$4, action=$5, decision_note=$6, reviewed_by=$7,
          review_started_at=COALESCE(review_started_at,NOW()), decided_at=NOW()
        WHERE target_type=$1 AND target_id=$2 AND id <> $3 AND status IN ('pending','in_review')
        RETURNING id,reporter_id`, [type, targetId, exceptId, status, action, String(note || '').slice(0, 1000), adminId]);
    },

    async countOpen() {
      return Number((await one(`SELECT count(*)::int AS total FROM reports WHERE status IN ('pending','in_review')`))?.total || 0);
    },

    async listAdminIds() {
      return (await many(`SELECT id FROM users WHERE account_type='admin' AND status='active'`)).map((r) => r.id);
    },
  };
}
