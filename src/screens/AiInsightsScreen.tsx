import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Brain, AlertCircle, Mail } from 'lucide-react-native';
import { Reading } from '../hooks/useUsbSerial';

type Props = {
  relativeEmail: string;
  lastReading: Reading;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const behaviorStats = [
  {
    tag: 'Uống cà phê',
    effect: '+6 mmHg sau 30 phút',
    type: 'negative',
    note: 'Bạn nên hạn chế uống cà phê trước khi đo.',
  },
  {
    tag: 'Thiếu ngủ',
    effect: '+8 mmHg buổi sáng',
    type: 'negative',
    note: 'Cố gắng ngủ đủ 7–8 tiếng để huyết áp ổn định hơn.',
  },
  {
    tag: 'Tập thể dục nhẹ',
    effect: '-5 mmHg sau 1 giờ',
    type: 'positive',
    note: 'Hoạt động thể chất giúp bạn duy trì huyết áp tốt hơn.',
  },
];

const AiInsightsScreen: React.FC<Props> = ({ relativeEmail, lastReading }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoading(true);

    try {
      // TODO: gọi API chatbot thật ở đây (backend của bạn)
      // demo trả lời tạm:
      const demoReply =
        'Đây là câu trả lời demo. Trong bản thật, mình sẽ phân tích huyết áp gần nhất của bạn và đưa gợi ý lối sống.';

      const botMsg: ChatMessage = { role: 'assistant', content: demoReply };
      setChatMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Brain size={18} color="#0f766e" />
          <Text style={styles.sectionTitle}>
            AI phân tích hành vi & huyết áp
          </Text>
        </View>
        <Text style={styles.sectionText}>
          Ý tưởng: dùng các{' '}
          <Text style={{ fontWeight: '700' }}>tags hành vi</Text> như “uống cà
          phê”, “thiếu ngủ”, “tập thể dục”… kết hợp kết quả đo để xem hành vi
          nào làm huyết áp tăng hoặc giảm.
        </Text>

        <View style={styles.aiPillRow}>
          <Text style={styles.aiPill}>Classification</Text>
          <Text style={styles.aiPill}>Tree-based</Text>
          <Text style={styles.aiPill}>SHAP explainability</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
          Demo phân tích hành vi
        </Text>
        {behaviorStats.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.behaviorRow,
              item.type === 'negative'
                ? styles.behaviorNegative
                : styles.behaviorPositive,
            ]}
          >
            <View style={styles.behaviorTagRow}>
              <View style={styles.behaviorDot} />
              <Text style={styles.behaviorTag}>{item.tag}</Text>
            </View>
            <Text style={styles.behaviorEffect}>{item.effect}</Text>
            <Text style={styles.behaviorNote}>{item.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <AlertCircle size={18} color="#b91c1c" />
          <Text style={styles.sectionTitle}>AI cảnh báo khẩn cấp</Text>
        </View>
        <Text style={styles.sectionText}>
          AI sẽ học mẫu huyết áp “bình thường” của riêng bạn. Khi có lần đo
          tăng/giảm đột ngột, hệ thống có thể đánh dấu bất thường và gửi cảnh
          báo.
        </Text>
        <View style={styles.alertEmailBox}>
          <Mail size={16} color="#0f172a" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.alertEmailTitle}>
              Email người thân sẽ nhận cảnh báo:
            </Text>
            <Text style={styles.alertEmailText}>
              {relativeEmail || 'Chưa cấu hình – nhập ở tab “BẮT ĐẦU”.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Chatbot mini */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
          Chatbot sức khỏe (demo)
        </Text>
        <Text style={styles.helperText}>
          * Chatbot chỉ mang tính tham khảo, không thay thế bác sĩ. Nếu có triệu
          chứng nghiêm trọng, hãy liên hệ cơ sở y tế.
        </Text>

        <ScrollView style={styles.chatMessages}>
          {chatMessages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.chatBubble,
                m.role === 'user'
                  ? styles.chatBubbleUser
                  : styles.chatBubbleAssistant,
              ]}
            >
              <Text style={styles.chatBubbleText}>{m.content}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInputRow}>
          <TextInput
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Hỏi về huyết áp, lối sống..."
            placeholderTextColor="#9ca3af"
            style={styles.chatInput}
            multiline
          />
          <TouchableOpacity
            style={styles.chatSendButton}
            onPress={handleSend}
            disabled={loading}
          >
            <Text style={styles.chatSendText}>{loading ? '...' : 'Gửi'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sectionText: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  aiPillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  aiPill: {
    fontSize: 11,
    color: '#0f172a',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginRight: 6,
    marginTop: 4,
  },
  behaviorRow: {
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  behaviorNegative: { backgroundColor: '#fef2f2' },
  behaviorPositive: { backgroundColor: '#ecfdf5' },
  behaviorTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  behaviorDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    marginRight: 6,
  },
  behaviorTag: { fontSize: 12, fontWeight: '600', color: '#111827' },
  behaviorEffect: { fontSize: 12, fontWeight: '500', color: '#111827' },
  behaviorNote: { marginTop: 2, fontSize: 11, color: '#4b5563' },
  alertEmailBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertEmailTitle: { fontSize: 11, fontWeight: '600', color: '#0f172a' },
  alertEmailText: { fontSize: 11, color: '#111827', marginTop: 2 },
  helperText: { fontSize: 11, color: '#6b7280' },
  chatMessages: {
    maxHeight: 180,
    marginTop: 8,
  },
  chatBubble: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    maxWidth: '80%',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0f766e',
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  chatBubbleText: {
    fontSize: 12,
    color: '#111827',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  chatInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxHeight: 80,
    fontSize: 12,
    backgroundColor: '#f9fafb',
  },
  chatSendButton: {
    marginLeft: 6,
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatSendText: {
    color: '#033437ff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AiInsightsScreen;
