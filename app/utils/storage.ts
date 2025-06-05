import AsyncStorage from "@react-native-async-storage/async-storage"

export const getItem = async (name: string) => await AsyncStorage.getItem(name)

export const setItem = async (name: string, data: string) =>
    await AsyncStorage.setItem(name, data)

export const delItem = async (name: string) =>
    await AsyncStorage.removeItem(name)

export const bulkDelItem = async (names: string[]) =>
    await AsyncStorage.multiRemove(names)

export const bulkGetItem = async (names: string[]) =>
    await AsyncStorage.multiGet(names)

export const bulkSetItem = async (items: [string, string][]) =>
    await AsyncStorage.multiSet(items)

export const resetStorage = async () => await AsyncStorage.clear()
