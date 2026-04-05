// Voice Input (Speech Recognition) and Output (Speech Synthesis) using Web Speech API — completely free

// Extend Window for SpeechRecognition (non-standard API)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Speech Recognition (Voice Input) ───

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

let recognition: any = null;
let isListening = false;

export function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function startListening(
  onResult: (transcript: string) => void,
  onEnd: () => void,
  onError: (error: string) => void,
  language = 'en-US'
): void {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return;
  }

  stopListening(); // Stop any existing session

  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[event.resultIndex][0].transcript;
    onResult(transcript.trim());
  };

  recognition.onerror = (event: any) => {
    isListening = false;
    if (event.error === 'no-speech') {
      onError('no-speech');
    } else if (event.error === 'aborted') {
      // Silently handle aborted
    } else {
      onError(event.error || 'Recognition failed');
    }
  };

  recognition.onend = () => {
    isListening = false;
    onEnd();
  };

  try {
    recognition.start();
    isListening = true;
  } catch (e) {
    onError('Failed to start speech recognition');
  }
}

export function stopListening(): void {
  if (recognition) {
    try {
      recognition.abort();
    } catch (_) {}
    recognition = null;
  }
  isListening = false;
}

export function getIsListening(): boolean {
  return isListening;
}

// ─── Speech Synthesis (Voice Output) ───

let selectedVoice: SpeechSynthesisVoice | null = null;
let isSpeaking = false;

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

export function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  // Prefer high-quality English voices
  const preferredNames = [
    'Google UK English Male',
    'Google UK English Female',
    'Microsoft David',
    'Microsoft Mark',
    'Microsoft Zira',
    'Google US English',
    'Daniel',
    'Alex',
    'Samantha',
  ];

  for (const name of preferredNames) {
    const found = voices.find(v => v.name.includes(name));
    if (found) return found;
  }

  // Fallback to any English voice
  const englishVoice = voices.find(v => v.lang.startsWith('en'));
  return englishVoice || voices[0];
}

export function setVoice(voice: SpeechSynthesisVoice | null) {
  selectedVoice = voice;
}

export function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void,
  rate = 1.0,
  pitch = 1.0
): void {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!text.trim()) {
    onEnd?.();
    return;
  }

  // Split long text into chunks to avoid the Chrome bug where long utterances stop mid-way
  const chunks = splitTextIntoChunks(text, 180);
  let currentChunk = 0;

  const speakChunk = () => {
    if (currentChunk >= chunks.length) {
      isSpeaking = false;
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);

    if (!selectedVoice) {
      selectedVoice = findBestVoice();
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    utterance.onstart = () => {
      isSpeaking = true;
      if (currentChunk === 0) onStart?.();
    };

    utterance.onend = () => {
      currentChunk++;
      speakChunk();
    };

    utterance.onerror = (e) => {
      isSpeaking = false;
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        onError?.(e.error || 'Speech synthesis failed');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakChunk();
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
  isSpeaking = false;
}

export function getIsSpeaking(): boolean {
  return isSpeaking || window.speechSynthesis.speaking;
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Initialize voices (they load async in some browsers)
if (typeof window !== 'undefined') {
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
    selectedVoice = findBestVoice();
  });
}
