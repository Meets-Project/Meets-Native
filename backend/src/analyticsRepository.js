import { rankSpeakers, summarizeSpeakerRatings } from './services/scoring.js';
import { APP_TIMEZONE } from './services/clock.js';

// Consultas de análise: Ranking de Apresentadores (#007) e Dashboards (#008).
export function makeAnalyticsRepository(db) {
  const many = async (sql, params = []) => (await db.query(sql, params)).rows;

  async function ranking({ since = null } = {}) {
    const rows = await many(`SELECT pr.speaker_id, pr.stars, pr.skills, pr.created_at,
        u.name, COALESCE(up.avatar,'👤') AS avatar, COALESCE(up.role,'Membro') AS role
      FROM presentation_ratings pr
      JOIN users u ON u.id = pr.speaker_id
      LEFT JOIN profiles up ON up.user_id = u.id
      WHERE u.status = 'active' AND ($1::timestamptz IS NULL OR pr.created_at >= $1)`, [since]);
    const bySpeaker = new Map();
    for (const r of rows) {
      if (!bySpeaker.has(r.speaker_id)) bySpeaker.set(r.speaker_id, { speaker: { id: r.speaker_id, name: r.name, avatar: r.avatar, role: r.role }, rows: [] });
      bySpeaker.get(r.speaker_id).rows.push(r);
    }
    const entries = [...bySpeaker.values()].map(({ speaker, rows: rs }) => {
      const s = summarizeSpeakerRatings(rs);
      return { speaker, overall: s.overall, averageStars: s.averageStars, totalRatings: s.totalRatings, averageSkills: s.averageSkills };
    });
    return rankSpeakers(entries);
  }

  // Mês (AAAA-MM) no fuso de São Paulo, para agrupar as evoluções mensais.
  const monthKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit' }).format(new Date(d));
  function lastMonths(n = 6) {
    const out = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      out.push(monthKey(d));
    }
    return out;
  }
  const avg = (xs) => (xs.length ? Number((xs.reduce((a, b) => a + Number(b || 0), 0) / xs.length).toFixed(1)) : 0);
  const count = async (sql, params) => Number((await many(sql, params))[0]?.total || 0);

  // Filtros comuns: $1 = início do período (ou NULL = tudo); $2 = dono do conteúdo (ou NULL = plataforma).
  const PERIOD = (col) => `($1::timestamptz IS NULL OR ${col} >= $1)`;
  const OWNER = (col) => `($2::uuid IS NULL OR ${col} = $2)`;

  async function postsBlock(params) {
    const scope = `u.status = 'active' AND ${OWNER('p.author_id')}`;
    const [total, likes, comments, shares, rows] = await Promise.all([
      count(`SELECT count(*)::int AS total FROM posts p JOIN users u ON u.id = p.author_id WHERE ${scope} AND ${PERIOD('p.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM post_likes l JOIN posts p ON p.id = l.post_id JOIN users u ON u.id = p.author_id WHERE ${scope} AND ${PERIOD('l.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM post_comments c JOIN posts p ON p.id = c.post_id JOIN users u ON u.id = p.author_id WHERE ${scope} AND ${PERIOD('c.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM content_shares s JOIN posts p ON s.content_type = 'post' AND s.content_id = p.id JOIN users u ON u.id = p.author_id WHERE ${scope} AND ${PERIOD('s.created_at')}`, params),
      many(`SELECT p.id, COALESCE(NULLIF(p.title,''), p.content) AS title, p.likes, u.name AS author,
          (SELECT count(*)::int FROM post_comments c WHERE c.post_id = p.id) AS comments,
          (SELECT count(*)::int FROM content_shares s WHERE s.content_type = 'post' AND s.content_id = p.id) AS shares
        FROM posts p JOIN users u ON u.id = p.author_id
        WHERE ${scope} AND ${PERIOD('p.created_at')} ORDER BY p.created_at DESC LIMIT 300`, params),
    ]);
    const top = rows
      .map((r) => ({ id: r.id, title: String(r.title || '').slice(0, 120), author: r.author, likes: Number(r.likes || 0), comments: Number(r.comments || 0), shares: Number(r.shares || 0) }))
      .map((r) => ({ ...r, engagement: r.likes + r.comments + r.shares }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
    const interactions = likes + comments + shares;
    return { total, likes, comments, shares, engagementPerPost: total ? Number((interactions / total).toFixed(1)) : 0, top };
  }

  async function eventsBlock(params) {
    const scope = `u.status = 'active' AND ${OWNER('e.author_id')}`;
    const [total, participants, likes, comments, shares, ratings, rows] = await Promise.all([
      count(`SELECT count(*)::int AS total FROM events e JOIN users u ON u.id = e.author_id WHERE ${scope} AND ${PERIOD('e.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM event_participants ep JOIN events e ON e.id = ep.event_id JOIN users u ON u.id = e.author_id WHERE ep.status <> 'host' AND ${scope} AND ${PERIOD('ep.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM event_likes l JOIN events e ON e.id = l.event_id JOIN users u ON u.id = e.author_id WHERE ${scope} AND ${PERIOD('l.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM post_comments c JOIN events e ON e.id = c.event_id JOIN users u ON u.id = e.author_id WHERE ${scope} AND ${PERIOD('c.created_at')}`, params),
      count(`SELECT count(*)::int AS total FROM content_shares s JOIN events e ON s.content_type = 'event' AND s.content_id = e.id JOIN users u ON u.id = e.author_id WHERE ${scope} AND ${PERIOD('s.created_at')}`, params),
      many(`SELECT er.stars FROM event_ratings er JOIN events e ON e.id = er.event_id JOIN users u ON u.id = e.author_id WHERE ${scope} AND ${PERIOD('er.created_at')}`, params),
      many(`SELECT e.id, e.title, e.event_date, u.name AS author,
          (SELECT count(*)::int FROM event_participants ep WHERE ep.event_id = e.id AND ep.status <> 'host') AS participants,
          (SELECT avg(er.stars)::float FROM event_ratings er WHERE er.event_id = e.id) AS rating
        FROM events e JOIN users u ON u.id = e.author_id
        WHERE ${scope} AND ${PERIOD('e.created_at')} ORDER BY e.created_at DESC LIMIT 300`, params),
    ]);
    const top = rows
      .map((r) => ({ id: r.id, title: r.title, author: r.author, eventDate: r.event_date, participants: Number(r.participants || 0), rating: r.rating === null ? null : Number(Number(r.rating).toFixed(1)) }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 5);
    return { total, participants, likes, comments, shares, averageRating: avg(ratings.map((r) => r.stars)), ratingsCount: ratings.length, top };
  }

  async function ratingsBlock(params) {
    const [eventRows, presentationRows] = await Promise.all([
      many(`SELECT er.stars, er.created_at FROM event_ratings er JOIN events e ON e.id = er.event_id JOIN users u ON u.id = e.author_id
        WHERE u.status = 'active' AND ${OWNER('e.author_id')} AND ${PERIOD('er.created_at')}`, params),
      many(`SELECT pr.stars, pr.created_at FROM presentation_ratings pr JOIN users u ON u.id = pr.speaker_id
        WHERE u.status = 'active' AND ${OWNER('pr.speaker_id')} AND ${PERIOD('pr.created_at')}`, params),
    ]);
    const distribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      events: eventRows.filter((r) => Math.round(Number(r.stars)) === stars).length,
      presentations: presentationRows.filter((r) => Math.round(Number(r.stars)) === stars).length,
    }));
    const evolution = lastMonths(6).map((month) => {
      const ev = eventRows.filter((r) => monthKey(r.created_at) === month);
      const pr = presentationRows.filter((r) => monthKey(r.created_at) === month);
      return { month, eventCount: ev.length, eventAverage: avg(ev.map((r) => r.stars)), presentationCount: pr.length, presentationAverage: avg(pr.map((r) => r.stars)) };
    });
    return {
      events: { count: eventRows.length, average: avg(eventRows.map((r) => r.stars)) },
      presentations: { count: presentationRows.length, average: avg(presentationRows.map((r) => r.stars)) },
      distribution,
      evolution,
    };
  }

  async function presentersBlock({ since, ownerId }) {
    const ranked = await ranking({ since });
    if (!ownerId) {
      return { totalRanked: ranked.length, top: ranked.slice(0, 5) };
    }
    const mine = ranked.find((r) => r.speaker.id === ownerId) || null;
    const rows = await many(`SELECT pr.stars, pr.skills, pr.created_at FROM presentation_ratings pr
      WHERE pr.speaker_id = $2 AND ${PERIOD('pr.created_at')}`, [since, ownerId]);
    const evolution = lastMonths(6).map((month) => {
      const s = summarizeSpeakerRatings(rows.filter((r) => monthKey(r.created_at) === month));
      return { month, overall: s.overall, count: s.totalRatings };
    });
    return { totalRanked: ranked.length, mine, evolution };
  }

  // #008 Visualizar Dashboards: posts, eventos, avaliações e apresentadores.
  async function dashboard({ scope = 'me', ownerId = null, since = null } = {}) {
    const owner = scope === 'platform' ? null : ownerId;
    const params = [since, owner];
    const [posts, events, ratings, presenters] = await Promise.all([
      postsBlock(params), eventsBlock(params), ratingsBlock(params), presentersBlock({ since, ownerId: owner }),
    ]);
    const result = { scope, since, generatedAt: new Date().toISOString(), posts, events, ratings, presenters };
    if (scope === 'platform') {
      const [activeUsers, deactivatedUsers, newUsers, openReports] = await Promise.all([
        count(`SELECT count(*)::int AS total FROM users WHERE status = 'active'`, []),
        count(`SELECT count(*)::int AS total FROM users WHERE status = 'deactivated'`, []),
        count(`SELECT count(*)::int AS total FROM users WHERE ${PERIOD('created_at')}`, [since]),
        count(`SELECT count(*)::int AS total FROM reports WHERE status IN ('pending','in_review')`, []),
      ]);
      result.community = { activeUsers, deactivatedUsers, newUsers, openReports };
    }
    return result;
  }

  return { ranking, dashboard };
}
