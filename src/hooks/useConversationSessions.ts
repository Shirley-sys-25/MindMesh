import { useCallback, useEffect, useState } from 'react';
import type { ConversationSession } from '../lib/appTypes';

interface UseConversationSessionsArgs {
  apiBaseUrl: string;
  getAuthorizationHeaders: () => Promise<Record<string, string>>;
  enabled?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toTrimmedString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSession = (value: unknown): ConversationSession | null => {
  if (!isRecord(value)) return null;

  const sessionId = toTrimmedString(value.sessionId ?? value.session_id);
  if (!sessionId) return null;

  const objectiveHistoryValue = value.objectiveHistory ?? value.objective_history;
  const objectiveHistory = Array.isArray(objectiveHistoryValue)
    ? objectiveHistoryValue
        .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item: string) => item.trim())
        .slice(0, 12)
    : [];

  return {
    sessionId,
    userSub: toTrimmedString(value.userSub ?? value.user_sub),
    currentObjective: toTrimmedString(value.currentObjective ?? value.current_objective),
    sessionSummary: toTrimmedString(value.sessionSummary ?? value.session_summary),
    firstMessagePreview: toTrimmedString(value.firstMessagePreview ?? value.first_message_preview),
    currentView: toTrimmedString(value.currentView ?? value.current_view),
    activeTab: toTrimmedString(value.activeTab ?? value.active_tab),
    objectiveStep: toNumber(value.objectiveStep ?? value.objective_step, 0),
    objectiveProgress: toNumber(value.objectiveProgress ?? value.objective_progress, 0),
    objectiveHistory,
    messageCount: toNumber(value.messageCount ?? value.message_count, 0),
    lastMessagePreview: toTrimmedString(value.lastMessagePreview ?? value.last_message_preview),
    updatedAt: toTrimmedString(value.updatedAt ?? value.updated_at),
    lastActivityAt: toTrimmedString(value.lastActivityAt ?? value.last_activity_at),
  };
};

export const useConversationSessions = ({ apiBaseUrl, getAuthorizationHeaders, enabled = true }: UseConversationSessionsArgs) => {
  const [conversationSessions, setConversationSessions] = useState<ConversationSession[]>([]);
  const [isLoadingConversationSessions, setIsLoadingConversationSessions] = useState(false);

  const refreshConversationSessions = useCallback(async () => {
    if (!enabled) return;

    setIsLoadingConversationSessions(true);

    try {
      const authHeaders = await getAuthorizationHeaders();
      const response = await fetch(`${apiBaseUrl}/api/sessions?limit=12`, {
        headers: {
          ...authHeaders,
        },
      });

      if (!response.ok) return;

      const payload: unknown = await response.json();
      const sessionsValue = isRecord(payload) ? payload.sessions : null;
      const sessions = Array.isArray(sessionsValue)
        ? sessionsValue
            .map(normalizeSession)
            .filter((item): item is ConversationSession => item !== null)
        : [];

      setConversationSessions(sessions);
    } catch (error) {
      console.error('Sessions conversation indisponibles:', error);
    } finally {
      setIsLoadingConversationSessions(false);
    }
  }, [apiBaseUrl, enabled, getAuthorizationHeaders]);

  useEffect(() => {
    void refreshConversationSessions();
  }, [refreshConversationSessions]);

  return {
    conversationSessions,
    isLoadingConversationSessions,
    refreshConversationSessions,
    setConversationSessions,
  };
};
