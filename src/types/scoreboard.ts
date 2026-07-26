// src/types/scoreboard.ts
export interface ParticipantRow {
  id: string; // Cambiado de 'name' a 'id'
  [problem: `P${number}`]: number;
}

export interface StudentMetadata {
  id: string; // ID único como llave primaria
  name: string;
  age: number;
  yearsInProcess: number;
}

export interface ScoreboardData {
  id: string;
  title: string;
  problemsCount: number;
  weight: number;
  results: ParticipantRow[];
}