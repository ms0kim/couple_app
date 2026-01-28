import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { StatusButton } from './StatusButton';
import { STATUS_OPTIONS, EMOTION_OPTIONS } from '../constants';
import type { UserStatus, Emotion } from '../stores';

interface StatusSelectorProps {
  currentStatus: UserStatus;
  currentEmotion: Emotion;
  currentMessage: string;
  onStatusChange: (status: UserStatus, emotion: Emotion, message: string) => void;
  isLoading?: boolean;
}

export function StatusSelector({
  currentStatus,
  currentEmotion,
  currentMessage,
  onStatusChange,
  isLoading = false,
}: StatusSelectorProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(currentStatus);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(currentEmotion);
  const [customMessage, setCustomMessage] = useState(currentMessage);
  const [showEmotions, setShowEmotions] = useState(false);

  const handleStatusSelect = (status: UserStatus) => {
    setSelectedStatus(status);
    onStatusChange(status, selectedEmotion, customMessage);
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    onStatusChange(selectedStatus, emotion, customMessage);
  };

  const handleMessageSubmit = () => {
    onStatusChange(selectedStatus, selectedEmotion, customMessage);
  };

  return (
    <View className="flex-1">
      {/* 상태 선택 섹션 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100 }}
      >
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 px-4">
          지금 뭐해?
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 gap-3"
        >
          {STATUS_OPTIONS.map((option, index) => (
            <MotiView
              key={option.value}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 50,
                type: 'spring',
                damping: 15,
              }}
            >
              <StatusButton
                status={option.value}
                label={option.label}
                emoji={option.emoji}
                isSelected={selectedStatus === option.value}
                onPress={() => handleStatusSelect(option.value)}
              />
            </MotiView>
          ))}
        </ScrollView>
      </MotiView>

      {/* 감정 선택 토글 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200 }}
        className="mt-6 px-4"
      >
        <Pressable
          onPress={() => setShowEmotions(!showEmotions)}
          className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3"
        >
          <Text className="text-gray-700 dark:text-gray-300 font-medium">
            기분은 어때?
          </Text>
          <View className="flex-row items-center">
            <Text className="text-xl mr-2">
              {EMOTION_OPTIONS.find((e) => e.value === selectedEmotion)?.emoji}
            </Text>
            <MotiView
              animate={{ rotate: showEmotions ? '180deg' : '0deg' }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <Text className="text-gray-400">▼</Text>
            </MotiView>
          </View>
        </Pressable>

        {/* 감정 선택 그리드 */}
        <MotiView
          animate={{
            height: showEmotions ? 'auto' : 0,
            opacity: showEmotions ? 1 : 0,
          }}
          transition={{ type: 'timing', duration: 200 }}
          style={{ overflow: 'hidden' }}
        >
          <View className="flex-row flex-wrap gap-2 mt-3">
            {EMOTION_OPTIONS.map((option, index) => (
              <MotiView
                key={option.value}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: showEmotions ? 1 : 0,
                  scale: showEmotions ? 1 : 0.8,
                }}
                transition={{
                  delay: showEmotions ? index * 30 : 0,
                  type: 'spring',
                  damping: 15,
                }}
              >
                <EmotionChip
                  emoji={option.emoji}
                  label={option.label}
                  isSelected={selectedEmotion === option.value}
                  onPress={() => handleEmotionSelect(option.value)}
                />
              </MotiView>
            ))}
          </View>
        </MotiView>
      </MotiView>

      {/* 커스텀 메시지 입력 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300 }}
        className="mt-6 px-4"
      >
        <Text className="text-gray-600 dark:text-gray-400 mb-2">
          한마디 남기기
        </Text>
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
          <TextInput
            className="flex-1 px-4 py-3 text-gray-900 dark:text-white"
            placeholder="오늘의 한마디..."
            placeholderTextColor="#9CA3AF"
            value={customMessage}
            onChangeText={setCustomMessage}
            onSubmitEditing={handleMessageSubmit}
            returnKeyType="done"
            maxLength={50}
          />
          {customMessage.length > 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <Pressable
                onPress={handleMessageSubmit}
                className="px-4 py-3"
              >
                <Text className="text-primary-500 font-medium">저장</Text>
              </Pressable>
            </MotiView>
          )}
        </View>
        <Text className="text-gray-400 text-xs mt-1 text-right">
          {customMessage.length}/50
        </Text>
      </MotiView>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white/50 dark:bg-black/50 items-center justify-center"
        >
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '360deg' }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 1000,
            }}
          >
            <Text className="text-3xl">⏳</Text>
          </MotiView>
        </MotiView>
      )}
    </View>
  );
}

// 감정 칩 컴포넌트
function EmotionChip({
  emoji,
  label,
  isSelected,
  onPress,
}: {
  emoji: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
    >
      <MotiView
        animate={{
          scale: isPressed ? 0.9 : 1,
          backgroundColor: isSelected ? '#ef4444' : '#f3f4f6',
        }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 400,
        }}
        className="flex-row items-center px-3 py-2 rounded-full"
      >
        <Text className="mr-1">{emoji}</Text>
        <Text
          className={`text-sm ${
            isSelected ? 'text-white font-medium' : 'text-gray-600'
          }`}
        >
          {label}
        </Text>
      </MotiView>
    </Pressable>
  );
}
