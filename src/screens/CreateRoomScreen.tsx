import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { theme, datingTheme } from '../theme';
import { PrimaryButton, Chip } from '../components/ui';
import { useAppState } from '../hooks/useAppState';

interface Props {
  onCreateRoom: (title: string, vibe: string, maxParticipants: number) => void;
  onBack?: () => void;
}

const VIBES = ['Casual', 'Adventurous', 'Romantic', 'Intellectual', 'Playful', 'Cozy'];
const PARTICIPANT_COUNTS = [2, 3, 4, 5, 6];

export function CreateRoomScreen({ onCreateRoom, onBack }: Props) {
  const { datePreferences } = useAppState();
  const [title, setTitle] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
  const [maxParticipants, setMaxParticipants] = useState(4);

  const prefActivitiesCount = datePreferences?.activities?.length || 0;
  const prefFoodsCount = datePreferences?.foods?.length || 0;
  const prefDrinksCount = datePreferences?.drinks?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={10}>
          <ArrowLeft size={24} color={datingTheme.color.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Create Your Room</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Room Title (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chill coffee date vibes"
            placeholderTextColor={datingTheme.color.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Room Vibe</Text>
          <View style={styles.chipGroup}>
            {VIBES.map(vibe => (
              <Chip
                key={vibe}
                active={selectedVibe === vibe}
                onPress={() => setSelectedVibe(vibe)}
              >
                {vibe}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Max Participants</Text>
          <View style={styles.chipGroup}>
            {PARTICIPANT_COUNTS.map(count => (
              <Chip
                key={count}
                active={maxParticipants === count}
                onPress={() => setMaxParticipants(count)}
              >
                {count.toString()}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Your Preferences</Text>
          <Text style={styles.summaryText}>
            Activities: {prefActivitiesCount} | Foods: {prefFoodsCount} | Drinks: {prefDrinksCount}
          </Text>
          <Text style={styles.summaryNote}>We'll use these to calculate compatibility.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton onPress={() => onCreateRoom(title, selectedVibe, maxParticipants)}>
          Go Live 🎤
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: datingTheme.color.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: datingTheme.geometry.pagePaddingHorizontal,
    paddingVertical: datingTheme.space.md,
  },
  backButton: {
    marginRight: datingTheme.space.md,
  },
  title: {
    fontFamily: datingTheme.typography.serif,
    fontSize: theme.font.h1,
    color: datingTheme.color.textPrimary,
  },
  scrollContent: {
    padding: datingTheme.geometry.pagePaddingHorizontal,
    paddingBottom: 40,
  },
  section: {
    marginBottom: datingTheme.space.xxl,
  },
  label: {
    fontFamily: datingTheme.typography.sans,
    fontSize: theme.font.body,
    fontWeight: '600',
    color: datingTheme.color.textPrimary,
    marginBottom: datingTheme.space.sm,
  },
  input: {
    backgroundColor: datingTheme.color.surface,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    borderRadius: datingTheme.radius.md,
    padding: datingTheme.space.md,
    fontSize: theme.font.body,
    color: datingTheme.color.textPrimary,
    minHeight: datingTheme.geometry.minTouchTarget,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: datingTheme.space.sm,
  },
  summaryBox: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.card,
    padding: datingTheme.space.lg,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    marginTop: datingTheme.space.md,
  },
  summaryTitle: {
    fontSize: theme.font.h2,
    fontWeight: '600',
    color: datingTheme.color.textPrimary,
    marginBottom: datingTheme.space.xs,
  },
  summaryText: {
    fontSize: theme.font.secondary,
    color: datingTheme.color.textSecondary,
    marginBottom: datingTheme.space.xs,
  },
  summaryNote: {
    fontSize: theme.font.caption,
    color: datingTheme.color.textMuted,
  },
  footer: {
    padding: datingTheme.geometry.pagePaddingHorizontal,
    paddingBottom: datingTheme.space.xl,
    backgroundColor: datingTheme.color.background,
  },
});
