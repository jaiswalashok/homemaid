import { Audio } from 'expo-av';

export class SpeechToText {
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('Requesting audio permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Audio recording permission not granted');
    }

    try {
      console.log('Starting recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.recording = new Audio.Recording();
      
      // Use default recording options for compatibility
      await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await this.recording.startAsync();
      this.isRecording = true;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    if (!this.isRecording || !this.recording) {
      throw new Error('Not currently recording');
    }

    try {
      console.log('Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      this.isRecording = false;

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      console.log('Recording stopped, URI:', uri);
      
      // For now, return a mock transcription since we don't have a speech-to-text API
      // In a real app, you'd send this to a service like Google Speech-to-Text or Azure
      const mockTranscription = await this.mockTranscribeAudio(uri);
      
      this.recording = null;
      return mockTranscription;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  private async mockTranscribeAudio(audioUri: string): Promise<string> {
    // Mock transcription - in reality you'd send to a speech-to-text API
    const mockPhrases = [
      "Add milk and eggs to grocery list",
      "Buy vegetables and fruits",
      "Schedule meeting for tomorrow",
      "Call mom about dinner plans",
      "Pay electricity bill",
      "Clean the kitchen",
      "Water the plants",
      "Take out the trash",
      "Prepare dinner for the family",
      "Finish the project report",
    ];
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error cleaning up recording:', error);
      }
      this.recording = null;
    }
    this.isRecording = false;
  }
}

export const speechToText = new SpeechToText();
