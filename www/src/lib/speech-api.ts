/**
 * Client-side helper for server-side speech APIs
 * Replaces browser's native Web Speech API with Gemini-powered APIs
 */

export interface SpeechRecognitionResult {
  transcription: string;
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  mimeType: string;
}

/**
 * Record audio from microphone and transcribe using server-side API
 */
export class SpeechRecognition {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  public onresult: ((result: { transcript: string }) => void) | null = null;
  public onerror: ((error: Error) => void) | null = null;
  public onend: (() => void) | null = null;
  
  private language: string = "English";

  constructor(language: string = "English") {
    this.language = language;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          
          // Send to server for transcription
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          formData.append("language", this.language);
          
          const response = await fetch("/api/speech/transcribe", {
            method: "POST",
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Transcription failed");
          }
          
          const data: SpeechRecognitionResult = await response.json();
          
          if (this.onresult) {
            this.onresult({ transcript: data.transcription });
          }
        } catch (err) {
          if (this.onerror) {
            this.onerror(err as Error);
          }
        } finally {
          if (this.onend) {
            this.onend();
          }
          this.cleanup();
        }
      };
      
      this.mediaRecorder.start();
    } catch (err) {
      if (this.onerror) {
        this.onerror(err as Error);
      }
    }
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * Synthesize speech from text using server-side API
 */
export class SpeechSynthesis {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  async speak(text: string, language: string = "English"): Promise<void> {
    try {
      // Call server API to synthesize speech
      const response = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Speech synthesis failed");
      }

      const data: SpeechSynthesisResult = await response.json();

      // Convert base64 to audio and play
      const audioData = atob(data.audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      // Create audio context and play
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      this.currentSource.start(0);

      // Wait for audio to finish
      return new Promise((resolve) => {
        if (this.currentSource) {
          this.currentSource.onended = () => resolve();
        }
      });
    } catch (err) {
      console.error("Speech synthesis error:", err);
      throw err;
    }
  }

  cancel() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }
}
