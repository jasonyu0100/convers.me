'use client';

/**
 * Service for recording audio from the microphone
 * Handles audio recording, transcription, and chunking
 */
export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onDataAvailableCallback: ((blob: Blob) => void) | null = null;
  private recordingInterval: NodeJS.Timeout | null = null;
  private recordingIntervalMs = 5000; // 5 seconds per chunk

  /**
   * Start recording audio from the microphone
   * @param onDataAvailable Callback function that will be called when audio data is available
   * @param chunkIntervalMs How often to process audio chunks in milliseconds (default: 5000ms)
   */
  async startRecording(onDataAvailable: (blob: Blob) => void, chunkIntervalMs = 5000): Promise {
    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      // Request microphone permission and get the stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // 16kHz is good for speech recognition
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Check supported MIME types
      const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'];

      let selectedMimeType = 'audio/webm';

      // Find the first supported MIME type
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`Using supported MIME type: ${selectedMimeType}`);
          break;
        }
      }

      // Set up the media recorder with the supported MIME type
      console.log(`Creating MediaRecorder with MIME type: ${selectedMimeType}`);
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
      });

      // Clear any existing chunks
      this.audioChunks = [];
      this.onDataAvailableCallback = onDataAvailable;
      this.recordingIntervalMs = chunkIntervalMs;

      // Set up event handlers with better error logging
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log(`Audio data available event: size=${event.data.size} bytes, type=${event.data.type}`);
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log(`Added chunk #${this.audioChunks.length} to queue`);
        } else {
          console.warn('Received empty audio data');
        }
      });

      this.mediaRecorder.addEventListener('start', () => {
        console.log('MediaRecorder started');
      });

      this.mediaRecorder.addEventListener('stop', () => {
        console.log('MediaRecorder stopped');
      });

      this.mediaRecorder.addEventListener('error', (event) => {
        console.error('MediaRecorder error:', event);
      });

      // Start recording with a timeslice to ensure regular dataavailable events
      // This ensures we get data regularly even if stop() isn't called
      console.log('Starting MediaRecorder with timeslice of 1000ms');
      this.mediaRecorder.start(1000); // Request data every second as a backup
      this.isRecording = true;

      // Set up interval to process chunks periodically
      console.log(`Setting up chunk processing interval every ${this.recordingIntervalMs}ms`);
      this.recordingInterval = setInterval(() => {
        if (this.isRecording && this.mediaRecorder) {
          console.log(`Processing interval triggered, current state: ${this.mediaRecorder.state}`);

          if (this.mediaRecorder.state === 'recording') {
            // Request data now by stopping the recorder
            console.log('Stopping current recording segment');
            this.mediaRecorder.stop();

            // Process the collected chunks
            setTimeout(() => {
              console.log('Processing audio chunks after stop');
              this.processAudioChunks();

              // Start a new recording segment if still recording
              if (this.isRecording && this.mediaRecorder && this.stream) {
                console.log('Starting new recording segment');
                this.mediaRecorder.start(1000);
              } else {
                console.warn('Cannot restart recording - conditions not met');
              }
            }, 200); // Give more time to ensure stop completes
          } else {
            console.warn(`MediaRecorder not in recording state: ${this.mediaRecorder.state}`);

            // Try to restart if it's inactive
            if (this.mediaRecorder.state === 'inactive' && this.isRecording && this.stream) {
              console.log('Restarting inactive MediaRecorder');
              this.mediaRecorder.start(1000);
            }
          }
        }
      }, this.recordingIntervalMs);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording(): void {
    if (!this.isRecording) {
      console.log('Not recording');
      return;
    }

    // Clear the processing interval
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    // Stop the media recorder if it exists
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();

      // Process any final chunks
      setTimeout(() => {
        this.processAudioChunks();
      }, 100);
    }

    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.isRecording = false;
    console.log('Recording stopped');
  }

  /**
   * Process the collected audio chunks
   */
  private processAudioChunks(): void {
    if (this.audioChunks.length === 0) {
      console.warn('No audio chunks available to process');
      return;
    }

    if (!this.onDataAvailableCallback) {
      console.warn('No callback registered for audio processing');
      return;
    }

    try {
      console.log(`Processing ${this.audioChunks.length} audio chunks`);

      // Get the MIME type from the MediaRecorder
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
      console.log(`Using MIME type for Blob: ${mimeType}`);

      // Combine all chunks into a single blob
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      console.log(`Created audio blob of size: ${audioBlob.size} bytes`);

      if (audioBlob.size < 100) {
        console.warn('Audio blob is suspiciously small, might not contain valid audio data');
      }

      // For debugging: create an audio URL that could be played
      if (audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log(`Debug audio URL (valid for this session only): ${audioUrl}`);
      }

      // Call the callback with the audio blob
      console.log('Calling audio processing callback with blob');
      this.onDataAvailableCallback(audioBlob);

      // Clear the chunks for the next recording segment
      this.audioChunks = [];
    } catch (error) {
      console.error('Error processing audio chunks:', error);
    }
  }

  /**
   * Check if recording is in progress
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }
}

// Export a singleton instance
export default new AudioRecorder();
