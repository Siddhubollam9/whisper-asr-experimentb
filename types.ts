export interface ExperimentData {
  id: string;
  timestamp: number;
  audioBlob: Blob;
  audioUrl: string;
  referenceText: string;
  hypothesisText: string;
  wer: number;
  modelName: string;
  analysis?: string;
  isLoading: boolean;
}

export interface WerResult {
  wer: number;
  distance: number;
  substitutions: number;
  deletions: number;
  insertions: number;
}

export enum PageState {
  DASHBOARD = 'DASHBOARD',
  NEW_EXPERIMENT = 'NEW_EXPERIMENT',
  DETAILS = 'DETAILS'
}
