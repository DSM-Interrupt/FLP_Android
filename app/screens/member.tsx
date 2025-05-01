import Map from "../components/Map"
import Notice from "../components/notice"

function Member() {
    const warning = [
        "현재 안전 구역입니다. 멀리 가지 않도록 주의하세요.",
        "현재 주의 구역입니다. 구역을 넘어가지 않도록 주의하세요.",
        "현재 경고 구역입니다. 위치를 벗어나지 않도록 안전 구역으로 돌아가주세요.",
    ]

    return (
        <>
            <Notice text={warning[0]} />
            <Map />
        </>
    )
}

export default Member
