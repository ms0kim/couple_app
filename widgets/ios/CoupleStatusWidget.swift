import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct PartnerStatus: Codable {
    let name: String
    let status: String
    let emotion: String
    let customMessage: String
    let characterType: String
    let updatedAt: Date

    static let placeholder = PartnerStatus(
        name: "파트너",
        status: "available",
        emotion: "happy",
        customMessage: "",
        characterType: "female",
        updatedAt: Date()
    )
}

// MARK: - Status Helpers
struct StatusInfo {
    static let statusEmoji: [String: String] = [
        "available": "😊",
        "busy": "😰",
        "studying": "📚",
        "working": "💻",
        "sleeping": "😴",
        "eating": "🍽️",
        "exercising": "🏃",
        "custom": "✨"
    ]

    static let statusLabel: [String: String] = [
        "available": "여유있음",
        "busy": "바쁨",
        "studying": "공부중",
        "working": "일하는중",
        "sleeping": "자는중",
        "eating": "밥먹는중",
        "exercising": "운동중",
        "custom": "직접입력"
    ]

    static let statusColor: [String: Color] = [
        "available": .green,
        "busy": .orange,
        "studying": .blue,
        "working": .purple,
        "sleeping": .indigo,
        "eating": .yellow,
        "exercising": .red,
        "custom": .pink
    ]

    static func emoji(for status: String) -> String {
        statusEmoji[status] ?? "😊"
    }

    static func label(for status: String) -> String {
        statusLabel[status] ?? status
    }

    static func color(for status: String) -> Color {
        statusColor[status] ?? .gray
    }
}

// MARK: - Timeline Provider
struct CoupleStatusProvider: TimelineProvider {
    // App Group ID - 앱과 동일하게 설정 필요
    let appGroupId = "group.com.yourapp.couplestatus"

    func placeholder(in context: Context) -> CoupleStatusEntry {
        CoupleStatusEntry(date: Date(), partnerStatus: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (CoupleStatusEntry) -> Void) {
        let entry = CoupleStatusEntry(date: Date(), partnerStatus: loadPartnerStatus())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CoupleStatusEntry>) -> Void) {
        let currentDate = Date()
        let partnerStatus = loadPartnerStatus()

        let entry = CoupleStatusEntry(date: currentDate, partnerStatus: partnerStatus)

        // 15분마다 자동 갱신
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }

    // App Group의 UserDefaults에서 파트너 상태 로드
    private func loadPartnerStatus() -> PartnerStatus {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let data = userDefaults.data(forKey: "partnerStatus"),
              let status = try? JSONDecoder().decode(PartnerStatus.self, from: data) else {
            return .placeholder
        }
        return status
    }
}

// MARK: - Timeline Entry
struct CoupleStatusEntry: TimelineEntry {
    let date: Date
    let partnerStatus: PartnerStatus
}

// MARK: - Widget View
struct CoupleStatusWidgetEntryView: View {
    var entry: CoupleStatusProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget View
struct SmallWidgetView: View {
    let entry: CoupleStatusEntry

    var body: some View {
        ZStack {
            // 배경 그라데이션
            LinearGradient(
                gradient: Gradient(colors: [
                    StatusInfo.color(for: entry.partnerStatus.status).opacity(0.3),
                    StatusInfo.color(for: entry.partnerStatus.status).opacity(0.1)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 8) {
                // 캐릭터 + 상태 이모지
                ZStack {
                    Circle()
                        .fill(StatusInfo.color(for: entry.partnerStatus.status).opacity(0.2))
                        .frame(width: 60, height: 60)

                    Text(entry.partnerStatus.characterType == "male" ? "👨" : "👩")
                        .font(.system(size: 32))

                    // 상태 배지
                    Text(StatusInfo.emoji(for: entry.partnerStatus.status))
                        .font(.system(size: 16))
                        .padding(4)
                        .background(Color.white)
                        .clipShape(Circle())
                        .offset(x: 20, y: 20)
                }

                // 이름
                Text(entry.partnerStatus.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)

                // 상태
                Text(StatusInfo.label(for: entry.partnerStatus.status))
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)

                // 마지막 업데이트
                Text(timeAgoString(from: entry.partnerStatus.updatedAt))
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
            .padding()
        }
    }

    func timeAgoString(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)

        if interval < 60 {
            return "방금 전"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes)분 전"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "\(hours)시간 전"
        } else {
            let days = Int(interval / 86400)
            return "\(days)일 전"
        }
    }
}

// MARK: - Medium Widget View
struct MediumWidgetView: View {
    let entry: CoupleStatusEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    StatusInfo.color(for: entry.partnerStatus.status).opacity(0.3),
                    StatusInfo.color(for: entry.partnerStatus.status).opacity(0.1)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 16) {
                // 캐릭터
                ZStack {
                    Circle()
                        .fill(StatusInfo.color(for: entry.partnerStatus.status).opacity(0.2))
                        .frame(width: 80, height: 80)

                    Text(entry.partnerStatus.characterType == "male" ? "👨" : "👩")
                        .font(.system(size: 44))

                    Text(StatusInfo.emoji(for: entry.partnerStatus.status))
                        .font(.system(size: 20))
                        .padding(6)
                        .background(Color.white)
                        .clipShape(Circle())
                        .offset(x: 28, y: 28)
                }

                VStack(alignment: .leading, spacing: 4) {
                    // 이름
                    Text(entry.partnerStatus.name)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.primary)

                    // 상태
                    HStack {
                        Text(StatusInfo.emoji(for: entry.partnerStatus.status))
                        Text(StatusInfo.label(for: entry.partnerStatus.status))
                            .font(.system(size: 16, weight: .medium))
                    }
                    .foregroundColor(StatusInfo.color(for: entry.partnerStatus.status))

                    // 커스텀 메시지
                    if !entry.partnerStatus.customMessage.isEmpty {
                        Text("\"\(entry.partnerStatus.customMessage)\"")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    // 마지막 업데이트
                    HStack {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                        Text(timeAgoString(from: entry.partnerStatus.updatedAt))
                            .font(.system(size: 11))
                    }
                    .foregroundColor(.gray)
                }

                Spacer()
            }
            .padding()
        }
    }

    func timeAgoString(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)

        if interval < 60 {
            return "방금 전"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes)분 전"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "\(hours)시간 전"
        } else {
            let days = Int(interval / 86400)
            return "\(days)일 전"
        }
    }
}

// MARK: - Widget Configuration
@main
struct CoupleStatusWidget: Widget {
    let kind: String = "CoupleStatusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CoupleStatusProvider()) { entry in
            CoupleStatusWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("파트너 상태")
        .description("파트너의 현재 상태를 확인하세요")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview
struct CoupleStatusWidget_Previews: PreviewProvider {
    static var previews: some View {
        CoupleStatusWidgetEntryView(
            entry: CoupleStatusEntry(
                date: Date(),
                partnerStatus: PartnerStatus(
                    name: "파트너",
                    status: "studying",
                    emotion: "happy",
                    customMessage: "열심히 공부 중! 💪",
                    characterType: "female",
                    updatedAt: Date().addingTimeInterval(-1800) // 30분 전
                )
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemSmall))

        CoupleStatusWidgetEntryView(
            entry: CoupleStatusEntry(
                date: Date(),
                partnerStatus: PartnerStatus(
                    name: "파트너",
                    status: "studying",
                    emotion: "happy",
                    customMessage: "열심히 공부 중! 💪",
                    characterType: "female",
                    updatedAt: Date().addingTimeInterval(-1800)
                )
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
