import axios from "axios"
import Constants from "expo-constants"

// 환경 변수에서 BASE_URL 가져오기 (올바른 키 사용)
const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_URL ?? "https://flp24.com"

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// 순환 참조를 피하기 위해 인터셉터는 auth 서비스에서 설정
export default api
