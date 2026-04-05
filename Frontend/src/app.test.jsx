import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTranslator } from './translations/i18n';
import DisclaimerAgreement from './components/DisclaimerAgreement';

const disclaimerMessages = {
  disclaimer_kicker: 'User Agreement',
  disclaimer_title: 'Review this medical and AI usage agreement before continuing.',
  disclaimer_subtitle:
    'DiagnoAI is designed to help users understand laboratory values, visualize patterns in results, and provide AI-generated commentary. It is not a replacement for clinical judgment or direct medical care.',
  disclaimer_warning_label: 'Important',
  disclaimer_warning_text:
    'This application is an AI support tool only. It does not diagnose pancreatic cancer, confirm disease, prescribe treatment, or replace a licensed doctor. Every result must be reviewed with a qualified healthcare professional.',
  disclaimer_purpose_title: 'What this tool does',
  disclaimer_purpose_1:
    'Helps people read laboratory numbers in a clearer and more organized way.',
  disclaimer_purpose_2:
    'Visualizes submitted results so patterns and possible risk signals are easier to understand.',
  disclaimer_purpose_3:
    'Generates AI commentary that can support questions for a doctor or medical team.',
  disclaimer_limits_title: 'What this tool does not do',
  disclaimer_limits_1:
    'It does not provide a final diagnosis or guarantee medical accuracy for every patient.',
  disclaimer_limits_2:
    'It should never be the only basis for treatment decisions, delaying care, or avoiding a doctor visit.',
  disclaimer_limits_3:
    'Abnormal results, symptoms, or persistent concerns still require medical evaluation by a licensed physician.',
  disclaimer_limits_4:
    'In urgent or emergency situations, seek immediate care from a hospital, doctor, or local emergency services.',
  disclaimer_agree_title: 'By continuing, you agree that',
  disclaimer_agree_1:
    'You understand this product provides educational AI assistance and result visualization only.',
  disclaimer_agree_2:
    'You will consult a doctor or qualified healthcare professional for diagnosis, confirmation, and treatment decisions.',
  disclaimer_agree_3:
    'You accept that AI commentary may be incomplete, incorrect, or not appropriate for your exact health condition.',
  disclaimer_emergency_title: 'Do not rely on this app alone',
  disclaimer_emergency_text:
    'If you feel unwell, have concerning symptoms, or receive worrying lab values, use this app as a supporting step only and contact a doctor for proper medical assessment.',
  disclaimer_data_notice:
    'Only enter information you are allowed to share. Avoid using the tool for emergencies, critical decisions, or situations where a direct medical examination is needed.',
  disclaimer_checkbox:
    'I have read and understood this agreement. I understand that DiagnoAI is only an AI support tool, and I will still consult a doctor for medical evaluation and follow-up.',
  disclaimer_accept: 'I Agree and Continue',
  theme_label: 'Theme',
  toggle_light: 'Light mode',
  toggle_dark: 'Dark mode',
};

const t = (key) => disclaimerMessages[key] ?? key;

describe('i18n translator', () => {
  it('falls back to English for unsupported locales', () => {
    const tUnknown = createTranslator('fr');
    const tEn = createTranslator('en');
    expect(tUnknown('nav_home')).toBe(tEn('nav_home'));
  });

  it('returns Russian text for Russian disclaimer keys', () => {
    const tRu = createTranslator('ru');
    expect(tRu('disclaimer_warning_label')).toBe('Важно');
  });
});

describe('DisclaimerAgreement', () => {
  it('requires explicit agreement before continuing', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();

    render(
      <DisclaimerAgreement
        onAccept={onAccept}
        language="en"
        setLanguage={vi.fn()}
        theme="light"
        setTheme={vi.fn()}
        t={t}
      />,
    );

    const continueButton = screen.getByRole('button', {
      name: /i agree and continue/i,
    });

    expect(continueButton).toBeDisabled();
    expect(
      screen.getByText(/this application is an ai support tool only/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));

    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
