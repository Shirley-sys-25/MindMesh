import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionSidebar } from './SessionSidebar';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('SessionSidebar', () => {
  it('renders without crashing', () => {
    render(
      <SessionSidebar
        objective="Objectif de test"
        agentStatuses={{ africonnect: 'idle', analyste_marche: 'idle', stratege_seo: 'idle' }}
        isDarkMode={false}
        objectiveProgress={25}
        completedSteps={1}
        sessionSummary="Résumé de test"
      />,
    );

    expect(screen.getByText('Mes Objectifs')).toBeInTheDocument();
    expect(screen.getByText('Objectif de test')).toBeInTheDocument();
    expect(screen.getByText('Résumé de test')).toBeInTheDocument();
  });
});
