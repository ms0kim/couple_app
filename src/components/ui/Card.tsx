import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
