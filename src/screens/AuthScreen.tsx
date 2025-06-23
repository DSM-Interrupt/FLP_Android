import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from "react-native"
import { useMutation } from "@tanstack/react-query"
import { useTheme } from "../contexts/ThemeContext"
import { colorTable } from "../styles/colorTable"
import { authService } from "../services/auth"

const { width, height } = Dimensions.get("window")

interface AuthScreenProps {
    onAuthSuccess: (userType: "member" | "host") => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const { theme, isDark, systemTheme } = useTheme()

    const colors = colorTable.main[theme]
    const grayColors = colorTable.gray[theme]
    const dangerColors = colorTable.danger[theme]
    const successColors = colorTable.success[theme]

    const [userType, setUserType] = useState<"member" | "host">("member")
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({
        deviceId: "",
        userId: "",
        password: "",
    })

    const loginMutation = useMutation({
        mutationFn: async () => {
            console.log("🚀 로그인 뮤테이션 시작")
            const response = await authService.login(
                userType,
                formData.userId,
                formData.password
            )
            console.log("📥 로그인 응답 받음:", response)
            return response
        },
        onSuccess: async (data) => {
            console.log("🎉 로그인 성공 콜백:", data)

            // 토큰 저장이 완료될 때까지 대기
            let retryCount = 0
            const maxRetries = 3

            while (retryCount < maxRetries) {
                const token = await authService.getStoredAccessToken()
                console.log(
                    `🔍 토큰 확인 시도 ${retryCount + 1}:`,
                    token ? "있음" : "없음"
                )

                if (token) {
                    console.log("✅ 토큰 확인됨, 화면 전환")
                    onAuthSuccess(userType)
                    return
                }

                retryCount++
                await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms 대기
            }

            console.error("❌ 토큰 저장 실패 - 최대 재시도 횟수 초과")
            // 에러 처리
        },
        onError: (error: any) => {
            console.error("❌ 로그인 에러:", error)
            // 기존 에러 처리...
        },
    })

    const signupMutation = useMutation({
        mutationFn: async () => {
            const response = await authService.signup(
                userType,
                formData.deviceId,
                formData.userId,
                formData.password
            )
            return response
        },
        onSuccess: (data) => {
            console.log("Signup successful:", data)
            Alert.alert(
                "회원가입 성공",
                "회원가입이 완료되었습니다. 로그인해주세요.",
                [
                    {
                        text: "확인",
                        onPress: () => setIsLogin(true),
                    },
                ]
            )
        },
        onError: (error: any) => {
            console.error("Login error:", error)

            let message = error.response?.data?.message

            if (Array.isArray(message)) {
                message = message.join("\n")
            }

            Alert.alert(
                "회원가입 실패",
                message ||
                    "회원가입에 실패했습니다. 기기 ID와 비밀번호를 확인해주세요."
            )
        },
    })

    const handleSubmit = () => {
        if (!isLogin && !formData.deviceId.trim()) {
            Alert.alert("오류", "기기 ID를 입력해주세요.")
            return
        }

        if (!formData.password.trim()) {
            Alert.alert("오류", "비밀번호를 입력해주세요.")
            return
        }

        if (!isLogin) {
            if (formData.password.length < 6) {
                Alert.alert("오류", "비밀번호는 6자 이상이어야 합니다.")
                return
            }
        }

        if (isLogin) {
            loginMutation.mutate()
        } else {
            signupMutation.mutate()
        }
    }

    const resetForm = () => {
        setFormData({
            deviceId: "",
            userId: "",
            password: "",
        })
    }

    const switchMode = () => {
        setIsLogin(!isLogin)
        resetForm()
    }

    const switchUserType = (type: "member" | "host") => {
        setUserType(type)
        resetForm()
    }

    const dynamicStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? grayColors[950] : grayColors[50],
        },
        keyboardAvoidingView: {
            flex: 1,
        },
        scrollView: {
            flexGrow: 1,
        },
        header: {
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 20,
        },
        headerTitle: {
            fontSize: 32,
            fontWeight: "bold",
            color: colors[500],
        },
        systemThemeIndicator: {
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: isDark ? grayColors[800] : grayColors[200],
            borderRadius: 12,
        },
        systemThemeText: {
            fontSize: 12,
            color: isDark ? grayColors[400] : grayColors[600],
            textAlign: "center",
        },
        content: {
            flex: 1,
            paddingHorizontal: 30,
            justifyContent: "center",
        },
        logoContainer: {
            alignItems: "center",
            marginBottom: 40,
        },
        logo: {
            fontSize: 48,
            marginBottom: 10,
        },
        appName: {
            fontSize: 32,
            fontWeight: "bold",
            color: colors[500],
            marginBottom: 8,
        },
        appDescription: {
            fontSize: 16,
            color: isDark ? grayColors[400] : grayColors[600],
            textAlign: "center",
            lineHeight: 22,
        },
        userTypeContainer: {
            flexDirection: "row",
            marginBottom: 30,
            backgroundColor: isDark ? grayColors[900] : grayColors[200],
            borderRadius: 12,
            padding: 4,
        },
        userTypeButton: {
            flex: 1,
            paddingVertical: 12,
            alignItems: "center",
            borderRadius: 8,
        },
        userTypeButtonActive: {
            backgroundColor: colors[500],
            shadowColor: colors[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
        },
        userTypeButtonInactive: {
            backgroundColor: "transparent",
        },
        userTypeText: {
            fontSize: 16,
            fontWeight: "600",
        },
        userTypeTextActive: {
            color: "white",
        },
        userTypeTextInactive: {
            color: isDark ? grayColors[400] : grayColors[600],
        },
        formContainer: {
            marginBottom: 30,
        },
        inputContainer: {
            marginBottom: 20,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? grayColors[200] : grayColors[700],
            marginBottom: 8,
        },
        input: {
            borderWidth: 2,
            borderColor: isDark ? grayColors[800] : grayColors[300],
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            backgroundColor: isDark ? grayColors[900] : "white",
            color: isDark ? grayColors[100] : grayColors[900],
        },
        submitButton: {
            backgroundColor: colors[500],
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 20,
            shadowColor: colors[500],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        submitButtonDisabled: {
            backgroundColor: isDark ? grayColors[800] : grayColors[400],
            shadowOpacity: 0,
            elevation: 0,
        },
        submitButtonText: {
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
        },
        switchContainer: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
        },
        switchText: {
            fontSize: 16,
            color: isDark ? grayColors[400] : grayColors[600],
        },
        switchButton: {
            marginLeft: 8,
        },
        switchButtonText: {
            fontSize: 16,
            color: colors[500],
            fontWeight: "600",
            textDecorationLine: "underline",
        },
        userTypeDescription: {
            backgroundColor: isDark ? grayColors[900] : grayColors[100],
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: colors[500],
        },
        descriptionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? grayColors[100] : grayColors[800],
            marginBottom: 8,
        },
        descriptionText: {
            fontSize: 14,
            color: isDark ? grayColors[300] : grayColors[600],
            lineHeight: 20,
        },
        footer: {
            paddingHorizontal: 30,
            paddingBottom: 30,
            alignItems: "center",
        },
        footerText: {
            fontSize: 12,
            color: isDark ? grayColors[500] : grayColors[500],
            textAlign: "center",
            lineHeight: 18,
        },
    })

    const isLoading = loginMutation.isPending || signupMutation.isPending

    return (
        <View style={dynamicStyles.container}>
            <KeyboardAvoidingView
                style={dynamicStyles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    style={dynamicStyles.scrollView}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={dynamicStyles.content}>
                        <View style={dynamicStyles.logoContainer}>
                            <Text style={dynamicStyles.appName}>FLP</Text>
                            <Text style={dynamicStyles.appDescription}>
                                실시간 위치 추적 및{"\n"}안전 관리 시스템
                            </Text>
                        </View>

                        <View style={dynamicStyles.userTypeContainer}>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.userTypeButton,
                                    userType === "member"
                                        ? dynamicStyles.userTypeButtonActive
                                        : dynamicStyles.userTypeButtonInactive,
                                ]}
                                onPress={() => switchUserType("member")}
                                disabled={isLoading}
                            >
                                <Text
                                    style={[
                                        dynamicStyles.userTypeText,
                                        userType === "member"
                                            ? dynamicStyles.userTypeTextActive
                                            : dynamicStyles.userTypeTextInactive,
                                    ]}
                                >
                                    멤버
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.userTypeButton,
                                    userType === "host"
                                        ? dynamicStyles.userTypeButtonActive
                                        : dynamicStyles.userTypeButtonInactive,
                                ]}
                                onPress={() => switchUserType("host")}
                                disabled={isLoading}
                            >
                                <Text
                                    style={[
                                        dynamicStyles.userTypeText,
                                        userType === "host"
                                            ? dynamicStyles.userTypeTextActive
                                            : dynamicStyles.userTypeTextInactive,
                                    ]}
                                >
                                    호스트
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={dynamicStyles.formContainer}>
                            {!isLogin && (
                                <View style={dynamicStyles.inputContainer}>
                                    <Text style={dynamicStyles.inputLabel}>
                                        기기 ID
                                    </Text>
                                    <TextInput
                                        style={dynamicStyles.input}
                                        value={formData.deviceId}
                                        onChangeText={(text) =>
                                            setFormData({
                                                ...formData,
                                                deviceId: text,
                                            })
                                        }
                                        placeholder="기기 고유 ID를 입력하세요"
                                        placeholderTextColor={
                                            isDark
                                                ? grayColors[600]
                                                : grayColors[400]
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                    />
                                </View>
                            )}

                            <View style={dynamicStyles.inputContainer}>
                                <Text style={dynamicStyles.inputLabel}>
                                    {userType === "host"
                                        ? "호스트 ID"
                                        : "멤버 ID"}
                                </Text>
                                <TextInput
                                    style={dynamicStyles.input}
                                    value={formData.userId}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            userId: text,
                                        })
                                    }
                                    placeholder={`${
                                        userType === "host" ? "호스트" : "멤버"
                                    } ID를 입력하세요`}
                                    placeholderTextColor={
                                        isDark
                                            ? grayColors[600]
                                            : grayColors[400]
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={dynamicStyles.inputContainer}>
                                <Text style={dynamicStyles.inputLabel}>
                                    비밀번호
                                </Text>
                                <TextInput
                                    style={dynamicStyles.input}
                                    value={formData.password}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            password: text,
                                        })
                                    }
                                    placeholder="비밀번호를 입력하세요"
                                    placeholderTextColor={
                                        isDark
                                            ? grayColors[600]
                                            : grayColors[400]
                                    }
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    dynamicStyles.submitButton,
                                    isLoading &&
                                        dynamicStyles.submitButtonDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <Text style={dynamicStyles.submitButtonText}>
                                    {isLoading
                                        ? isLogin
                                            ? "로그인 중..."
                                            : "회원가입 중..."
                                        : isLogin
                                        ? "로그인"
                                        : "회원가입"}
                                </Text>
                            </TouchableOpacity>

                            <View style={dynamicStyles.switchContainer}>
                                <Text style={dynamicStyles.switchText}>
                                    {isLogin
                                        ? "계정이 없으신가요?"
                                        : "이미 계정이 있으신가요?"}
                                </Text>
                                <TouchableOpacity
                                    style={dynamicStyles.switchButton}
                                    onPress={switchMode}
                                    disabled={isLoading}
                                >
                                    <Text
                                        style={dynamicStyles.switchButtonText}
                                    >
                                        {isLogin ? "회원가입" : "로그인"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}
