import { Pressable, Text } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import type { UserStatus } from '../stores';

interface StatusButtonProps {
  status: UserStatus;
  label: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
}

export function StatusButton({
  label,
  emoji,
  isSelected,
  onPress,
}: StatusButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
    >
      <MotiView
        animate={{
          scale: isPressed ? 0.92 : isSelected ? 1.05 : 1,
          opacity: isPressed ? 0.8 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 15,
          stiffness: 400,
        }}
        className={`px-4 py-3 rounded-2xl min-w-[100px] items-center ${
          isSelected
            ? 'bg-primary-500'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        <MotiView
          animate={{
            scale: isSelected ? [1, 1.2, 1] : 1,
            rotate: isSelected ? ['0deg', '10deg', '-10deg', '0deg'] : '0deg',
          }}
          transition={{
            type: 'timing',
            duration: 400,
          }}
        >
          <Text className="text-2xl mb-1">{emoji}</Text>
        </MotiView>
        <Text
          className={`font-medium text-sm ${
            isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {label}
        </Text>
      </MotiView>
    </Pressable>
  );
}
