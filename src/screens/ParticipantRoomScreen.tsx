import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, datingTheme } from '../theme';
import { PrimaryButton } from '../components/ui';
import { RoomInfo } from './HostLobbyScreen';
import { GamePhase } from './HostRoomScreen';

// Ensure the GamePhase is imported or redefined correctly.
// Instead of import { GamePhase } from './HostRoomScreen', redefined for simplicity if needed or we can keep it imported.
// But we actually exported it from HostRoomScreen so it's fine.

type ParticipantPhase = GamePhase | 'lobby' | 'eliminated';

interface HostProfile {
  name: string;
  photo: string;
}

interface Props {
  room: RoomInfo;
  hostProfile: HostProfile;
  phase: ParticipantPhase;
  question?: string;
  isEliminated: boolean;
  isMatched: boolean;
  onSubmitAnswer: (answer: string) => void;
  onStartChat: () => void;
  onLeave: () => void;
}

export function ParticipantRoomScreen({
  room, hostProfile, phase, question, isEliminated, isMatched,
  onSubmitAnswer, onStartChat, onLeave
}: Props) {
  const [answer, setAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmitAnswer(answer);
    setHasSubmitted(true);
  };

  const renderLobby = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Waiting for Host...</Text>
      <View style={styles.hostPreview}>
        <View style={styles.avatarBlurred} />
        <Text style={styles.hostName}>{hostProfile.name} is preparing the room.</Text>
      </View>
    </View>
  );

  const renderRound1 = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>First Impressions</Text>
      <Text style={styles.subtitle}>The host is evaluating your profile...</Text>
    </View>
  );

  const renderRound2 = () => (
    <View style={styles.containerWithPadding}>
      <Text style={styles.title}>Icebreaker Time</Text>
      {question ? (
        <View style={styles.card}>
          <Text style={styles.questionText}>{question}</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your answer here..."
            value={answer}
            onChangeText={setAnswer}
            multiline
            editable={!hasSubmitted}
          />
          <PrimaryButton onPress={handleSubmit} disabled={hasSubmitted || !answer}>
            {hasSubmitted ? 'Submitted!' : 'Submit Answer'}
          </PrimaryButton>
        </View>
      ) : (
        <Text style={styles.subtitle}>Waiting for the host to ask a question...</Text>
      )}
    </View>
  );

  const renderReveal = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Full Reveal</Text>
      <Text style={styles.subtitle}>Your full profile is now visible to the host!</Text>
    </View>
  );

  const renderFinal = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>The Final Pick</Text>
      <Text style={styles.subtitle}>The host is making their final decision...</Text>
    </View>
  );

  const renderMatched = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.celebrationText}>🎉 You've been picked! 🎉</Text>
      <PrimaryButton onPress={onStartChat} style={styles.actionBtn}>
        Start Chatting
      </PrimaryButton>
    </View>
  );

  const renderEliminated = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.eliminatedText}>Not this time.</Text>
      <Text style={styles.subtitle}>Better luck next round!</Text>
      <PrimaryButton onPress={onLeave} style={styles.actionBtn}>
        Find Another Room
      </PrimaryButton>
    </View>
  );

  const renderContent = () => {
    if (isEliminated) return renderEliminated();
    if (isMatched) return renderMatched();
    
    switch (phase) {
      case 'lobby': return renderLobby();
      case 'round1': return renderRound1();
      case 'round2': return renderRound2();
      case 'reveal': return renderReveal();
      case 'final': return renderFinal();
      case 'matched': return renderMatched();
      case 'eliminated': return renderEliminated();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: datingTheme.color.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: datingTheme.geometry.pagePaddingHorizontal,
  },
  containerWithPadding: {
    flex: 1,
    padding: datingTheme.geometry.pagePaddingHorizontal,
    paddingTop: datingTheme.space.xxl,
  },
  title: {
    fontFamily: datingTheme.typography.serif,
    fontSize: theme.font.h1,
    color: datingTheme.color.textPrimary,
    marginBottom: datingTheme.space.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.font.body,
    color: datingTheme.color.textSecondary,
    textAlign: 'center',
  },
  hostPreview: {
    alignItems: 'center',
    marginTop: datingTheme.space.xl,
  },
  avatarBlurred: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: datingTheme.color.pastelRose,
    marginBottom: datingTheme.space.md,
    opacity: 0.7,
  },
  hostName: {
    fontWeight: '600',
    color: datingTheme.color.primaryDark,
  },
  card: {
    backgroundColor: datingTheme.color.surface,
    borderRadius: datingTheme.radius.cardLarge,
    padding: datingTheme.space.lg,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    marginTop: datingTheme.space.md,
  },
  questionText: {
    fontSize: theme.font.h2,
    fontWeight: '600',
    color: datingTheme.color.textPrimary,
    marginBottom: datingTheme.space.md,
  },
  input: {
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    borderRadius: datingTheme.radius.md,
    padding: datingTheme.space.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: datingTheme.space.lg,
  },
  celebrationText: {
    fontSize: theme.font.display,
    fontFamily: datingTheme.typography.serif,
    color: datingTheme.color.primary,
    marginBottom: datingTheme.space.xl,
    textAlign: 'center',
  },
  eliminatedText: {
    fontSize: theme.font.display,
    color: datingTheme.color.textMuted,
    marginBottom: datingTheme.space.md,
  },
  actionBtn: {
    width: '100%',
    minHeight: datingTheme.geometry.ctaHeight,
    marginTop: datingTheme.space.xl,
  },
});
