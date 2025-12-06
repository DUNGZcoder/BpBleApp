// Import các hook core của React
import { useEffect, useRef, useState } from 'react';
// Import tiện ích từ React Native
import { Alert, DeviceEventEmitter } from 'react-native';
// Import thư viện serialport native để nói chuyện với USB CDC
import { RNSerialport, definitions, actions } from 'react-native-serialport';

// Kiểu dữ liệu cho một lần đo
export type Reading = {
  sys?: number; // Huyết áp tâm thu (systolic)
  dia?: number; // Huyết áp tâm trương (diastolic)
  map?: number; // Mean Arterial Pressure (MAP)
  pulse?: number; // Nhịp tim
};

// Ngưỡng cảnh báo huyết áp cao
// 👉 Muốn chỉnh ngưỡng (ví dụ 160) thì sửa số ở đây
const DANGER_THRESHOLD_SYS = 140;

// Hook custom dùng để gom toàn bộ logic kết nối USB CDC + đo huyết áp
export const useUsbSerial = () => {
  // Có đang bật USB Service chưa
  const [usbServiceStarted, setUsbServiceStarted] = useState(false);
  // Có thiết bị USB cắm vào hay chưa
  const [usbAttached, setUsbAttached] = useState(false);
  // Đã CONNECTED tới ESP32 (serial) hay chưa
  const [connected, setConnected] = useState(false);
  // Có đang trong quá trình đo hay không
  const [isMeasuring, setIsMeasuring] = useState(false);
  // Lần đo gần nhất (sys, dia, map, pulse)
  const [lastReading, setLastReading] = useState<Reading>({});
  // Log dùng để hiển thị trong UI (debug cho dev / user)
  const [log, setLog] = useState<string[]>([]);

  // Buffer tạm thời để ghép chuỗi data nhận từ serial (vì data có thể bị cắt)
  // useRef dùng để tránh re-render khi buffer thay đổi
  const bufferRef = useRef('');

  // Hàm tiện ích thêm 1 dòng log, kèm timestamp
  const addLog = (msg: string) => {
    setLog(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('vi-VN', { hour12: false })}] ${msg}`,
      // 👉 Nếu muốn format giờ khác (12h, có AM/PM), đổi hour12: true
    ]);
  };

  // Công thức tính MAP = diastolic + 1/3 (systolic - diastolic)
  // 👉 Nếu muốn dùng công thức khác, sửa tại đây
  const calculateMAP = (sys: number, dia: number) =>
    Math.round(dia + (sys - dia) / 3);

  // useEffect chạy 1 lần khi hook được mount (tương đương componentDidMount)
  useEffect(() => {
    addLog('Khởi tạo USB CDC (react-native-serialport)...');

    // Lắng nghe event: Service bắt đầu chạy
    const subServiceStarted = DeviceEventEmitter.addListener(
      actions.ON_SERVICE_STARTED,
      (res: any) => {
        setUsbServiceStarted(true);
        addLog('USB Service: STARTED');

        // Nếu khi service start mà thiết bị đã cắm sẵn
        if (res?.deviceAttached) {
          setUsbAttached(true);
          addLog('USB: Đã gắn thiết bị.');
        }
      },
    );

    // Lắng nghe event: Service dừng
    const subServiceStopped = DeviceEventEmitter.addListener(
      actions.ON_SERVICE_STOPPED,
      () => {
        setUsbServiceStarted(false);
        addLog('USB Service: STOPPED');
      },
    );

    // Lắng nghe event: Cắm thiết bị USB
    const subDeviceAttached = DeviceEventEmitter.addListener(
      actions.ON_DEVICE_ATTACHED,
      () => {
        setUsbAttached(true);
        addLog('USB: Thiết bị được gắn.');
      },
    );

    // Lắng nghe event: Rút thiết bị USB
    const subDeviceDetached = DeviceEventEmitter.addListener(
      actions.ON_DEVICE_DETACHED,
      () => {
        setUsbAttached(false);
        setConnected(false); // Khi rút thì chắc chắn mất kết nối serial
        addLog('USB: Thiết bị đã tháo.');
      },
    );

    // Lắng nghe event: Serial CONNECTED
    const subConnected = DeviceEventEmitter.addListener(
      actions.ON_CONNECTED,
      () => {
        setConnected(true);
        addLog('Serial: ĐÃ KẾT NỐI tới ESP32.');
      },
    );

    // Lắng nghe event: Serial DISCONNECTED
    const subDisconnected = DeviceEventEmitter.addListener(
      actions.ON_DISCONNECTED,
      () => {
        setConnected(false);
        addLog('Serial: NGẮT KẾT NỐI.');
      },
    );

    // Lắng nghe event: Lỗi từ serial
    const subError = DeviceEventEmitter.addListener(
      actions.ON_ERROR,
      (e: any) => {
        console.error('Serial error', e);
        addLog(`Serial ERROR: ${e?.message || JSON.stringify(e)}`);
      },
    );

    // Lắng nghe event: Nhận data từ serial
    const subReadData = DeviceEventEmitter.addListener(
      actions.ON_READ_DATA,
      (data: any) => {
        try {
          // Data đang ở dạng HEX string → chuyển thành UTF-16 text
          const text = RNSerialport.hexToUtf16(data.payload);

          // Ghép thêm vào buffer hiện tại
          const newBuf = bufferRef.current + text;

          // Tách theo dòng (mỗi bản tin JSON kết thúc bằng \n)
          const parts = newBuf.split('\n');

          // Các dòng đã hoàn chỉnh (trừ dòng cuối cùng có thể đang dở)
          const completeLines = parts.slice(0, -1);
          // Phần còn lại chưa hoàn chỉnh → giữ lại cho lần sau
          const remaining = parts[parts.length - 1];

          // Xử lý từng dòng hoàn chỉnh
          completeLines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return; // bỏ dòng rỗng

            addLog(`RECV: ${trimmed}`);

            try {
              // Mỗi dòng là 1 JSON string từ ESP32
              const json = JSON.parse(trimmed);

              // Nếu đây là kết quả đo
              if (json.type === 'measurement_result') {
                const sys = Number(json.sys);
                const dia = Number(json.dia);
                const pulse = Number(json.pulse);

                if (!Number.isNaN(sys) && !Number.isNaN(dia)) {
                  // Tính MAP từ sys/dia
                  const map = calculateMAP(sys, dia);

                  // Cập nhật kết quả đo gần nhất
                  setLastReading({ sys, dia, pulse, map });
                  // Kết thúc trạng thái đang đo
                  setIsMeasuring(false);

                  // Nếu vượt ngưỡng nguy hiểm → hiện cảnh báo
                  if (sys >= DANGER_THRESHOLD_SYS) {
                    Alert.alert(
                      'CẢNH BÁO HUYẾT ÁP CAO',
                      `Chỉ số: ${sys}/${dia} mmHg\nVui lòng nghỉ ngơi và kiểm tra lại hoặc liên hệ bác sĩ.`,
                      // 👉 Nếu không muốn hiện alert (chỉ log thôi), có thể bỏ đoạn này
                    );
                  }
                }
              }
            } catch (err: any) {
              // JSON không parse được → log lỗi
              addLog(`JSON parse error: ${err.message}`);
            }
          });

          // Lưu phần còn lại chưa hoàn chỉnh để ghép với data lần sau
          bufferRef.current = remaining;
        } catch (err: any) {
          // Lỗi trong quá trình decode → log lỗi
          addLog(`Decode error: ${err.message}`);
        }
      },
    );

    // ------------ CẤU HÌNH USB SERIAL & START SERVICE ------------

    // Dữ liệu trả về ở dạng HEX string
    // 👉 Nếu ESP32 gửi kiểu khác, có thể đổi RETURNED_DATA_TYPES
    RNSerialport.setReturnedDataType(definitions.RETURNED_DATA_TYPES.HEXSTRING);

    // Tự động connect khi cắm thiết bị
    RNSerialport.setAutoConnect(true);

    // Baudrate dùng để giao tiếp với ESP32
    // 👉 Phải khớp với cấu hình Serial trên ESP32 (Serial.begin(115200))
    RNSerialport.setAutoConnectBaudRate(115200);

    // Interface: -1 = dùng tất cả, để library tự chọn
    RNSerialport.setInterface(-1);

    // Bắt đầu USB service
    RNSerialport.startUsbService();
    addLog('Đã startUsbService(), chờ cắm ESP32...');

    // Cleanup khi unmount hook (component bị tháo)
    return () => {
      // Bỏ đăng ký tất cả listener để tránh memory leak
      subServiceStarted.remove();
      subServiceStopped.remove();
      subDeviceAttached.remove();
      subDeviceDetached.remove();
      subConnected.remove();
      subDisconnected.remove();
      subError.remove();
      subReadData.remove();

      // Đảm bảo ngắt kết nối và dừng USB service
      (async () => {
        try {
          const open = await RNSerialport.isOpen();
          if (open) {
            RNSerialport.disconnect(); // Ngắt kết nối serial nếu đang mở
          }
        } catch {
          // Có lỗi cũng bỏ qua, vì chỉ cleanup
        }

        RNSerialport.stopUsbService(); // Dừng USB service
      })();
    };
  }, []); // [] → chỉ chạy 1 lần khi mount

  // Hàm bắt đầu đo huyết áp (gửi lệnh xuống ESP32)
  const handleStartMeasure = () => {
    // Check 1: USB service đã start chưa
    if (!usbServiceStarted) {
      addLog('Chưa start USB service.');
      return;
    }

    // Check 2: Đã cắm thiết bị chưa
    if (!usbAttached) {
      addLog('Chưa gắn ESP32 vào điện thoại.');
      Alert.alert('Chưa gắn thiết bị', 'Hãy cắm cáp ESP32 vào điện thoại.');
      return;
    }

    // Check 3: Đã CONNECTED chưa (vượt qua permission popup, v.v.)
    if (!connected) {
      addLog(
        'USB đã gắn nhưng chưa CONNECTED (hãy chấp nhận popup permission nếu có).',
      );
      return;
    }

    // Qua 3 bước kiểm tra → OK để bắt đầu đo
    setIsMeasuring(true); // Đánh dấu đang đo
    setLastReading({}); // Xoá kết quả cũ
    bufferRef.current = ''; // Reset buffer nhận data

    // Gửi lệnh xuống ESP32 dưới dạng JSON + xuống dòng (\n)
    // 👉 Bên ESP32 cần đọc theo dòng, parse JSON tương ứng
    const cmd = JSON.stringify({ command: 'START_MEASURE' }) + '\n';
    RNSerialport.writeString(cmd);
    addLog(`SEND: ${cmd.trim()}`);
  };

  // Chuỗi trạng thái gọn để show lên UI
  // 👉 Nếu muốn phân nhiều trạng thái hơn (đang đo, lỗi...), có thể mở rộng logic ở đây
  const statusText = connected
    ? 'Đã kết nối ESP32 (CDC)'
    : usbAttached
    ? 'Đã gắn cáp, đang chờ CONNECTED...'
    : 'Chưa gắn thiết bị';

  // Trả ra tất cả state + hàm để component khác sử dụng
  return {
    usbServiceStarted,
    usbAttached,
    connected,
    isMeasuring,
    lastReading,
    log,
    handleStartMeasure,
    statusText,
  };
};
