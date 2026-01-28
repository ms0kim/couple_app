import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register';
type CharacterType = 'male' | 'female';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [characterType, setCharacterType] = useState<CharacterType>('male');
  const [error, setError] = useState('');

  const { signIn, signUp, loading } = useAuth();

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (mode === 'register' && !name) {
      setError('이름을 입력해주세요');
      return;
    }

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, characterType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-primary-500">CoupleStatus</Text>
          <Text className="text-gray-500 mt-2">커플 실시간 상태 공유</Text>
        </View>

        <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
          {/* 모드 전환 탭 */}
          <View className="flex-row bg-gray-200 dark:bg-gray-700 rounded-xl p-1 mb-6">
            <Pressable
              className={`flex-1 py-3 rounded-lg ${
                mode === 'login' ? 'bg-white dark:bg-gray-600' : ''
              }`}
              onPress={() => setMode('login')}
            >
              <Text
                className={`text-center font-medium ${
                  mode === 'login'
                    ? 'text-primary-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                로그인
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-3 rounded-lg ${
                mode === 'register' ? 'bg-white dark:bg-gray-600' : ''
              }`}
              onPress={() => setMode('register')}
            >
              <Text
                className={`text-center font-medium ${
                  mode === 'register'
                    ? 'text-primary-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                회원가입
              </Text>
            </Pressable>
          </View>

          {/* 입력 필드 */}
          {mode === 'register' && (
            <>
              <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                이름
              </Text>
              <TextInput
                className="bg-white dark:bg-gray-700 rounded-xl px-4 py-3 mb-4 text-gray-900 dark:text-white"
                placeholder="이름을 입력하세요"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />

              <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
                캐릭터 선택
              </Text>
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  className={`flex-1 py-4 rounded-xl items-center ${
                    characterType === 'male'
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white dark:bg-gray-700'
                  }`}
                  onPress={() => setCharacterType('male')}
                >
                  <Text className="text-2xl mb-1">👨</Text>
                  <Text
                    className={
                      characterType === 'male'
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600 dark:text-gray-300'
                    }
                  >
                    남자
                  </Text>
                </Pressable>
                <Pressable
                  className={`flex-1 py-4 rounded-xl items-center ${
                    characterType === 'female'
                      ? 'bg-pink-100 border-2 border-pink-500'
                      : 'bg-white dark:bg-gray-700'
                  }`}
                  onPress={() => setCharacterType('female')}
                >
                  <Text className="text-2xl mb-1">👩</Text>
                  <Text
                    className={
                      characterType === 'female'
                        ? 'text-pink-600 font-medium'
                        : 'text-gray-600 dark:text-gray-300'
                    }
                  >
                    여자
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
            이메일
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl px-4 py-3 mb-4 text-gray-900 dark:text-white"
            placeholder="이메일을 입력하세요"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
            비밀번호
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-700 rounded-xl px-4 py-3 mb-6 text-gray-900 dark:text-white"
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          ) : null}

          <Pressable
            className="bg-primary-500 rounded-xl py-4 items-center active:bg-primary-600"
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                {mode === 'login' ? '로그인' : '회원가입'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
