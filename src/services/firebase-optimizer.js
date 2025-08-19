/**
 * Optimizaciones para Firebase Spark Plan
 * Reduce lecturas/escrituras y mejora eficiencia
 */

// Cache en memoria para evitar lecturas repetidas
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Leer usuario con cache
 */
export const getCachedUser = async (userId) => {
  const cached = userCache.get(userId);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('📚 Using cached user data');
    return cached.data;
  }
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // Cache result
    userCache.set(userId, {
      data: userData,
      timestamp: Date.now()
    });
    
    console.log('🔥 Firestore read - User loaded');
    return userData;
  } catch (error) {
    console.error('Error loading user:', error);
    return null;
  }
};

/**
 * Escribir datos en batch para reducir operaciones
 */
export const batchWrite = async (operations) => {
  const batch = db.batch();
  let operationCount = 0;
  
  for (const op of operations) {
    if (operationCount >= 500) { // Límite de batch de Firestore
      await batch.commit();
      batch = db.batch();
      operationCount = 0;
    }
    
    const { type, collection, doc, data } = op;
    const docRef = db.collection(collection).doc(doc);
    
    switch (type) {
      case 'set':
        batch.set(docRef, data);
        break;
      case 'update':
        batch.update(docRef, data);
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
    
    operationCount++;
  }
  
  if (operationCount > 0) {
    await batch.commit();
  }
  
  console.log(`🔥 Batch write - ${operations.length} operations`);
};

/**
 * Escuchar cambios con límites
 */
export const listenWithLimits = (collection, callback, limit = 10) => {
  return db.collection(collection)
    .limit(limit)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(callback, (error) => {
      console.error('Listen error:', error);
    });
};

/**
 * Contador de operaciones diarias
 */
let dailyOperations = {
  reads: 0,
  writes: 0,
  deletes: 0,
  date: new Date().toDateString()
};

// Reset contador si es nuevo día
const resetIfNewDay = () => {
  const today = new Date().toDateString();
  if (dailyOperations.date !== today) {
    dailyOperations = { reads: 0, writes: 0, deletes: 0, date: today };
  }
};

/**
 * Monitorear operaciones
 */
export const trackOperation = (type) => {
  resetIfNewDay();
  dailyOperations[type]++;
  
  // Alertar si cerca del límite
  const limits = { reads: 50000, writes: 20000, deletes: 20000 };
  const current = dailyOperations[type];
  const limit = limits[type];
  
  if (current > limit * 0.8) {
    console.warn(`⚠️ ${type} usage: ${current}/${limit} (${Math.round(current/limit*100)}%)`);
  }
};

/**
 * Ver uso actual
 */
export const getUsageStats = () => {
  resetIfNewDay();
  return {
    ...dailyOperations,
    limits: { reads: 50000, writes: 20000, deletes: 20000 }
  };
};

export default {
  getCachedUser,
  batchWrite,
  listenWithLimits,
  trackOperation,
  getUsageStats
};