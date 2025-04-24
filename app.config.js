import "dotenv/config"

export default {
    expo: {
        name: "FLP",
        slug: "FLP",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./app/assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./app/assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        ios: {
            supportsTablet: true,
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./app/assets/Logo.png",
                backgroundColor: "#ffffff",
            },
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        },
        web: {
            favicon: "./app/assets/Logo.png",
        },
    },
}
