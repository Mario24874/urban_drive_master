const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files (including downloads folder)
app.use(express.static('public'));

// APK download endpoint
app.get('/download-apk', (req, res) => {
  // Buscar APK firmado primero, luego el normal
  const signedApkPath = path.join(__dirname, 'public', 'downloads', 'urban-drive-signed.apk');
  const realApkPath = path.join(__dirname, 'public', 'downloads', 'urban-drive.apk');
  const demoApkPath = path.join(__dirname, 'public', 'urban-drive-demo.apk');
  
  let apkPath = signedApkPath;
  let isRealApk = true;
  let apkType = 'SIGNED';
  
  // Primero intentar con APK firmado
  if (!fs.existsSync(signedApkPath)) {
    // Si no existe firmado, usar APK normal
    if (fs.existsSync(realApkPath)) {
      apkPath = realApkPath;
      apkType = 'NORMAL';
    } else {
      console.log('⚠️  APK real no encontrado. Usando APK de demostración...');
      apkPath = demoApkPath;
      isRealApk = false;
      apkType = 'DEMO';
      
      // Crear APK de demostración si no existe
      if (!fs.existsSync(demoApkPath)) {
        const demoContent = `Urban Drive APK Demo - ${new Date().toISOString()}`;
        fs.writeFileSync(demoApkPath, demoContent);
      }
    }
  }
  
  const stat = fs.statSync(apkPath);
  
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="urban-drive.apk"');
  res.setHeader('Content-Length', stat.size);
  
  const readStream = fs.createReadStream(apkPath);
  readStream.pipe(res);
  
  console.log(`📱 APK descargado (${apkType}):`, new Date().toISOString());
});

// Get APK info endpoint
app.get('/apk-info', (req, res) => {
  const signedApkPath = path.join(__dirname, 'public', 'downloads', 'urban-drive-signed.apk');
  const realApkPath = path.join(__dirname, 'public', 'downloads', 'urban-drive.apk');
  const demoApkPath = path.join(__dirname, 'public', 'urban-drive-demo.apk');
  
  const signedExists = fs.existsSync(signedApkPath);
  const realExists = fs.existsSync(realApkPath);
  const demoExists = fs.existsSync(demoApkPath);
  
  let apkPath, filename, directUrl, type;
  const exists = signedExists || realExists || demoExists;
  
  if (signedExists) {
    apkPath = signedApkPath;
    filename = 'urban-drive-signed.apk';
    directUrl = `http://localhost:${PORT}/downloads/urban-drive-signed.apk`;
    type = 'signed';
  } else if (realExists) {
    apkPath = realApkPath;
    filename = 'urban-drive.apk';
    directUrl = `http://localhost:${PORT}/downloads/urban-drive.apk`;
    type = 'real';
  } else {
    apkPath = demoApkPath;
    filename = 'urban-drive-demo.apk';
    directUrl = null;
    type = 'demo';
  }
  
  res.json({
    available: exists,
    filename,
    downloadUrl: `http://localhost:${PORT}/download-apk`,
    directUrl,
    shareUrl: `http://localhost:${PORT}/download-apk`,
    size: exists ? fs.statSync(apkPath).size : 0,
    lastModified: exists ? fs.statSync(apkPath).mtime : null,
    type,
    isReal: signedExists || realExists,
    isSigned: signedExists
  });
});

// Share via email endpoint
app.post('/share-email', express.json(), (req, res) => {
  const { email, message } = req.body;
  
  console.log('📧 Compartir por email solicitado:');
  console.log('- Email:', email);
  console.log('- Mensaje:', message);
  console.log('- URL APK:', `http://localhost:${PORT}/download-apk`);
  
  // Aquí podrías integrar con un servicio de email real
  // Por ahora solo simulamos
  res.json({
    success: true,
    message: 'Email enviado exitosamente (simulado)',
    downloadUrl: `http://localhost:${PORT}/download-apk`
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Urban Drive APK Server',
    endpoints: {
      '/download-apk': 'Descargar APK',
      '/apk-info': 'Información del APK',
      '/share-email': 'Compartir por email (POST)'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
🚀 Urban Drive APK Server iniciado
📍 URL: http://localhost:${PORT}
📱 Descarga APK: http://localhost:${PORT}/download-apk
💡 Info APK: http://localhost:${PORT}/apk-info

Para usar en tu app, actualiza la URL del APK a:
http://localhost:${PORT}/download-apk
  `);
});

module.exports = app;