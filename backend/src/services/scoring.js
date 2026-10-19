// Pontuação gamificada do apresentador (casos de uso #006 e #007).
// Cada avaliação traz estrelas (1 a 5) e notas de 0 a 99 em seis atributos.
// Pontuação geral = média das médias dos atributos (0 a 99).
// Se ninguém avaliou atributos, usa as estrelas convertidas (estrelas x 20).
export const SKILL_KEYS = ['clarity', 'content', 'engagement', 'storytelling', 'timing', 'visuals'];

export function summarizeSpeakerRatings(rows = []) {
  const totalRatings = rows.length;
  const sums = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0]));
  let skillsCount = 0;
  let starSum = 0;
  for (const r of rows) {
    starSum += Number(r.stars || 0);
    const skills = typeof r.skills === 'string' ? JSON.parse(r.skills || '{}') : (r.skills || {});
    if (skills && Object.keys(skills).length > 0) {
      skillsCount += 1;
      for (const k of SKILL_KEYS) sums[k] += Number(skills[k] || 0);
    }
  }
  const averageStars = totalRatings ? Number((starSum / totalRatings).toFixed(1)) : 0;
  const averageSkills = Object.fromEntries(SKILL_KEYS.map((k) => [k, skillsCount ? Math.round(sums[k] / skillsCount) : 0]));
  let overall = 0;
  if (skillsCount) overall = Math.round(SKILL_KEYS.reduce((a, k) => a + averageSkills[k], 0) / SKILL_KEYS.length);
  else if (totalRatings) overall = Math.round(averageStars * 20);
  return { totalRatings, averageStars, averageSkills, overall, skillsCount };
}

// Ordena: pontuação geral, depois média de estrelas, depois quantidade de avaliações, depois nome.
export function rankSpeakers(entries) {
  return [...entries]
    .sort((a, b) => (b.overall - a.overall) || (b.averageStars - a.averageStars) || (b.totalRatings - a.totalRatings) || String(a.speaker.name).localeCompare(String(b.speaker.name)))
    .map((e, i) => ({ position: i + 1, ...e }));
}
