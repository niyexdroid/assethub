import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Input }  from '../../../components/ui/Input';
import { typography } from '../../../constants/typography';
import { propertiesService } from '../../../services/properties.service';
import { LAGOS_LGAS } from '../../../constants/lgas';

const TYPES       = ['Apartment', 'Self Contain', 'Room', 'Hostel', 'Bedspace'];
const MODES       = ['monthly', 'yearly', 'both'];
const MODE_LABELS : Record<string, string> = { monthly: 'Monthly', yearly: 'Yearly', both: 'Both' };
const MAX_PHOTOS  = 5;

export default function CreateListingScreen() {
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  const { edit_id } = useLocalSearchParams<{ edit_id?: string }>();
  const isEdit = !!edit_id;

  const [loading,      setLoading]      = useState(false);
  const [initialising, setInitialising] = useState(isEdit);

  // Form fields
  const [title,  setTitle]  = useState('');
  const [addr,   setAddr]   = useState('');
  const [rent,   setRent]   = useState('');
  const [type,   setType]   = useState('');
  const [mode,   setMode]   = useState('monthly');
  const [lga,    setLga]    = useState('');
  const [beds,   setBeds]   = useState('');
  const [baths,  setBaths]  = useState('');
  const [desc,        setDesc]        = useState('');
  const [caution,     setCaution]     = useState('');
  const [agency,      setAgency]      = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Photos: existing URLs (from server) + new local URIs to upload
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos,      setNewPhotos]      = useState<string[]>([]);

  const totalPhotos = existingPhotos.length + newPhotos.length;

  // Load property data when editing
  useEffect(() => {
    if (!edit_id) return;
    propertiesService.getById(edit_id)
      .then(p => {
        setTitle(p.title ?? '');
        setAddr(p.address ?? '');
        setMode(p.tenancy_mode ?? 'monthly');
        setType(
          TYPES.find(t => t.toLowerCase().replace(' ', '_') === p.property_type) ??
          (p.property_type ? p.property_type.replace('_', ' ') : '')
        );
        setLga(p.lga ?? '');
        setBeds(p.bedrooms != null  ? String(p.bedrooms)  : '');
        setBaths(p.bathrooms != null ? String(p.bathrooms) : '');
        setDesc(p.description ?? '');
        setCaution(p.caution_fee != null ? String(p.caution_fee) : '');
        setAgency(p.agency_fee   != null ? String(p.agency_fee)  : '');
        setIsAvailable(p.is_available ?? true);
        setExistingPhotos(Array.isArray(p.photos) ? p.photos : []);
        // Prefill rent with whichever value exists
        const r = p.monthly_rent ?? p.yearly_rent;
        if (r) setRent(String(r));
      })
      .catch(() => Alert.alert('Error', 'Could not load listing data.'))
      .finally(() => setInitialising(false));
  }, [edit_id]);

  const pickImages = async () => {
    const remaining = MAX_PHOTOS - totalPhotos;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can add up to ${MAX_PHOTOS} photos per listing.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri).slice(0, remaining);
      setNewPhotos(prev => [...prev, ...uris]);
    }
  };

  const removeExistingPhoto = (url: string) => {
    setExistingPhotos(prev => prev.filter(p => p !== url));
  };

  const removeNewPhoto = (uri: string) => {
    setNewPhotos(prev => prev.filter(p => p !== uri));
  };

  const onSubmit = async () => {
    if (!title || !addr || !rent || !type || !lga) {
      Alert.alert('Missing fields', 'Please fill in title, address, rent, type and area.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        address: addr,
        ...(mode !== 'yearly'  && { monthly_rent: Number(rent) }),
        ...(mode !== 'monthly' && { yearly_rent:  Number(rent) }),
        tenancy_mode: mode,
        property_type: type.toLowerCase().replace(' ', '_'),
        lga,
        ...(beds  && { bedrooms:  Number(beds)  }),
        ...(baths && { bathrooms: Number(baths) }),
        ...(desc    && { description: desc }),
        caution_fee: caution ? Number(caution) : 0,
        agency_fee:  agency  ? Number(agency)  : 0,
        is_available: isAvailable,
        state: 'Lagos',
      };

      let propertyId = edit_id;

      if (isEdit) {
        await propertiesService.update(edit_id!, payload);
      } else {
        const created = await propertiesService.create(payload);
        propertyId = created.id;
      }

      // Upload new photos if any
      if (newPhotos.length > 0 && propertyId) {
        const files = newPhotos.map(uri => ({
          uri,
          name: uri.split('/').pop() ?? 'photo.jpg',
          type: 'image/jpeg',
        }));
        await propertiesService.addPhotos(propertyId, files);
      }

      Alert.alert(
        isEdit ? 'Listing Updated' : 'Listing Published',
        isEdit ? 'Your changes have been saved.' : 'Your property is now live.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not save listing.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialising) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: theme.textMuted }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
          <Text style={[typography.label, { color: theme.primaryLight }]}>Back</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 28 }}>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>{isEdit ? 'Edit Listing' : 'List a Property'}</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            {isEdit ? 'Update your listing details' : 'Fill in the details to publish your listing'}
          </Text>
        </Animated.View>

        <View style={{ gap: 16 }}>
          <Input label="Property Title" placeholder="e.g. Modern 2 Bedroom Flat" value={title} onChangeText={setTitle} />
          <Input label="Full Address" placeholder="Street, area, state" value={addr} onChangeText={setAddr} />
          <Input label="Rent Amount (₦)" placeholder="e.g. 85000" value={rent} onChangeText={setRent} keyboardType="number-pad" />

          {/* Property Type */}
          <View>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>PROPERTY TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TYPES.map(t => (
                <Pressable key={t} onPress={() => setType(t)}
                  style={[styles.chip, { backgroundColor: type === t ? theme.primary + '22' : theme.surface, borderColor: type === t ? theme.primary : theme.border }]}>
                  <Text style={[typography.small, { color: type === t ? theme.primary : theme.textSecondary, fontWeight: type === t ? '700' : '400' }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tenancy Mode */}
          <View>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>TENANCY MODE</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MODES.map(m => (
                <Pressable key={m} onPress={() => setMode(m)}
                  style={[styles.chip, { backgroundColor: mode === m ? theme.primary + '22' : theme.surface, borderColor: mode === m ? theme.primary : theme.border }]}>
                  <Text style={[typography.small, { color: mode === m ? theme.primary : theme.textSecondary, fontWeight: mode === m ? '700' : '400' }]}>{MODE_LABELS[m]}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* LGA */}
          <View>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>LGA / AREA</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LAGOS_LGAS.map(l => (
                <Pressable key={l} onPress={() => setLga(l)}
                  style={[styles.chip, { backgroundColor: lga === l ? theme.accent + '20' : theme.surface, borderColor: lga === l ? theme.accent : theme.border }]}>
                  <Text style={[typography.small, { color: lga === l ? theme.accent : theme.textSecondary, fontWeight: lga === l ? '700' : '400' }]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bedrooms / Bathrooms */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Bedrooms" placeholder="e.g. 2" value={beds} onChangeText={setBeds} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Bathrooms" placeholder="e.g. 1" value={baths} onChangeText={setBaths} keyboardType="number-pad" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Caution Fee (₦)" placeholder="e.g. 50000" value={caution} onChangeText={setCaution} keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Agency Fee (₦)" placeholder="e.g. 10000" value={agency} onChangeText={setAgency} keyboardType="number-pad" />
            </View>
          </View>

          <Input label="Description" placeholder="Describe the property, neighbourhood, features..." value={desc} onChangeText={setDesc} multiline numberOfLines={4} />

          {/* Availability */}
          <View>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>AVAILABILITY</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[true, false].map(val => {
                const active = isAvailable === val;
                return (
                  <Pressable
                    key={String(val)}
                    onPress={() => setIsAvailable(val)}
                    style={[
                      styles.chip,
                      { flex: 1, justifyContent: 'center', alignItems: 'center',
                        backgroundColor: active ? (val ? theme.primary + '22' : theme.dangerBg) : theme.surface,
                        borderColor:     active ? (val ? theme.primary        : theme.danger)  : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={val ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      size={16}
                      color={active ? (val ? theme.primary : theme.danger) : theme.textMuted}
                    />
                    <Text style={[typography.small, {
                      marginLeft: 6,
                      fontWeight: active ? '700' : '400',
                      color: active ? (val ? theme.primary : theme.danger) : theme.textSecondary,
                    }]}>
                      {val ? 'Available' : 'Occupied / Taken'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Photos */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[typography.label, { color: theme.textMuted }]}>PHOTOS ({totalPhotos}/{MAX_PHOTOS})</Text>
              {totalPhotos < MAX_PHOTOS && (
                <Pressable onPress={pickImages} style={[styles.addPhotoBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]}>
                  <Ionicons name="add" size={16} color={theme.primary} />
                  <Text style={[typography.small, { color: theme.primary, fontWeight: '600' }]}>Add Photos</Text>
                </Pressable>
              )}
            </View>

            {totalPhotos === 0 ? (
              <Pressable onPress={pickImages} style={[styles.photoPlaceholder, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Ionicons name="camera-outline" size={32} color={theme.textMuted} />
                <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>Tap to add up to {MAX_PHOTOS} photos</Text>
              </Pressable>
            ) : (
              <View style={styles.photoGrid}>
                {/* Existing photos from server */}
                {existingPhotos.map(url => (
                  <View key={url} style={styles.photoWrap}>
                    <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                    <Pressable onPress={() => removeExistingPhoto(url)} style={styles.removeBtn} hitSlop={4}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {/* New local photos */}
                {newPhotos.map(uri => (
                  <View key={uri} style={styles.photoWrap}>
                    <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
                    <Pressable onPress={() => removeNewPhoto(uri)} style={styles.removeBtn} hitSlop={4}>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                    </Pressable>
                    <View style={styles.newBadge}>
                      <Text style={{ fontSize: 9, color: '#fff', fontWeight: '700' }}>NEW</Text>
                    </View>
                  </View>
                ))}
                {/* Add more slot */}
                {totalPhotos < MAX_PHOTOS && (
                  <Pressable onPress={pickImages} style={[styles.photoAddSlot, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Ionicons name="add" size={28} color={theme.textMuted} />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <Button title={isEdit ? 'Save Changes' : 'Publish Listing'} onPress={onSubmit} size="lg" loading={loading} />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PHOTO_SIZE = 100;

const styles = StyleSheet.create({
  container:      { padding: 20, paddingBottom: 40 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  addPhotoBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  photoPlaceholder: { height: 120, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrap:      { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo:          { width: PHOTO_SIZE, height: PHOTO_SIZE },
  removeBtn:      { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
  newBadge:       { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#12A376', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  photoAddSlot:   { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
