export interface TranscriptEntry {
  time: string;
  speaker: string;
  text: string;
}

export interface TranscriptSection {
  section: string;
  entries: TranscriptEntry[];
}

export interface TranscriptData {
  sections: TranscriptSection[];
}

export interface LiveParticipant {
  name: string;
  id: string;
  isLocal?: boolean;
}
