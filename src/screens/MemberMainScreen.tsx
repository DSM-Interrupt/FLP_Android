import type React from "react"
import { useEffect, useState, useRef } from "react"
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Dimensions,
} from "react-native"
import MapView, { Marker, Circle, type Region } from "react-native-maps"
import { useTheme } from "../contexts/ThemeContext"
import { colorTable } from "../styles/colorTable"
import { socketService } from "../services/socket"
import { authService } from "../services/auth"
import { io } from "socket.io-client"
import Ionicons from "@expo/vector-icons/Ionicons"
import { sendLocalPushNotification } from "../utils/push"

const { width, height } = Dimensions.get("window")

interface MemberLocationData {
    danger: number
    distanceInfo: {
        safe: number
        warning: number
        danger: number
    }
    distance: number
    host: {
        lat: number
        lon: number
    }
    member: {
        lat: number
        lon: number
    }
}

export const MemberMainScreen: React.FC = () => {
    const { theme, isDark, systemTheme } = useTheme()

    const colors = colorTable.main[theme]
    const grayColors = colorTable.gray[theme]
    const dangerColors = colorTable.danger[theme]
    const warningColors = colorTable.warning[theme]
    const successColors = colorTable.success[theme]

    const mapRef = useRef<MapView>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const socketRef = useRef<any>(null)

    const [locationData, setLocationData] = useState<MemberLocationData | null>(
        null
    )
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)

    const previousDangerRef = useRef<number | null>(null)

    useEffect(() => {
        if (locationData) {
            const currentDanger = locationData.danger
            const previousDanger = previousDangerRef.current

            if (currentDanger === 3 && previousDanger !== 3) {
                sendLocalPushNotification(
                    "이탈 감지",
                    "지정된 구역을 벗어났습니다."
                )
            }

            previousDangerRef.current = currentDanger
        }
    }, [locationData])

    useEffect(() => {
        connectSocket()
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            socketService.removeAllListeners()
            socketService.disconnect()
        }
    }, [])

    const connectSocket = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        try {
            console.log("🔌 멤버 소켓 연결 시도 중...")
            const token = await authService.getStoredAccessToken()

            if (!token) {
                console.log("❌ 토큰이 없어 소켓 연결 실패")
                setSocketConnected(false)
                setIsLoading(false)
                setError("인증 토큰이 없습니다.")
                return
            }

            console.log("✅ 토큰 확인됨, 멤버 소켓 연결 중...")

            timeoutRef.current = setTimeout(() => {
                console.log("⏰ 소켓 연결 타임아웃")
                setIsLoading(false)
                if (!socketConnected) {
                    setError("서버 연결 시간이 초과되었습니다.")
                }
                timeoutRef.current = null
            }, 10000)

            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            const socket = io(`wss://flp24.com/member/location`, {
                query: {
                    Authorization: `Bearer ${token}`,
                },
                transports: ["websocket"],
                forceNew: true,
            })

            socketRef.current = socket

            await new Promise((resolve, reject) => {
                socket.on("connect", () => {
                    console.log("✅ 멤버 소켓 연결 성공 (직접 연결)")
                    resolve(socket)
                })

                socket.on("connect_error", (error) => {
                    console.error("❌ 멤버 소켓 연결 실패:", error)
                    reject(error)
                })
            })

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            setSocketConnected(true)
            setIsLoading(false)
            setError(null)
            console.log("✅ 멤버 소켓 연결 성공")

            socket.on("info", (data: any) => {
                console.log("📍 멤버 위치 데이터 수신 (info):", data)

                try {
                    const memberLocationData: MemberLocationData = {
                        danger: data.danger || 0,
                        distanceInfo: {
                            safe: data.distanceInfo?.safe || 100,
                            warning: data.distanceInfo?.warning || 200,
                            danger: data.distanceInfo?.danger || 300,
                        },
                        distance: data.distance || 0,
                        host: {
                            lat: data.host?.lat || 0,
                            lon: data.host?.lon || 0,
                        },
                        member: {
                            lat: data.member?.lat || 0,
                            lon: data.member?.lon || 0,
                        },
                    }

                    setLocationData(memberLocationData)
                    setError(null)
                } catch (transformError) {
                    console.error("❌ 멤버 데이터 변환 실패:", transformError)
                    setError("위치 데이터 변환에 실패했습니다.")
                }
            })

            socketService.startConnectionMonitoring((connected: boolean) => {
                console.log("🔄 멤버 소켓 연결 상태 변경:", connected)
                setSocketConnected(connected)
                if (!connected) {
                    console.log("❌ 멤버 소켓 연결 끊김, 재연결 시도 중...")
                    setError("서버 연결이 끊어졌습니다.")
                    setTimeout(() => {
                        connectSocket()
                    }, 3000)
                } else {
                    console.log("✅ 멤버 소켓 재연결 성공")
                    setError(null)
                }
            })

            socketService.onError((error: any) => {
                console.error("❌ 멤버 소켓 에러:", error)
                setError(`소켓 에러: ${error?.message || "알 수 없는 오류"}`)
                setIsLoading(false)
            })
        } catch (error: any) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            console.error("❌ 멤버 소켓 연결 오류:", error)
            setSocketConnected(false)
            setIsLoading(false)
            setError(`연결 실패: ${error?.message || "알 수 없는 오류"}`)

            setTimeout(() => {
                console.log("🔄 멤버 소켓 재연결 시도...")
                connectSocket()
            }, 3000)
        }
    }

    const handleRefresh = () => {
        console.log("🔄 멤버 수동 새로고침 실행")

        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }

        setSocketConnected(false)
        setIsLoading(true)
        setError(null)

        connectSocket()
    }

    const getStatusMessage = (danger: number) => {
        switch (danger) {
            case 0:
                return { text: "안전 구역", color: successColors[500] }
            case 1:
                return { text: "경고 구역", color: warningColors[500] }
            case 2:
                return { text: "위험 구역", color: dangerColors[500] }
            case 3:
                return { text: "이탈 상태", color: dangerColors[700] }
            default:
                return { text: "상태 확인 중", color: grayColors[500] }
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
                    } catch (error) {
                        console.error("로그아웃 실패:", error)
                        Alert.alert("오류", "로그아웃 중 오류가 발생했습니다.")
                    }
                },
            },
        ])
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

    const getInitialRegion = (): Region => {
        if (locationData) {
            const centerLat =
                (locationData.host.lat + locationData.member.lat) / 2
            const centerLon =
                (locationData.host.lon + locationData.member.lon) / 2

            const latDelta =
                Math.abs(locationData.host.lat - locationData.member.lat) *
                    1.5 || 0.01
            const lonDelta =
                Math.abs(locationData.host.lon - locationData.member.lon) *
                    1.5 || 0.01

            return {
                latitude: centerLat,
                longitude: centerLon,
                latitudeDelta: Math.max(latDelta, 0.005),
                longitudeDelta: Math.max(lonDelta, 0.005),
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
        systemThemeIndicator: {
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: isDark ? grayColors[800] : grayColors[200],
            borderRadius: 12,
        },
        systemThemeText: {
            fontSize: 10,
            color: isDark ? grayColors[400] : grayColors[600],
            textAlign: "center",
        },
        statusContainer: {
            backgroundColor: isDark ? grayColors[900] : "white",
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? grayColors[800] : grayColors[200],
        },
        statusRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        statusText: {
            fontSize: 18,
            fontWeight: "600",
        },
        connectionStatus: {
            fontSize: 12,
            fontWeight: "500",
        },
        distanceText: {
            fontSize: 14,
            textAlign: "center",
            marginTop: 5,
            color: isDark ? grayColors[400] : grayColors[600],
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
                    <Text style={dynamicStyles.title}>FLP 멤버</Text>
                    <View style={dynamicStyles.headerButtons}>
                        <TouchableOpacity
                            style={dynamicStyles.headerButton}
                            onPress={handleLogout}
                        >
                            <Text style={{ fontSize: 20 }}>
                                <Ionicons
                                    name="exit-outline"
                                    size={24}
                                    color={
                                        isDark
                                            ? grayColors[100]
                                            : grayColors[800]
                                    }
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                    <Text style={dynamicStyles.title}>FLP 멤버</Text>
                    <View style={dynamicStyles.headerButtons}>
                        <View style={dynamicStyles.systemThemeIndicator}></View>
                        <TouchableOpacity
                            style={dynamicStyles.headerButton}
                            onPress={handleLogout}
                        >
                            <Text style={{ fontSize: 20 }}>
                                <Ionicons
                                    name="exit-outline"
                                    size={24}
                                    color={
                                        isDark
                                            ? grayColors[100]
                                            : grayColors[800]
                                    }
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
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
                    <Text style={dynamicStyles.title}>FLP 멤버</Text>
                    <View style={dynamicStyles.headerButtons}>
                        <TouchableOpacity
                            style={dynamicStyles.headerButton}
                            onPress={handleLogout}
                        >
                            <Text style={{ fontSize: 20 }}>
                                <Ionicons
                                    name="exit-outline"
                                    size={24}
                                    color={
                                        isDark
                                            ? grayColors[100]
                                            : grayColors[800]
                                    }
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={dynamicStyles.statusContainer}>
                    <View style={dynamicStyles.statusRow}>
                        <Text
                            style={[
                                dynamicStyles.statusText,
                                { color: grayColors[500] },
                            ]}
                        >
                            대기 중
                        </Text>
                        <Text
                            style={[
                                dynamicStyles.connectionStatus,
                                { color: successColors[500] },
                            ]}
                        >
                            🟢
                        </Text>
                    </View>
                    <Text style={dynamicStyles.distanceText}>
                        호스트 연결을 기다리는 중...
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
                        호스트가 추적을 시작하면 자동으로 표시됩니다.
                    </Text>
                </View>
            </View>
        )
    }

    if (!locationData) {
        return (
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <Text style={dynamicStyles.title}>FLP 멤버</Text>
                    <View style={dynamicStyles.headerButtons}>
                        <TouchableOpacity
                            style={dynamicStyles.headerButton}
                            onPress={handleLogout}
                        >
                            <Text style={{ fontSize: 20 }}>🚪</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={dynamicStyles.loadingContainer}>
                    <Text style={dynamicStyles.loadingText}>
                        위치 데이터를 기다리는 중...
                    </Text>
                </View>
            </View>
        )
    }

    const statusInfo = getStatusMessage(locationData.danger)

    return (
        <View style={dynamicStyles.container}>
            <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.title}>FLP 멤버</Text>
                <View style={dynamicStyles.headerButtons}>
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
            </View>

            <View style={dynamicStyles.statusContainer}>
                <View style={dynamicStyles.statusRow}>
                    <Text
                        style={[
                            dynamicStyles.statusText,
                            { color: statusInfo.color },
                        ]}
                    >
                        {statusInfo.text}
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
                <Text style={dynamicStyles.distanceText}>
                    호스트와 기기 간 거리: {locationData.distance.toFixed(1)}m
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
                        title="호스트"
                        description="호스트의 현재 위치"
                        pinColor={colors[500]}
                    />

                    <Marker
                        coordinate={{
                            latitude: locationData.member.lat,
                            longitude: locationData.member.lon,
                        }}
                        title="추적 기기"
                        description="멤버 기기의 현재 위치"
                        pinColor={statusInfo.color}
                    />

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
        </View>
    )
}
