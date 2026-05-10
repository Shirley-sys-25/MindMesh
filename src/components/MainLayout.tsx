import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEventHandler, type RefObject } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  Code,
  Cpu,
  Download,
  Eye,
  LayoutDashboard,
  Menu,
  Mic,
  Moon,
  MessageSquareText,
  Paperclip,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sun,
  Target,
  Terminal,
  Trash2,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SignedIn } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminDashboardView from './AdminDashboardView';
import DashboardView from './DashboardView';
import PricingModal from './PricingModal';
import type {
  AttachmentPreview,
  BackendSnapshot,
  ConversationSession,
  Message,
  MetricsSnapshot,
  SessionLog,
  WorkspaceNotice,
} from '../lib/appTypes';
import {
  CHAT_ATTACHMENT_ACCEPT,
  buildConversationTitle,
  evaluatePromptSecurity,
  formatAttachmentSize,
  formatCounter,
  formatSnapshotTime,
  shrinkText,
} from '../lib/appUtils';

export type SessionView = 'chat' | 'dashboard' | 'dashboard-debug';
export type SessionTab = 'preview' | 'code';

type UserLike = {
  imageUrl?: string | null;
  firstName?: string | null;
} | null;

interface MainLayoutProps {
  user: UserLike;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  isAdmin: boolean;
  isSigningOut: boolean;
  currentView: SessionView;
  setCurrentView: (value: SessionView) => void;
  activeTab: SessionTab;
  setActiveTab: (value: SessionTab) => void;
  messages: Message[];
  message: string;
  setMessage: (value: string) => void;
  setSecurityScore: (value: number) => void;
  isLoading: boolean;
  isRecording: boolean;
  isExecutingWorkspace: boolean;
  latencyMs: number | null;
  securityScore: number;
  sessionLogs: SessionLog[];
  agentStatuses: Record<string, 'idle' | 'working'>;
  currentObjective: string | null;
  objectiveProgress: number;
  objectiveStep: number;
  objectiveHistory: string[];
  sessionSummary: string | null;
  conversationSessions: ConversationSession[];
  isLoadingConversationSessions: boolean;
  sessionId: string;
  backendSnapshot: BackendSnapshot;
  metricsSnapshot: MetricsSnapshot;
  isRefreshingSnapshot: boolean;
  refreshBackendSnapshot: () => Promise<void>;
  navigate: (path: string) => void;
  handleSignOut: () => Promise<void>;
  handleNewChat: () => void;
  clearObjective: () => void;
  openConversationSession: (conversation: ConversationSession) => Promise<void>;
  handleDeleteConversation: (conversation: ConversationSession) => Promise<void>;
  sendPrompt: (prompt: string, attachments?: AttachmentPreview[]) => Promise<void>;
  toggleRecording: () => Promise<void>;
  pushSessionLog: (message: string, tone?: SessionLog['tone']) => void;
  showWorkspaceNotice: (tone: WorkspaceNotice['tone'], text: string) => void;
  workspaceNotice: WorkspaceNotice | null;
  attachmentPreviews: AttachmentPreview[];
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  messageInputRef: RefObject<HTMLInputElement | null>;
  setAttachmentPreviews: (value: AttachmentPreview[]) => void;
  onAttachmentSelection: ChangeEventHandler<HTMLInputElement>;
  removeAttachment: (attachmentId: string) => void;
}

interface AgentItem {
  id: string;
  name: string;
  role: string;
  icon: LucideIcon;
}

const AGENTS: AgentItem[] = [
  { id: 'africonnect', name: 'AfriConnect', role: 'Traduction & Contexte Local', icon: LayoutDashboard },
  { id: 'analyste_marche', name: 'Analyste Marché', role: 'Analyse des tendances...', icon: Search },
  { id: 'stratege_seo', name: 'Stratège SEO', role: 'Optimisation visibilité', icon: Zap },
];

const markdownBubbleClass = (isDarkMode: boolean) =>
  isDarkMode
    ? 'prose prose-invert max-w-none prose-headings:text-inherit prose-p:my-3 prose-p:leading-relaxed prose-strong:text-inherit prose-em:text-inherit prose-a:text-fuchsia-300 prose-a:no-underline hover:prose-a:underline prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:marker:text-purple-400 prose-blockquote:border-purple-400/30 prose-blockquote:text-inherit prose-code:text-fuchsia-200 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:break-words prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-pre:whitespace-pre-wrap prose-pre:break-words prose-img:max-w-full prose-img:h-auto'
    : 'prose prose-slate max-w-none prose-headings:text-inherit prose-p:my-3 prose-p:leading-relaxed prose-strong:text-inherit prose-em:text-inherit prose-a:text-purple-700 prose-a:no-underline hover:prose-a:underline prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:marker:text-purple-500 prose-blockquote:border-purple-400/30 prose-blockquote:text-inherit prose-code:text-purple-700 prose-code:bg-purple-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:break-words prose-pre:bg-slate-50 prose-pre:border prose-pre:border-purple-100 prose-pre:whitespace-pre-wrap prose-pre:break-words prose-img:max-w-full prose-img:h-auto';

const markdownTableComponents = (isDarkMode: boolean) => ({
  table: ({ node, ...props }: any) => (
    <div className="my-4 overflow-x-auto">
      <table {...props} className={`min-w-full border-collapse text-sm ${isDarkMode ? 'border border-white/10' : 'border border-slate-200'}`} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead {...props} className={isDarkMode ? 'bg-white/5 text-white' : 'bg-slate-50 text-slate-900'} />,
  tbody: ({ node, ...props }: any) => <tbody {...props} className={isDarkMode ? 'divide-y divide-white/10' : 'divide-y divide-slate-200'} />,
  tr: ({ node, ...props }: any) => <tr {...props} className={isDarkMode ? 'border-white/10' : 'border-slate-200'} />,
  th: ({ node, ...props }: any) => (
    <th {...props} className={`border px-3 py-2 text-left font-semibold ${isDarkMode ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`} />
  ),
  td: ({ node, ...props }: any) => (
    <td {...props} className={`border px-3 py-2 align-top ${isDarkMode ? 'border-white/10 text-white/80' : 'border-slate-200 text-slate-700'}`} />
  ),
});

const workspaceNoticeToneClass = (isDarkMode: boolean, tone: WorkspaceNotice['tone'] | undefined) => {
  if (tone === 'success') return isDarkMode ? 'bg-green-500/10 border-green-500/30 text-green-200' : 'bg-green-50 border-green-200 text-green-700';
  if (tone === 'warn') return isDarkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-700';
  return isDarkMode ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-700';
};

const securityScoreClass = (score: number, isDarkMode: boolean) => {
  if (score >= 85) return isDarkMode ? 'text-purple-400' : 'text-purple-600';
  if (score >= 60) return isDarkMode ? 'text-amber-300' : 'text-amber-600';
  return isDarkMode ? 'text-red-300' : 'text-red-600';
};

const runtimeMeta = (snapshot: BackendSnapshot) => {
  const state = snapshot.ready === 'ready' ? 'live' : snapshot.ready === 'degraded' ? 'degraded' : snapshot.health === 'down' ? 'offline' : 'sync';
  const label = state === 'live' ? 'Live' : state === 'degraded' ? 'Degraded' : state === 'offline' ? 'Offline' : 'Sync';
  const dotClass = state === 'live'
    ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]'
    : state === 'degraded'
      ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'
      : state === 'offline'
        ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
        : 'bg-slate-400 animate-pulse';
  const textClass = state === 'live'
    ? 'text-green-600 dark:text-green-500'
    : state === 'degraded'
      ? 'text-amber-600 dark:text-amber-400'
      : state === 'offline'
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-600 dark:text-slate-300';
  return { label, dotClass, textClass };
};

export default function MainLayout({
  user,
  isDarkMode,
  setIsDarkMode,
  isAdmin,
  isSigningOut,
  currentView,
  setCurrentView,
  activeTab,
  setActiveTab,
  messages,
  message,
  setMessage,
  setSecurityScore,
  isLoading,
  isRecording,
  isExecutingWorkspace,
  latencyMs,
  securityScore,
  sessionLogs,
  agentStatuses,
  currentObjective,
  objectiveProgress,
  objectiveStep,
  objectiveHistory,
  sessionSummary,
  conversationSessions,
  isLoadingConversationSessions,
  sessionId,
  backendSnapshot,
  metricsSnapshot,
  isRefreshingSnapshot,
  refreshBackendSnapshot,
  navigate,
  handleSignOut,
  handleNewChat,
  clearObjective,
  openConversationSession,
  handleDeleteConversation,
  sendPrompt,
  toggleRecording,
  pushSessionLog,
  showWorkspaceNotice,
  workspaceNotice,
  attachmentPreviews,
  attachmentInputRef,
  messageInputRef,
  setAttachmentPreviews,
  onAttachmentSelection,
  removeAttachment,
}: MainLayoutProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileWorkspace, setShowMobileWorkspace] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
  const latestAssistantMarkdown = latestAssistantMessage.trim() ? latestAssistantMessage.replace(/\\n/g, '\n') : 'Aucune réponse disponible pour le moment.';
  const objectiveDisplayText = currentObjective && objectiveProgress >= 100 ? `${currentObjective} — objectif atteint, poursuivez la conversation ou supprimez-le.` : currentObjective;
  const completedSteps = objectiveStep;
  const markdownClass = useMemo(() => markdownBubbleClass(isDarkMode), [isDarkMode]);
  const markdownComponents = useMemo(() => markdownTableComponents(isDarkMode), [isDarkMode]);
  const noticeClass = workspaceNoticeToneClass(isDarkMode, workspaceNotice?.tone);
  const runtime = useMemo(() => runtimeMeta(backendSnapshot), [backendSnapshot]);
  const securityClass = useMemo(() => securityScoreClass(securityScore, isDarkMode), [securityScore, isDarkMode]);
  const totalMessages = messages.length;
  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  const assistantMessagesCount = messages.filter((m) => m.role === 'assistant').length;
  const failedMessagesCount = messages.filter((m) => m.role === 'system' && m.tone === 'error').length;

  useEffect(() => {
    if (!logsContainerRef.current) return;
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [sessionLogs]);

  const closeMobilePanels = useCallback(() => {
    setShowMenu(false);
    setShowMobileSidebar(false);
    setShowMobileWorkspace(false);
  }, []);

  const openUpgrade = useCallback(() => {
    closeMobilePanels();
    setShowPricingModal(true);
  }, [closeMobilePanels]);

  const handleQuickAction = useCallback((prompt: string) => {
    setMessage(prompt);
    setCurrentView('chat');
    window.setTimeout(() => messageInputRef.current?.focus(), 0);
  }, [messageInputRef, setCurrentView, setMessage]);

  const handleDownloadWorkspace = useCallback(() => {
    const exportText = latestAssistantMessage.trim();
    if (!exportText) {
      showWorkspaceNotice('warn', 'Aucun contenu a exporter pour le moment.');
      return;
    }

    const extension = activeTab === 'code' ? 'txt' : 'md';
    const mimeType = activeTab === 'code' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
    const fileName = `mindmesh-workspace-${Date.now()}.${extension}`;
    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    pushSessionLog(`Export workspace (${fileName}) termine.`, 'success');
    showWorkspaceNotice('success', 'Export telecharge avec succes.');
  }, [activeTab, latestAssistantMessage, pushSessionLog, showWorkspaceNotice]);

  const handleShareWorkspace = useCallback(async () => {
    const exportText = latestAssistantMessage.trim();
    if (!exportText) {
      showWorkspaceNotice('warn', 'Aucun contenu a partager pour le moment.');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'MindMesh Workspace', text: shrinkText(exportText, 1900) });
        pushSessionLog('Partage workspace effectue.', 'success');
        showWorkspaceNotice('success', 'Contenu partage avec succes.');
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
        pushSessionLog('Copie workspace dans le presse-papiers.', 'success');
        showWorkspaceNotice('success', 'Contenu copie dans le presse-papiers.');
        return;
      }

      throw new Error('CLIPBOARD_UNAVAILABLE');
    } catch (error) {
      console.error('Partage workspace impossible:', error);
      pushSessionLog('Partage workspace impossible.', 'warn');
      showWorkspaceNotice('warn', 'Partage indisponible sur ce navigateur.');
    }
  }, [latestAssistantMessage, pushSessionLog, showWorkspaceNotice]);

  const handleExecuteWorkspace = useCallback(async () => {
    if (isLoading || isExecutingWorkspace) return;

    const workspaceSeed = latestAssistantMessage.trim();
    if (!workspaceSeed) {
      showWorkspaceNotice('warn', 'Aucune sortie IA disponible a executer.');
      return;
    }

    setCurrentView('chat');
    setShowMobileWorkspace(false);
    pushSessionLog('Execution workspace declenchee...', 'info');
    showWorkspaceNotice('info', 'Execution en cours via l\'orchestrateur.');
    await sendPrompt('Transforme la sortie suivante en plan d\'execution operationnel avec checklist actionnable, risques et priorites:\n\n' + workspaceSeed);
  }, [isExecutingWorkspace, isLoading, latestAssistantMessage, pushSessionLog, sendPrompt, setCurrentView, showWorkspaceNotice]);

  const handleSend = useCallback(async () => {
    const selectedAttachments = attachmentPreviews;
    try {
      await sendPrompt(message, selectedAttachments);
    } finally {
      if (selectedAttachments.length > 0) {
        setAttachmentPreviews([]);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      }
    }
  }, [attachmentPreviews, attachmentInputRef, message, sendPrompt, setAttachmentPreviews]);

  const handleOpenConversation = useCallback(async (conversation: ConversationSession) => {
    closeMobilePanels();
    await openConversationSession(conversation);
  }, [closeMobilePanels, openConversationSession]);

  const handleDeleteConversationLocal = useCallback(async (conversation: ConversationSession) => {
    closeMobilePanels();
    await handleDeleteConversation(conversation);
  }, [closeMobilePanels, handleDeleteConversation]);

  const handleNewChatLocal = useCallback(() => {
    closeMobilePanels();
    handleNewChat();
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }, [attachmentInputRef, closeMobilePanels, handleNewChat]);

  const handleSignOutLocal = useCallback(async () => {
    closeMobilePanels();
    await handleSignOut();
  }, [closeMobilePanels, handleSignOut]);

  const openDebugDashboard = useCallback(() => {
    if (!isAdmin) return;
    setCurrentView('dashboard-debug');
  }, [isAdmin, setCurrentView]);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[var(--background)] text-[var(--text)] font-sans overflow-x-hidden relative transition-colors duration-500 lg:h-screen lg:flex-row lg:overflow-hidden">
      <div className={`absolute top-[-200px] right-[-100px] h-[900px] w-[900px] rounded-full blur-[180px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-400/15'}`} />
      <div className={`absolute bottom-[-250px] left-[-100px] h-[800px] w-[800px] rounded-full blur-[160px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-pink-600/5' : 'bg-pink-400/10'}`} />
      <div className={`absolute top-1/2 left-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[220px] pointer-events-none transition-colors duration-1000 ${isDarkMode ? 'bg-purple-600/5' : 'bg-purple-400/10'}`} />
      <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-[0.08]" />

      <div className="fixed left-3 right-3 top-3 z-[60] flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => { setShowMobileWorkspace(false); setShowMobileSidebar((prev) => !prev); setShowMenu(false); }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white shadow-2xl backdrop-blur-xl"
          aria-label="Ouvrir la navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.28em] text-purple-200 shadow-2xl backdrop-blur-xl">
          MindMesh
        </div>

        <button
          type="button"
          onClick={() => {
            if (currentView === 'chat' && messages.length > 0) {
              setShowMobileSidebar(false);
              setShowMobileWorkspace((prev) => !prev);
              setShowMenu(false);
            }
          }}
          className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl backdrop-blur-xl disabled:opacity-40"
          disabled={currentView !== 'chat' || messages.length === 0}
          aria-label="Ouvrir l'espace de travail"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Workspace</span>
        </button>

        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsDarkMode(!isDarkMode)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-white shadow-2xl backdrop-blur-xl" aria-label="Changer le thème">
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>
      </div>

      {(showMobileSidebar || showMobileWorkspace) && (
        <button type="button" onClick={closeMobilePanels} className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden" aria-label="Fermer les panneaux" />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 m-0 w-[86vw] max-w-[20rem] -translate-x-full overflow-y-auto glass-dark rounded-none rounded-r-[40px] border border-white/10 flex flex-col p-5 shadow-2xl relative shrink-0 transition-transform duration-300 lg:static lg:z-20 lg:m-4 lg:w-72 lg:translate-x-0 lg:overflow-hidden lg:rounded-[40px] lg:p-6 ${showMobileSidebar ? 'translate-x-0' : 'lg:translate-x-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex cursor-pointer items-center gap-3">
              <Brain className="w-9 h-9 text-purple-600 dark:text-fuchsia-400 drop-shadow-md" />
              <span className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-purple-950'}`}>MindMesh</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={closeMobilePanels} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors lg:hidden" aria-label="Fermer la navigation">
                <X className="h-4 w-4" />
              </button>

              <motion.button whileHover={{ scale: 1.1, rotate: 10 }} whileTap={{ scale: 0.9 }} onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-purple-400 hover:text-white transition-colors" aria-label="Changer le thème">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          <button onClick={handleNewChatLocal} className="mb-8 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 active:scale-95">
            <Plus className="w-4 h-4" />
            <span>Nouveau Chat</span>
          </button>

          <div className="mb-8 space-y-4">
            <div className={`flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-purple-950/60'}`}>
              <LayoutDashboard className="w-3 h-3" />
              <span>Navigation</span>
            </div>
            <button type="button" onClick={() => { closeMobilePanels(); setCurrentView('dashboard'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold transition-colors ${currentView === 'dashboard' || currentView === 'dashboard-debug' ? (isDarkMode ? 'bg-purple-500/15 border-purple-400/40 text-white' : 'bg-purple-100 border-purple-300 text-purple-950') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/80 hover:bg-purple-500/10' : 'bg-purple-900/5 border-purple-500/10 text-purple-950 hover:bg-purple-500/10')}`}>
              <Activity className={`w-4 h-4 ${currentView === 'dashboard' || currentView === 'dashboard-debug' ? 'text-purple-400' : 'text-purple-400/70'}`} />
              <span>Tableau de bord</span>
            </button>
            {isAdmin && (
              <button type="button" onClick={() => { closeMobilePanels(); setCurrentView('dashboard-debug'); }} className={`mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold transition-colors ${currentView === 'dashboard-debug' ? (isDarkMode ? 'bg-purple-500/15 border-purple-400/40 text-white' : 'bg-purple-100 border-purple-300 text-purple-950') : (isDarkMode ? 'bg-white/5 border-white/5 text-white/80 hover:bg-purple-500/10' : 'bg-purple-900/5 border-purple-500/10 text-purple-950 hover:bg-purple-500/10')}`}>
                <ShieldCheck className={`w-4 h-4 ${currentView === 'dashboard-debug' ? 'text-purple-400' : 'text-purple-400/70'}`} />
                <span>Tableau de bord Admin</span>
              </button>
            )}
          </div>

          <div className="mb-6 flex min-h-0 flex-1 flex-col gap-3">
            <div className={`flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-purple-950/60'}`}>
              <MessageSquareText className="w-3 h-3" />
              <span>Conversations passées</span>
            </div>

            {conversationSessions.length > 0 ? (
              <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {conversationSessions.slice(0, 6).map((conversation) => {
                  const isActiveConversation = conversation.sessionId === sessionId;
                  const title = buildConversationTitle({ currentObjective: conversation.currentObjective, firstMessagePreview: conversation.firstMessagePreview });
                  return (
                    <div key={conversation.sessionId} className={`group relative rounded-2xl border transition-colors ${isActiveConversation ? (isDarkMode ? 'border-purple-400/40 bg-purple-500/10 text-white' : 'border-purple-300 bg-purple-50 text-purple-950') : (isDarkMode ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-purple-100 bg-white text-slate-700 hover:bg-purple-50')}`}>
                      <button type="button" onClick={() => void handleOpenConversation(conversation)} className="w-full rounded-2xl px-3 py-3 pr-12 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{title}</div></div>
                          <div className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${isDarkMode ? 'border-white/10 bg-white/5 text-white/35' : 'border-slate-200 bg-white text-slate-500'}`}>{conversation.messageCount}</div>
                        </div>
                      </button>
                      <button type="button" onClick={() => void handleDeleteConversationLocal(conversation)} className={`absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${isDarkMode ? 'border-white/10 bg-white/5 text-white/35 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200' : 'border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600'}`} aria-label={`Supprimer ${title}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 text-xs italic text-gray-400">Aucune conversation sauvegardée</p>
            )}
          </div>

          <div className="mb-6 shrink-0">
            <div className={`mb-4 flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/20' : 'text-purple-950/60'}`}>
              <Target className="w-3 h-3" />
              <span>Mes Objectifs</span>
            </div>

            {currentObjective ? (
              <motion.div whileHover={{ y: -2 }} className={`relative mb-4 overflow-hidden rounded-[24px] border p-5 shadow-2xl ${isDarkMode ? 'border-white/5 bg-[#150925]' : 'border-purple-200 bg-white/80'}`}>
                <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
                  <span className={`text-xs font-semibold leading-5 ${isDarkMode ? 'text-gray-300' : 'text-purple-900'}`}>{objectiveDisplayText}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-black tracking-tighter text-purple-600 dark:text-purple-300">{objectiveProgress}%</span>
                    <button type="button" onClick={clearObjective} className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${isDarkMode ? 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10' : 'border-purple-100 bg-white text-slate-500 hover:bg-purple-50'}`} aria-label="Supprimer l'objectif">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className={`relative z-10 mb-3 h-1.5 w-full overflow-hidden rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-purple-100'}`}>
                  <motion.div initial={{ width: 0 }} animate={{ width: String(objectiveProgress) + '%' }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600" />
                </div>
                <div className={`relative z-10 flex items-center gap-2 text-[10px] ${isDarkMode ? 'text-white/20' : 'text-purple-900/30'}`}>
                  <Trophy className="h-3 w-3 text-purple-400/40" />
                  <span className="font-medium">{completedSteps} sur 5 étapes complétées</span>
                </div>
                {sessionSummary && <p className={`relative z-10 mt-3 text-[11px] leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-purple-950/70'}`}>{sessionSummary}</p>}
              </motion.div>
            ) : (
              <p className="mt-2 text-xs italic text-gray-400">Aucun objectif en cours</p>
            )}
          </div>

          <div className="relative mt-auto">
            <SignedIn>
              <div onClick={() => setShowMenu((prev) => !prev)} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white/50 hover:bg-gray-50'}`}>
                <img src={user?.imageUrl || ''} alt="Avatar" className="h-10 w-10 rounded-full border border-purple-500/50" />
                <div className="relative flex-1 text-left">
                  <div className="text-sm font-bold text-[var(--text)]">{user?.firstName || 'Utilisateur'}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Plan Gratuit</div>
                </div>
              </div>

              {showMenu && (
                <div className={`absolute bottom-20 left-4 right-4 z-50 flex flex-col gap-1 rounded-xl border p-2 backdrop-blur-xl ${isDarkMode ? 'border-slate-700 bg-slate-800 text-white shadow-[0_20px_50px_rgba(15,23,42,0.35)]' : 'border-gray-200 bg-white text-slate-800 shadow-lg'}`}>
                  <button type="button" onClick={openUpgrade} className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2 text-left text-sm font-bold transition-colors ${isDarkMode ? 'border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-slate-700' : 'border-purple-500 bg-purple-500/10 text-purple-700 hover:bg-gray-100'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Passer Pro
                  </button>
                  <button type="button" onClick={() => { closeMobilePanels(); navigate('/settings'); }} className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm transition-colors ${isDarkMode ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-gray-100'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Paramètres
                  </button>
                  <div className={`my-1 h-px ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  <button type="button" onClick={() => void handleSignOutLocal()} disabled={isSigningOut} className={`flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors disabled:opacity-70 ${isDarkMode ? 'text-red-300 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    {isSigningOut ? 'Déconnexion en cours...' : 'Déconnexion'}
                  </button>
                </div>
              )}
            </SignedIn>
          </div>
        </div>
      </aside>

      <main className="relative z-20 flex min-w-0 flex-1 flex-col bg-transparent pt-16 lg:pt-0">
        <div className="absolute top-8 right-10 z-30 hidden lg:block">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`cursor-pointer rounded-full border border-white/10 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} transition-all hover:bg-purple-500/10 hover:text-white active:bg-purple-500/20 shadow-2xl`}>
            MULTI-AGENT ORCHESTRATOR
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4 pb-4 lg:p-10">
          {currentView === 'dashboard' ? (
            <DashboardView
              messages={messages}
              isDarkMode={isDarkMode}
              isAdmin={isAdmin}
              objective={objectiveDisplayText}
              objectiveProgress={objectiveProgress}
              completedSteps={completedSteps}
              objectiveHistory={objectiveHistory}
              conversationSessions={conversationSessions}
              activeSessionId={sessionId}
              isLoadingConversationSessions={isLoadingConversationSessions}
              onClearObjective={clearObjective}
              onQuickAction={handleQuickAction}
              onBackToChat={() => setCurrentView('chat')}
              onOpenConversation={handleOpenConversation}
              onDeleteConversation={handleDeleteConversationLocal}
              onOpenDebug={openDebugDashboard}
            />
          ) : currentView === 'dashboard-debug' && isAdmin ? (
            <AdminDashboardView
              backendSnapshot={backendSnapshot}
              metricsSnapshot={metricsSnapshot}
              isRefreshingSnapshot={isRefreshingSnapshot}
              refreshBackendSnapshot={refreshBackendSnapshot}
              onClose={() => setCurrentView('dashboard')}
              formatSnapshotTime={formatSnapshotTime}
              formatCounter={formatCounter}
              shrinkText={shrinkText}
              totalMessages={totalMessages}
              userMessagesCount={userMessagesCount}
              assistantMessagesCount={assistantMessagesCount}
              failedMessagesCount={failedMessagesCount}
              latencyMs={latencyMs}
              sessionLogsCount={sessionLogs.length}
              isDarkMode={isDarkMode}
            />
          ) : (
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div key="accueil" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 max-w-2xl text-center">
                  <div className="mb-12 relative inline-block group">
                    <div className="absolute -inset-16 rounded-full bg-indigo-600/10 blur-[80px] animate-pulse" />
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: 'backOut' }} className="relative flex h-28 w-28 items-center justify-center">
                      <Brain className={`absolute h-24 w-24 blur-2xl ${isDarkMode ? 'text-white/5' : 'text-purple-900/10'}`} />
                      <Brain className={`relative z-10 h-24 w-24 transition-colors duration-700 group-hover:text-purple-500/60 ${isDarkMode ? 'text-white/10' : 'text-purple-500/40'}`} />
                    </motion.div>
                  </div>
                  <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`mb-4 text-4xl font-serif leading-snug tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Comment puis-je vous aider aujourd'hui ?
                  </motion.h2>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">Déployez vos agents spécialisés pour structurer, créer et automatiser vos projets.</p>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="custom-scrollbar mx-auto flex h-full w-full flex-col gap-6 overflow-y-auto overflow-x-hidden p-6 relative z-10">
                  {messages.map((m, index) => {
                    const isUserMessage = m.role === 'user';
                    const isAssistantMessage = m.role === 'assistant';
                    const isErrorMessage = m.role === 'system' && m.tone === 'error';

                    const bubbleClass = isUserMessage
                      ? 'w-fit max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-none bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-white shadow-lg shadow-purple-500/20'
                      : isErrorMessage
                        ? `w-fit max-w-[80%] rounded-2xl rounded-bl-none px-4 py-2 ${isDarkMode ? 'border border-red-500/40 bg-red-500/10 text-red-100' : 'border border-red-200 bg-red-50 text-red-700'}`
                        : `w-fit max-w-[80%] rounded-2xl rounded-bl-none px-4 py-2 ${isDarkMode ? 'border border-white/10 bg-white/5 text-gray-200' : 'border border-purple-100 bg-white text-slate-700 shadow-sm'}`;

                    return (
                      <div key={index} className={`flex min-w-0 gap-4 ${isUserMessage ? 'justify-end' : ''}`}>
                        {isAssistantMessage && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-500"><Brain size={18} /></div>}
                        {isErrorMessage && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"><AlertTriangle size={18} /></div>}
                        <div className={`min-w-0 max-w-full overflow-x-hidden text-sm leading-relaxed markdown-body ${markdownClass} ${bubbleClass}`}>
                          {isUserMessage ? <div className="whitespace-pre-wrap break-words">{m.content}</div> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{(m.content || '').replace(/\\n/g, '\n')}</ReactMarkdown>}
                        </div>
                        {isUserMessage && <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gray-900 shadow-lg"><img src={user?.imageUrl || 'https://picsum.photos/seed/userelegant/100/100'} alt="Avatar user" className="h-full w-full object-cover" /></div>}
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-500 animate-pulse"><Brain size={18} /></div>
                      <div className={`rounded-[24px] rounded-bl-none border p-5 text-sm italic ${isDarkMode ? 'border-white/10 bg-white/5 text-gray-400' : 'border-purple-100 bg-white text-slate-500'}`}>L'Orchestrateur réfléchit...</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="w-full px-4 pb-4 pt-0 lg:px-10 lg:pb-10 lg:pt-0">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 lg:gap-8">
            {workspaceNotice && <div className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium ${noticeClass}`}>{workspaceNotice.text}</div>}
            <SignedIn>
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="group relative w-full">
                <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 blur transition-opacity duration-700 group-focus-within:opacity-100" />
                <div className={`relative flex min-h-20 flex-wrap items-center gap-2 rounded-[32px] border p-2 shadow-2xl transition-all duration-300 group-focus-within:border-purple-400 md:h-20 md:flex-nowrap md:gap-0 ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-purple-200 bg-white/80'}`}>
                  <button type="button" onClick={toggleRecording} className={`relative flex h-full items-center justify-center px-6 transition-colors ${isRecording ? 'text-red-500' : isDarkMode ? 'text-white/40 hover:text-white' : 'text-purple-900/40 hover:text-purple-600'}`}>
                    {isRecording && <div className="absolute h-6 w-6 animate-ping rounded-full bg-red-500/30" />}
                    <Mic className="relative z-10 h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 text-purple-400 transition-colors hover:text-purple-600"><Paperclip className="h-5 w-5" /></button>
                  <input type="file" multiple className="hidden" ref={attachmentInputRef} onChange={onAttachmentSelection} accept={CHAT_ATTACHMENT_ACCEPT} />
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
                    {attachmentPreviews.length > 0 && (
                      <div className={`custom-scrollbar flex max-w-full shrink-0 items-center gap-2 overflow-x-auto text-[10px] ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                        {attachmentPreviews.map((attachment) => (
                          <span key={attachment.id} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-100 bg-white'}`}>
                            <span className="max-w-[8rem] truncate font-semibold">{attachment.name}</span>
                            <span>{formatAttachmentSize(attachment.size)}</span>
                            <button type="button" onClick={() => removeAttachment(attachment.id)} className={`${isDarkMode ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'} transition-colors`} aria-label={`Retirer ${attachment.name}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => { const nextInput = e.target.value; setMessage(nextInput); setSecurityScore(evaluatePromptSecurity(nextInput)); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
                      placeholder={isRecording ? 'Écoute en cours (Cliquez pour arrêter)...' : 'Instruire MindMesh...'}
                      disabled={isRecording}
                      className={`w-full min-w-0 flex-1 bg-transparent px-2 font-medium text-lg outline-none border-none ${isDarkMode ? 'placeholder:text-white/40 text-white' : 'placeholder:text-slate-500 text-slate-800'}`}
                    />
                  </div>
                  <button type="button" onClick={() => void handleSend()} disabled={isLoading || !message.trim() || isRecording} className={`flex h-12 w-full shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/40 transition-all duration-300 md:h-14 md:w-14 ${isLoading || !message.trim() || isRecording ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'}`}>
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            </SignedIn>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {currentView === 'chat' && messages.length > 0 && (
          <motion.aside initial={{ opacity: 0, width: 0, marginRight: 0 }} animate={{ opacity: 1, width: '34rem', marginRight: '1rem' }} exit={{ opacity: 0, width: 0, marginRight: 0 }} className={`my-0 fixed inset-y-0 right-0 z-50 w-[92vw] max-w-[28rem] translate-x-full glass-dark rounded-l-[40px] rounded-r-none border border-white/10 flex flex-col pt-6 overflow-y-auto custom-scrollbar shadow-2xl relative overflow-hidden shrink-0 transition-transform duration-300 lg:static lg:z-20 lg:w-[34rem] lg:max-w-none lg:translate-x-0 lg:rounded-[40px] lg:mr-4 ${showMobileWorkspace ? 'translate-x-0' : 'lg:translate-x-0'}`}>
            <div className="absolute inset-0 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex h-full w-full flex-col lg:w-[34rem]">
              <div className="border-b border-white/5 px-5 pb-6 lg:px-10">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className={`flex items-center gap-1 rounded-2xl border p-1 backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-200 bg-white/60'}`}>
                    {[{ id: 'preview' as const, label: 'Aperçu', icon: Eye }, { id: 'code' as const, label: 'Code', icon: Code }].map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-semibold transition-colors ${activeTab === tab.id ? (isDarkMode ? 'border border-white/20 bg-white/20 text-white' : 'border border-purple-300/70 bg-purple-600/15 text-purple-950') : (isDarkMode ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-purple-900/70 hover:bg-purple-100/70 hover:text-purple-950')}`}>
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleDownloadWorkspace} className={`rounded-xl p-2.5 transition-all ${isDarkMode ? 'bg-white/5 text-white/20 hover:text-white' : 'bg-purple-100 text-purple-900/50 hover:text-purple-600'}`}><Download className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void handleShareWorkspace()} className={`rounded-xl p-2.5 transition-all ${isDarkMode ? 'bg-white/5 text-white/20 hover:text-white' : 'bg-purple-100 text-purple-900/50 hover:text-purple-600'}`}><Play className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void handleExecuteWorkspace()} disabled={isLoading || isExecutingWorkspace || !latestAssistantMessage.trim()} className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-purple-500/20 transition-all ${isLoading || isExecutingWorkspace || !latestAssistantMessage.trim() ? 'cursor-not-allowed opacity-60' : 'hover:scale-105'}`}>
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isExecutingWorkspace ? 'Exécution...' : 'Exécuter'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-purple-950/60'}`}>ESPACE DE TRAVAIL</span>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 glass">
                    <div className={`h-1.5 w-1.5 rounded-full ${runtime.dotClass}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${runtime.textClass}`}>{runtime.label}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pt-8 lg:px-10">
                <div className={`rounded-[28px] border p-6 backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-200 bg-white/70'}`}>
                  {activeTab === 'preview' ? (
                    <div className={`markdown-body ${markdownClass} text-sm leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-slate-700'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{latestAssistantMarkdown}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className={`rounded-2xl border p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words ${isDarkMode ? 'border-white/10 bg-black/30 text-gray-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                      <code>{latestAssistantMessage || '// Aucune réponse disponible pour le moment.'}</code>
                    </pre>
                  )}
                </div>
              </div>

              <div className="px-5 py-8 lg:px-10">
                <h3 className={`mb-8 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-purple-900/40'}`}>
                  <Activity className="h-4 w-4 text-purple-400/60" />
                  ÉQUIPE MOBILISÉE
                </h3>

                <div className="space-y-4">
                  {AGENTS.map((agent) => {
                    const isAgentActive = agentStatuses[agent.id] === 'working';
                    return (
                      <motion.div key={agent.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: 4 }} className={`group relative flex cursor-pointer items-center gap-5 rounded-[28px] border p-5 shadow-xl transition-all ${isDarkMode ? 'border-white/10 bg-white/5 shadow-black/40 hover:bg-white/10' : 'border-purple-200 bg-white/60 shadow-purple-500/10 hover:bg-purple-50'}`}>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 ${isAgentActive ? 'border-purple-500/30 bg-purple-500/10' : isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-200 bg-white'}`}>
                          <agent.icon className={`h-5 w-5 transition-colors duration-500 ${isAgentActive ? 'text-purple-500' : isDarkMode ? 'text-white/30' : 'text-purple-900/30'}`} />
                        </div>
                        <div className="flex-1">
                          <div className={`mb-0.5 text-sm font-bold tracking-tight transition-colors group-hover:text-purple-600 ${isDarkMode ? 'text-white' : 'text-purple-950'}`}>{agent.name}</div>
                          <div className={`text-[10px] font-medium tracking-wide ${isDarkMode ? 'text-white/40' : 'text-purple-900/60'}`}>{agent.role}</div>
                        </div>
                        <div className={`rounded-xl border px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${isAgentActive ? `animate-pulse border-purple-500/30 bg-purple-500/10 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}` : isDarkMode ? 'border-white/10 bg-white/5 text-white/30' : 'border-purple-200 bg-purple-100 text-purple-900/60'}`}>
                          {isAgentActive ? 'WORKING' : 'IDLE'}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto border-t border-white/5 bg-transparent px-5 py-8 lg:px-10">
                <div className="mb-8 grid grid-cols-2 gap-4">
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-purple-100 bg-white/60'}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-purple-950/60'}`}><Cpu className="h-3 w-3" />Latence</div>
                    <div className={`text-xl font-serif italic ${isDarkMode ? 'text-gray-300' : 'text-purple-950'}`}>{latencyMs !== null ? `${latencyMs.toFixed(1)}ms` : '--'}</div>
                  </div>
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-purple-100 bg-white/60'}`}>
                    <div className={`mb-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-purple-950/60'}`}><ShieldCheck className="h-3 w-3" />Score Sécurité</div>
                    <div className={`text-xl font-serif italic ${securityClass}`}>{securityScore.toFixed(1)}%</div>
                  </div>
                </div>

                <div className={`relative rounded-2xl border p-6 font-mono text-[10px] overflow-hidden ${isDarkMode ? 'bg-black/20 shadow-inner border-white/10' : 'bg-white/60 shadow-sm border-purple-100'}`}>
                  <div className={`mb-4 flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-white/5' : 'border-purple-100'}`}>
                    <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white/40' : 'text-purple-950/60'}`}><Terminal className="h-3 w-3" /></div>
                    <span className={`${isDarkMode ? 'text-white/30' : 'text-purple-950/50'} text-[8px] font-bold`}>PID: 4020-SYS</span>
                  </div>

                  <div ref={logsContainerRef} className="custom-scrollbar max-h-28 space-y-2 overflow-y-auto pr-1 opacity-80">
                    {sessionLogs.length === 0 ? (
                      <div className="text-[10px] text-purple-500/70">Aucun log pour le moment.</div>
                    ) : (
                      sessionLogs.map((log) => (
                        <div key={log.id} className={`flex gap-3 font-medium ${log.tone === 'success' ? 'text-green-500' : log.tone === 'warn' ? 'text-amber-500' : 'text-purple-500'}`}>
                          <span>[{log.timestamp}]</span>
                          <span>{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <PricingModal open={showPricingModal} onClose={() => setShowPricingModal(false)} onNavigate={navigate} isDarkMode={isDarkMode} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(168, 85, 247, 0.2)'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(168, 85, 247, 0.3)'}; }
        ::selection { background: ${isDarkMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.2)'}; color: ${isDarkMode ? 'white' : '#1a0b2e'}; }
        .markdown-body p { margin-bottom: 0.75em; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: 700; color: inherit; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
        .markdown-body ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
}
