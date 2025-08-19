/**
 * Script de prueba para el sistema dual Firebase + Supabase
 * Ejecutar con: node test-dual-system.js
 */

import { writeData, readData, getSyncStatus } from './src/services/database-sync.js';

async function testDualSystem() {
  console.log('🧪 PROBANDO SISTEMA DUAL Firebase + Supabase\n');

  // 1. Ver estado inicial
  console.log('📊 Estado inicial:');
  const initialStatus = getSyncStatus();
  console.log('- Base de datos principal:', initialStatus.primaryDB);
  console.log('- Firebase online:', initialStatus.isFirebaseOnline);
  console.log('- Sincronización activa:', initialStatus.isSyncEnabled);
  console.log('- Datos pendientes:', initialStatus.pendingCount);
  console.log('');

  // 2. Crear usuario de prueba
  console.log('👤 Creando usuario de prueba...');
  const testUser = {
    email: 'test@urbandrive.com',
    displayName: 'Usuario Prueba',
    phone: '+57 300 123 4567',
    userType: 'user',
    isVisible: true,
    location: {
      lat: 4.710989,
      lng: -74.072092,
      address: 'Bogotá, Colombia'
    },
    contacts: []
  };

  const userId = 'test-user-' + Date.now();
  
  try {
    const writeSuccess = await writeData('users', userId, testUser);
    console.log('✅ Usuario creado:', writeSuccess ? 'Éxito' : 'Error');
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
  }
  
  // 3. Leer usuario
  console.log('\n📖 Leyendo usuario...');
  try {
    const readUser = await readData('users', userId);
    if (readUser) {
      console.log('✅ Usuario leído:', readUser.displayName);
      console.log('   Email:', readUser.email);
      console.log('   Ubicación:', readUser.location?.address);
    } else {
      console.log('❌ Usuario no encontrado');
    }
  } catch (error) {
    console.error('❌ Error leyendo usuario:', error.message);
  }

  // 4. Crear invitación de prueba
  console.log('\n📨 Creando invitación de prueba...');
  const testInvitation = {
    inviterEmail: 'test@urbandrive.com',
    inviterName: 'Usuario Prueba',
    inviterPhone: '+57 300 123 4567',
    recipientPhone: '+57 300 987 6543',
    used: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
  };

  const invitationId = 'invite-' + Date.now();
  
  try {
    const inviteSuccess = await writeData('invitations', invitationId, testInvitation);
    console.log('✅ Invitación creada:', inviteSuccess ? 'Éxito' : 'Error');
  } catch (error) {
    console.error('❌ Error creando invitación:', error.message);
  }

  // 5. Estado final
  console.log('\n📊 Estado final:');
  const finalStatus = getSyncStatus();
  console.log('- Base de datos principal:', finalStatus.primaryDB);
  console.log('- Firebase online:', finalStatus.isFirebaseOnline);
  console.log('- Datos pendientes:', finalStatus.pendingCount);
  
  if (finalStatus.pendingCount > 0) {
    console.log('⏳ Hay datos pendientes de sincronización');
  } else {
    console.log('✅ Todos los datos sincronizados');
  }

  console.log('\n🎉 Prueba completada!');
  console.log('\nPuedes verificar los datos en:');
  console.log('- Firebase: https://console.firebase.google.com/project/urbandrive-1082b/firestore');
  console.log('- Supabase: https://app.supabase.com/project/jdsojfcdcxumgwbgvsxt/editor');
}

// Ejecutar prueba
testDualSystem().catch(console.error);