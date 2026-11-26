export type KioskVoiceLang = 'en-IN' | 'hi-IN' | 'gu-IN' | 'fr-FR' | 'zh-CN' | 'es-ES';
export type KioskVoiceGender = 'female' | 'male';

export const KIOSK_VOICE_LANGUAGES: Array<{ code: KioskVoiceLang; label: string; native: string }> = [
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'fr-FR', label: 'French', native: 'Français' },
  { code: 'zh-CN', label: 'Chinese', native: '中文' },
  { code: 'es-ES', label: 'Spanish', native: 'Español' },
];

export type KioskSpeechEvent =
  | { kind: 'clock-in'; name: string; lateText?: string }
  | { kind: 'clock-out'; name: string }
  | { kind: 'break-in'; name: string }
  | { kind: 'break-out'; name: string }
  | { kind: 'test' };

let activeUtterance: SpeechSynthesisUtterance | null = null;

const FEMALE_HINTS = [
  'female', 'woman', 'girl', 'zira', 'heera', 'kalpana', 'neerja', 'swara',
  'dhwani', 'aria', 'jenny', 'samantha', 'victoria', 'karen', 'moira', 'tessa',
  'fiona', 'veena', 'lekha', 'amelie', 'hortense', 'denise', 'xiaoxiao', 'huihui',
  'yaoyao', 'tingting', 'monica', 'paulina', 'helena', 'elena', 'lucia',
];

const MALE_HINTS = [
  'male', 'man', 'david', 'mark', 'ravi', 'hemant', 'prabhat', 'madhur', 'niranjan',
  'alex', 'daniel', 'thomas', 'henri', 'paul', 'kangkang', 'yunxi', 'yunyang',
  'jorge', 'pablo', 'alvaro', 'diego', 'guy', 'ryan',
];

export function pickKioskVoice(
  voices: SpeechSynthesisVoice[],
  lang: KioskVoiceLang,
  gender: KioskVoiceGender,
) {
  const prefix = lang.split('-')[0].toLowerCase();
  const exact = voices.filter((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const byLang = exact.length ? exact : voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const pool = byLang.length ? byLang : voices;
  const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
  const opposite = gender === 'male' ? FEMALE_HINTS : MALE_HINTS;
  return (
    pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) ||
    pool.find((v) => !opposite.some((h) => v.name.toLowerCase().includes(h))) ||
    pool[0] ||
    null
  );
}

export function buildKioskPhrase(event: KioskSpeechEvent, lang: KioskVoiceLang): string {
  if (event.kind === 'test') {
    const samples: Record<KioskVoiceLang, string> = {
      'en-IN': 'Face clock voice is ready. Thank you.',
      'hi-IN': 'फेस क्लॉक आवाज़ तैयार है। धन्यवाद।',
      'gu-IN': 'ફેસ ક્લોક અવાજ તૈયાર છે. આભાર.',
      'fr-FR': 'La voix est prête. Merci.',
      'zh-CN': '人脸考勤语音已就绪。谢谢。',
      'es-ES': 'La voz está lista. Gracias.',
    };
    return samples[lang];
  }

  if (event.kind === 'clock-in') {
    if (event.lateText) {
      const map: Record<KioskVoiceLang, string> = {
        'en-IN': 'Are you late today?',
        'hi-IN': 'क्या आप आज लेट हैं?',
        'gu-IN': 'શું તમે આજે મોડા છો?',
        'fr-FR': 'Êtes-vous en retard aujourd’hui ?',
        'zh-CN': '你今天迟到了吗？',
        'es-ES': '¿Llegas tarde hoy?',
      };
      return map[lang];
    }
    const map: Record<KioskVoiceLang, string> = {
      'en-IN': 'Clocked in on time. Thank you.',
      'hi-IN': 'समय पर क्लॉक इन हो गया। धन्यवाद।',
      'gu-IN': 'સમયસર ક્લોક ઇન થઈ ગયું છે. આભાર.',
      'fr-FR': 'Pointage à l’heure. Merci.',
      'zh-CN': '已准时打卡上班。谢谢。',
      'es-ES': 'Entrada registrada a tiempo. Gracias.',
    };
    return map[lang];
  }

  if (event.kind === 'clock-out') {
    const map: Record<KioskVoiceLang, string> = {
      'en-IN': 'Clocked out. Thank you.',
      'hi-IN': 'क्लॉक आउट हो गया। धन्यवाद।',
      'gu-IN': 'ક્લોક આઉટ થઈ ગયું છે. આભાર.',
      'fr-FR': 'Sortie enregistrée. Merci.',
      'zh-CN': '已打卡下班。谢谢。',
      'es-ES': 'Salida registrada. Gracias.',
    };
    return map[lang];
  }

  if (event.kind === 'break-in') {
    const map: Record<KioskVoiceLang, string> = {
      'en-IN': 'Break started. Thank you.',
      'hi-IN': 'ब्रेक शुरू हो गया। धन्यवाद।',
      'gu-IN': 'બ્રેક શરૂ થઈ ગયો છે. આભાર.',
      'fr-FR': 'Pause commencée. Merci.',
      'zh-CN': '休息开始。谢谢。',
      'es-ES': 'Descanso iniciado. Gracias.',
    };
    return map[lang];
  }

  const map: Record<KioskVoiceLang, string> = {
    'en-IN': 'Break ended. Thank you.',
    'hi-IN': 'ब्रेक समाप्त हो गया। धन्यवाद।',
    'gu-IN': 'બ્રેક પૂરો થઈ ગયો છે. આભાર.',
    'fr-FR': 'Pause terminée. Merci.',
    'zh-CN': '休息结束。谢谢。',
    'es-ES': 'Descanso terminado. Gracias.',
  };
  return map[lang];
}

export function unlockKioskSpeech() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.getVoices();
    const utter = new SpeechSynthesisUtterance(' ');
    utter.volume = 0;
    utter.rate = 10;
    activeUtterance = utter;
    synth.resume();
    synth.speak(utter);
  } catch {
    // Ignore unlock errors
  }
}

export function speakKioskText(
  text: string,
  options: { enabled?: boolean; lang?: KioskVoiceLang; gender?: KioskVoiceGender } = {},
) {
  const { enabled = true, lang = 'en-IN', gender = 'female' } = options;
  if (!enabled || !text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    const run = () => {
      const utter = new SpeechSynthesisUtterance(text);
      const picked = pickKioskVoice(synth.getVoices(), lang, gender);
      if (picked) utter.voice = picked;
      utter.lang = picked?.lang || lang;
      utter.pitch = gender === 'male' ? 0.86 : 1.12;
      utter.rate = 0.98;
      utter.volume = 1;
      activeUtterance = utter;
      utter.onend = () => {
        if (activeUtterance === utter) activeUtterance = null;
      };
      synth.resume();
      synth.speak(utter);
    };
    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(run, 60);
    } else {
      run();
    }
  } catch {
    // Ignore speech synthesis errors on unsupported browsers
  }
}
