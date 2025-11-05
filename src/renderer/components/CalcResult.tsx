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
    <div className="calc-result calculator-mode">
      <div className="calc-header">
        <span className="calc-icon">🧮</span>
        <span className="calc-label">Calculadora</span>
      </div>
      <div className="calc-expression">
        {query}
      </div>
      <div className="calc-equals">=</div>
      <div className="calc-value">
        {result}
      </div>
      <div className="calc-hint">
        Presiona Enter para copiar el resultado
      </div>
    </div>
  );
};

