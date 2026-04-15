import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Input }  from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { useAuthStore } from '../../store/auth.store';
import { usersService } from '../../services/users.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/* ─── Reusable row ─────────────────────────────────────────────────────────── */
function Row({ icon, label, value, right, onPress, danger }: {
  icon: IoniconsName; label: string; value?: string;
  right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.iconBubble, { backgroundColor: danger ? theme.danger + '18' : theme.background }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.textSecondary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[typography.bodyMed, { color: danger ? theme.danger : theme.textPrimary }]}>{label}</Text>
        {value && <Text style={[typography.small, { color: theme.textMuted }]}>{value}</Text>}
      </View>
      <View style={styles.rowRight}>
        {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />)}
      </View>
    </Pressable>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────────────────── */
function Section({ label, children, delay = 80 }: { label?: string; children: React.ReactNode; delay?: number }) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.section}>
      {label && <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8, marginLeft: 4 }]}>{label}</Text>}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </Animated.View>
  );
}

/* ─── Generic bottom sheet modal ──────────────────────────────────────────── */
function SheetModal({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <View style={styles.sheetHeader}>
            <Text style={[typography.h3, { color: theme.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Main screen ──────────────────────────────────────────────────────────── */
export default function SettingsScreen() {
  const { theme, mode } = useTheme();
  const insets          = useSafeAreaInsets();
  const { user, updateUser, clearAuth } = useAuthStore();

  // Modal visibility
  const [showPassword,   setShowPassword]   = useState(false);
  const [showEmail,      setShowEmail]      = useState(false);
  const [showPhone,      setShowPhone]      = useState(false);
  const [showName,       setShowName]       = useState(false);

  // Change password
  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);

  // Update email
  const [email, setEmail] = useState(user?.email ?? '');

  // Update phone — 2 steps
  const [newPhone,  setNewPhone]  = useState('');
  const [phoneOtp,  setPhoneOtp]  = useState('');
  const [phoneStep, setPhoneStep] = useState<'enter' | 'otp'>('enter');

  // Update name
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName,  setLastName]  = useState(user?.last_name  ?? '');

  const [loading,      setLoading]      = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to change avatar'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setAvatarLoading(true);
    try {
      const { user: updated } = await usersService.uploadAvatar(result.assets[0].uri);
      await updateUser({ ...user, ...updated });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to upload avatar');
    } finally { setAvatarLoading(false); }
  };

  const refreshUser = async (updated: any) => {
    await updateUser({ ...user, ...updated });
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (newPass !== confPass) { Alert.alert('Error', 'New passwords do not match'); return; }
    if (newPass.length < 8)   { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await usersService.changePassword({ current_password: curPass, new_password: newPass });
      Alert.alert('Success', 'Password updated successfully');
      setCurPass(''); setNewPass(''); setConfPass('');
      setShowPassword(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to update password');
    } finally { setLoading(false); }
  };

  /* ── Update email ── */
  const handleUpdateEmail = async () => {
    setLoading(true);
    try {
      const updated = await usersService.updateProfile({ email });
      await refreshUser(updated);
      Alert.alert('Success', 'Email updated');
      setShowEmail(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to update email');
    } finally { setLoading(false); }
  };

  /* ── Update name ── */
  const handleUpdateName = async () => {
    setLoading(true);
    try {
      const updated = await usersService.updateProfile({ first_name: firstName, last_name: lastName });
      await refreshUser(updated);
      Alert.alert('Success', 'Name updated');
      setShowName(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to update name');
    } finally { setLoading(false); }
  };

  /* ── Change phone step 1 ── */
  const handlePhoneRequest = async () => {
    setLoading(true);
    try {
      await usersService.changePhone(newPhone);
      setPhoneStep('otp');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  /* ── Change phone step 2 ── */
  const handlePhoneVerify = async () => {
    setLoading(true);
    try {
      const updated = await usersService.verifyPhoneChange(newPhone, phoneOtp);
      await refreshUser(updated);
      Alert.alert('Success', 'Phone number updated');
      setShowPhone(false); setNewPhone(''); setPhoneOtp(''); setPhoneStep('enter');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await clearAuth(); router.replace('/(auth)/login'); } },
    ]);
  };

  const roleBadge = user?.role === 'landlord' ? 'Landlord' : user?.role === 'tenant' ? 'Tenant' : 'User';

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
          <Text style={[typography.label, { color: theme.primaryLight }]}>Back</Text>
        </Pressable>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 28 }}>
          <LinearGradient colors={theme.primaryGrad} style={styles.profileCard}>
            <Pressable onPress={handlePickAvatar} style={styles.profileAvatar}>
              {user?.avatar_url
                ? <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                : <Ionicons name="person" size={32} color="#fff" />
              }
              {avatarLoading && (
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera-outline" size={20} color="#fff" />
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: '#fff' }]}>
                {user ? `${user.first_name} ${user.last_name}` : 'Guest'}
              </Text>
              <Text style={[typography.small, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}>
                {user?.phone_number ?? '—'}
              </Text>
              {user?.email && (
                <Text style={[typography.small, { color: 'rgba(255,255,255,0.65)', marginTop: 1 }]}>
                  {user.email}
                </Text>
              )}
            </View>
            <Pressable onPress={() => setShowName(true)} style={styles.editBadge}>
              <Ionicons name="pencil" size={13} color="#fff" />
            </Pressable>
          </LinearGradient>
          <View style={[styles.rolePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.label, { color: theme.primary }]}>{roleBadge.toUpperCase()}</Text>
            {user?.is_verified && <Ionicons name="checkmark-circle" size={14} color={theme.success} />}
          </View>
        </Animated.View>

        <Section label="APPEARANCE" delay={100}>
          <Row icon="moon-outline"          label="Dark Mode"     value={mode === 'dark' ? 'On' : 'Off'} right={<ThemeToggle />} />
          <Row icon="notifications-outline" label="Notifications" value="WhatsApp + Push" onPress={() => {}} />
        </Section>

        <Section label="ACCOUNT" delay={160}>
          <Row icon="lock-closed-outline"      label="Change Password"  onPress={() => setShowPassword(true)} />
          <Row icon="phone-portrait-outline"   label="Update Phone"     value={user?.phone_number} onPress={() => setShowPhone(true)} />
          <Row icon="mail-outline"             label="Update Email"     value={user?.email || 'Not set'} onPress={() => setShowEmail(true)} />
          <Row icon="shield-checkmark-outline" label="KYC Verification" value={user?.is_verified ? 'Verified' : 'Not verified'} onPress={() => router.push('/(onboarding)/index')} />
        </Section>

        <Section label="SUPPORT" delay={220}>
          <Row icon="chatbubble-ellipses-outline" label="Help Center"    onPress={() => {}} />
          <Row icon="star-outline"                label="Rate the App"   onPress={() => {}} />
          <Row icon="document-text-outline"       label="Privacy Policy" onPress={() => {}} />
          <Row icon="reader-outline"              label="Terms of Use"   onPress={() => {}} />
        </Section>

        <Section delay={280}>
          <Row icon="log-out-outline" label="Log Out"        onPress={handleLogout} danger />
          <Row icon="trash-outline"   label="Delete Account" onPress={() => Alert.alert('Delete Account', 'Contact support to delete your account.')} danger />
        </Section>

        <Animated.View entering={FadeInDown.delay(340).springify()}>
          <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 8 }]}>
            PropMan v1.0.0 · Built in Lagos
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <SheetModal visible={showPassword} onClose={() => setShowPassword(false)} title="Change Password">
        <View style={styles.sheetBody}>
          <Input label="Current Password" placeholder="Enter current password" secureTextEntry={!showCur}
            value={curPass} onChangeText={setCurPass}
            rightIcon={<Ionicons name={showCur ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />}
            onRightPress={() => setShowCur(v => !v)} />
          <Input label="New Password" placeholder="Min. 8 characters" secureTextEntry={!showNew}
            value={newPass} onChangeText={setNewPass}
            rightIcon={<Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />}
            onRightPress={() => setShowNew(v => !v)} />
          <Input label="Confirm New Password" placeholder="Re-enter new password" secureTextEntry={!showNew}
            value={confPass} onChangeText={setConfPass} />
          <Button title="Update Password" onPress={handleChangePassword} loading={loading} size="lg" />
        </View>
      </SheetModal>

      {/* ── Update Email Modal ── */}
      <SheetModal visible={showEmail} onClose={() => setShowEmail(false)} title="Update Email">
        <View style={styles.sheetBody}>
          <Input label="Email Address" placeholder="you@example.com" keyboardType="email-address"
            autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Button title="Save Email" onPress={handleUpdateEmail} loading={loading} size="lg" />
        </View>
      </SheetModal>

      {/* ── Update Phone Modal ── */}
      <SheetModal visible={showPhone} onClose={() => { setShowPhone(false); setPhoneStep('enter'); setNewPhone(''); setPhoneOtp(''); }} title="Update Phone Number">
        <View style={styles.sheetBody}>
          {phoneStep === 'enter' ? (
            <>
              <Input label="New Phone Number" placeholder="08012345678" keyboardType="phone-pad"
                value={newPhone} onChangeText={setNewPhone} />
              <Button title="Send OTP" onPress={handlePhoneRequest} loading={loading} size="lg" />
            </>
          ) : (
            <>
              <Text style={[typography.small, { color: theme.textMuted, marginBottom: 12 }]}>
                Enter the 6-digit OTP sent to {newPhone}
              </Text>
              <Input label="OTP Code" placeholder="123456" keyboardType="number-pad"
                value={phoneOtp} onChangeText={setPhoneOtp} />
              <Button title="Verify & Update" onPress={handlePhoneVerify} loading={loading} size="lg" />
              <Button title="Resend OTP" onPress={handlePhoneRequest} variant="ghost" size="lg" />
            </>
          )}
        </View>
      </SheetModal>

      {/* ── Update Name Modal ── */}
      <SheetModal visible={showName} onClose={() => setShowName(false)} title="Edit Profile">
        <View style={styles.sheetBody}>
          <Input label="First Name" placeholder="First name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name"  placeholder="Last name"  value={lastName}  onChangeText={setLastName}  />
          <Button title="Save Changes" onPress={handleUpdateName} loading={loading} size="lg" />
        </View>
      </SheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 20 },
  section:       { marginBottom: 24 },
  card:          { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBubble:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent:    { flex: 1, gap: 2 },
  rowRight:      { marginLeft: 8 },
  profileCard:   { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar:  { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage:    { width: 56, height: 56, borderRadius: 28 },
  avatarOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  editBadge:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  rolePill:      { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetBody:     { gap: 14 },
});
