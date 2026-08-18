import { defaultSkillScores, presentationSkills } from '../data/presentationRatings';

const ratings = [];

function getSkillIds() {
  return presentationSkills.map((skill) => skill.id);
}

export function buildInitialSkillScores() {
  return { ...defaultSkillScores };
}

export async function savePresentationRating(payload) {
  const skillIds = getSkillIds();
  const includeSpeakerSkills = Boolean(payload?.includeSpeakerSkills);
  const sanitizedStars = Math.max(1, Math.min(5, Number(payload?.stars) || 1));

  const safeSkills = {};
  skillIds.forEach((id) => {
    const value = payload?.skills?.[id];
    safeSkills[id] = Math.max(0, Math.min(99, Number(value) || defaultSkillScores[id]));
  });

  // Guarda timestamp para exibir historico publico por apresentador.
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    postId: payload?.postId || '',
    presentationId: payload?.presentationId || '',
    presentationTitle: payload?.presentationTitle || '',
    speakerId: payload?.speakerId || '',
    speakerName: payload?.speakerName || '',
    stars: sanitizedStars,
    includeSpeakerSkills,
    skills: safeSkills,
    comment: payload?.comment || '',
    createdAt: new Date().toISOString(),
  };

  ratings.push(entry);
  return entry;
}

export async function listPresentationRatings() {
  return [...ratings];
}

export async function getPublicSpeakerRatingSummary(speakerId) {
  const speakerRatings = ratings.filter(
    (entry) => entry.speakerId === speakerId && entry.includeSpeakerSkills,
  );

  if (!speakerRatings.length) {
    return {
      totalRatings: 0,
      overall: 0,
      averageSkills: buildInitialSkillScores(),
      recentRatings: [],
    };
  }

  const skillIds = getSkillIds();
  const averageSkills = {};

  skillIds.forEach((id) => {
    const sum = speakerRatings.reduce((acc, entry) => acc + (entry.skills?.[id] || 0), 0);
    averageSkills[id] = Math.round(sum / speakerRatings.length);
  });

  const overall = Math.round(
    skillIds.reduce((acc, id) => acc + averageSkills[id], 0) / skillIds.length,
  );

  const recentRatings = [...speakerRatings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalRatings: speakerRatings.length,
    overall,
    averageSkills,
    recentRatings,
  };
}
