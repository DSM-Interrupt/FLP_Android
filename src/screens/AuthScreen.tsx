"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
    StatusBar,
} from "react-native"
import { useMutation } from "@tanstack/react-query"
import { useTheme } from "../contexts/ThemeContext"
import { getThemeColors } from "../styles/colorTable"
import { authService } from "../services/auth"

const { width, height } = Dimensions.get("window")

interface AuthScreenProps {
    onAuthSuccess: (userType: "member" | "host") => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const { isDark } = useTheme()
    const themeColors = getThemeColors(isDark)

    const [userType, setUserType] = useState<"member" | "host">("member")
    const [isLogin, setIsLogin] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [formData, setFormData] = useState({
        deviceId: "",
        userId: "",
        password: "",
    })

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage("")
            }, 8000)
            return () => clearTimeout(timer)
        }
    }, [errorMessage])

    const loginMutation = useMutation({
        mutationFn: async () => {
            console.log("🚀 로그인 뮤테이션 시작")
            setErrorMessage("")

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

            const token = data?.accessToken

            if (!token) {
                setErrorMessage("서버에서 토큰을 받지 못했습니다.")
                return
            }

            console.log("✅ accessToken 확인:", token.substring(0, 10), "...")

            const savedToken = await authService.getStoredAccessToken()

            if (savedToken) {
                console.log("✅ 저장된 토큰 재확인됨")
                onAuthSuccess(userType)
            } else {
                console.error("❌ 토큰 저장 실패 또는 확인 실패")
                setErrorMessage("토큰 저장 확인에 실패했습니다.")
            }
        },
        onError: (error: any) => {
            console.error("❌ 로그인 에러:", error)

            let errorMsg = "로그인에 실패했습니다."

            if (error.response) {
                const status = error.response.status
                const data = error.response.data
                errorMsg = data?.message || `서버 오류 (${status})`

                if (status === 401) {
                    errorMsg = "아이디 또는 비밀번호가 잘못되었습니다."
                } else if (status === 404) {
                    errorMsg = "서버를 찾을 수 없습니다."
                } else if (status >= 500) {
                    errorMsg = "서버 내부 오류가 발생했습니다."
                }
            } else if (error.request) {
                errorMsg = "네트워크 연결을 확인해주세요."
            } else {
                errorMsg = error.message || "알 수 없는 오류가 발생했습니다."
            }

            setErrorMessage(errorMsg)
        },
    })

    const signupMutation = useMutation({
        mutationFn: async () => {
            setErrorMessage("")
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
            console.error("Signup error:", error)

            let errorMsg = "회원가입에 실패했습니다."

            if (error.response) {
                const data = error.response.data
                let message = data?.message
                if (Array.isArray(message)) {
                    message = message.join(", ")
                }
                errorMsg = message || `서버 오류 (${error.response.status})`
            } else if (error.request) {
                errorMsg = "네트워크 연결을 확인해주세요."
            } else {
                errorMsg = error.message || "알 수 없는 오류가 발생했습니다."
            }

            setErrorMessage(errorMsg)
        },
    })

    const handleSubmit = () => {
        setErrorMessage("")

        if (!isLogin && !formData.deviceId.trim()) {
            setErrorMessage("기기 ID를 입력해주세요.")
            return
        }

        if (!formData.userId.trim()) {
            setErrorMessage("사용자 ID를 입력해주세요.")
            return
        }

        if (!formData.password.trim()) {
            setErrorMessage("비밀번호를 입력해주세요.")
            return
        }

        if (!isLogin) {
            if (formData.password.length < 6) {
                setErrorMessage("비밀번호는 6자 이상이어야 합니다.")
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
        setErrorMessage("")
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
            backgroundColor: themeColors.background,
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
            color: themeColors.primary,
        },
        systemThemeIndicator: {
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: themeColors.surface,
            borderRadius: 12,
        },
        systemThemeText: {
            fontSize: 12,
            color: themeColors.textSecondary,
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
            color: themeColors.primary,
            marginBottom: 8,
        },
        appDescription: {
            fontSize: 16,
            color: themeColors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
        },
        userTypeContainer: {
            flexDirection: "row",
            marginBottom: 30,
            backgroundColor: themeColors.surface,
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
            backgroundColor: themeColors.primary,
            shadowColor: themeColors.primary,
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
            color: themeColors.textSecondary,
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
            color: themeColors.text,
            marginBottom: 8,
        },
        input: {
            borderWidth: 2,
            borderColor: themeColors.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            backgroundColor: themeColors.card,
            color: themeColors.text,
        },
        errorText: {
            fontSize: 14,
            color: "#ef4444",
            textAlign: "center",
            marginBottom: 16,
            paddingHorizontal: 16,
            lineHeight: 20,
        },
        submitButton: {
            backgroundColor: themeColors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 20,
            shadowColor: themeColors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        submitButtonDisabled: {
            backgroundColor: themeColors.border,
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
            color: themeColors.textSecondary,
        },
        switchButton: {
            marginLeft: 8,
        },
        switchButtonText: {
            fontSize: 16,
            color: themeColors.primary,
            fontWeight: "600",
            textDecorationLine: "underline",
        },
        userTypeDescription: {
            backgroundColor: themeColors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: themeColors.primary,
        },
        descriptionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: themeColors.text,
            marginBottom: 8,
        },
        descriptionText: {
            fontSize: 14,
            color: themeColors.textSecondary,
            lineHeight: 20,
        },
        footer: {
            paddingHorizontal: 30,
            paddingBottom: 30,
            alignItems: "center",
        },
        footerText: {
            fontSize: 12,
            color: themeColors.textSecondary,
            textAlign: "center",
            lineHeight: 18,
        },
    })

    const isLoading = loginMutation.isPending || signupMutation.isPending

    return (
        <View style={dynamicStyles.container}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={themeColors.background}
            />
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
                                            themeColors.textSecondary
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
                                        themeColors.textSecondary
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
                                        themeColors.textSecondary
                                    }
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                />
                            </View>

                            {errorMessage ? (
                                <Text style={dynamicStyles.errorText}>
                                    {errorMessage}
                                </Text>
                            ) : null}

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
