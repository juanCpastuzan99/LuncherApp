/**
 * Componente para mostrar resultados de conversión de unidades
 */

import React from 'react';
import './ConvertResult.css';

interface ConvertResultProps {
  value: number;
  from: string;
  to: string;
  result: number;
}

export const ConvertResult: React.FC<ConvertResultProps> = ({ 
  value, 
  from, 
  to, 
  result 
}) => {
  const formatUnit = (unit: string) => {
    return unit.charAt(0).toUpperCase() + unit.slice(1);
  };
  
  return (
    <div className="convert-result">
      <div className="convert-equation">
        {value} {formatUnit(from)} =
      </div>
      <div className="convert-value">
        {result} {formatUnit(to)}
      </div>
      <div className="convert-hint">
        Presiona Enter para copiar
      </div>
    </div>
  );
};

