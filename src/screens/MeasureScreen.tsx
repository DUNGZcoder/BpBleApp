// Màn hình ĐO USB: hiển thị trạng thái kết nối + kết quả đo + log
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
// Import icon từ lucide-react-native (icon dạng vector, scale tốt)
import { Activity, AlertCircle, Check, Heart } from 'lucide-react-native';
// Kiểu Reading lấy từ hook useUsbSerial (sys, dia, map, pulse)
import { Reading } from '../hooks/useUsbSerial';

// Kiểu props mà MeasureScreen nhận từ App.tsx
type Props = {
  usbServiceStarted: boolean; // USB service đã khởi tạo chưa
  usbAttached: boolean; // Thiết bị USB đã được gắn vào chưa
  connected: boolean; // Đã CONNECTED (serial) với ESP32 chưa
  isMeasuring: boolean; // Đang trong trạng thái đo hay không
  lastReading: Reading; // Kết quả đo gần nhất
  log: string[]; // Danh sách log để hiển thị debug
  statusText: string; // Chuỗi trạng thái tổng, hiển thị ở trên cùng
  onStartMeasure: () => void; // Hàm callback bấm nút "Bắt đầu đo"
};

// Component chính của màn hình đo
const MeasureScreen: React.FC<Props> = ({
  usbServiceStarted,
  usbAttached,
  connected,
  isMeasuring,
  lastReading,
  log,
  statusText,
  onStartMeasure,
}) => {
  return (
    <ScrollView
      style={styles.container} // Style nền chung của màn hình
      contentContainerStyle={{ paddingBottom: 24 }} // Thêm padding dưới để scroll không bị cụt
    >
      {/* Thanh trạng thái tổng (statusText) */}
      <View style={styles.statusBar}>
        <Text style={styles.statusLabel}>Trạng thái:</Text>
        <Text style={styles.statusValue}>{statusText}</Text>
      </View>

      {/* 3 ô trạng thái nhỏ: USB Service, Thiết bị, Serial */}
      <View style={styles.statusGrid}>
        <StatusChip
          label="USB Service"
          value={usbServiceStarted ? 'Sẵn sàng' : 'Chưa khởi tạo'} // Nội dung tùy theo boolean
          active={usbServiceStarted} // Dùng để đổi màu chấm
        />
        <StatusChip
          label="Thiết bị"
          value={usbAttached ? 'Đã gắn cáp' : 'Chưa gắn thiết bị'}
          active={usbAttached}
        />
        <StatusChip
          label="Serial"
          value={connected ? 'Đã kết nối' : 'Chờ kết nối'}
          active={connected}
        />
      </View>

      {/* 3 card hiển thị giá trị SYS, DIA, MAP */}
      <View style={styles.cardList}>
        <MetricCard
          title="Tâm thu (SYS)"
          unit="mmHg"
          value={lastReading.sys}
          heartColor="#fb7185" // màu icon trái tim (hồng/đỏ)
        />
        <MetricCard
          title="Tâm trương (DIA)"
          unit="mmHg"
          value={lastReading.dia}
          heartColor="#facc15" // màu icon trái tim (vàng)
        />
        <MetricCard
          title="Áp suất trung bình (MAP)"
          unit="mmHg"
          value={lastReading.map}
          heartColor="#22c55e" // màu icon trái tim (xanh lá)
        />
      </View>

      {/* Card nhịp tim */}
      <View style={styles.pulseCard}>
        {/* Hàng tiêu đề có icon Heart + chữ "Nhịp tim" */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Heart size={18} color="#ec4899" />
          <Text style={styles.pulseTitle}> Nhịp tim</Text>
        </View>

        {/* Giá trị nhịp tim, nếu chưa có thì hiển thị "--" */}
        <Text style={styles.pulseValue}>
          {lastReading.pulse != null ? lastReading.pulse : '--'}
        </Text>
        <Text style={styles.pulseUnit}>BPM</Text>
      </View>

      {/* Nút bấm bắt đầu đo */}
      <TouchableOpacity
        style={[
          styles.button,
          // Nếu chưa start USB Service hoặc đang đo thì disable style
          (!usbServiceStarted || isMeasuring) && styles.buttonDisabled,
        ]}
        onPress={onStartMeasure} // Bấm nút → gọi hàm đo
        disabled={!usbServiceStarted || isMeasuring} // Disable logic
      >
        {/* Icon giả lập sóng đo ∿ (có thể đổi thành icon khác nếu thích) */}
        <Text style={styles.buttonIcon}>∿</Text>
        <Text style={styles.buttonText}>
          {isMeasuring ? 'Đang đo...' : 'Bắt đầu đo qua USB'}
        </Text>
      </TouchableOpacity>

      {/* Box hướng dẫn nhanh cho người dùng */}
      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          {/* Nếu đã connected → icon check xanh, chưa thì icon cảnh báo cam */}
          {connected ? (
            <Check size={16} color="#16a34a" />
          ) : (
            <AlertCircle size={16} color="#f97316" />
          )}
          <Text style={styles.infoTitle}> Hướng dẫn nhanh</Text>
        </View>
        <Text style={styles.infoText}>
          1. Cắm ESP32 vào điện thoại bằng cáp OTG.
        </Text>
        <Text style={styles.infoText}>
          2. Khi hiện popup xin quyền USB, chọn{' '}
          <Text style={{ fontWeight: '700' }}>OK / Allow</Text>.
        </Text>
        <Text style={styles.infoText}>
          3. ESP32 gửi JSON theo từng dòng, ví dụ:
        </Text>
        {/* Box code minh hoạ JSON nhận được từ ESP32 */}
        <Text style={styles.code}>
          {'{"type":"measurement_result","sys":123,"dia":80,"pulse":70}\\n'}
        </Text>
      </View>

      {/* Tiêu đề + badge số lượng log */}
      <View style={styles.logHeaderRow}>
        <Text style={styles.logTitle}>Nhật ký kết nối</Text>
        <View style={styles.logBadge}>
          <Text style={styles.logBadgeText}>{log.length}</Text>
        </View>
      </View>

      {/* Box hiển thị log (nằm trong ScrollView để cuộn được) */}
      <View style={styles.logBox}>
        <ScrollView
          style={{ maxHeight: 150 }} // Giới hạn chiều cao log
          contentContainerStyle={{ paddingVertical: 6 }} // Thêm padding trên/dưới
        >
          {log.map((l, i) => (
            <Text key={i} style={styles.logLine}>
              {l}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

/* ------------------------ COMPONENT PHỤ: StatusChip ------------------------ */

type StatusChipProps = {
  label: string; // Dòng label nhỏ, ví dụ "USB Service"
  value: string; // Dòng giá trị, ví dụ "Sẵn sàng"
  active: boolean; // Trạng thái để đổi màu chấm (xanh / xám)
};

// Chip hiển thị 1 trạng thái nhỏ (USB, Thiết bị, Serial)
const StatusChip: React.FC<StatusChipProps> = ({ label, value, active }) => (
  <View style={styles.statusChip}>
    {/* Chấm tròn nhỏ bên trái, màu dựa vào active */}
    <View
      style={[
        styles.statusDot,
        { backgroundColor: active ? '#22c55e' : '#9ca3af' }, // Xanh nếu true, xám nếu false
      ]}
    />
    {/* Text label + value */}
    <View style={{ flex: 1 }}>
      <Text style={styles.statusChipLabel}>{label}</Text>
      <Text style={styles.statusChipValue}>{value}</Text>
    </View>
  </View>
);

/* ------------------------ COMPONENT PHỤ: MetricCard ------------------------ */

type MetricCardProps = {
  title: string; // Tiêu đề, ví dụ "Tâm thu (SYS)"
  unit: string; // Đơn vị, ví dụ "mmHg"
  value?: number; // Giá trị đo, có thể undefined nếu chưa có
  heartColor: string; // Màu trái tim (tuỳ loại chỉ số)
};

// Card hiển thị 1 chỉ số huyết áp (SYS, DIA, MAP)
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  unit,
  value,
  heartColor,
}) => (
  <View style={styles.metricCard}>
    {/* Header của card: tiêu đề + icon tim */}
    <View style={styles.metricHeader}>
      <View>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
      {/* Vòng tròn chứa icon tim, nền mờ từ màu heartColor */}
      <View
        style={[styles.metricHeart, { backgroundColor: `${heartColor}22` }]}
        // `${heartColor}22` = màu có alpha (22 hex ~ 13% opacity)
      >
        <Heart size={18} color={heartColor} />
      </View>
    </View>

    {/* Hàng hiển thị giá trị lớn + placeholder nếu chưa có data */}
    <View style={styles.metricValueRow}>
      <Text style={styles.metricValue}>{value != null ? value : '---'}</Text>
      {value == null && (
        <Text style={styles.metricPlaceholder}>Chờ dữ liệu…</Text>
      )}
    </View>
  </View>
);

/* ------------------------ STYLE SHEET ------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1, // Chiếm toàn bộ chiều cao màn hình
    backgroundColor: '#0ea5e9', // Màu nền xanh (trùng với App.body)
  },

  // Thanh trạng thái tổng đầu màn
  statusBar: {
    backgroundColor: '#38bdf8', // Nền xanh nhạt hơn header
    borderRadius: 18, // Bo tròn → đổi nhỏ hơn nếu muốn góc ít cong
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 12,
    color: '#e0f2fe', // Chữ nhỏ, nhạt hơn
  },
  statusValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff', // Chữ trắng nổi bật
  },

  // Grid chứa 3 status chip ngang hàng
  statusGrid: {
    flexDirection: 'row', // Sắp xếp 3 chip theo hàng ngang
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusChip: {
    flex: 1, // Mỗi chip chiếm đều chiều ngang
    flexDirection: 'row', // Chấm + text nằm ngang
    alignItems: 'center',
    backgroundColor: '#e0f2fe', // Nền xanh nhạt
    borderRadius: 999, // Bo tròn pill
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 3, // Khoảng cách giữa các chip
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999, // Thành chấm tròn
    marginRight: 8,
  },
  statusChipLabel: {
    fontSize: 11,
    color: '#64748b', // Màu xám xanh
  },
  statusChipValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a', // Màu xanh đậm
  },

  // Container cho 3 metric card
  cardList: {
    marginBottom: 10,
  },

  // Card hiển thị 1 chỉ số huyết áp
  metricCard: {
    backgroundColor: '#ffffff', // Nền trắng
    borderRadius: 20, // Bo tròn card
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    // Shadow cho iOS
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    // Elevation cho Android
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  metricUnit: {
    marginTop: 2,
    fontSize: 11,
    color: '#9ca3af',
  },
  metricHeart: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    // Nền mờ dùng trong component (color + alpha)
  },
  metricValueRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metricValue: {
    fontSize: 26, // Số to nổi bật
    fontWeight: '800',
    color: '#0f172a',
  },
  metricPlaceholder: {
    fontSize: 11,
    color: '#9ca3af', // Chữ nhạt: “Chờ dữ liệu…”
  },

  // Card hiển thị nhịp tim
  pulseCard: {
    marginTop: 2,
    backgroundColor: '#fdf2f8', // Nền hồng rất nhạt
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pulseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9d174d', // Hồng đậm
  },
  pulseValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: '#9d174d',
  },
  pulseUnit: {
    fontSize: 11,
    color: '#9f1239',
  },

  // Nút bắt đầu đo
  button: {
    marginTop: 14,
    backgroundColor: '#06e4bfff', // Màu xanh ngọc tươi (có alpha FF)
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row', // Để icon + text nằm ngang
    justifyContent: 'center',
    // Shadow iOS
    shadowColor: '#009ea3ff',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    // Shadow Android
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af', // Màu xám khi disable
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    color: '#f9fafb',
    fontSize: 18,
    marginRight: 6, // Khoảng cách giữa icon và text
  },
  buttonText: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '700',
  },

  // Box hướng dẫn nhanh
  infoBox: {
    marginTop: 16,
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    padding: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#0f172a',
    marginTop: 2,
  },
  code: {
    marginTop: 6,
    fontSize: 11,
    backgroundColor: '#020617', // Nền đen xanh
    color: '#e5e7eb', // Chữ xám nhạt
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    fontFamily: 'monospace', // Font chữ đều (code style)
  },

  // Header của phần log
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  logBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#fee2e2', // Nền hồng nhạt cho badge số log
  },
  logBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b91c1c', // Chữ đỏ đậm
  },

  // Box nền cho log
  logBox: {
    backgroundColor: '#020617', // Nền đen xanh
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  logLine: {
    fontSize: 10,
    color: '#14c8e3ff', // Màu xanh cyan sáng
    marginBottom: 2,
  },
});

export default MeasureScreen;
