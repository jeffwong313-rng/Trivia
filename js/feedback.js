// Flagged questions, saved on this device for later review.
import { answerText } from './questions.js';

const KEY = 'noah_feedback';
export const FLAG_REASONS = [
  { id: 'niche', label: 'Too niche' },
  { id: 'incomplete', label: 'Incomplete question' },
  { id: 'other', label: 'Other' },
];
export const reasonLabel = (id) => FLAG_REASONS.find((r) => r.id === id)?.label || id;

export const Feedback = {
  all() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} },
  add(q, reason, note = '') {
    const list = Feedback.all().filter((f) => f.id !== q.id);
    list.unshift({
      id: q.id, source: q.source || '', topic: q.topic || '', topicName: q.topicName || q.subtopic || '', tier: q.tier,
      prompt: q.prompt, answers: q.answers.map((a) => answerText(a) || '(picture)'), correct: answerText(q.answers[q.correct]) || '',
      reason, note: String(note || '').slice(0, 300), date: new Date().toISOString(), status: 'pending',
    });
    Feedback.save(list.slice(0, 500));
  },
  setStatus(id, status) { Feedback.save(Feedback.all().map((f) => (f.id === id ? { ...f, status } : f))); },
  remove(id) { Feedback.save(Feedback.all().filter((f) => f.id !== id)); },
  pending() { return Feedback.all().filter((f) => f.status === 'pending').length; },
};
