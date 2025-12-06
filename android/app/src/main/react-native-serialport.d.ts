declare module 'react-native-serialport' {
  export const RNSerialport: {
    isSupported(): Promise<boolean>;
    startUsbService(): void;
    stopUsbService(): void;
    disconnect(): void;
    isOpen(): Promise<boolean>;
    writeString(data: string): void;
    writeBase64(data: string): void;
    setAutoConnect(auto: boolean): void;
    setAutoConnectBaudRate(baudRate: number): void;
    setInterface(iface: number): void;
    setReturnedDataType(type: string): void;
    hexToUtf16(hex: string): string;
  };

  export const definitions: {
    RETURNED_DATA_TYPES: {
      HEXSTRING: string;
      INTARRAY: string;
      // thêm nếu cần
    };
  };

  export const actions: {
    ON_SERVICE_STARTED: string;
    ON_SERVICE_STOPPED: string;
    ON_DEVICE_ATTACHED: string;
    ON_DEVICE_DETACHED: string;
    ON_CONNECTED: string;
    ON_DISCONNECTED: string;
    ON_READ_DATA: string;
    ON_ERROR: string;
  };
}
