import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container} className="bg-white dark:bg-gray-900">
      <Text className="text-xl font-bold text-gray-900 dark:text-white">
        모달 화면
      </Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text className="text-primary-500">홈으로 돌아가기</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
