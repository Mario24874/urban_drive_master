const admin = require('firebase-admin');
const serviceAccount = require('../credentials/serviceAccountKey.json');

// Inicializa la aplicación de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'http://localhost:8080' // URL del emulador de Firestore
});

const db = admin.firestore();

// Ejemplo de consulta
const phoneNumber = '04126763969'; // Cambia este valor si es necesario
const query = db.collection('users').where('phoneNumber', '==', phoneNumber);

query.get().then((querySnapshot) => {
  if (querySnapshot.empty) {
    console.log('No matching documents.');
  } else {
    querySnapshot.forEach((doc) => {
      console.log('Document found:', doc.id, '=>', doc.data());
    });
  }
}).catch((error) => {
  console.error('Error getting documents:', error);
});