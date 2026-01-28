import { View, Text, Pressable, Alert } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useCoupleStatus } from '../hooks/useCoupleStatus';
import { useUserStore } from '../stores';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut } = useAuth();
  const { inviteCode, isConnected, partner } = useCoupleStatus();
  const { user } = useUserStore();

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
          } catch (error) {
            Alert.alert('오류', '로그아웃에 실패했습니다');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ paddingTop: insets.top }}
    >
      {/* 헤더 */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="px-6 py-4"
      >
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          설정
        </Text>
      </MotiView>

      {/* 프로필 섹션 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100 }}
        className="mx-6 mt-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4"
      >
        <Text className="text-gray-500 text-sm mb-3">내 프로필</Text>
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
            <Text className="text-3xl">
              {user?.characterType === 'male' ? '👨' : '👩'}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.name || '이름 없음'}
            </Text>
            <Text className="text-gray-500 text-sm">
              {user?.characterType === 'male' ? '남자' : '여자'} 캐릭터
            </Text>
          </View>
        </View>
      </MotiView>

      {/* 커플 정보 섹션 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200 }}
        className="mx-6 mt-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4"
      >
        <Text className="text-gray-500 text-sm mb-3">커플 정보</Text>

        {isConnected ? (
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-secondary-900 items-center justify-center">
              <Text className="text-2xl">
                {partner?.characterType === 'male' ? '👨' : '👩'}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 dark:text-white font-medium">
                {partner?.name}
              </Text>
              <Text className="text-green-500 text-sm">💕 연결됨</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-gray-600 dark:text-gray-400 mb-2">
              파트너 대기 중...
            </Text>
            {inviteCode && (
              <View className="bg-white dark:bg-gray-700 rounded-xl p-3">
                <Text className="text-gray-500 text-xs mb-1">내 초대 코드</Text>
                <Text className="text-xl font-bold text-primary-500 tracking-widest">
                  {inviteCode}
                </Text>
              </View>
            )}
          </View>
        )}
      </MotiView>

      {/* 메뉴 섹션 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300 }}
        className="mx-6 mt-4"
      >
        <SettingMenuItem
          icon="🔔"
          title="알림 설정"
          onPress={() => Alert.alert('알림', '준비 중인 기능입니다')}
        />
        <SettingMenuItem
          icon="🎨"
          title="테마 설정"
          onPress={() => Alert.alert('테마', '준비 중인 기능입니다')}
        />
        <SettingMenuItem
          icon="❓"
          title="도움말"
          onPress={() => Alert.alert('도움말', '준비 중인 기능입니다')}
        />
      </MotiView>

      {/* 로그아웃 버튼 */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 400 }}
        className="mx-6 mt-8"
      >
        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          className="bg-red-50 dark:bg-red-900/30 rounded-xl py-4 items-center active:opacity-80"
        >
          <Text className="text-red-500 font-medium">
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Text>
        </Pressable>
      </MotiView>

      {/* 버전 정보 */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <Text className="text-gray-400 text-sm">CoupleStatus v1.0.0</Text>
      </View>
    </View>
  );
}

function SettingMenuItem({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
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
          scale: isPressed ? 0.98 : 1,
          opacity: isPressed ? 0.8 : 1,
        }}
        transition={{ type: 'timing', duration: 100 }}
        className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-4 mb-2"
      >
        <Text className="text-xl mr-3">{icon}</Text>
        <Text className="flex-1 text-gray-900 dark:text-white">{title}</Text>
        <Text className="text-gray-400">›</Text>
      </MotiView>
    </Pressable>
  );
}
