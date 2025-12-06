// Màn hình ONBOARDING: chào mừng + nhập email + hướng dẫn đo
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
} from 'react-native';
// Icon trái tim, icon mail, icon activity từ lucide-react-native
import { Activity, Heart, Mail } from 'lucide-react-native';

// Props nhận từ App.tsx
type Props = {
  relativeEmail: string; // Giá trị email hiện tại
  setRelativeEmail: (val: string) => void; // Hàm cập nhật email khi user nhập
};

const OnboardingScreen: React.FC<Props> = ({
  relativeEmail,
  setRelativeEmail,
}) => {
  return (
    <ScrollView
      style={{ flex: 1 }} // Chiếm toàn bộ chiều cao màn hình
      contentContainerStyle={{ paddingBottom: 24 }} // Thêm khoảng trống phía dưới để không bị cấn khi scroll
    >
      {/* ---------------- HERO CHÀO MỪNG ---------------- */}
      <View style={styles.heroCard}>
        {/* Phần text bên trái */}
        <View style={styles.heroLeft}>
          <Text style={styles.heroTitle}>Chào mừng đến PicoBP 💙</Text>
          <Text style={styles.heroSubtitle}>
            Ứng dụng hỗ trợ theo dõi huyết áp với thiết bị đo ESP32 kết nối trực
            tiếp qua USB.
          </Text>
        </View>

        {/* Avatar tròn bên phải, chứa icon trái tim */}
        <View style={styles.heroAvatar}>
          <Heart size={30} color="#ec4899" />
        </View>
      </View>

      {/* ---------------- EMAIL NGƯỜI DÙNG / NGƯỜI THÂN ---------------- */}
      <View style={styles.sectionCard}>
        {/* Header nhỏ: icon + title */}
        <View style={styles.sectionHeaderRow}>
          <Mail size={18} color="#0f766e" />
          <Text style={styles.sectionTitle}>
            Email của bạn / người thân (tùy chọn)
          </Text>
        </View>

        {/* Giải thích ý nghĩa email */}
        <Text style={styles.sectionText}>
          Bạn có thể nhập{' '}
          <Text style={{ fontWeight: '700' }}>
            email của bạn hoặc người thân
          </Text>{' '}
          để sau này nhận thông báo khi huyết áp bất thường.
        </Text>
        <Text style={[styles.sectionText, { marginTop: 4 }]}>
          Nếu không muốn dùng chức năng này, bạn có thể bỏ trống và tiếp tục sử
          dụng app bình thường.
        </Text>

        {/* Ô nhập email */}
        <TextInput
          placeholder="ví dụ: meba@gmail.com" // Gợi ý format email
          placeholderTextColor="#9ca3af" // Màu chữ placeholder
          style={styles.input}
          value={relativeEmail} // Giá trị hiện tại trong state
          onChangeText={setRelativeEmail} // Khi gõ → cập nhật state bên ngoài
          keyboardType="email-address" // Bàn phím kiểu email (có @, .com,…)
          autoCapitalize="none" // Không tự động viết hoa
        />

        {/* Ghi chú nhỏ về bảo mật / lưu trữ */}
        <Text style={styles.helperText}>
          * Email hiện chỉ được lưu cục bộ trên máy bạn và dùng cho các tính
          năng cảnh báo sức khỏe ở phiên bản sau.
        </Text>
      </View>

      {/* ---------------- HƯỚNG DẪN ĐO HUYẾT ÁP ---------------- */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Activity size={18} color="#0f766e" />
          <Text style={styles.sectionTitle}>Cách thức đo huyết áp</Text>
        </View>

        {/* Render danh sách các bước hướng dẫn động từ mảng */}
        {[
          'Cắm ESP32 vào điện thoại bằng cáp OTG. Khi hiện popup xin quyền USB, chọn OK/Allow.',
          'Ngồi trên ghế, lưng tựa, tay đặt ngang tim, thư giãn và không nói chuyện trong lúc đo.',
          'Chuyển sang tab “ĐO USB” và nhấn nút “Bắt đầu đo qua USB”.',
          'Chờ kết quả SYS/DIA, MAP và nhịp tim hiển thị. Nếu chỉ số quá cao, ứng dụng sẽ đưa ra cảnh báo.',
        ].map((text, idx) => (
          <View key={idx} style={styles.stepRow}>
            {/* Vòng tròn màu hồng hiển thị số thứ tự 1,2,3,4... */}
            <View style={styles.stepBullet}>
              <Text style={styles.stepNumber}>{idx + 1}</Text>
            </View>
            {/* Nội dung từng bước */}
            <Text style={styles.sectionText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Card chào mừng trên cùng
  heroCard: {
    flexDirection: 'row', // Text + avatar xếp ngang → đổi 'column' nếu muốn avatar dưới
    backgroundColor: '#0ea5e9', // Nền xanh da trời
    borderRadius: 20, // Bo góc card
    padding: 16, // Khoảng cách trong card
    marginBottom: 14, // Cách dưới 14px
    alignItems: 'center', // Căn các item theo trục dọc (trung tâm)
  },
  heroLeft: {
    flex: 1, // Chiếm hết phần còn lại bên trái
  },
  heroTitle: {
    fontSize: 18, // Cỡ chữ tiêu đề
    fontWeight: '700', // Đậm
    color: '#ecfeff', // Trắng hơi xanh nhạt
  },
  heroSubtitle: {
    marginTop: 6, // Cách title một chút
    fontSize: 12, // Cỡ chữ nhỏ hơn
    color: '#e0f2fe', // Xanh nhạt, ít nổi hơn title
  },
  heroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 999, // Bo tròn 100% → avatar tròn
    backgroundColor: '#fdf2f8', // Nền hồng nhạt
    alignItems: 'center',
    justifyContent: 'center', // Icon ở giữa
    marginLeft: 10, // Cách phần text bên trái
  },

  // Card trắng dùng chung cho phần email + phần hướng dẫn
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000', // Shadow iOS
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2, // Đổ bóng Android
  },
  sectionHeaderRow: {
    flexDirection: 'row', // Icon + title ngang hàng
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    marginLeft: 6, // Cách icon
    fontSize: 14,
    fontWeight: '700',
    color: '#111827', // Xanh đen
  },
  sectionText: {
    fontSize: 12,
    color: '#4b5563', // Xám đậm (dễ đọc)
    marginTop: 2,
  },

  // Ô nhập email
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db', // Viền xám nhạt
    paddingHorizontal: 10,
    // paddingVertical tuỳ platform để TextInput không bị quá cao/thấp
    paddingVertical: Platform.select({ ios: 10, android: 6, default: 8 }),
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#f9fafb', // Nền xám rất nhạt
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: '#6b7280', // Xám trung tính, làm text phụ
  },

  // Mỗi dòng hướng dẫn (số thứ tự + text)
  stepRow: {
    flexDirection: 'row', // Số thứ tự + nội dung nằm ngang
    alignItems: 'flex-start', // Căn đỉnh để text dài xuống vẫn thẳng
    marginTop: 6,
  },
  // Vòng tròn số thứ tự
  stepBullet: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#f472b6', // Hồng
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2, // Đẩy xuống chút cho cân với text
  },
  stepNumber: {
    color: '#ecfeff', // Chữ trắng nhạt
    fontSize: 11,
    fontWeight: '700',
  },
});

export default OnboardingScreen;
