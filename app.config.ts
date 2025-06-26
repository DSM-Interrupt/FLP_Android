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
    splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#22c55e",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
        supportsTablet: true,
    },
    android: {
        package: "com.teamInturrpt.flp",
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#22c55e",
        },
        permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
    },
    web: {
        favicon: "./assets/favicon.png",
    },
    extra: {
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
                    usesCleartextTraffic: true,
                },
            },
        ],
    ],

    owner: "jihoseo",
})
