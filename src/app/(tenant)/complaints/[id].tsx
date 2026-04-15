import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge } from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { complaintsService, Complaint, ComplaintMessage } from '../../../services/complaints.service';

const SENDER_LABELS: Record<string, string> = { tenant: 'You', landlord: 'Landlord', admin: 'PropMan Admin' };

const STATUS_BADGE: Record<string, { variant: 'danger' | 'warning' | 'success' | 'info'; label: string }> = {
  open:        { variant: 'danger',  label: 'Open'        },
  in_progress: { variant: 'warning', label: 'In Progress' },
  resolved:    { variant: 'success', label: 'Resolved'    },
  escalated:   { variant: 'info',    label: 'Escalated'   },
};

export default function ComplaintDetailScreen() {
  const { theme }    = useTheme();
  const insets       = useSafeAreaInsets();
  const { id }       = useLocalSearchParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages]   = useState<ComplaintMessage[]>([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    complaintsService.getById(id).then(c => {
      setComplaint(c);
      setMessages(c.messages ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    setSending(true);
    try {
      const msg = await complaintsService.addMessage(id, trimmed);
      setMessages(prev => [...prev, msg]);
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: theme.textMuted }]}>Complaint not found.</Text>
      </View>
    );
  }

  const statusBadge = STATUS_BADGE[complaint.status] ?? STATUS_BADGE.open;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()}
        style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={2}>
              {complaint.title}
            </Text>
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
              {complaint.property_title ?? 'Property'}
            </Text>
          </View>
          <Badge label={statusBadge.label} variant={statusBadge.variant} />
        </View>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: theme.background }]}>
            <Ionicons name="construct-outline" size={12} color={theme.textSecondary} />
            <Text style={[typography.caption, { color: theme.textSecondary }]}>{complaint.category}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: theme.background }]}>
            <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {new Date(complaint.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          {complaint.priority === 'high' && (
            <View style={[styles.tag, { backgroundColor: '#FF6B6B22' }]}>
              <Ionicons name="alert-circle-outline" size={12} color="#FF6B6B" />
              <Text style={[typography.caption, { color: '#FF6B6B' }]}>High Priority</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === complaint.raised_by;
          return (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.delay(i * 40).springify()}
              style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}
            >
              {!isMe && (
                <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name="home-outline" size={16} color={theme.textSecondary} />
                </View>
              )}
              <View style={{ maxWidth: '75%' }}>
                {!isMe && (
                  <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 4, marginLeft: 4 }]}>
                    {msg.sender_name ?? 'Landlord'}
                  </Text>
                )}
                <View style={[
                  styles.bubble,
                  isMe
                    ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderBottomLeftRadius: 4 }
                ]}>
                  <Text style={[typography.body, { color: isMe ? '#fff' : theme.textPrimary, lineHeight: 20 }]}>
                    {msg.message}
                  </Text>
                </View>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 3, textAlign: isMe ? 'right' : 'left', marginHorizontal: 4 }]}>
                  {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={theme.textMuted}
          multiline
          style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary, ...typography.body }]}
        />
        <Pressable
          onPress={sendMessage}
          disabled={sending || !text.trim()}
          style={({ pressed }) => [styles.sendBtn, { backgroundColor: text.trim() ? theme.primary : theme.border, opacity: pressed ? 0.8 : 1 }]}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:       { padding: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tagsRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  messageList:  { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow:       { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowLeft:   { justifyContent: 'flex-start' },
  msgRowRight:  { justifyContent: 'flex-end' },
  avatar:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 20 },
  bubble:       { borderRadius: 16, padding: 12 },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  textInput:    { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 100 },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
