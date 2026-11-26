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
  | { kind: 'not-matched' }
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

export function hasNativeVoice(voices: SpeechSynthesisVoice[], lang: KioskVoiceLang): boolean {
  const prefix = lang.split('-')[0].toLowerCase();
  return voices.some(
    (v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.toLowerCase().startsWith(`${prefix}-`) || v.lang.toLowerCase() === prefix,
  );
}

export function pickKioskVoice(
  voices: SpeechSynthesisVoice[],
  lang: KioskVoiceLang,
  gender: KioskVoiceGender,
) {
  const prefix = lang.split('-')[0].toLowerCase();
  const exact = voices.filter((v) => v.lang.toLowerCase() === lang.toLowerCase());
  const byLang = exact.length ? exact : voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const fallbackEn = voices.filter((v) => v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('en'));
  const pool = byLang.length ? byLang : (fallbackEn.length ? fallbackEn : voices);
  const hints = gender === 'male' ? MALE_HINTS : FEMALE_HINTS;
  const opposite = gender === 'male' ? FEMALE_HINTS : MALE_HINTS;
  return (
    pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) ||
    pool.find((v) => !opposite.some((h) => v.name.toLowerCase().includes(h))) ||
    pool[0] ||
    null
  );
}

export function buildKioskPhrase(
  event: KioskSpeechEvent,
  lang: KioskVoiceLang,
  usePhoneticFallback = false,
): string {
  if (usePhoneticFallback && lang === 'gu-IN') {
    if (event.kind === 'test') return 'Face clock voice taiyaar chhe. Aabhaar.';
    if (event.kind === 'not-matched') return 'Face match thato nathi, please fari try karo.';
    if (event.kind === 'clock-in') {
      return event.lateText ? 'Shu tame aaje moda chho?' : 'Samaysar clock in thai gayu chhe. Aabhaar.';
    }
    if (event.kind === 'clock-out') return 'Clock out thai gayu chhe. Aabhaar.';
    if (event.kind === 'break-in') return 'Break shuru thai gayo chhe. Aabhaar.';
    return 'Break puro thai gayo chhe. Aabhaar.';
  }

  if (usePhoneticFallback && lang === 'hi-IN') {
    if (event.kind === 'test') return 'Face clock voice taiyaar hai. Dhanyavaad.';
    if (event.kind === 'not-matched') return 'Face match nahi ho raha hai, kripya phir se try karein.';
    if (event.kind === 'clock-in') {
      return event.lateText ? 'Kya aap aaj late hain?' : 'Samay par clock in ho gaya. Dhanyavaad.';
    }
    if (event.kind === 'clock-out') return 'Clock out ho gaya. Dhanyavaad.';
    if (event.kind === 'break-in') return 'Break shuru ho gaya. Dhanyavaad.';
    return 'Break samapt ho gaya. Dhanyavaad.';
  }

  if (usePhoneticFallback && lang !== 'en-IN') {
    return buildKioskPhrase(event, 'en-IN', false);
  }
  if (event.kind === 'not-matched') {
    const map: Record<KioskVoiceLang, string> = {
      'en-IN': 'Face is not match, please try again.',
      'hi-IN': 'चेहरा मेल नहीं खा रहा है, कृपया फिर से प्रयास करें।',
      'gu-IN': 'ચહેરો મેચ થતો નથી, કૃપા કરીને ફરી પ્રયાસ કરો.',
      'fr-FR': 'Le visage ne correspond pas, veuillez réessayer.',
      'zh-CN': '人脸不匹配，请重试。',
      'es-ES': 'El rostro no coincide, por favor inténtalo de nuevo.',
    };
    return map[lang];
  }
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
  textOrEvent: string | KioskSpeechEvent,
  options: { enabled?: boolean; lang?: KioskVoiceLang; gender?: KioskVoiceGender } = {},
) {
  const { enabled = true, lang = 'en-IN', gender = 'female' } = options;
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    const run = () => {
      const voices = synth.getVoices();
      const native = hasNativeVoice(voices, lang);
      const text = typeof textOrEvent === 'string'
        ? textOrEvent
        : buildKioskPhrase(textOrEvent, lang, !native);
      if (!text.trim()) return;
      const utter = new SpeechSynthesisUtterance(text);
      const picked = pickKioskVoice(voices, lang, gender);
      if (picked) utter.voice = picked;
      utter.lang = native ? (picked?.lang || lang) : (picked?.lang || 'en-IN');
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
