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
    scheme: "flp", // 딥링킹용

    splash: {
        image: "./assets/adaptive-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.teamInturrpt.flp",
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
    },
    android: {
        package: "com.teamInturrpt.flp",
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#22c55e",
        },
        permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
    },

    web: {
        favicon: "./assets/favicon.png",
    },
    notification: {
        icon: "./assets/icon.png",
        color: "#22c55e",
        androidMode: "default",
        androidCollapsedTitle: "FLP",
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
        [
            "expo-notifications",
            {
                icon: "./assets/icon.png",
                color: "#22c55e",
                defaultChannel: "default",
            },
        ],
    ],
    owner: "jihoseo",
})
