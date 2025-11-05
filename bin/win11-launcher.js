#!/usr/bin/env node

/**
 * Binary entry point para win11-dev-launcher
 * Permite ejecutar la aplicación desde cualquier lugar después de instalarla globalmente
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Obtener la ruta del módulo instalado
function getModulePath() {
  // Si estamos en node_modules (instalación local o global)
  const possiblePaths = [
    path.join(__dirname, '..', 'src', 'main.js'),
    path.join(__dirname, '..', '..', 'win11-dev-launcher', 'src', 'main.js'),
    path.join(process.cwd(), 'src', 'main.js'),
    path.join(__dirname, '..', '..', '..', 'win11-dev-launcher', 'src', 'main.js')
  ];
  
  for (const modulePath of possiblePaths) {
    if (fs.existsSync(modulePath)) {
      return path.dirname(modulePath);
    }
  }
  
  // Si no se encuentra, usar el directorio actual
  return process.cwd();
}

const modulePath = getModulePath();
const mainFile = path.join(modulePath, 'src', 'main.js');

if (!fs.existsSync(mainFile)) {
  console.error('Error: No se encontró el archivo main.js');
  console.error('Rutas intentadas:');
  console.error('  -', mainFile);
  console.error('  -', path.join(__dirname, '..', 'src', 'main.js'));
  process.exit(1);
}

// Buscar electron en diferentes ubicaciones
function findElectron() {
  const possibleElectrons = [
    path.join(modulePath, 'node_modules', '.bin', 'electron'),
    path.join(modulePath, 'node_modules', 'electron', 'cli.js'),
    path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    path.join(__dirname, '..', 'node_modules', 'electron', 'cli.js'),
    path.join(__dirname, '..', '..', 'win11-dev-launcher', 'node_modules', '.bin', 'electron'),
    path.join(__dirname, '..', '..', 'win11-dev-launcher', 'node_modules', 'electron', 'cli.js'),
    'electron' // Si está en PATH
  ];
  
  for (const electronPath of possibleElectrons) {
    if (fs.existsSync(electronPath) || electronPath === 'electron') {
      return electronPath;
    }
  }
  
  return 'electron'; // Fallback
}

const electronPath = findElectron();

console.log('Iniciando Win11 Dev Launcher...');
console.log('Ubicación:', modulePath);

// Ejecutar electron
const electronProcess = spawn(electronPath, [mainFile], {
  cwd: modulePath,
  stdio: 'inherit',
  shell: true
});

electronProcess.on('error', (error) => {
  console.error('Error al ejecutar Electron:', error.message);
  console.error('\nAsegúrate de que Electron esté instalado:');
  console.error('  npm install -g electron');
  process.exit(1);
});

electronProcess.on('close', (code) => {
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  electronProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  electronProcess.kill('SIGTERM');
});

