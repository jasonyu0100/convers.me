export interface LiveStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  inProgress?: boolean;
  substeps?: LiveSubstep[];
}

export interface LiveSubstep {
  id: string;
  title: string;
  completed: boolean;
  inProgress?: boolean;
}

export interface LiveProviderProps {
  children: React.ReactNode;
}
