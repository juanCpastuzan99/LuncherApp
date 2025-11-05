import React from 'react';
import './CalcResult.css';

interface CalcResultProps {
  result: number | string;
  expression: string;
  copied?: boolean;
}

const CalcResult: React.FC<CalcResultProps> = ({ result, expression, copied = false }) => {
  return (
    <div className="calc-result">
      <div className="calc-expression">{expression}</div>
      <div className="calc-value">{result}</div>
      {copied && (
        <div className="calc-copied">✓ Copiado al portapapeles</div>
      )}
      <div className="calc-hint">Presiona Enter para copiar</div>
    </div>
  );
};

export default CalcResult;

