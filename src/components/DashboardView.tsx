import { ArrowRight, Brain, FileText, MessageSquareText, Search, Sparkles, Trash2, WandSparkles, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { ConversationSession, Message } from '../lib/appTypes';
import { buildConversationTitle } from '../lib/appUtils';

interface QuickAction {
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
}

interface DashboardViewProps {
  messages: Message[];
  isDarkMode: boolean;
  isAdmin: boolean;
  objective: string | null;
  objectiveProgress: number;
  completedSteps: number;
  objectiveHistory: string[];
  conversationSessions: ConversationSession[];
  activeSessionId: string;
  isLoadingConversationSessions: boolean;
  onClearObjective: () => void;
  onQuickAction: (prompt: string) => void;
  onBackToChat: () => void;
  onOpenConversation: (session: ConversationSession) => void;
  onDeleteConversation: (session: ConversationSession) => void;
  onOpenDebug?: () => void;
}

const quickActions: QuickAction[] = [
  {
    title: 'Analyser un projet',
    description: 'Obtenez une lecture claire des enjeux, risques et opportunités.',
    prompt: 'Analyse ce projet et identifie les risques, opportunites et prochaines etapes.',
    icon: Search,
  },
  {
    title: 'Brainstorming',
    description: 'Générez des idées concrètes et des pistes d exploration.',
    prompt: 'Fais un brainstorming de solutions creativites pour mon besoin.',
    icon: Sparkles,
  },
  {
    title: 'Rédiger un document',
    description: 'Transformez une idée en note, brief ou document structuré.',
    prompt: 'Rédige un document clair et structure a partir de mon idee.',
    icon: FileText,
  },
  {
    title: 'Structurer le plan',
    description: "Passez d'une intention à une feuille de route actionnable.",
    prompt: 'Aide-moi a transformer cette demande en plan d action concret.',
    icon: WandSparkles,
  },
];

export default function DashboardView({
  messages,
  isDarkMode,
  isAdmin,
  objective,
  objectiveProgress,
  completedSteps,
  objectiveHistory,
  conversationSessions,
  activeSessionId,
  isLoadingConversationSessions,
  onClearObjective,
  onQuickAction,
  onBackToChat,
  onOpenConversation,
  onDeleteConversation,
  onOpenDebug,
}: DashboardViewProps) {
  const recentMessages = messages
    .filter((message) => message.role !== 'system')
    .slice(-4)
    .reverse();

  return (
    <div className="w-full max-w-6xl flex-1 h-full overflow-y-auto pt-8 md:pt-12 pb-8 relative z-10 mx-auto">
      <div className={`relative overflow-hidden rounded-[36px] border p-6 md:p-8 lg:p-10 shadow-[0_30px_120px_rgba(15,23,42,0.28)] ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-100' : 'bg-white/90 border-purple-100 text-slate-700'}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -right-24 top-0 h-72 w-72 rounded-full blur-3xl ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-300/30'}`} />
          <div className={`absolute -left-24 bottom-0 h-80 w-80 rounded-full blur-3xl ${isDarkMode ? 'bg-indigo-500/15' : 'bg-pink-200/40'}`} />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-10">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${isDarkMode ? 'border-white/10 bg-white/5 text-purple-200' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
                <Brain className="h-3.5 w-3.5" />
                MindMesh
              </div>
              <h1 className={`mt-5 text-4xl font-serif leading-[1.05] tracking-tight md:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Bonjour, comment puis-je vous aider aujourd'hui ?
              </h1>
              <p className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                Lancez un projet, clarifiez une idée ou reprenez une conversation existante dans un espace plus doux, plus rapide et plus lisible.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:pt-2">
              <button
                type="button"
                onClick={onBackToChat}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-purple-100 bg-white text-slate-600 hover:bg-purple-50'}`}
              >
                <MessageSquareText className="h-4 w-4" />
                Retour au chat
              </button>
              {isAdmin && onOpenDebug && (
                <button
                  type="button"
                  onClick={onOpenDebug}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-purple-400/30 bg-purple-500/10 text-purple-100 hover:bg-purple-500/20' : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                >
                  Vue debug
                </button>
              )}
            </div>
          </div>

          <section className={`mb-10 overflow-hidden rounded-[32px] border p-5 md:p-6 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-100 bg-white'}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${isDarkMode ? 'border-white/10 bg-white/5 text-purple-200' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Mes objectifs
                </div>
                <h2 className={`mt-4 text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {objective || 'Aucun objectif actif'}
                </h2>
                <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  {objective
                    ? objectiveProgress >= 100
                      ? 'Objectif atteint — poursuivez la conversation ou supprimez-le si vous souhaitez repartir sur une nouvelle base.'
                      : 'Votre objectif reste visible entre vos conversations pour garder le fil.'
                    : 'Vos objectifs apparaissent ici dès qu’une demande claire est lancée.'}
                </p>
              </div>

              {objective && (
                <button
                  type="button"
                  onClick={onClearObjective}
                  className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10' : 'border-purple-100 bg-white text-slate-600 hover:bg-purple-50'}`}
                >
                  Supprimer l'objectif
                </button>
              )}
            </div>

            {objective && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-black/15' : 'border-purple-100 bg-purple-50/50'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-white/35' : 'text-purple-900/50'}`}>
                    Progression
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {objectiveProgress}%
                  </p>
                </div>
                <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-black/15' : 'border-purple-100 bg-purple-50/50'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-white/35' : 'text-purple-900/50'}`}>
                    Étapes
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {completedSteps}/5
                  </p>
                </div>
                <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-black/15' : 'border-purple-100 bg-purple-50/50'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-white/35' : 'text-purple-900/50'}`}>
                    Statut
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {objectiveProgress >= 100 ? 'Terminé et conservé' : 'En cours'}
                  </p>
                </div>
              </div>
            )}

            {objectiveHistory.length > 0 && (
              <div className="mt-5">
                <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${isDarkMode ? 'text-white/35' : 'text-purple-900/50'}`}>
                  Objectifs récents
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {objectiveHistory.slice(0, 5).map((item) => (
                    <span
                      key={item}
                      className={`rounded-full border px-3 py-2 text-xs font-medium ${isDarkMode ? 'border-white/10 bg-white/5 text-white/70' : 'border-purple-100 bg-purple-50 text-slate-700'}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Démarrage rapide
                </h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
                  Choisissez un point de départ et ouvrez la conversation avec une intention claire.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  type="button"
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onQuickAction(action.prompt)}
                  className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all ${isDarkMode ? 'border-white/10 bg-white/5 hover:border-purple-400/30 hover:bg-white/10' : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50'}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${isDarkMode ? 'border-white/10 bg-white/10 text-purple-200 group-hover:border-purple-400/30 group-hover:bg-purple-500/15' : 'border-purple-100 bg-purple-50 text-purple-700 group-hover:border-purple-200 group-hover:bg-purple-100'}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5">
                    <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {action.title}
                    </h3>
                    <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-white/55' : 'text-slate-600'}`}>
                      {action.description}
                    </p>
                  </div>
                  <div className={`mt-5 inline-flex items-center gap-2 text-xs font-semibold ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                    Démarrer
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${isDarkMode ? 'from-purple-400/0 via-purple-300/50 to-cyan-300/0' : 'from-purple-300/0 via-purple-300/80 to-pink-300/0'} opacity-0 transition-opacity group-hover:opacity-100`} />
                </motion.button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Conversations récentes
                </h2>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
                    Vos derniers échanges apparaissent ici lorsque l'historique est disponible.
                  </p>
              </div>
            </div>

            {recentMessages.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {recentMessages.map((message, index) => {
                  const Icon = message.role === 'assistant' ? Brain : MessageSquareText;
                  const label = message.role === 'assistant' ? 'Réponse assistant' : 'Message utilisateur';
                  const excerpt = message.content.replace(/\s+/g, ' ').trim();

                  return (
                    <motion.div
                      key={`${message.role}-${index}-${excerpt.slice(0, 24)}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className={`rounded-3xl border p-4 md:p-5 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-100 bg-white'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/10 text-purple-200' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {label}
                            </h3>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'}`}>
                              Récent
                            </span>
                          </div>
                           <p className={`mt-2 max-h-[4.5rem] overflow-hidden text-sm leading-6 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                             {excerpt}
                           </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-3xl border p-6 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-100 bg-white'}`}>
                <div className={`flex items-start gap-4 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/10 text-purple-200' : 'border-purple-100 bg-purple-50 text-purple-700'}`}>
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Aucune conversation récente
                    </h3>
                    <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-white/55' : 'text-slate-600'}`}>
                      Lancez une demande avec une carte de démarrage rapide pour faire apparaître votre historique ici.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sessions sauvegardées
                </h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-white/45' : 'text-slate-500'}`}>
                  Roulez entre vos conversations et reprenez un contexte précédent.
                </p>
              </div>
              {isLoadingConversationSessions && (
                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${isDarkMode ? 'text-white/35' : 'text-purple-900/50'}`}>
                  Chargement...
                </span>
              )}
            </div>

            {conversationSessions.length > 0 ? (
              <div className="grid gap-3">
                {conversationSessions.map((session) => {
                  const isActive = session.sessionId === activeSessionId;
                  const title = buildConversationTitle({
                    currentObjective: session.currentObjective,
                    firstMessagePreview: session.firstMessagePreview,
                  });
                  return (
                    <motion.div
                      key={session.sessionId}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      className={`group relative rounded-3xl border p-4 text-left transition-all ${
                        isActive
                          ? isDarkMode
                            ? 'border-purple-400/40 bg-purple-500/10'
                            : 'border-purple-300 bg-purple-50'
                          : isDarkMode
                            ? 'border-white/10 bg-white/5 hover:border-purple-400/30 hover:bg-white/10'
                            : 'border-purple-100 bg-white hover:border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenConversation(session)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {title}
                            </p>
                          </div>
                          <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${isDarkMode ? 'border-white/10 bg-white/5 text-white/40' : 'border-slate-200 bg-white text-slate-500'}`}>
                            {session.messageCount} msg
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteConversation(session);
                        }}
                        className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${isDarkMode ? 'border-white/10 bg-white/5 text-white/35 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200' : 'border-slate-200 bg-white text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600'}`}
                        aria-label={`Supprimer ${title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                        <span className={isDarkMode ? 'text-white/35' : 'text-slate-500'}>
                          MAJ: {session.updatedAt ? new Date(session.updatedAt).toLocaleString('fr-FR') : 'inconnue'}
                        </span>
                        {isActive && (
                          <span className={isDarkMode ? 'text-purple-200' : 'text-purple-700'}>Session active</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-3xl border p-6 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-purple-100 bg-white'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-white/55' : 'text-slate-600'}`}>
                  Aucune session sauvegardée pour le moment.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
