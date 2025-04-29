'use client';

/**
 * Service for recording audio from the microphone
 */

interface AudioRecorderConfig {
  chunkIntervalMs: number;
  mimeType: string;
  channels: number;
  sampleRate: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

const DEFAULT_CONFIG: AudioRecorderConfig = {
  chunkIntervalMs: 5000,
  mimeType: 'audio/webm',
  channels: 1,
  sampleRate: 16000,
  echoCancellation: true,
  noiseSuppression: true,
};

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onDataAvailableCallback: ((blob: Blob) => void) | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;
  private config: AudioRecorderConfig;

  constructor(customConfig?: Partial) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  private getBestSupportedMimeType(): string {
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return this.config.mimeType;
  }

  async startRecording(onDataAvailable: (blob: Blob) => void, chunkIntervalMs?: number): Promise {
    if (this.isRecording) return;

    try {
      if (chunkIntervalMs) {
        this.config.chunkIntervalMs = chunkIntervalMs;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channels,
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
        },
      });

      const selectedMimeType = this.getBestSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
      });

      this.audioChunks = [];
      this.onDataAvailableCallback = onDataAvailable;

      this.setupMediaRecorderEvents();

      this.mediaRecorder.start(1000);
      this.isRecording = true;

      this.setupProcessingInterval();
    } catch (error) {
      this.cleanupResources();
      this.isRecording = false;
      throw error;
    }
  }

  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    });
  }

  private setupProcessingInterval(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }

    this.recordingInterval = setInterval(() => {
      this.processRecordingSegment();
    }, this.config.chunkIntervalMs);
  }

  private processRecordingSegment(): void {
    if (!this.isRecording || !this.mediaRecorder || !this.stream) {
      return;
    }

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();

      setTimeout(() => {
        this.processAudioChunks();

        if (this.isRecording && this.mediaRecorder && this.stream) {
          this.mediaRecorder.start(1000);
        }
      }, 200);
    } else if (this.mediaRecorder.state === 'inactive' && this.isRecording) {
      try {
        this.mediaRecorder.start(1000);
      } catch (error) {
        console.error('Error restarting MediaRecorder:', error);
      }
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.cleanupResources();

    if (this.audioChunks.length > 0) {
      setTimeout(() => {
        this.processAudioChunks();
      }, 100);
    }
  }

  private cleanupResources(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }

    if (this.stream) {
      try {
        this.stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error('Error stopping media tracks:', error);
      }
      this.stream = null;
    }
  }

  private processAudioChunks(): void {
    if (this.audioChunks.length === 0 || !this.onDataAvailableCallback) {
      return;
    }

    try {
      const mimeType = this.mediaRecorder?.mimeType || this.config.mimeType;
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      this.onDataAvailableCallback(audioBlob);
      this.audioChunks = [];
    } catch (error) {
      console.error('Error processing audio chunks:', error);
    }
  }

  isRecordingActive(): boolean {
    return this.isRecording && !!this.mediaRecorder;
  }
}

// Export a singleton instance with default configuration
export default new AudioRecorder();
