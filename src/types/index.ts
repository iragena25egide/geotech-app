export interface User {
  id: number;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
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
  texture?: string; // e.g., "sandy", "clay", "loam"
  classification?: string; // USDA classification
}

export interface Report {
  id: number;
  projectId: number;
  createdAt: string;
  pdfUrl?: string;
}