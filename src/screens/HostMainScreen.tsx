"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    Dimensions,
    ActivityIndicator,
} from "react-native"
import MapView, { Marker, Circle, type Region } from "react-native-maps"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "../contexts/ThemeContext"
import { colorTable } from "../styles/colorTable"
import api from "../services/api"
import { socketService } from "../services/socket" // socketService 사용
// import { io } from "socket.io-client" // 🔥 io 직접 호출 제거
import { authService } from "../services/auth"
import Ionicons from "@expo/vector-icons/Ionicons"
import { sendLocalPushNotification } from "../utils/push"

const { width, height } = Dimensions.get("window")

interface Member {
    memberName: string
    lat: number
    lon: number
    distance: number
    danger: number
}

interface HostLocationData {
    host: {
        lat: number
        lon: number
    }
    distanceInfo: {
        safe: number
        warning: number
        danger: number
    }
    members: Member[]
}

interface HostMainScreenProps {
    onLogout: () => void
}

export const HostMainScreen: React.FC<HostMainScreenProps> = ({ onLogout }) => {
    const { theme, isDark, systemTheme } = useTheme()
    const colors = colorTable.main[theme]
    const grayColors = colorTable.gray[theme]
    const dangerColors = colorTable.danger[theme]
    const warningColors = colorTable.warning[theme]
    const successColors = colorTable.success[theme]

    const queryClient = useQueryClient()
    const mapRef = useRef<MapView>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<any>(null)
    const previousDangerStatesRef = useRef<Record<string, number>>({})

    const [ready, setReady] = useState(false)
    const [locationData, setLocationData] = useState<HostLocationData | null>(
        null
    )
    const [mapRenderKey, setMapRenderKey] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showMemberList, setShowMemberList] = useState(false)
    const [showDistanceSettings, setShowDistanceSettings] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [newMemberName, setNewMemberName] = useState("")
    const [distanceSettings, setDistanceSettings] = useState({
        safe: 100,
        warning: 200,
        danger: 300,
    })
    const [mapReady, setMapReady] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)

    const updateMemberNameMutation = useMutation({
        mutationFn: async ({
            beforeName,
            afterName,
        }: {
            beforeName: string
            afterName: string
        }) => {
            const response = await api.post("/host/name", {
                beforeName,
                afterName,
            })
            return response.data
        },
        onMutate: async ({ beforeName, afterName }) => {
            if (locationData) {
                const updatedMembers = locationData.members.map((member) =>
                    member.memberName === beforeName
                        ? { ...member, memberName: afterName }
                        : member
                )
                setLocationData({
                    ...locationData,
                    members: updatedMembers,
                })
            }
        },
        onSuccess: () => {
            setSelectedMember(null)
            setNewMemberName("")
            Alert.alert("성공", "멤버 이름이 변경되었습니다.")
        },
        onError: (error: any, { beforeName }) => {
            if (locationData) {
                const revertedMembers = locationData.members.map((member) =>
                    member.memberName !== beforeName
                        ? member
                        : { ...member, memberName: beforeName }
                )
                setLocationData({
                    ...locationData,
                    members: revertedMembers,
                })
            }
            Alert.alert(
                "오류",
                error.response?.data?.message || "이름 변경에 실패했습니다."
            )
        },
    })

    const updateDistanceSettingsMutation = useMutation({
        mutationFn: async (settings: {
            safe: number
            warning: number
            danger: number
        }) => {
            const response = await api.post("/host/distance", settings)
            return response.data
        },
        onMutate: async (newSettings) => {
            if (locationData) {
                setLocationData({
                    ...locationData,
                    distanceInfo: newSettings,
                })
            }
        },
        onSuccess: () => {
            setShowDistanceSettings(false)
            Alert.alert("성공", "거리 설정이 변경되었습니다.")

            setLocationData((prev) => {
                if (!prev) return null

                const { safe, warning, danger } = distanceSettings

                const updatedMembers = prev.members.map((member) => {
                    const dist = member.distance
                    const newDanger =
                        dist > danger
                            ? 3
                            : dist > warning
                            ? 2
                            : dist > safe
                            ? 1
                            : 0

                    return {
                        ...member,
                        danger: newDanger,
                    }
                })

                return {
                    ...prev,
                    distanceInfo: { safe, warning, danger },
                    members: updatedMembers,
                }
            })

            setMapRenderKey((prev) => prev + 1)
        },
        onError: (error: any) => {
            if (locationData) {
                setDistanceSettings(locationData.distanceInfo)
                setLocationData({
                    ...locationData,
                    distanceInfo: locationData.distanceInfo,
                })
            }
            Alert.alert(
                "오류",
                error.response?.data?.message || "설정 변경에 실패했습니다."
            )
        },
    })

    useEffect(() => {
        // 300ms 후에 무거운 작업 시작
        const timer = setTimeout(() => {
            setReady(true)
        }, 300)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (ready) {
            connectSocket()
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            // 🔥 수정: socketService를 사용하도록 변경
            socketService.disconnect()
            socketRef.current = null
        }
    }, [ready])

    useEffect(() => {
        if (locationData) {
            setDistanceSettings(locationData.distanceInfo)
        }
    }, [locationData])

    if (!ready) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" />
            </View>
        )
    }

    const handleLocationData = (data: any) => {
        const dataTimeoutRef = { current: timeoutRef.current }

        if (dataTimeoutRef.current) {
            clearTimeout(dataTimeoutRef.current)
            dataTimeoutRef.current = null
            timeoutRef.current = null
        }

        const dangerMembers: string[] = []

        data.members?.forEach((member: any) => {
            const name = member.memberName || "Unknown"
            const currentDanger = member.danger || 0
            const prevDanger = previousDangerStatesRef.current[name] ?? 0

            if (currentDanger === 3 && prevDanger !== 3) {
                dangerMembers.push(name)
            }

            previousDangerStatesRef.current[name] = currentDanger
        })

        dangerMembers.forEach((name) => {
            sendLocalPushNotification("이탈 감지", `${name}님이 이탈했습니다.`)
        })

        try {
            const hostLocationData: HostLocationData = {
                host: {
                    lat: data.host?.lat || 0,
                    lon: data.host?.lon || 0,
                },
                distanceInfo: {
                    safe: data.distanceInfo?.safe || 100,
                    warning: data.distanceInfo?.warning || 200,
                    danger: data.distanceInfo?.danger || 300,
                },
                members:
                    data.members?.map((member: any) => ({
                        memberName: member.memberName || "Unknown",
                        lat: member.lat || 0,
                        lon: member.lon || 0,
                        distance: member.distance || 0,
                        danger: member.danger || 0,
                    })) || [],
            }

            setLocationData(hostLocationData)
            setError(null)
            setIsLoading(false)
        } catch (transformError) {
            console.error("❌ 호스트 데이터 변환 실패:", transformError)
            setError("위치 데이터 변환에 실패했습니다.")
            setIsLoading(false)
        }
    }

    const connectSocket = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        try {
            console.log("🔌 호스트 소켓 연결 시도 중...")
            const token = await authService.getStoredAccessToken()

            if (!token) {
                console.log("❌ 토큰이 없어 자동 로그아웃 처리")
                await authService.logout()
                onLogout()
                return
            }

            console.log("✅ 토큰 확인됨, 호스트 소켓 연결 중...")

            setIsLoading(true)
            setError(null)

            // 🔥 수정: socketService를 사용하고, 연결이 완료될 때까지 기다립니다.
            const socket = await socketService.connectAsHost()
            socketRef.current = socket

            // 데이터 수신 타임아웃 설정
            timeoutRef.current = setTimeout(() => {
                console.log(
                    "⏰ 데이터 수신 타임아웃 - 서버에서 위치 데이터를 받지 못했습니다"
                )
                setIsLoading(false)
                setError(
                    "위치 데이터를 받지 못했습니다. 새로고침을 시도해주세요."
                )
                timeoutRef.current = null
            }, 10000)

            // 🔥 수정: 소켓 연결 후 바로 서버에 초기 데이터 요청을 보냅니다. (느린 로딩 방지)
            console.log("📤 서버에 초기 데이터 요청 중...")
            socket.emit("requestData")

            // 🔥 수정: 재연결 시에도 데이터를 요청하도록 connect 리스너 등록
            socket.on("connect", () => {
                console.log(
                    "✅ 소켓 connected 이벤트 호출됨. 서버에 초기 데이터 요청 중..."
                )
                socket.emit("requestData")
            })

            // 🔥 수정: 데이터 리스너 등록
            socket.on("info", (data: any) => {
                console.log("📍 호스트 위치 데이터 수신 (info):", data)
                handleLocationData(data)
            })

            setSocketConnected(true)
            setIsLoading(false)
            setError(null)
            console.log("✅ 호스트 소켓 연결 성공")

            // 🔥 수정: socketService의 connection monitoring/error listener를 사용
            socketService.startConnectionMonitoring((connected: boolean) => {
                console.log("🔄 호스트 소켓 연결 상태 변경:", connected)
                setSocketConnected(connected)
                if (!connected) {
                    console.log("❌ 호스트 소켓 연결 끊김, 재연결 시도 중...")
                    setError("서버 연결이 끊어졌습니다.")
                    setTimeout(() => {
                        // socketService.disconnect()
                        // connectSocket()
                        // 재연결은 socket.io 내부 로직에 의존
                    }, 3000)
                } else {
                    console.log("✅ 호스트 소켓 재연결 성공")
                    setError(null)
                }
            })

            socketService.onError((error: any) => {
                console.error("❌ 호스트 소켓 에러:", error)
                setError(`소켓 에러: ${error?.message || "알 수 없는 오류"}`)
                setIsLoading(false)
            })
        } catch (error: any) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            console.error("❌ 호스트 소켓 연결 오류:", error)
            setSocketConnected(false)
            setIsLoading(false)
            setError(
                `연결 실패: ${error?.message || "서버에 연결할 수 없습니다"}`
            )

            setTimeout(() => {
                console.log("🔄 호스트 소켓 재연결 시도...")
                connectSocket()
            }, 2000)
        }
    }

    const handleRefresh = () => {
        console.log("🔄 호스트 수동 새로고침 실행")

        // 기존 연결 해제
        socketService.disconnect()

        setSocketConnected(false)
        setIsLoading(true)
        setError(null)

        connectSocket()
    }

    const getStatusColor = (danger: number) => {
        switch (danger) {
            case 0:
                return successColors[500]
            case 1:
                return warningColors[500]
            case 2:
                return dangerColors[500]
            case 3:
                return dangerColors[700]
            default:
                return grayColors[500]
        }
    }

    const getStatusText = (danger: number) => {
        switch (danger) {
            case 0:
                return "안전"
            case 1:
                return "경고"
            case 2:
                return "위험"
            case 3:
                return "이탈"
            default:
                return "확인중"
        }
    }

    const handleMemberNameChange = () => {
        if (!selectedMember || !newMemberName.trim()) {
            Alert.alert("오류", "새로운 이름을 입력해주세요.")
            return
        }

        updateMemberNameMutation.mutate({
            beforeName: selectedMember.memberName,
            afterName: newMemberName.trim(),
        })
    }

    const handleDistanceSettingsChange = () => {
        const { safe, warning, danger } = distanceSettings

        if (
            safe < 0 ||
            safe > 2000 ||
            warning < 0 ||
            warning > 2000 ||
            danger < 0 ||
            danger > 2000
        ) {
            Alert.alert("오류", "거리는 0 ~ 2000m 사이로 설정해야 합니다.")
            return
        }

        if (safe >= warning || warning >= danger) {
            Alert.alert("오류", "안전 < 경고 < 위험 순서로 설정해주세요.")
            return
        }

        updateDistanceSettingsMutation.mutate(distanceSettings)
    }

    const centerMapOnHost = () => {
        if (locationData && mapRef.current && mapReady) {
            mapRef.current.animateToRegion(
                {
                    latitude: locationData.host.lat,
                    longitude: locationData.host.lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                },
                1000
            )
        }
    }

    const handleLogout = async () => {
        Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
            { text: "취소", style: "cancel" },
            {
                text: "확인",
                onPress: async () => {
                    try {
                        if (socketRef.current) {
                            socketRef.current.disconnect()
                            socketRef.current = null
                        }
                        socketService.disconnect()

                        await authService.logout()
                        onLogout()
                    } catch (error) {
                        console.error("로그아웃 실패:", error)
                        Alert.alert("오류", "로그아웃 중 오류가 발생했습니다.")
                    }
                },
            },
        ])
    }

    const getInitialRegion = (): Region => {
        if (locationData) {
            if (locationData.members.length > 0) {
                const allLats = [
                    locationData.host.lat,
                    ...locationData.members.map((m) => m.lat),
                ]
                const allLons = [
                    locationData.host.lon,
                    ...locationData.members.map((m) => m.lon),
                ]

                const minLat = Math.min(...allLats)
                const maxLat = Math.max(...allLats)
                const minLon = Math.min(...allLons)
                const maxLon = Math.max(...allLons)

                const centerLat = (minLat + maxLat) / 2
                const centerLon = (minLon + maxLon) / 2
                const latDelta = (maxLat - minLat) * 1.5 || 0.01
                const lonDelta = (maxLon - minLon) * 1.5 || 0.01

                return {
                    latitude: centerLat,
                    longitude: centerLon,
                    latitudeDelta: Math.max(latDelta, 0.005),
                    longitudeDelta: Math.max(lonDelta, 0.005),
                }
            } else {
                return {
                    latitude: locationData.host.lat,
                    longitude: locationData.host.lon,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }
            }
        } else {
            return {
                latitude: 37.5665,
                longitude: 126.978,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }
        }
    }

    const dynamicStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? grayColors[950] : grayColors[50],
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 15,
            backgroundColor: isDark ? grayColors[900] : "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        title: {
            fontSize: 24,
            fontWeight: "bold",
            color: colors[500],
        },
        headerButtons: {
            flexDirection: "row",
            gap: 10,
        },
        headerButton: {
            padding: 8,
            backgroundColor: isDark ? grayColors[800] : grayColors[200],
            borderRadius: 20,
        },
        controlPanel: {
            flexDirection: "row",
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: isDark ? grayColors[900] : "white",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? grayColors[800] : grayColors[200],
            gap: 10,
        },
        controlButton: {
            flex: 1,
            backgroundColor: colors[500],
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        controlButtonText: {
            color: "white",
            fontSize: 14,
            fontWeight: "600",
        },
        statusRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: isDark ? grayColors[900] : "white",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? grayColors[800] : grayColors[200],
        },
        connectionStatus: {
            fontSize: 12,
            fontWeight: "500",
        },
        mapContainer: {
            flex: 1,
        },
        map: {
            flex: 1,
        },
        buttonContainer: {
            position: "absolute",
            bottom: 30,
            right: 20,
            gap: 10,
        },
        actionButton: {
            backgroundColor: colors[500],
            borderRadius: 25,
            width: 50,
            height: 50,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        },
        refreshButton: {
            backgroundColor: isDark ? grayColors[700] : grayColors[400],
        },
        allViewButton: {
            backgroundColor: isDark ? grayColors[600] : grayColors[500],
        },
        buttonText: {
            color: "white",
            fontSize: 20,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
        },
        modalContent: {
            backgroundColor: isDark ? grayColors[900] : "white",
            borderRadius: 12,
            padding: 20,
            width: width * 0.9,
            maxHeight: height * 0.8,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
            color: isDark ? grayColors[100] : grayColors[900],
        },
        memberItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 8,
            backgroundColor: isDark ? grayColors[800] : grayColors[100],
            borderRadius: 8,
        },
        memberInfo: {
            flex: 1,
        },
        memberName: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? grayColors[100] : grayColors[900],
        },
        memberDistance: {
            fontSize: 14,
            color: isDark ? grayColors[400] : grayColors[600],
            marginTop: 2,
        },
        statusBadge: {
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            marginLeft: 10,
        },
        statusText: {
            color: "white",
            fontSize: 12,
            fontWeight: "600",
        },
        input: {
            borderWidth: 1,
            borderColor: isDark ? grayColors[700] : grayColors[300],
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            backgroundColor: isDark ? grayColors[800] : "white",
            color: isDark ? grayColors[100] : grayColors[900],
            marginBottom: 16,
        },
        modalButtons: {
            flexDirection: "row",
            gap: 10,
            marginTop: 20,
        },
        modalButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        primaryButton: {
            backgroundColor: colors[500],
        },
        secondaryButton: {
            backgroundColor: isDark ? grayColors[700] : grayColors[300],
        },
        modalButtonText: {
            color: "white",
            fontSize: 16,
            fontWeight: "600",
        },
        settingItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        settingLabel: {
            fontSize: 16,
            color: isDark ? grayColors[300] : grayColors[700],
            flex: 1,
        },
        settingInput: {
            borderWidth: 1,
            borderColor: isDark ? grayColors[700] : grayColors[300],
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 16,
            backgroundColor: isDark ? grayColors[800] : "white",
            color: isDark ? grayColors[100] : grayColors[900],
            width: 80,
            textAlign: "center",
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        loadingText: {
            color: isDark ? grayColors[300] : grayColors[700],
            fontSize: 16,
            marginTop: 10,
        },
        errorContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
        },
        errorText: {
            color: dangerColors[500],
            fontSize: 16,
            textAlign: "center",
            marginBottom: 20,
        },
        retryButton: {
            backgroundColor: colors[500],
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
        },
        retryButtonText: {
            color: "white",
            fontSize: 16,
            fontWeight: "600",
        },
    })

    if (isLoading) {
        return (
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.title}>FLP 호스트</Text>
                    <TouchableOpacity
                        style={dynamicStyles.headerButton}
                        onPress={handleLogout}
                    >
                        <Text style={{ fontSize: 20 }}>
                            <Ionicons
                                name="exit-outline"
                                size={24}
                                color={
                                    isDark ? grayColors[100] : grayColors[800]
                                }
                            />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={dynamicStyles.loadingContainer}>
                    <Text style={dynamicStyles.loadingText}>
                        실시간 위치 데이터 연결 중...
                    </Text>
                    <TouchableOpacity
                        style={[dynamicStyles.retryButton, { marginTop: 20 }]}
                        onPress={() => {
                            setIsLoading(false)
                            setError("연결을 다시 시도해주세요.")
                        }}
                    >
                        <Text style={dynamicStyles.retryButtonText}>
                            연결 건너뛰기
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    if (error) {
        return (
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.title}>FLP 호스트</Text>
                    <TouchableOpacity
                        style={dynamicStyles.headerButton}
                        onPress={handleLogout}
                    >
                        <Text style={{ fontSize: 20 }}>
                            <Ionicons
                                name="exit-outline"
                                size={24}
                                color={
                                    isDark ? grayColors[100] : grayColors[800]
                                }
                            />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={dynamicStyles.errorContainer}>
                    <Text style={dynamicStyles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={dynamicStyles.retryButton}
                        onPress={handleRefresh}
                    >
                        <Text style={dynamicStyles.retryButtonText}>
                            다시 연결
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    if (!locationData && socketConnected) {
        return (
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.title}>FLP 호스트</Text>
                    <TouchableOpacity
                        style={dynamicStyles.headerButton}
                        onPress={handleLogout}
                    >
                        <Text style={{ fontSize: 20 }}>
                            <Ionicons
                                name="exit-outline"
                                size={24}
                                color={
                                    isDark ? grayColors[100] : grayColors[800]
                                }
                            />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={dynamicStyles.statusRow}>
                    <Text
                        style={[
                            dynamicStyles.connectionStatus,
                            {
                                color: isDark
                                    ? grayColors[400]
                                    : grayColors[600],
                            },
                        ]}
                    >
                        실시간 추적: 대기 중
                    </Text>
                    <Text
                        style={[
                            dynamicStyles.connectionStatus,
                            { color: successColors[500] },
                        ]}
                    >
                        🟢 실시간 연결
                    </Text>
                </View>
                <View style={dynamicStyles.loadingContainer}>
                    <Text style={dynamicStyles.loadingText}>
                        위치 데이터를 기다리는 중...
                    </Text>
                    <Text
                        style={[
                            dynamicStyles.loadingText,
                            { fontSize: 12, marginTop: 10 },
                        ]}
                    >
                        멤버 기기가 연결되면 자동으로 표시됩니다.
                    </Text>
                </View>
            </View>
        )
    }

    if (!locationData) {
        return (
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.title}>FLP 호스트</Text>
                    <TouchableOpacity
                        style={dynamicStyles.headerButton}
                        onPress={handleLogout}
                    >
                        <Text style={{ fontSize: 20 }}>
                            <Ionicons
                                name="exit-outline"
                                size={24}
                                color={
                                    isDark ? grayColors[100] : grayColors[800]
                                }
                            />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={dynamicStyles.loadingContainer}>
                    <Text style={dynamicStyles.loadingText}>
                        위치 데이터를 기다리는 중...
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View style={dynamicStyles.container}>
            <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.title}>FLP 호스트</Text>
                <TouchableOpacity
                    style={dynamicStyles.headerButton}
                    onPress={handleLogout}
                >
                    <Text style={{ fontSize: 20 }}>
                        <Ionicons
                            name="exit-outline"
                            size={24}
                            color={isDark ? grayColors[100] : grayColors[800]}
                        />
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={dynamicStyles.controlPanel}>
                <TouchableOpacity
                    style={dynamicStyles.controlButton}
                    onPress={() => setShowMemberList(true)}
                >
                    <Text style={dynamicStyles.controlButtonText}>
                        멤버 목록 ({locationData.members.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={dynamicStyles.controlButton}
                    onPress={() => setShowDistanceSettings(true)}
                >
                    <Text style={dynamicStyles.controlButtonText}>
                        거리 설정
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={dynamicStyles.statusRow}>
                <Text
                    style={[
                        dynamicStyles.connectionStatus,
                        { color: isDark ? grayColors[400] : grayColors[600] },
                    ]}
                >
                    실시간 추적: {locationData.members.length}개 기기
                </Text>
                <Text
                    style={[
                        dynamicStyles.connectionStatus,
                        {
                            color: socketConnected
                                ? successColors[500]
                                : dangerColors[500],
                        },
                    ]}
                >
                    {socketConnected ? "🟢" : "🔴"}
                </Text>
            </View>

            <View style={dynamicStyles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={dynamicStyles.map}
                    initialRegion={getInitialRegion()}
                    onMapReady={() => setMapReady(true)}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    loadingEnabled={true}
                >
                    <Marker
                        coordinate={{
                            latitude: locationData.host.lat,
                            longitude: locationData.host.lon,
                        }}
                        title="호스트 (나)"
                        pinColor={colors[500]}
                    />

                    {locationData.members.map((member, index) => (
                        <Marker
                            key={`${mapRenderKey}-${member.lat}-${member.lon}`}
                            coordinate={{
                                latitude: member.lat,
                                longitude: member.lon,
                            }}
                            title={member.memberName}
                            description={`거리: ${member.distance.toFixed(
                                1
                            )}m | 상태: ${getStatusText(member.danger)}`}
                            pinColor={getStatusColor(member.danger)}
                        />
                    ))}

                    <Circle
                        center={{
                            latitude: locationData.host.lat,
                            longitude: locationData.host.lon,
                        }}
                        radius={locationData.distanceInfo.safe}
                        fillColor={`${successColors[500]}20`}
                        strokeColor={successColors[500]}
                        strokeWidth={2}
                    />

                    <Circle
                        center={{
                            latitude: locationData.host.lat,
                            longitude: locationData.host.lon,
                        }}
                        radius={locationData.distanceInfo.warning}
                        fillColor={`${warningColors[500]}15`}
                        strokeColor={warningColors[500]}
                        strokeWidth={2}
                    />

                    <Circle
                        center={{
                            latitude: locationData.host.lat,
                            longitude: locationData.host.lon,
                        }}
                        radius={locationData.distanceInfo.danger}
                        fillColor={`${dangerColors[500]}10`}
                        strokeColor={dangerColors[500]}
                        strokeWidth={2}
                    />
                </MapView>

                <View style={dynamicStyles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            dynamicStyles.actionButton,
                            dynamicStyles.refreshButton,
                        ]}
                        onPress={handleRefresh}
                    >
                        <Text style={dynamicStyles.buttonText}>
                            <Ionicons name="refresh" size={24} color="white" />
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={dynamicStyles.actionButton}
                        onPress={centerMapOnHost}
                    >
                        <Text style={dynamicStyles.buttonText}>
                            <Ionicons
                                name="pin-sharp"
                                size={24}
                                color="white"
                            />
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showMemberList}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMemberList(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={dynamicStyles.modalContent}>
                        <Text style={dynamicStyles.modalTitle}>멤버 목록</Text>
                        <ScrollView style={{ maxHeight: height * 0.5 }}>
                            {locationData.members.map((member, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={dynamicStyles.memberItem}
                                    onPress={() => {
                                        setSelectedMember(member)
                                        setNewMemberName(member.memberName)
                                        setShowMemberList(false)
                                    }}
                                >
                                    <View style={dynamicStyles.memberInfo}>
                                        <Text style={dynamicStyles.memberName}>
                                            {member.memberName}
                                        </Text>
                                        <Text
                                            style={dynamicStyles.memberDistance}
                                        >
                                            거리: {member.distance.toFixed(1)}m
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            dynamicStyles.statusBadge,
                                            {
                                                backgroundColor: getStatusColor(
                                                    member.danger
                                                ),
                                            },
                                        ]}
                                    >
                                        <Text style={dynamicStyles.statusText}>
                                            {getStatusText(member.danger)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={dynamicStyles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.modalButton,
                                    dynamicStyles.secondaryButton,
                                ]}
                                onPress={() => setShowMemberList(false)}
                            >
                                <Text style={dynamicStyles.modalButtonText}>
                                    닫기
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={selectedMember !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setSelectedMember(null)
                    setNewMemberName("")
                }}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={dynamicStyles.modalContent}>
                        <Text style={dynamicStyles.modalTitle}>
                            멤버 이름 변경
                        </Text>
                        <Text
                            style={[
                                dynamicStyles.memberName,
                                { textAlign: "center", marginBottom: 20 },
                            ]}
                        >
                            현재 이름: {selectedMember?.memberName}
                        </Text>
                        <TextInput
                            style={dynamicStyles.input}
                            value={newMemberName}
                            onChangeText={setNewMemberName}
                            placeholder="새로운 이름을 입력하세요"
                            placeholderTextColor={
                                isDark ? grayColors[500] : grayColors[400]
                            }
                        />
                        <View style={dynamicStyles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.modalButton,
                                    dynamicStyles.secondaryButton,
                                ]}
                                onPress={() => {
                                    setSelectedMember(null)
                                    setNewMemberName("")
                                }}
                            >
                                <Text style={dynamicStyles.modalButtonText}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.modalButton,
                                    dynamicStyles.primaryButton,
                                ]}
                                onPress={handleMemberNameChange}
                                disabled={updateMemberNameMutation.isPending}
                            >
                                <Text style={dynamicStyles.modalButtonText}>
                                    {updateMemberNameMutation.isPending
                                        ? "변경 중..."
                                        : "변경"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showDistanceSettings}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDistanceSettings(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={dynamicStyles.modalContent}>
                        <Text style={dynamicStyles.modalTitle}>거리 설정</Text>

                        <View style={dynamicStyles.settingItem}>
                            <Text style={dynamicStyles.settingLabel}>
                                안전 거리 (m)
                            </Text>
                            <TextInput
                                style={dynamicStyles.settingInput}
                                value={distanceSettings.safe.toString()}
                                onChangeText={(text) =>
                                    setDistanceSettings({
                                        ...distanceSettings,
                                        safe: Number.parseInt(text) || 0,
                                    })
                                }
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={dynamicStyles.settingItem}>
                            <Text style={dynamicStyles.settingLabel}>
                                경고 거리 (m)
                            </Text>
                            <TextInput
                                style={dynamicStyles.settingInput}
                                value={distanceSettings.warning.toString()}
                                onChangeText={(text) =>
                                    setDistanceSettings({
                                        ...distanceSettings,
                                        warning: Number.parseInt(text) || 0,
                                    })
                                }
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={dynamicStyles.settingItem}>
                            <Text style={dynamicStyles.settingLabel}>
                                위험 거리 (m)
                            </Text>
                            <TextInput
                                style={dynamicStyles.settingInput}
                                value={distanceSettings.danger.toString()}
                                onChangeText={(text) =>
                                    setDistanceSettings({
                                        ...distanceSettings,
                                        danger: Number.parseInt(text) || 0,
                                    })
                                }
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={dynamicStyles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.modalButton,
                                    dynamicStyles.secondaryButton,
                                ]}
                                onPress={() => setShowDistanceSettings(false)}
                            >
                                <Text style={dynamicStyles.modalButtonText}>
                                    취소
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.modalButton,
                                    dynamicStyles.primaryButton,
                                ]}
                                onPress={handleDistanceSettingsChange}
                                disabled={
                                    updateDistanceSettingsMutation.isPending
                                }
                            >
                                <Text style={dynamicStyles.modalButtonText}>
                                    {updateDistanceSettingsMutation.isPending
                                        ? "저장 중..."
                                        : "저장"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
