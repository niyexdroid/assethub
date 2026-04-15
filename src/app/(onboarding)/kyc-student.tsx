import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { typography } from '../../constants/typography';
import { kycService } from '../../services/kyc.service';

const schema = z.object({
  school_email: z.string().email('Enter a valid school email').refine(
    v => v.endsWith('.edu.ng') || v.endsWith('.edu') || v.endsWith('.ac.uk'),
    'Must be an institutional email (e.g. .edu.ng)'
  ),
  matric_number: z.string().min(6, 'Enter your matric/student ID number'),
});
type FormData = z.infer<typeof schema>;

export default function KycStudentScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
      setImageError('');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!idImage) { setImageError('Please upload your student ID card'); return; }
    setLoading(true);
    try {
      await kycService.submitStudentId(idImage, data.matric_number, data.school_email);
      router.push('/(onboarding)/kyc-review');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit student ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
            <Text style={{ fontSize: 32 }}>🎓</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
            Student Verification
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 22 }]}>
            Unlock hostel listings, bedspaces, and roommate matching with student KYC.
          </Text>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.benefitsRow}>
          {['Hostel listings', 'Roommate match', 'Student rates'].map(b => (
            <Badge key={b} label={b} variant="success" />
          ))}
        </Animated.View>

        {/* School ID Upload */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>
            SCHOOL ID CARD
          </Text>
          <Pressable onPress={pickImage}
            style={[styles.uploadBox, {
              backgroundColor: theme.surface,
              borderColor: imageError ? theme.danger : idImage ? theme.primary : theme.border,
              borderStyle: idImage ? 'solid' : 'dashed',
            }]}>
            {idImage ? (
              <Image source={{ uri: idImage }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 36 }}>📷</Text>
                <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>Upload Student ID</Text>
                <Text style={[typography.small, { color: theme.textMuted }]}>Tap to choose from gallery</Text>
                <Text style={[typography.caption, { color: theme.textMuted }]}>JPEG or PNG · Max 5 MB</Text>
              </View>
            )}
          </Pressable>
          {imageError ? (
            <Text style={[typography.caption, { color: theme.danger, marginTop: 4 }]}>{imageError}</Text>
          ) : null}
          {idImage && (
            <Pressable onPress={pickImage} style={{ alignSelf: 'center', marginTop: 8 }}>
              <Text style={[typography.small, { color: theme.primaryLight }]}>Change photo</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <Controller
            control={control}
            name="school_email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="School / Institutional Email"
                placeholder="you@unilag.edu.ng"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.school_email?.message}
                hint="We'll send a verification OTP to this email"
                leftIcon={<Text style={{ fontSize: 16 }}>✉️</Text>}
              />
            )}
          />

          <Controller
            control={control}
            name="matric_number"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Matric / Student ID Number"
                placeholder="e.g. 190501009"
                value={value}
                onChangeText={onChange}
                autoCapitalize="characters"
                error={errors.matric_number?.message}
                leftIcon={<Text style={{ fontSize: 16 }}>🔢</Text>}
              />
            )}
          />

          <Button
            title="Submit for Verification"
            onPress={handleSubmit(onSubmit)}
            size="lg"
            loading={loading}
          />

          <Button
            title="Skip for now"
            onPress={() => router.push('/(onboarding)/kyc-review')}
            variant="ghost"
            size="lg"
          />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:       { alignItems: 'center', marginBottom: 20 },
  iconBox:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  benefitsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 },
  section:      { marginBottom: 20 },
  uploadBox:    { borderRadius: 16, borderWidth: 2, height: 180, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview:      { width: '100%', height: '100%' },
  form:         { gap: 16 },
});
