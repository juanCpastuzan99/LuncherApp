/**
 * Convertidor de unidades educativas
 * Soporta conversiones comunes: longitud, peso, temperatura, moneda, tiempo
 */

interface ConversionResult {
  result: number;
  formatted: string;
  from: string;
  to: string;
}

// Factores de conversión
const CONVERSIONS: Record<string, Record<string, number>> = {
  // Longitud
  length: {
    'metro': 1,
    'metros': 1,
    'm': 1,
    'kilómetro': 1000,
    'kilómetros': 1000,
    'km': 1000,
    'centímetro': 0.01,
    'centímetros': 0.01,
    'cm': 0.01,
    'milímetro': 0.001,
    'milímetros': 0.001,
    'mm': 0.001,
    'milla': 1609.34,
    'millas': 1609.34,
    'mile': 1609.34,
    'miles': 1609.34,
    'pie': 0.3048,
    'pies': 0.3048,
    'ft': 0.3048,
    'feet': 0.3048,
    'pulgada': 0.0254,
    'pulgadas': 0.0254,
    'in': 0.0254,
    'inch': 0.0254,
    'inches': 0.0254,
    'yarda': 0.9144,
    'yardas': 0.9144,
    'yard': 0.9144,
    'yards': 0.9144
  },
  
  // Peso/Masa
  weight: {
    'kilogramo': 1,
    'kilogramos': 1,
    'kg': 1,
    'gramo': 0.001,
    'gramos': 0.001,
    'g': 0.001,
    'libra': 0.453592,
    'libras': 0.453592,
    'lb': 0.453592,
    'pound': 0.453592,
    'pounds': 0.453592,
    'onza': 0.0283495,
    'onzas': 0.0283495,
    'oz': 0.0283495,
    'ounce': 0.0283495,
    'ounces': 0.0283495,
    'tonelada': 1000,
    'toneladas': 1000,
    'ton': 1000
  },
  
  // Temperatura (especial)
  temperature: {
    'celsius': 0,
    'c': 0,
    'fahrenheit': 1,
    'f': 1,
    'kelvin': 2,
    'k': 2
  },
  
  // Tiempo
  time: {
    'segundo': 1,
    'segundos': 1,
    's': 1,
    'minuto': 60,
    'minutos': 60,
    'min': 60,
    'hora': 3600,
    'horas': 3600,
    'h': 3600,
    'día': 86400,
    'días': 86400,
    'day': 86400,
    'days': 86400,
    'semana': 604800,
    'semanas': 604800,
    'week': 604800,
    'weeks': 604800
  },
  
  // Volumen
  volume: {
    'litro': 1,
    'litros': 1,
    'l': 1,
    'mililitro': 0.001,
    'mililitros': 0.001,
    'ml': 0.001,
    'galón': 3.78541,
    'galones': 3.78541,
    'gallon': 3.78541,
    'gallons': 3.78541,
    'onza líquida': 0.0295735,
    'fl oz': 0.0295735,
    'taza': 0.236588,
    'tazas': 0.236588,
    'cup': 0.236588,
    'cups': 0.236588
  },
  
  // Moneda (tasas aproximadas, actualizar si es necesario)
  currency: {
    'usd': 1,
    'dólar': 1,
    'dólares': 1,
    'dollar': 1,
    'dollars': 1,
    'eur': 0.85,
    'euro': 0.85,
    'euros': 0.85,
    'gbp': 0.73,
    'libra esterlina': 0.73,
    'peso mexicano': 17.5,
    'mxn': 17.5,
    'peso colombiano': 4000,
    'cop': 4000
  }
};

/**
 * Detecta la categoría de conversión
 */
function detectCategory(from: string, to: string): string | null {
  const categories = ['length', 'weight', 'volume', 'time', 'currency', 'temperature'];
  
  for (const category of categories) {
    const conversions = CONVERSIONS[category];
    if (conversions[from] !== undefined && conversions[to] !== undefined) {
      return category;
    }
  }
  
  return null;
}

/**
 * Convierte unidades
 */
export function convertUnits(value: number, from: string, to: string): ConversionResult | null {
  const category = detectCategory(from, to);
  if (!category) {
    return null;
  }
  
  // Temperatura es especial
  if (category === 'temperature') {
    return convertTemperature(value, from, to);
  }
  
  const conversions = CONVERSIONS[category];
  const fromFactor = conversions[from];
  const toFactor = conversions[to];
  
  if (fromFactor === undefined || toFactor === undefined) {
    return null;
  }
  
  // Convertir a unidad base, luego a unidad destino
  const baseValue = value * fromFactor;
  const result = baseValue / toFactor;
  
  return {
    result,
    formatted: formatResult(result),
    from,
    to
  };
}

/**
 * Convierte temperatura (especial)
 */
function convertTemperature(value: number, from: string, to: string): ConversionResult | null {
  let celsius: number;
  
  // Convertir a Celsius primero
  if (from === 'c' || from === 'celsius') {
    celsius = value;
  } else if (from === 'f' || from === 'fahrenheit') {
    celsius = (value - 32) * 5 / 9;
  } else if (from === 'k' || from === 'kelvin') {
    celsius = value - 273.15;
  } else {
    return null;
  }
  
  // Convertir de Celsius a destino
  let result: number;
  if (to === 'c' || to === 'celsius') {
    result = celsius;
  } else if (to === 'f' || to === 'fahrenheit') {
    result = (celsius * 9 / 5) + 32;
  } else if (to === 'k' || to === 'kelvin') {
    result = celsius + 273.15;
  } else {
    return null;
  }
  
  return {
    result,
    formatted: formatResult(result),
    from,
    to
  };
}

/**
 * Formatea el resultado
 */
function formatResult(value: number): string {
  if (value % 1 === 0) {
    return value.toString();
  }
  
  // Redondear a máximo 4 decimales
  const rounded = Math.round(value * 10000) / 10000;
  return rounded.toString();
}

/**
 * Obtiene unidades disponibles para una categoría
 */
export function getAvailableUnits(category: string): string[] {
  return Object.keys(CONVERSIONS[category] || {});
}

