import "dotenv/config"
import { ExpoConfig, ConfigContext } from "@expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "FLP",
    slug: "flp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#22c55e",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
        config: {
            googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
    },
    android: {
        package: "com.teamInturrpt.flp",
        versionCode: 1,
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#22c55e",
        },
        config: {
            googleMaps: {
                apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
        },
    },
    web: {
        favicon: "./assets/favicon.png",
    },
    extra: {
        baseUrl: process.env.EXPO_PUBLIC_BASE_URL,
        eas: {
            projectId: "4107784e-7d82-468c-8e90-b54088e58be0",
        },
    },
    plugins: [
        [
            "expo-build-properties",
            {
                android: {
                    enableProguardInReleaseBuilds: false,
                    enableShrinkResourcesInReleaseBuilds: false,
                },
            },
        ],
    ],
    owner: "jihoseo",
})
