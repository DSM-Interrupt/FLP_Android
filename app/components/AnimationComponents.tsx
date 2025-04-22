import {
    Animated,
    TextInput,
    TouchableOpacity as NativeTouchable,
} from "react-native"
import {
    ScrollView as NativeScroll,
    TouchableWithoutFeedback as NativeTouchableWithoutFeedback,
} from "react-native-gesture-handler"

export const View = Animated.View
export const NativeText = Animated.Text
export const ScrollView = Animated.createAnimatedComponent(NativeScroll)
export const TouchableOpacity =
    Animated.createAnimatedComponent(NativeTouchable)
export const TouchableWithoutFeedback = Animated.createAnimatedComponent(
    NativeTouchableWithoutFeedback
)
export const NativeInput = Animated.createAnimatedComponent(TextInput)
