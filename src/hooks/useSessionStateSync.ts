import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

type SessionView = 'chat' | 'dashboard' | 'dashboard-debug';
type SessionTab = 'preview' | 'code';

interface UseSessionStateSyncParams {
  apiBaseUrl: string;
  sessionId: string;
  currentView: SessionView;
  activeTab: SessionTab;
  currentObjective: string | null;
  sessionSummary: string | null;
  objectiveStep: number;
  objectiveProgress: number;
  objectiveHistory: string[];
  getAuthorizationHeaders: () => Promise<Record<string, string>>;
  setCurrentObjective: Dispatch<SetStateAction<string | null>>;
  setSessionSummary: Dispatch<SetStateAction<string | null>>;
  setObjectiveHistory: Dispatch<SetStateAction<string[]>>;
  setCurrentView: Dispatch<SetStateAction<SessionView>>;
  setActiveTab: Dispatch<SetStateAction<SessionTab>>;
  setObjectiveStep: Dispatch<SetStateAction<number>>;
  setObjectiveProgress: Dispatch<SetStateAction<number>>;
}

interface PersistSessionStateArgs {
  sessionId?: string;
  currentObjective?: string | null;
  sessionSummary?: string | null;
  objectiveStep?: number;
  objectiveProgress?: number;
  objectiveHistory?: string[];
  currentView?: SessionView | null;
  activeTab?: SessionTab | null;
}

const isSessionView = (value: unknown): value is SessionView => value === 'chat' || value === 'dashboard' || value === 'dashboard-debug';

const isSessionTab = (value: unknown): value is SessionTab => value === 'preview' || value === 'code';

export const useSessionStateSync = ({
  apiBaseUrl,
  sessionId,
  currentView,
  activeTab,
  currentObjective,
  sessionSummary,
  objectiveStep,
  objectiveProgress,
  objectiveHistory,
  getAuthorizationHeaders,
  setCurrentObjective,
  setSessionSummary,
  setObjectiveHistory,
  setCurrentView,
  setActiveTab,
  setObjectiveStep,
  setObjectiveProgress,
}: UseSessionStateSyncParams) => {
  const [isSessionStateHydrated, setIsSessionStateHydrated] = useState(false);

  const loadSessionState = useCallback(async () => {
    try {
      setIsSessionStateHydrated(false);
      setCurrentObjective(null);
      setSessionSummary(null);
      setCurrentView('chat');
      setActiveTab('preview');
      setObjectiveStep(0);
      setObjectiveProgress(0);
      setObjectiveHistory([]);

      const authHeaders = await getAuthorizationHeaders();
      const response = await fetch(`${apiBaseUrl}/api/session-state?session_id=${encodeURIComponent(sessionId)}`, {
        headers: {
          ...authHeaders,
          'X-Session-Id': sessionId,
        },
      });

      if (!response.ok) return;

      const payload: any = await response.json();
      if (typeof payload?.current_objective === 'string' && payload.current_objective.trim()) {
        setCurrentObjective(payload.current_objective.trim());
      }
      if (typeof payload?.session_summary === 'string' && payload.session_summary.trim()) {
        setSessionSummary(payload.session_summary.trim());
      }
      if (isSessionView(payload?.current_view)) {
        setCurrentView(payload.current_view);
      }
      if (isSessionTab(payload?.active_tab)) {
        setActiveTab(payload.active_tab);
      }
      if (Number.isFinite(Number(payload?.objective_step))) {
        setObjectiveStep(Math.max(0, Math.min(5, Number(payload.objective_step))));
      }
      if (Number.isFinite(Number(payload?.objective_progress))) {
        setObjectiveProgress(Math.max(0, Math.min(100, Number(payload.objective_progress))));
      }
      if (Array.isArray(payload?.objective_history)) {
        setObjectiveHistory(
          payload.objective_history
            .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item: string) => item.trim())
            .slice(0, 12),
        );
      }
    } catch (error) {
      console.error('Etat session indisponible:', error);
    } finally {
      setIsSessionStateHydrated(true);
    }
  }, [apiBaseUrl, getAuthorizationHeaders, sessionId, setActiveTab, setCurrentObjective, setCurrentView, setObjectiveHistory, setObjectiveProgress, setObjectiveStep, setSessionSummary]);

  const persistSessionState = useCallback(
    async ({
      sessionId: sessionKey = sessionId,
      currentObjective: nextCurrentObjective = currentObjective,
      sessionSummary: nextSessionSummary = sessionSummary,
      objectiveStep: nextObjectiveStep = objectiveStep,
      objectiveProgress: nextObjectiveProgress = objectiveProgress,
      objectiveHistory: nextObjectiveHistory = objectiveHistory,
      currentView: nextCurrentView = currentView,
      activeTab: nextActiveTab = activeTab,
    }: PersistSessionStateArgs = {}) => {
      try {
        if (!sessionKey) return;

        const authHeaders = await getAuthorizationHeaders();
        await fetch(`${apiBaseUrl}/api/session-state`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionKey,
            ...authHeaders,
          },
          body: JSON.stringify({
            session_id: sessionKey,
            current_objective: nextCurrentObjective ?? null,
            session_summary: nextSessionSummary ?? null,
            current_view: nextCurrentView ?? null,
            active_tab: nextActiveTab ?? null,
            objective_step: Number.isFinite(nextObjectiveStep) ? nextObjectiveStep : 0,
            objective_progress: Number.isFinite(nextObjectiveProgress) ? nextObjectiveProgress : 0,
            objective_history: Array.isArray(nextObjectiveHistory)
              ? nextObjectiveHistory
                  .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                  .map((item) => item.trim())
                  .slice(0, 12)
              : [],
          }),
        });
      } catch (error) {
        console.error('Persistance session indisponible:', error);
      }
    },
    [activeTab, apiBaseUrl, currentObjective, currentView, getAuthorizationHeaders, objectiveHistory, objectiveProgress, objectiveStep, sessionId, sessionSummary],
  );

  return {
    loadSessionState,
    persistSessionState,
    isSessionStateHydrated,
  };
};
