export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface SoilSample {
  id?: number;
  projectId: number;
  moisture: number;
  organicMatter: number;
  pH: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}
