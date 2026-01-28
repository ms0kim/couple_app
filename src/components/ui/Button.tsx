import { Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ title, variant = 'primary', ...props }: ButtonProps) {
  const baseStyle = 'px-6 py-3 rounded-xl items-center justify-center';

  const variantStyles = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-secondary-500 active:bg-secondary-600',
    outline: 'border-2 border-primary-500 bg-transparent',
  };

  const textStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-white font-semibold',
    outline: 'text-primary-500 font-semibold',
  };

  return (
    <Pressable className={`${baseStyle} ${variantStyles[variant]}`} {...props}>
      <Text className={textStyles[variant]}>{title}</Text>
    </Pressable>
  );
}
