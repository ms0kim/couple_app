import { View, Text } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import type { UserStatus } from '../stores';

// 상태별 이모지와 배경색
const STATUS_VISUALS: Record<
  UserStatus,
  { emoji: string; bgColor: string; darkBgColor: string }
> = {
  available: { emoji: '😊', bgColor: 'bg-green-100', darkBgColor: 'dark:bg-green-900' },
  busy: { emoji: '😰', bgColor: 'bg-orange-100', darkBgColor: 'dark:bg-orange-900' },
  studying: { emoji: '📚', bgColor: 'bg-blue-100', darkBgColor: 'dark:bg-blue-900' },
  working: { emoji: '💻', bgColor: 'bg-purple-100', darkBgColor: 'dark:bg-purple-900' },
  sleeping: { emoji: '😴', bgColor: 'bg-indigo-100', darkBgColor: 'dark:bg-indigo-900' },
  eating: { emoji: '🍽️', bgColor: 'bg-yellow-100', darkBgColor: 'dark:bg-yellow-900' },
  exercising: { emoji: '🏃', bgColor: 'bg-red-100', darkBgColor: 'dark:bg-red-900' },
  custom: { emoji: '✨', bgColor: 'bg-pink-100', darkBgColor: 'dark:bg-pink-900' },
};

interface CharacterDisplayProps {
  characterType: 'male' | 'female';
  status: UserStatus;
  size?: number;
  name?: string;
}

export function CharacterDisplay({
  characterType,
  status,
  size = 180,
  name,
}: CharacterDisplayProps) {
  const visual = STATUS_VISUALS[status];
  const genderEmoji = characterType === 'male' ? '👨' : '👩';

  return (
    <View className="items-center">
      <AnimatePresence exitBeforeEnter>
        <MotiView
          key={status}
          from={{ opacity: 0, scale: 0.5, rotate: '-15deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          exit={{ opacity: 0, scale: 0.8, rotate: '15deg' }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 200,
          }}
          className="items-center justify-center"
        >
          {/* 떠다니는 애니메이션 컨테이너 */}
          <MotiView
            from={{ translateY: 0 }}
            animate={{ translateY: [-6, 6, -6] }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 2500,
              delay: 0,
            }}
          >
            {/* 메인 캐릭터 원 */}
            <View
              className={`rounded-full items-center justify-center ${visual.bgColor} ${visual.darkBgColor}`}
              style={{ width: size, height: size }}
            >
              {/* 펄스 이펙트 */}
              <MotiView
                from={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{
                  loop: true,
                  type: 'timing',
                  duration: 2000,
                }}
                className={`absolute rounded-full ${visual.bgColor}`}
                style={{ width: size, height: size }}
              />

              {/* 캐릭터 이모지 */}
              <MotiView
                from={{ scale: 0.8 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  loop: true,
                  type: 'timing',
                  duration: 1500,
                }}
              >
                <Text style={{ fontSize: size * 0.35 }}>{genderEmoji}</Text>
              </MotiView>

              {/* 상태 이모지 배지 */}
              <MotiView
                from={{ scale: 0, rotate: '-45deg' }}
                animate={{ scale: 1, rotate: '0deg' }}
                transition={{
                  type: 'spring',
                  damping: 10,
                  stiffness: 300,
                  delay: 200,
                }}
                className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg"
              >
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: ['0deg', '10deg', '-10deg', '0deg'] }}
                  transition={{
                    loop: true,
                    type: 'timing',
                    duration: 2000,
                    delay: 500,
                  }}
                >
                  <Text style={{ fontSize: size * 0.2 }}>{visual.emoji}</Text>
                </MotiView>
              </MotiView>
            </View>
          </MotiView>
        </MotiView>
      </AnimatePresence>

      {/* 이름 표시 */}
      {name && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          className="mt-4"
        >
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {name}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
