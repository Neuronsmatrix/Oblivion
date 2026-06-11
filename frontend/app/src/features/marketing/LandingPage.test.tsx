import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import { LandingPage } from './LandingPage';

function renderLanding() {
  return render(<MemoryRouter><LandingPage /></MemoryRouter>);
}

describe('LandingPage i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ru');
  });

  it('renders Russian hero copy by default', () => {
    renderLanding();
    expect(screen.getByText(/Фенотип, прочитанный точно\./i)).toBeInTheDocument();
  });

  it('renders English hero copy after switching', async () => {
    await i18n.changeLanguage('en');
    renderLanding();
    expect(screen.getByText(/Phenotype, precisely read\./i)).toBeInTheDocument();
  });
});
