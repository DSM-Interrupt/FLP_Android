import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * 로컬 푸시 알림 전송
 */
export async function sendLocalPushNotification(title: string, body: string) {
  try {
    // 알림 권한 요청
    const { status } = await Notifications.requestPermissionsAsync()

    if (status !== "granted") {
      console.warn("알림 권한이 거부되었습니다.")
      return
    }

    // 로컬 알림 전송
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // 즉시 전송
    })

    console.log("✅ 로컬 푸시 알림 전송됨:", { title, body })
  } catch (error) {
    console.error("❌ 로컬 푸시 알림 전송 실패:", error)
  }
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === "granted"
  } catch (error) {
    console.error("알림 권한 요청 실패:", error)
    return false
  }
}

/**
 * 알림 채널 설정 (Android)
 */
export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "FLP 알림",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0ea5e9",
      sound: "default",
    })
  }
}
