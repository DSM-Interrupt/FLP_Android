import {
    StyleSheet,
    View,
    Text,
    TextInput as NativeInput,
    KeyboardTypeOptions,
} from "react-native"
import { colorTable, fontTable } from "../../constants"
import { View as AnimView } from "../AnimationComponents"
import { useState } from "react"
import Ionicons from "@expo/vector-icons/Ionicons"

interface props {
    label?: string
    placeholder?: string
    password?: boolean
    disabled?: boolean
    value?: string
    id?: string
    onChange?: (text: string, id: string) => void
    type?: KeyboardTypeOptions
}

function TextInput({
    label,
    placeholder,
    password,
    disabled,
    value,
    id,
    onChange,
    type = "default",
}: props) {
    const [show, setShow] = useState<boolean>(false)

    const handleChange = (text: string) => {
        if (onChange && id) {
            onChange(text, id)
        }
    }

    return (
        <>
            <View style={styles.container}>
                {label && (
                    <Text style={{ ...fontTable["label"][1] }}>{label}</Text>
                )}
                <AnimView style={styles.inputContainer}>
                    <NativeInput
                        value={value}
                        placeholder={placeholder}
                        secureTextEntry={!!password && !show}
                        editable={!!!disabled}
                        style={styles.input}
                        id={id}
                        onChangeText={handleChange}
                        keyboardType={type}
                    />
                    {password && (
                        <View style={styles.icon}>
                            <Ionicons
                                name={show ? "eye" : "eye-off"}
                                onPress={() => setShow(!show)}
                                size={18}
                                color={`${colorTable["gray"]["light"]["500"]}`}
                            />
                        </View>
                    )}
                </AnimView>
            </View>
        </>
    )
}

export default TextInput

const styles = StyleSheet.create({
    container: {
        gap: 4,
        width: "100%",
    },
    inputContainer: {
        width: "100%",
        height: 50,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        borderColor: `${colorTable["main"]["light"][600]}`,
        borderWidth: 1,
    },
    input: {
        verticalAlign: "top",
        fontSize: 14,
        fontFamily: "Regular",
        width: "100%",
        flexShrink: 1,
    },
    icon: {
        width: 40,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        color: `${colorTable["gray"]["light"]["500"]}`,
    },
})
