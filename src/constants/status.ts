import type { UserStatus, Emotion } from '../stores/useUserStore';

interface StatusOption {
  value: UserStatus;
  label: string;
  emoji: string;
}

interface EmotionOption {
  value: Emotion;
  label: string;
  emoji: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'available', label: '여유있음', emoji: '✨' },
  { value: 'busy', label: '바쁨', emoji: '💼' },
  { value: 'studying', label: '공부중', emoji: '📚' },
  { value: 'working', label: '일하는중', emoji: '💻' },
  { value: 'sleeping', label: '자는중', emoji: '😴' },
  { value: 'eating', label: '밥먹는중', emoji: '🍽️' },
  { value: 'exercising', label: '운동중', emoji: '🏃' },
  { value: 'custom', label: '직접입력', emoji: '✏️' },
];

export const EMOTION_OPTIONS: EmotionOption[] = [
  { value: 'happy', label: '행복', emoji: '😊' },
  { value: 'sad', label: '슬픔', emoji: '😢' },
  { value: 'angry', label: '화남', emoji: '😠' },
  { value: 'tired', label: '피곤', emoji: '😫' },
  { value: 'excited', label: '신남', emoji: '🤩' },
  { value: 'neutral', label: '평범', emoji: '😐' },
  { value: 'love', label: '사랑', emoji: '🥰' },
];

export const getStatusLabel = (status: UserStatus): string => {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
};

export const getEmotionLabel = (emotion: Emotion): string => {
  return EMOTION_OPTIONS.find((e) => e.value === emotion)?.label ?? emotion;
};

export const getStatusEmoji = (status: UserStatus): string => {
  return STATUS_OPTIONS.find((s) => s.value === status)?.emoji ?? '✨';
};

export const getEmotionEmoji = (emotion: Emotion): string => {
  return EMOTION_OPTIONS.find((e) => e.value === emotion)?.emoji ?? '😐';
};
