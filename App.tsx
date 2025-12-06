// Import React và các hook cơ bản
import React, { useState, useEffect } from 'react';

// Import các component UI từ React Native
import {
  SafeAreaView, // Vùng hiển thị an toàn tránh tai thỏ (trên iOS, tránh tai thỏ / thanh trạng thái)
  View, // Khối container cơ bản để bố cục
  Text, // Hiển thị chữ
  TouchableOpacity, // Vùng bấm được (button đơn giản)
  StatusBar, // Tùy chỉnh thanh trạng thái (icon sáng/tối)
  StyleSheet, // Định nghĩa style tách riêng, dễ quản lý
} from 'react-native';

// Icon từ thư viện lucide-react-native (vector icon, dễ scale)
import { Activity } from 'lucide-react-native';

// Hook xử lý kết nối USB Serial (tự tạo, gom logic kết nối vào 1 chỗ)
import { useUsbSerial } from './src/hooks/useUsbSerial';

// Import các màn hình chính của ứng dụng (3 tab)
import OnboardingScreen from './src/screens/OnboardingScreen';
import MeasureScreen from './src/screens/MeasureScreen';
import AiInsightsScreen from './src/screens/AiInsightsScreen';

// Kiểu dữ liệu cho tên tab (giúp TS kiểm tra, tránh gõ sai string)
type Tab = 'onboarding' | 'measure' | 'ai';

const App: React.FC = () => {
  // Lấy các trạng thái + hàm từ hook USB Serial
  const {
    usbServiceStarted, // USB service đã chạy chưa → dùng để báo trạng thái hệ thống
    usbAttached, // Có USB cắm vào hay không → dùng để gợi ý user cắm dây
    connected, // ESP32 đã kết nối thành công chưa → dùng để báo ONLINE/OFFLINE
    isMeasuring, // Đang đo huyết áp hay không → dùng để disable nút, đổi text
    lastReading, // Kết quả đo gần nhất → truyền sang màn hình hiển thị
    log, // Log debug → có thể show ở MeasureScreen cho dev xem
    handleStartMeasure, // Hàm bắt đầu quá trình đo → bấm nút gọi hàm này
    statusText, // Chuỗi mô tả trạng thái hiện tại → hiển thị cho user
  } = useUsbSerial();

  // State quản lý tab hiện tại → đổi giá trị để chuyển tab
  const [activeTab, setActiveTab] = useState<Tab>('onboarding');

  // Email người thân để gửi kết quả đo (tuỳ chọn) → truyền giữa các màn
  const [relativeEmail, setRelativeEmail] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      {/* Đặt kiểu màu chữ trên thanh status bar 
          'light-content' = icon & chữ màu sáng → hợp với nền tối
          Nếu nền status bar sáng, dùng 'dark-content'
      */}
      <StatusBar barStyle="light-content" />

      {/* ---------------- HEADER ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Icon trong vòng tròn ở bên trái header
              Nếu muốn icon lớn hơn → chỉnh size ở Activity + width/height
          */}
          <View style={styles.headerIcon}>
            <Activity size={18} color="#ffffff" />
          </View>

          {/* Text tiêu đề + mô tả ngắn trong header */}
          <View>
            <Text style={styles.headerTitle}>PicoBP – USB CDC</Text>
            <Text style={styles.headerSub}>
              ESP32 đo huyết áp • Kết nối USB
            </Text>
          </View>
        </View>

        {/* Badge hiển thị trạng thái kết nối ONLINE / OFFLINE
            Dùng ternary để chọn style & text theo biến connected
        */}
        <View
          style={[
            styles.badge,
            connected ? styles.badgeOnline : styles.badgeOffline,
          ]}
        >
          <Text style={styles.badgeText}>
            {connected ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* ---------------- BODY ---------------- */}
      <View style={styles.body}>
        {/* --------- TAB BAR --------- */}
        <View style={styles.tabBar}>
          {/* Tab 1: màn bắt đầu / onboarding */}
          <TabButton
            label="BẮT ĐẦU"
            active={activeTab === 'onboarding'} // true nếu tab đang được chọn
            onPress={() => setActiveTab('onboarding')} // Bấm để đổi tab
          />

          {/* Tab 2: màn đo huyết áp bằng USB */}
          <TabButton
            label="ĐO USB"
            active={activeTab === 'measure'}
            onPress={() => setActiveTab('measure')}
          />

          {/* Tab 3: màn AI Insights */}
          <TabButton
            label="AI INSIGHTS"
            active={activeTab === 'ai'}
            onPress={() => setActiveTab('ai')}
          />
        </View>

        {/* --------- RENDER SCREEN THEO TAB --------- */}

        {/* Màn hình 1: Nhập email người thân, hướng dẫn, onboarding
            Nếu muốn thêm props khác → khai báo thêm ở OnboardingScreen
        */}
        {activeTab === 'onboarding' && (
          <OnboardingScreen
            relativeEmail={relativeEmail} // Giá trị email hiện tại
            setRelativeEmail={setRelativeEmail} // Hàm cập nhật email
          />
        )}

        {/* Màn hình 2: Đo huyết áp bằng USB CDC
            Truyền toàn bộ trạng thái & hàm điều khiển để UI xử lý
        */}
        {activeTab === 'measure' && (
          <MeasureScreen
            usbServiceStarted={usbServiceStarted}
            usbAttached={usbAttached}
            connected={connected}
            isMeasuring={isMeasuring}
            lastReading={lastReading}
            log={log}
            statusText={statusText}
            onStartMeasure={handleStartMeasure}
          />
        )}

        {/* Màn hình 3: Phân tích AI từ kết quả đo
            Dùng lastReading + relativeEmail để tạo insights hoặc gửi mail
        */}
        {activeTab === 'ai' && (
          <AiInsightsScreen
            relativeEmail={relativeEmail}
            lastReading={lastReading}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// --------------------------------------------------
// COMPONENT TAB BUTTON (NÚT ĐỔI TAB)
// --------------------------------------------------
type TabButtonProps = {
  label: string; // Text hiển thị trên nút tab
  active: boolean; // Tab hiện tại có đang được chọn không
  onPress: () => void; // Hàm sẽ chạy khi user bấm tab
};

const TabButton: React.FC<TabButtonProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress} // Gọi hàm khi bấm
    style={[styles.tabItem, active && styles.tabItemActive]}
    // Nếu active = true → apply thêm style tabItemActive
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// --------------------------------------------------
// STYLE SHEET (TOÀN BỘ UI)
// --------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1, // Chiếm toàn bộ chiều cao màn hình
    backgroundColor: '#0ea5e9', // Màu nền xanh da trời → đổi theme thì đổi màu này
  },

  header: {
    paddingHorizontal: 16, // Lề trái/phải của header → tăng nếu muốn thoáng hơn
    paddingVertical: 12, // Lề trên/dưới → tăng để header cao hơn
    flexDirection: 'row', // Sắp xếp con theo chiều ngang → đổi 'column' sẽ xếp dọc
    justifyContent: 'space-between',
    // Căn các item ra hai phía trái/phải → đổi 'center' nếu muốn gom vào giữa
    alignItems: 'center', // Căn giữa theo trục dọc → đổi 'flex-start' nếu muốn sát trên
  },

  headerLeft: {
    flexDirection: 'row', // Icon + text nằm ngang
    alignItems: 'center', // Căn giữa icon và text theo chiều dọc
  },

  headerIcon: {
    width: 36, // Chiều rộng vòng tròn icon → tăng để icon to hơn
    height: 36, // Chiều cao vòng tròn
    borderRadius: 18, // 1/2 chiều rộng = tròn hoàn toàn → đổi 8 nếu muốn bo nhẹ
    backgroundColor: '#0284c7', // Nền vòng tròn icon → đổi theo brand color
    alignItems: 'center', // Căn icon vào giữa ngang
    justifyContent: 'center', // Căn icon vào giữa dọc
    marginRight: 10, // Khoảng cách giữa icon và text → tăng nếu muốn rộng hơn
  },

  headerTitle: {
    fontSize: 18, // Cỡ chữ tiêu đề → tăng nếu muốn to hơn
    fontWeight: '700', // Độ đậm chữ → có thể dùng 'bold'
    color: '#ffffff', // Màu chữ trắng → đổi nếu header nền sáng
  },

  headerSub: {
    fontSize: 11, // Cỡ chữ mô tả nhỏ hơn tiêu đề
    color: '#e0f2fe', // Màu chữ nhạt để phụ hơn title
  },

  badge: {
    paddingHorizontal: 10, // Độ dài ngang của badge → tăng nếu muốn badge dài
    paddingVertical: 4, // Độ cao của badge → tăng để badge dày hơn
    borderRadius: 999, // Siêu bo tròn → giúp badge thành viên thuốc
    // Nếu muốn badge vuông → giảm xuống 4–8
  },

  badgeOnline: {
    backgroundColor: '#bbf7d0', // Nền xanh lá nhạt khi ONLINE → đổi màu nếu muốn nổi hơn
  },

  badgeOffline: {
    backgroundColor: '#fecaca', // Nền đỏ hồng khi OFFLINE → có thể đổi sang #fecaca/#fee2e2
  },

  badgeText: {
    fontSize: 11, // Cỡ chữ trong badge
    fontWeight: '700', // Chữ đậm để dễ đọc
    color: '#0f172a', // Màu chữ đậm (xanh than) → đổi #000 nếu muốn đen
  },

  body: {
    flex: 1, // Phần body chiếm hết khoảng còn lại dưới header
    backgroundColor: '#e0f2fe', // Nền xanh nhạt → đổi theo theme
    borderTopLeftRadius: 24, // Bo góc trên trái → để tạo cảm giác tấm card lớn
    borderTopRightRadius: 24, // Bo góc trên phải
    padding: 16, // Padding bên trong toàn body → tăng để nội dung thoáng hơn
  },

  tabBar: {
    flexDirection: 'row', // Các tab nằm ngang cạnh nhau
    backgroundColor: '#ffffff', // Nền trắng cho thanh tab
    borderRadius: 999, // Bo tròn thành thanh pill → đổi 12 nếu muốn bo nhẹ
    padding: 4, // Khoảng cách viền tab bar với các nút bên trong
    marginBottom: 12, // Khoảng cách giữa tab bar và nội dung bên dưới
  },

  tabItem: {
    flex: 1, // Mỗi tab chia đều chiều ngang
    paddingVertical: 8, // Độ cao tab → tăng nếu muốn nút bự hơn
    borderRadius: 999, // Bo tròn tab → phải đủ lớn để ra hình viên thuốc
    alignItems: 'center', // Căn Text tab vào giữa theo chiều ngang
  },

  tabItemActive: {
    backgroundColor: '#f472b6', // Nền tab khi active (màu hồng) → đổi màu để theo brand
  },

  tabText: {
    fontSize: 12, // Cỡ chữ tab → tăng lên 14 nếu thấy nhỏ
    fontWeight: '600', // Độ đậm chữ để dễ đọc
    color: '#475569', // Màu chữ tab bình thường (xám xanh)
  },

  tabTextActive: {
    color: '#ffffff', // Màu chữ khi tab active → đổi sang đen nếu nền tab nhạt
  },
});

export default App;
