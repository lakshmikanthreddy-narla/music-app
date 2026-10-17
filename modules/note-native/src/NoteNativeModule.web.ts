import { registerWebModule, NativeModule } from 'expo';

import { NativeStreamResult, PlatformInfo } from './NoteNative.types';

class NoteNativeModule extends NativeModule<{}> {
  getPlatformInfo(): PlatformInfo {
    return { platform: 'web', native: false };
  }

  /** There is no extractor on web; callers fall through to the next source. */
  async resolveYouTubeStream(): Promise<NativeStreamResult> {
    return {
      ok: false,
      reason: 'module_unavailable',
      message: 'Native stream resolution is not available on web',
    };
  }

  async startVoiceSearch(): Promise<string> {
    if (typeof window === 'undefined') return '';
    return new Promise((resolve) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        resolve('');
        return;
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
          const text = event.results?.[0]?.[0]?.transcript || '';
          resolve(text);
        };
        recognition.onerror = () => resolve('');
        recognition.onend = () => resolve('');
        recognition.start();
      } catch {
        resolve('');
      }
    });
  }
}

export default registerWebModule(NoteNativeModule, 'NoteNativeModule');
