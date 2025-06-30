import "dotenv/config"
import type { ExpoConfig, ConfigContext } from "@expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "FLP",
    slug: "flp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "flp", // ✅ 여기에 추가 (딥링킹용)

    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#22c55e",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.teamInturrpt.flp", // ✅ iOS에서 필요한 경우
        scheme: "flp", // ✅ 선택적 (딥링크 명시적으로)
    },
    android: {
        package: "com.teamInturrpt.flp",
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#22c55e",
        },
        permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        scheme: "flp", // ✅ 딥링크 대응
    },
    web: {
        favicon: "./assets/favicon.png",
    },
    extra: {
        eas: {
            projectId: "4107784e-7d82-468c-8e90-b54088e58be0",
        },
        EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        EXPO_PUBLIC_BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
    },
    plugins: [
        [
            "expo-build-properties",
            {
                android: {
                    enableProguardInReleaseBuilds: false,
                    enableShrinkResourcesInReleaseBuilds: false,
                    usesCleartextTraffic: true,
                },
            },
        ],
    ],
    owner: "jihoseo",
})
