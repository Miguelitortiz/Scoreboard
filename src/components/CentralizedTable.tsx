// src/components/CentralizedTable.tsx
import React, { useState, useMemo } from 'react';
import type { ScoreboardData, StudentMetadata } from '../types/scoreboard';

interface Props {
  scoreboards: ScoreboardData[];
  studentMetadata: StudentMetadata[];
}

export const CentralizedTable: React.FC<Props> = ({ scoreboards, studentMetadata }) => {
  const [activeTab, setActiveTab] = useState<string>('general');

  // Mapa rápido O(1) para buscar metadatos de estudiantes por ID
  const studentMap = useMemo(() => {
    const map = new Map<string, StudentMetadata>();
    studentMetadata.forEach(student => map.set(student.id, student));
    return map;
  }, [studentMetadata]);

  // ==========================================
 // ==========================================
  // ⚙️ FÓRMULA DE CÁLCULO PERSONALIZADA (CON LOGARITMOS Y PONDERACIÓN)
  // ==========================================
  const calculateFinalScore = (
    studentId: string,
    scoresByExam: Array<{ scoreboardId: string; weight: number; sumOfPoints: number; problemsCount: number }>,
    age: number,
    yearsInProcess: number
  ): number => {
    const k1 = 0.5;
    const k2 = 12;

    // 1. Calcular el promedio ponderado (Weighted Mean) de aciertos
    // Promedio de cada examen = puntos obtenidos / cantidad de problemas de ese examen.
    // Sumatoria de (Promedio_Examen_i * Peso_Examen_i)
    let weightedMean = 0;

    scoresByExam.forEach(item => {
      if (item.problemsCount > 0) {
        const examMean = item.sumOfPoints / item.problemsCount / 7; // Promedio de este examen
        weightedMean += examMean * item.weight; // Aplicamos la ponderación del examen (ej. 0.40 o 0.60)
      }
    });

    // 2. Aplicar la fórmula con logaritmos usando el promedio ponderado
    const experience = Math.max(1, yearsInProcess);
    const termAge = Math.log(18 - age);
    const termExperience = Math.log(experience);

    const finalScore = weightedMean * ((termAge - termExperience) * k1 + k2);

    // 3. Tu nueva instrucción de redondeo y escala personalizada (finalScore * 5) / 20
    return Math.max(0, Math.round(finalScore * 100) );
  };
  // ==========================================
  // ==========================================

  const activeExam = useMemo(() => {
    return scoreboards.find(s => s.id === activeTab);
  }, [scoreboards, activeTab]);

  const activeExamHeaders = useMemo(() => {
    if (!activeExam) return [];
    return Array.from({ length: activeExam.problemsCount }, (_, i) => `P${i + 1}`);
  }, [activeExam]);

  // Colección única de IDs de estudiantes participantes
  const allParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    scoreboards.forEach(s => s.results.forEach(r => ids.add(r.id)));
    return Array.from(ids);
  }, [scoreboards]);

  // Generación del Leaderboard General Relacional
  const generalLeaderboardData = useMemo(() => {
    return allParticipantIds.map(id => {
      const meta = studentMap.get(id) || {
        id,
        name: `Desconocido (${id})`,
        age: 15, // Valor por defecto seguro menor a 18
        yearsInProcess: 1
      };

      const scoresByExam = scoreboards.map(board => {
        const studentRow = board.results.find(r => r.id === id);
        let sumOfPoints = 0;
        
        if (studentRow) {
          const headers = Array.from({ length: board.problemsCount }, (_, i) => `P${i + 1}`);
          headers.forEach(h => {
            sumOfPoints += studentRow[h as `P${number}`] || 0;
          });
        }

        return {
          scoreboardId: board.id,
          weight: board.weight,
          sumOfPoints,
          problemsCount: board.problemsCount // Pasamos la cantidad de problemas del examen
        };
      });

      const finalScore = calculateFinalScore(id, scoresByExam, meta.age, meta.yearsInProcess);

      return {
        id,
        name: meta.name,
        age: meta.age,
        yearsInProcess: meta.yearsInProcess,
        scoresByExam,
        finalScore
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }, [scoreboards, allParticipantIds, studentMap]);

  return (
    <div className="w-full space-y-8">
      {/* Selector de Pestañas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 font-black uppercase tracking-tight text-sm border-4 border-black transition-all ${
            activeTab === 'general'
              ? 'bg-yellow-300 translate-x-1 translate-y-1 shadow-none'
              : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
          }`}
        >
          Leaderboard General
        </button>

        {scoreboards.map((board) => (
          <button
            key={board.id}
            onClick={() => setActiveTab(board.id)}
            className={`px-5 py-3 font-black uppercase tracking-tight text-sm border-4 border-black transition-all ${
              activeTab === board.id
                ? 'bg-blue-300 translate-x-1 translate-y-1 shadow-none'
                : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'
            }`}
          >
             {board.title} <span className="text-xs opacity-60">({board.problemsCount} Probs)</span>
          </button>
        ))}
      </div>

      {/* Tabla Única */}
      <div className="w-full overflow-x-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6">
        {activeTab === 'general' ? (
          /* VISTA: LEADERBOARD GENERAL CON NUEVA FÓRMULA */
          <table className="w-full text-left border-collapse font-sans uppercase tracking-tight text-sm">
            <thead>
              <tr className="border-b-4 border-black bg-yellow-300">
                <th className="p-4 border-r-4 border-black font-black w-1/4">NAME</th>
                {scoreboards.map(board => (
                  <th key={board.id} className="p-4 border-r-4 border-black font-black text-center">
                    {board.title}
                    <div className="text-xs font-bold text-gray-700 font-mono">
                      {board.problemsCount} PROBS
                    </div>
                  </th>
                ))}
                <th className="p-4 font-black text-center bg-black text-white">FINAL SCORE</th>
              </tr>
            </thead>
            <tbody>
              {generalLeaderboardData.map((row) => (
                <tr key={row.id} className="border-b-2 border-black hover:bg-gray-100 transition-colors">
                  <td className="p-4 border-r-4 border-black font-medium">{row.name}</td>
                  {scoreboards.map(board => {
                    const examData = row.scoresByExam.find(e => e.scoreboardId === board.id);
                    return (
                      <td key={board.id} className="p-4 border-r-4 border-black text-center font-bold">
                        {examData ? examData.sumOfPoints : 0} pts
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-black bg-gray-50 text-base">{row.finalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* VISTA: EXAMEN INDIVIDUAL */
          <table className="w-full text-left border-collapse font-sans uppercase tracking-tight text-sm">
            <thead>
              <tr className="border-b-4 border-black bg-blue-300">
                <th className="p-4 border-r-4 border-black font-black w-1/3">NAME</th>
                {activeExamHeaders.map(header => (
                  <th key={header} className="p-4 border-r-4 border-black font-black text-center">
                    {header}
                  </th>
                ))}
                <th className="p-4 font-black text-center bg-black text-white">Σ</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const computedResults = (activeExam?.results || []).map(row => {
                  let sum = 0;
                  activeExamHeaders.forEach(h => {
                    sum += row[h as `P${number}`] || 0;
                  });
                  return { row, sum };
                });

                // Ordenar por puntaje total (sum) descendente
                computedResults.sort((a, b) => b.sum - a.sum);

                return computedResults.map(({ row, sum }) => {
                  const meta = studentMap.get(row.id);
                  return (
                    <tr key={row.id} className="border-b-2 border-black hover:bg-gray-100 transition-colors">
                      <td className="p-4 border-r-4 border-black font-medium">{meta ? meta.name : 'Desconocido'}</td>
                      {activeExamHeaders.map(header => (
                        <td 
                          key={header} 
                          className={`p-4 border-r-4 border-black text-center font-bold ${
                            row[header] === 7 ? 'bg-green-200' : row[header] === 0 ? 'text-gray-400' : ''
                          }`}
                        >
                          {row[header]}
                        </td>
                      ))}
                      <td className="p-4 text-center font-black bg-gray-50">{sum}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};