import * as Notifications from "expo-notifications"
import * as Device from "expo-device"

export const registerForPushNotificationsAsync = async (): Promise<
    string | null
> => {
    if (!Device.isDevice) {
        console.warn("푸시 알림은 실기기에서만 지원됩니다.")
        return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }

    if (finalStatus !== "granted") {
        console.warn("푸시 알림 권한이 거부되었습니다.")
        return null
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data
    console.log("📱 푸시 토큰:", token)
    return token
}

export const sendLocalPushNotification = (title: string, body: string) => {
    Notifications.scheduleNotificationAsync({
        content: { title, body, sound: "default" },
        trigger: null,
    })
}
