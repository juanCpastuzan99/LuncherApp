/**
 * Componente para mostrar resultados de cálculo
 */

import React from 'react';
import './CalcResult.css';

interface CalcResultProps {
  query: string;
  result: string;
}

export const CalcResult: React.FC<CalcResultProps> = ({ query, result }) => {
  return (
    <div className="calc-result">
      <div className="calc-query">{query} =</div>
      <div className="calc-value">{result}</div>
      <div className="calc-hint">Presiona Enter para copiar</div>
    </div>
  );
};

