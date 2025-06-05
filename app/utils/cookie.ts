import AsyncStorage from "@react-native-async-storage/async-storage"

export const cookie = {
    set: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value)
        } catch (e) {
            console.error("Set cookie error:", e)
        }
    },
    get: async (key: string) => {
        try {
            return await AsyncStorage.getItem(key)
        } catch (e) {
            console.error("Get cookie error:", e)
            return null
        }
    },
    remove: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key)
        } catch (e) {
            console.error("Remove cookie error:", e)
        }
    },
    clearAll: async () => {
        await AsyncStorage.clear()
    },
}
