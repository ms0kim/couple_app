import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useCoupleStatus } from '../hooks/useCoupleStatus';

type ConnectMode = 'create' | 'join';

export function ConnectScreen() {
  const [mode, setMode] = useState<ConnectMode>('create');
  const [inputCode, setInputCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const { inviteCode, generateInviteCode, joinWithCode, error } = useCoupleStatus();

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      await generateInviteCode();
    } catch {
      // error is handled by the hook
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!inputCode.trim()) {
      Alert.alert('알림', '초대 코드를 입력해주세요');
      return;
    }

    setIsJoining(true);
    try {
      await joinWithCode(inputCode.trim().toUpperCase());
      Alert.alert('연결 완료', '파트너와 연결되었습니다!');
    } catch (err) {
      Alert.alert('연결 실패', err instanceof Error ? err.message : '다시 시도해주세요');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('복사 완료', '초대 코드가 복사되었습니다');
    }
  };

  const handleShareCode = async () => {
    if (inviteCode) {
      await Share.share({
        message: `CoupleStatus에서 나와 연결해요! 초대 코드: ${inviteCode}`,
      });
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <View className="items-center mb-8 mt-12">
        <Text className="text-2xl">💑</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
          파트너와 연결하기
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          초대 코드를 생성하거나{'\n'}파트너의 코드를 입력하세요
        </Text>
      </View>

      {/* 모드 전환 탭 */}
      <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        <Pressable
          className={`flex-1 py-3 rounded-lg ${
            mode === 'create' ? 'bg-white dark:bg-gray-600' : ''
          }`}
          onPress={() => setMode('create')}
        >
          <Text
            className={`text-center font-medium ${
              mode === 'create'
                ? 'text-primary-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            코드 생성
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-lg ${
            mode === 'join' ? 'bg-white dark:bg-gray-600' : ''
          }`}
          onPress={() => setMode('join')}
        >
          <Text
            className={`text-center font-medium ${
              mode === 'join'
                ? 'text-primary-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            코드 입력
          </Text>
        </Pressable>
      </View>

      {mode === 'create' ? (
        <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
          {inviteCode ? (
            <>
              <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
                파트너에게 이 코드를 공유하세요
              </Text>
              <View className="bg-white dark:bg-gray-700 rounded-xl py-6 px-4 mb-6">
                <Text className="text-3xl font-bold text-center text-primary-500 tracking-widest">
                  {inviteCode}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-xl py-4 items-center active:opacity-80"
                  onPress={handleCopyCode}
                >
                  <Text className="text-gray-700 dark:text-gray-200 font-medium">
                    📋 복사
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-primary-500 rounded-xl py-4 items-center active:bg-primary-600"
                  onPress={handleShareCode}
                >
                  <Text className="text-white font-medium">📤 공유</Text>
                </Pressable>
              </View>
              <Text className="text-gray-400 text-center text-sm mt-6">
                파트너가 코드를 입력하면 자동으로 연결됩니다
              </Text>
            </>
          ) : (
            <>
              <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
                초대 코드를 생성하여{'\n'}파트너에게 공유하세요
              </Text>
              <Pressable
                className="bg-primary-500 rounded-xl py-4 items-center active:bg-primary-600"
                onPress={handleGenerateCode}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    초대 코드 생성
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      ) : (
        <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
            파트너에게 받은 코드를 입력하세요
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl px-4 py-4 mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white tracking-widest"
            placeholder="XXXXXX"
            placeholderTextColor="#9CA3AF"
            value={inputCode}
            onChangeText={(text) => setInputCode(text.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
          />
          {error && (
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          )}
          <Pressable
            className="bg-primary-500 rounded-xl py-4 items-center active:bg-primary-600"
            onPress={handleJoinWithCode}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">연결하기</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
