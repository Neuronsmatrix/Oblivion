import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ru');
  });

  it('reflects the current language and switches it', async () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox', { name: /язык|language/i });
    expect((select as HTMLSelectElement).value).toBe('ru');

    await userEvent.selectOptions(select, 'en');
    expect(i18n.language).toBe('en');
    expect((select as HTMLSelectElement).value).toBe('en');
  });
});
