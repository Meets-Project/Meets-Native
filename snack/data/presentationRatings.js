export const postTypes = { DEFAULT: 'default', PRESENTATION: 'presentation' };

export const presentationSkills = [
  { id: 'clarity', label: 'Clareza', short: 'CLR' },
  { id: 'content', label: 'Domínio do conteúdo', short: 'CNT' },
  { id: 'engagement', label: 'Engajamento da audiência', short: 'ENG' },
  { id: 'storytelling', label: 'Storytelling', short: 'STY' },
  { id: 'timing', label: 'Gestão de tempo', short: 'TMP' },
  { id: 'visuals', label: 'Recursos visuais', short: 'VIS' },
];

export const defaultSkillScores = {
  clarity: 70, content: 70, engagement: 70, storytelling: 70, timing: 70, visuals: 70,
};

export const defaultPresentationRating = { stars: 1, includeSpeakerSkills: false };
