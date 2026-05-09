import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import { frFR } from '@clerk/localizations';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkAppearance = {
  variables: {
    colorBackground: 'var(--background)',
    colorPrimary: '#a855f7',
    colorText: 'var(--text)',
    colorInputBackground: 'var(--glass-bg)',
    colorInputText: 'var(--text)',
  },
  elements: {
    card: 'bg-transparent shadow-none border-0',
  },
};

const MissingConfigurationScreen = () => (
  <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
    <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200/80">MindMesh</div>
      <h1 className="mt-4 text-3xl font-serif tracking-tight">Configuration manquante</h1>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        L&apos;application ne peut pas démarrer tant que `VITE_CLERK_PUBLISHABLE_KEY` n&apos;est pas défini dans le fichier `.env`.
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Ajoute la clé Clerk, puis recharge la page pour afficher l&apos;interface complète.
      </p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-xs text-slate-200">
        VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
      </div>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={frFR} appearance={clerkAppearance}>
        <App />
      </ClerkProvider>
    ) : (
      <MissingConfigurationScreen />
    )}
  </StrictMode>,
);
