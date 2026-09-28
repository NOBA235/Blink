import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, datingTheme } from '../theme';
import { PrimaryButton, SecondaryButton } from '../components/ui';

export interface RoomInfo {
  id: string;
  title: string;
  vibe: string;
  maxParticipants: number;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  age: number;
  photo: string;
  joinedAt: string;
}

export interface CompatibilityScore {
  participantId: string;
  overallScore: number;
  interestOverlap: string[];
  aiInsights: string[];
}

interface Props {
  room: RoomInfo;
  participants: ParticipantInfo[];
  compatibilityScores: Record<string, CompatibilityScore>;
  onStart: () => void;
  onCancel: () => void;
}

export function HostLobbyScreen({ room, participants, compatibilityScores, onStart, onCancel }: Props) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const canStart = participants.length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Room is Live!</Text>
        <Text style={styles.subtitle}>{room.title || 'Untitled Room'}</Text>
      </View>

      <View style={styles.waitingContainer}>
        <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
        <Text style={styles.waitingText}>Waiting for participants...</Text>
      </View>
      
      <Text style={styles.countText}>
        {participants.length} of {room.maxParticipants} joined
      </Text>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {participants.map(p => {
          const score = compatibilityScores[p.id]?.overallScore;
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <View style={styles.avatarPlaceholder} />
                <View>
                  <Text style={styles.name}>{p.name}, {p.age}</Text>
                  {score !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{score}% match</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton 
          onPress={onStart} 
          disabled={!canStart}
          style={styles.startBtn}
        >
          Start the Game
        </PrimaryButton>
        <SecondaryButton onPress={onCancel}>
          Cancel Room
        </SecondaryButton>
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
    alignItems: 'center',
    paddingVertical: datingTheme.space.xl,
    paddingHorizontal: datingTheme.geometry.pagePaddingHorizontal,
  },
  title: {
    fontFamily: datingTheme.typography.serif,
    fontSize: theme.font.display,
    color: datingTheme.color.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.font.h2,
    color: datingTheme.color.textSecondary,
    marginTop: datingTheme.space.xs,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: datingTheme.space.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: datingTheme.color.primary,
    marginRight: datingTheme.space.sm,
  },
  waitingText: {
    fontSize: theme.font.body,
    color: datingTheme.color.primary,
    fontWeight: '500',
  },
  countText: {
    textAlign: 'center',
    color: datingTheme.color.textMuted,
    marginBottom: datingTheme.space.lg,
  },
  listContainer: {
    paddingHorizontal: datingTheme.geometry.pagePaddingHorizontal,
    paddingBottom: 40,
    gap: datingTheme.space.md,
  },
  card: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.cardLarge,
    padding: datingTheme.space.lg,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: datingTheme.color.pastelLavender,
    marginRight: datingTheme.space.md,
  },
  name: {
    fontSize: theme.font.h2,
    fontWeight: '600',
    color: datingTheme.color.textPrimary,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: datingTheme.color.activeBackground,
    paddingHorizontal: datingTheme.space.sm,
    paddingVertical: 2,
    borderRadius: datingTheme.radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: datingTheme.color.activeText,
    fontSize: theme.font.caption,
    fontWeight: 'bold',
  },
  footer: {
    padding: datingTheme.geometry.pagePaddingHorizontal,
    paddingBottom: datingTheme.space.xl,
    gap: datingTheme.space.md,
    backgroundColor: datingTheme.color.background,
  },
  startBtn: {
    minHeight: datingTheme.geometry.ctaHeight,
  },
});
