import { createPresentationRating, getSpeakerRatingSummary } from './api';
import { defaultSkillScores, presentationSkills } from '../data/presentationRatings';

export function buildInitialSkillScores() {
  return { ...defaultSkillScores };
}

export async function savePresentationRating(payload) {
  return createPresentationRating({
    postId: payload.postId || undefined,
    presentationId: payload.presentationId || undefined,
    stars: payload.stars,
    speakerId: payload.speakerId,
    includeSpeakerSkills: Boolean(payload.includeSpeakerSkills),
    skills: payload.includeSpeakerSkills ? payload.skills : undefined,
    comment: payload.comment || '',
  });
}

export async function listPresentationRatings() {
  return [];
}

export async function getPublicSpeakerRatingSummary(speakerId) {
  return getSpeakerRatingSummary(speakerId);
}
