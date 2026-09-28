import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, datingTheme } from '../theme';
import { PrimaryButton, SecondaryButton, GhostButton } from '../components/ui';
import { RoomInfo, ParticipantInfo, CompatibilityScore } from './HostLobbyScreen';

export type GamePhase = 'round1' | 'round2' | 'reveal' | 'final' | 'matched';

interface Props {
  room: RoomInfo;
  phase: GamePhase;
  participants: ParticipantInfo[];
  compatibilityScores: Record<string, CompatibilityScore>;
  aiQuestion?: string;
  participantAnswers: Record<string, string>;
  onEliminate: (participantId: string) => void;
  onAdvancePhase: () => void;
  onSendQuestion: (question: string) => void;
  onPickMatch: (participantId: string) => void;
  onStartChat: () => void;
}

export function HostRoomScreen({
  room, phase, participants, compatibilityScores, aiQuestion, participantAnswers,
  onEliminate, onAdvancePhase, onSendQuestion, onPickMatch, onStartChat
}: Props) {
  const [customQuestion, setCustomQuestion] = useState('');

  const renderRound1 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Round 1: First Impressions</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {participants.map(p => {
          const score = compatibilityScores[p.id];
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarPlaceholder} />
                <View>
                  <Text style={styles.name}>{p.name}, {p.age}</Text>
                  {score && <Text style={styles.matchText}>{score.overallScore}% AI Match</Text>}
                </View>
              </View>
              <SecondaryButton onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onEliminate(p.id);
              }}>
                Eliminate
              </SecondaryButton>
            </View>
          );
        })}
      </ScrollView>
      <PrimaryButton onPress={onAdvancePhase} style={styles.advanceBtn}>Next Round →</PrimaryButton>
    </View>
  );

  const renderRound2 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Round 2: Icebreakers</Text>
      <View style={styles.questionBox}>
        <Text style={styles.label}>Ask a Question:</Text>
        <TextInput
          style={styles.input}
          placeholder="Type a custom question..."
          value={customQuestion}
          onChangeText={setCustomQuestion}
        />
        <View style={styles.questionActions}>
          {aiQuestion && (
            <GhostButton onPress={() => setCustomQuestion(aiQuestion)}>
              Use AI: {aiQuestion}
            </GhostButton>
          )}
          <PrimaryButton onPress={() => onSendQuestion(customQuestion || aiQuestion || 'What is your favorite hobby?')} style={styles.askBtn}>
            Send
          </PrimaryButton>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.list}>
        {participants.map(p => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.answerText}>
              {participantAnswers[p.id] || 'Waiting for answer...'}
            </Text>
            <SecondaryButton onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                onEliminate(p.id);
              }}
              style={{ marginTop: theme.space.md }}>
              Eliminate
            </SecondaryButton>
          </View>
        ))}
      </ScrollView>
      <PrimaryButton onPress={onAdvancePhase} style={styles.advanceBtn}>Reveal →</PrimaryButton>
    </View>
  );

  const renderReveal = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Full Reveal</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {participants.map(p => {
          const score = compatibilityScores[p.id];
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.avatarLarge} />
              <Text style={styles.nameLarge}>{p.name}, {p.age}</Text>
              {score && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsTitle}>AI Compatibility Breakdown:</Text>
                  {score.aiInsights.map((insight, i) => (
                    <Text key={i} style={styles.insightText}>• {insight}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <PrimaryButton onPress={onAdvancePhase} style={styles.advanceBtn}>Make Your Pick →</PrimaryButton>
    </View>
  );

  const renderFinal = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>The Pick</Text>
      <Text style={styles.subtitle}>Who will you choose?</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {participants.map(p => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.name}>{p.name}</Text>
            </View>
            <PrimaryButton onPress={() => onPickMatch(p.id)}>
              Pick {p.name}
            </PrimaryButton>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderMatched = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.celebrationText}>🎉 You Have a Match! 🎉</Text>
      <PrimaryButton onPress={onStartChat} style={styles.chatBtn}>Start Chatting</PrimaryButton>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {phase === 'round1' && renderRound1()}
      {phase === 'round2' && renderRound2()}
      {phase === 'reveal' && renderReveal()}
      {phase === 'final' && renderFinal()}
      {phase === 'matched' && renderMatched()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: datingTheme.color.background,
  },
  phaseContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: datingTheme.geometry.pagePaddingHorizontal,
  },
  phaseTitle: {
    fontFamily: datingTheme.typography.serif,
    fontSize: theme.font.h1,
    color: datingTheme.color.textPrimary,
    textAlign: 'center',
    paddingVertical: datingTheme.space.md,
  },
  subtitle: {
    textAlign: 'center',
    color: datingTheme.color.textSecondary,
    marginBottom: datingTheme.space.md,
  },
  list: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: datingTheme.space.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: datingTheme.color.pastelRose,
    marginRight: datingTheme.space.md,
  },
  name: {
    fontSize: theme.font.h2,
    fontWeight: '600',
    color: datingTheme.color.textPrimary,
  },
  matchText: {
    color: datingTheme.color.primary,
    fontWeight: '500',
  },
  advanceBtn: {
    margin: datingTheme.geometry.pagePaddingHorizontal,
    minHeight: datingTheme.geometry.ctaHeight,
  },
  questionBox: {
    marginHorizontal: datingTheme.geometry.pagePaddingHorizontal,
    marginBottom: datingTheme.space.md,
    backgroundColor: datingTheme.color.surface,
    padding: datingTheme.space.lg,
    borderRadius: datingTheme.radius.card,
    borderWidth: 1,
    borderColor: datingTheme.color.border,
  },
  label: {
    fontWeight: '600',
    marginBottom: datingTheme.space.sm,
    color: datingTheme.color.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: datingTheme.color.border,
    borderRadius: datingTheme.radius.sm,
    padding: datingTheme.space.sm,
    marginBottom: datingTheme.space.sm,
    minHeight: datingTheme.geometry.minTouchTarget,
  },
  questionActions: {
    alignItems: 'flex-start',
  },
  askBtn: {
    marginTop: datingTheme.space.sm,
    alignSelf: 'stretch',
  },
  answerText: {
    marginTop: datingTheme.space.sm,
    fontStyle: 'italic',
    color: datingTheme.color.textSecondary,
  },
  avatarLarge: {
    width: '100%',
    height: 200,
    borderRadius: datingTheme.radius.md,
    backgroundColor: datingTheme.color.pastelPeach,
    marginBottom: datingTheme.space.md,
  },
  nameLarge: {
    fontSize: theme.font.display,
    fontFamily: datingTheme.typography.serif,
    color: datingTheme.color.textPrimary,
    marginBottom: datingTheme.space.sm,
  },
  detailsBox: {
    backgroundColor: datingTheme.color.pastelLavender,
    padding: datingTheme.space.md,
    borderRadius: datingTheme.radius.md,
    marginTop: datingTheme.space.sm,
  },
  detailsTitle: {
    fontWeight: 'bold',
    color: datingTheme.color.primaryDark,
    marginBottom: datingTheme.space.xs,
  },
  insightText: {
    color: datingTheme.color.textPrimary,
    marginBottom: 2,
  },
  celebrationText: {
    fontSize: theme.font.display,
    fontFamily: datingTheme.typography.serif,
    color: datingTheme.color.primary,
    marginBottom: datingTheme.space.xl,
    textAlign: 'center',
  },
  chatBtn: {
    width: '100%',
    minHeight: datingTheme.geometry.ctaHeight,
  }
});
