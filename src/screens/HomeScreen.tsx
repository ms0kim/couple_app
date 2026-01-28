import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CharacterDisplay } from '../components/CharacterDisplay';
import { StatusSelector } from '../components/StatusSelector';
import { useCoupleStatus } from '../hooks/useCoupleStatus';
import { useWidgetSync } from '../hooks/useWidgetSync';
import { useUserStore, type UserStatus, type Emotion } from '../stores';
import { getStatusLabel, getStatusEmoji } from '../constants';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user } = useUserStore();
  const {
    isConnected,
    partner,
    partnerStatus,
    myStatus,
    updateStatus,
    refresh,
  } = useCoupleStatus();

  // 위젯 동기화 훅 - 파트너 상태 변경 시 자동으로 위젯 업데이트
  useWidgetSync();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleStatusChange = async (
    status: UserStatus,
    emotion: Emotion,
    message: string
  ) => {
    setIsUpdating(true);
    try {
      await updateStatus(status, emotion, message);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = (myStatus?.status as UserStatus) || 'available';
  const currentEmotion = (myStatus?.emotion as Emotion) || 'neutral';
  const currentMessage = myStatus?.customMessage || '';

  const partnerCurrentStatus = (partnerStatus?.status as UserStatus) || 'available';

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 헤더 */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="px-6 py-4"
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          우리의 하루
        </Text>
        <Text className="text-gray-500 mt-1">
          {isConnected ? '파트너와 연결됨 💕' : '파트너 연결 대기 중...'}
        </Text>
      </MotiView>

      {/* 커플 캐릭터 디스플레이 */}
      <View className="flex-row justify-center items-end px-6 py-8 gap-6">
        {/* 내 캐릭터 */}
        <MotiView
          from={{ opacity: 0, translateX: -50 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ delay: 100, type: 'spring' }}
          className="items-center"
        >
          <CharacterDisplay
            characterType={user?.characterType || 'male'}
            status={currentStatus}
            size={140}
            name={user?.name || '나'}
          />
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 400 }}
            className="mt-2 bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full"
          >
            <Text className="text-primary-600 dark:text-primary-300 text-sm">
              {getStatusEmoji(currentStatus)} {getStatusLabel(currentStatus)}
            </Text>
          </MotiView>
        </MotiView>

        {/* 하트 연결 */}
        {isConnected && (
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 300, type: 'spring' }}
            className="mb-16"
          >
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                loop: true,
                type: 'timing',
                duration: 1000,
              }}
            >
              <Text className="text-3xl">💕</Text>
            </MotiView>
          </MotiView>
        )}

        {/* 파트너 캐릭터 */}
        {isConnected && partner && (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 200, type: 'spring' }}
            className="items-center"
          >
            <CharacterDisplay
              characterType={partner.characterType || 'female'}
              status={partnerCurrentStatus}
              size={140}
              name={partner.name}
            />
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 500 }}
              className="mt-2 bg-secondary-100 dark:bg-secondary-900 px-3 py-1 rounded-full"
            >
              <Text className="text-secondary-600 dark:text-secondary-300 text-sm">
                {getStatusEmoji(partnerCurrentStatus)} {getStatusLabel(partnerCurrentStatus)}
              </Text>
            </MotiView>
          </MotiView>
        )}

        {/* 파트너 대기 중 */}
        {!isConnected && (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 200, type: 'spring' }}
            className="items-center"
          >
            <View className="w-[140px] h-[140px] rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
              <MotiView
                from={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                  loop: true,
                  type: 'timing',
                  duration: 2000,
                }}
              >
                <Text className="text-5xl">❓</Text>
              </MotiView>
            </View>
            <Text className="mt-4 text-gray-400">파트너 대기 중</Text>
          </MotiView>
        )}
      </View>

      {/* 파트너 메시지 */}
      {isConnected && partnerStatus?.customMessage && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600 }}
          className="mx-6 mb-6"
        >
          <View className="bg-secondary-50 dark:bg-secondary-900/30 rounded-2xl p-4">
            <Text className="text-secondary-400 text-xs mb-1">
              {partner?.name}의 한마디
            </Text>
            <Text className="text-gray-800 dark:text-gray-200">
              "{partnerStatus.customMessage}"
            </Text>
          </View>
        </MotiView>
      )}

      {/* 구분선 */}
      <View className="h-2 bg-gray-100 dark:bg-gray-800" />

      {/* 상태 선택 */}
      <View className="py-6">
        <StatusSelector
          currentStatus={currentStatus}
          currentEmotion={currentEmotion}
          currentMessage={currentMessage}
          onStatusChange={handleStatusChange}
          isLoading={isUpdating}
        />
      </View>
    </ScrollView>
  );
}
