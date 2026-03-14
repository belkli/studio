import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils';

// ---------------------------------------------------------------------------
// RegistrationAgreement — tests (LC-58..LC-60)
//
// The component renders 9 standard accordion sections plus an optional
// section 10 in 'enrollment' mode.  We use renderWithProviders which
// injects a real NextIntlClientProvider with Hebrew messages, but we also
// override useTranslations so keys are predictably testable.
// ---------------------------------------------------------------------------

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl');
  return {
    ...actual,
    useLocale: () => 'en',
    // Return the translation key so tests can assert on key names
    useTranslations: () => (key: string, params?: Record<string, string | number>) => {
      if (!params || Object.keys(params).length === 0) return key;
      // Append serialised params so tests can assert on their values
      const paramStr = Object.values(params).join('-');
      return `${key}[${paramStr}]`;
    },
  };
});

// Mock accordion to render both trigger and content as visible text
vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionItem: ({ children, value }: any) => <div data-testid={`item-${value}`}>{children}</div>,
  AccordionTrigger: ({ children }: any) => <button data-testid="trigger">{children}</button>,
  AccordionContent: ({ children }: any) => <div data-testid="content">{children}</div>,
}));

import { RegistrationAgreement } from '@/components/enrollment/registration-agreement';

// ---------------------------------------------------------------------------
// LC-58: section rendering
// ---------------------------------------------------------------------------

describe('RegistrationAgreement — section rendering (LC-58)', () => {
  it('renders without crashing', () => {
    renderWithProviders(<RegistrationAgreement />);
    expect(screen.getByTestId('accordion')).toBeInTheDocument();
  });

  it('renders all 9 standard sections (s1–s9)', () => {
    renderWithProviders(<RegistrationAgreement />);
    for (let n = 1; n <= 9; n++) {
      expect(screen.getByTestId(`item-s${n}`)).toBeInTheDocument();
    }
  });

  it('renders section 10 in enrollment mode (default)', () => {
    renderWithProviders(<RegistrationAgreement mode="enrollment" />);
    expect(screen.getByTestId('item-s10')).toBeInTheDocument();
  });

  it('does not render section 10 in admin-preview mode', () => {
    renderWithProviders(<RegistrationAgreement mode="admin-preview" />);
    expect(screen.queryByTestId('item-s10')).not.toBeInTheDocument();
  });

  it('renders 9 items total in admin-preview mode', () => {
    renderWithProviders(<RegistrationAgreement mode="admin-preview" />);
    const items = screen.getAllByTestId(/^item-s/);
    expect(items).toHaveLength(9);
  });

  it('renders 10 items total in enrollment mode', () => {
    renderWithProviders(<RegistrationAgreement mode="enrollment" />);
    const items = screen.getAllByTestId(/^item-s/);
    expect(items).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// LC-59: VAT rate and makeups params
// ---------------------------------------------------------------------------

describe('RegistrationAgreement — vatRate and maxMakeups params (LC-59)', () => {
  it('passes vatRate param to section bodies', () => {
    renderWithProviders(<RegistrationAgreement vatRate={18} maxMakeups={3} />);
    // Our mock appends param values as [18-3] to the key
    const contents = screen.getAllByTestId('content');
    const s1Content = contents[0];
    expect(s1Content.textContent).toContain('18');
    expect(s1Content.textContent).toContain('3');
  });

  it('passes custom vatRate=17 to section bodies', () => {
    renderWithProviders(<RegistrationAgreement vatRate={17} maxMakeups={3} />);
    const contents = screen.getAllByTestId('content');
    const s1Content = contents[0];
    // 17 and 3 should both appear in the serialised param string
    expect(s1Content.textContent).toContain('17');
  });

  it('uses default vatRate of 18 when not specified', () => {
    renderWithProviders(<RegistrationAgreement />);
    const contents = screen.getAllByTestId('content');
    const allText = contents.map((c) => c.textContent).join(' ');
    // Default vatRate=18 should appear somewhere in all content
    expect(allText).toContain('18');
  });

  it('uses default maxMakeups of 3 when not specified', () => {
    renderWithProviders(<RegistrationAgreement />);
    // maxMakeups is passed to section bodies — the mock will embed it
    const contents = screen.getAllByTestId('content');
    const allText = contents.map((c) => c.textContent).join(' ');
    expect(allText).toContain('3');
  });
});

// ---------------------------------------------------------------------------
// LC-60: customAddendum in section 10
// ---------------------------------------------------------------------------

describe('RegistrationAgreement — customAddendum (LC-60)', () => {
  it('renders customAddendum text when provided', () => {
    renderWithProviders(
      <RegistrationAgreement
        mode="enrollment"
        customAddendum="Special terms for this conservatorium."
      />
    );
    expect(screen.getByText('Special terms for this conservatorium.')).toBeInTheDocument();
  });

  it('falls back to s10BodyDefault translation key when no customAddendum', () => {
    renderWithProviders(<RegistrationAgreement mode="enrollment" />);
    // Our useTranslations mock returns the key as-is
    expect(screen.getByText('contract.s10BodyDefault')).toBeInTheDocument();
  });

  it('renders customAddendum in the section 10 content area', () => {
    renderWithProviders(
      <RegistrationAgreement
        mode="enrollment"
        customAddendum="Unique pricing addendum"
      />
    );
    const s10 = screen.getByTestId('item-s10');
    expect(s10.textContent).toContain('Unique pricing addendum');
  });

  it('section 10 is not rendered in admin-preview even with customAddendum', () => {
    renderWithProviders(
      <RegistrationAgreement
        mode="admin-preview"
        customAddendum="Should not appear"
      />
    );
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});
