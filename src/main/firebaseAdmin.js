/**
 * Firebase Admin SDK para el proceso principal de Electron
 * Solo se usa si necesitas operaciones administrativas
 * 
 * NOTA: Para sincronización multi-dispositivo normal, NO necesitas esto.
 * Usa el Firebase Client SDK que ya está implementado.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let adminApp = null;

/**
 * Inicializar Firebase Admin SDK
 * Solo se inicializa si existe el archivo de service account
 */
function initializeFirebaseAdmin() {
  // Ruta al archivo de service account
  // Buscar en múltiples ubicaciones posibles
  const { app } = require('electron');
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'serviceAccountKey.json'), // Raíz del proyecto
    path.join(process.cwd(), 'serviceAccountKey.json'), // Directorio actual
    app && app.isReady() ? path.join(app.getPath('userData'), 'serviceAccountKey.json') : null // AppData (NO recomendado)
  ].filter(p => p !== null);

  let serviceAccountPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      serviceAccountPath = possiblePath;
      break;
    }
  }

  // Verificar si existe el archivo
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    console.log('⚠️ Firebase Admin: serviceAccountKey.json no encontrado');
    console.log('⚠️ Buscado en:', possiblePaths);
    console.log('⚠️ Firebase Admin no se inicializará. Usa Firebase Client SDK para sincronización.');
    console.log('📝 Para habilitar Firebase Admin, descarga serviceAccountKey.json desde Firebase Console');
    return null;
  }

  console.log('📁 Firebase Admin: Archivo encontrado en:', serviceAccountPath);

  try {
    const serviceAccount = require(serviceAccountPath);

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Opcional: especificar projectId si no está en serviceAccount
      // projectId: 'tu-proyecto-id'
    });

    console.log('✅ Firebase Admin inicializado correctamente');
    return adminApp;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error);
    return null;
  }
}

/**
 * Obtener instancia de Firestore Admin
 */
function getAdminFirestore() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return adminApp ? admin.firestore() : null;
}

/**
 * Obtener instancia de Auth Admin
 */
function getAdminAuth() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return adminApp ? admin.auth() : null;
}

/**
 * Ejemplo: Obtener todos los usuarios (solo admin)
 */
async function getAllUsers() {
  const auth = getAdminAuth();
  if (!auth) {
    throw new Error('Firebase Admin no está inicializado');
  }

  try {
    const listUsersResult = await auth.listUsers();
    return listUsersResult.users;
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    throw error;
  }
}

/**
 * Ejemplo: Eliminar datos de un usuario (solo admin)
 */
async function deleteUserData(userId) {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin no está inicializado');
  }

  try {
    const batch = db.batch();
    
    // Eliminar todos los datos del usuario
    const collections = ['flashcards', 'notes', 'todos', 'snippets', 'quizzes'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(`users/${userId}/${collectionName}`).get();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    console.log(`✅ Datos del usuario ${userId} eliminados`);
  } catch (error) {
    console.error('Error eliminando datos:', error);
    throw error;
  }
}

module.exports = {
  initializeFirebaseAdmin,
  getAdminFirestore,
  getAdminAuth,
  getAllUsers,
  deleteUserData
};

