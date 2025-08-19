const fs = require('fs');
const path = require('path');

// Generate Android resources for Urban Drive
console.log('🎨 Generating Android resources for Urban Drive...');

// Create android strings.xml
const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Urban Drive</string>
    <string name="title_activity_main">Urban Drive</string>
    <string name="package_name">com.urbandrive.app</string>
    <string name="custom_url_scheme">com.urbandrive.app</string>
    
    <!-- Permission descriptions -->
    <string name="location_permission_description">Urban Drive needs location access to find drivers near you and provide ride services.</string>
    <string name="camera_permission_description">Urban Drive needs camera access to scan QR codes and take profile photos.</string>
    <string name="notification_permission_description">Urban Drive needs notification access to keep you updated about your rides.</string>
    
    <!-- App features -->
    <string name="find_driver">Find Driver</string>
    <string name="my_location">My Location</string>
    <string name="destination">Destination</string>
    <string name="ride_request">Request Ride</string>
    <string name="driver_profile">Driver Profile</string>
    <string name="ride_history">Ride History</string>
    <string name="settings">Settings</string>
    <string name="logout">Logout</string>
    
    <!-- Error messages -->
    <string name="location_error">Unable to get your location. Please check your GPS settings.</string>
    <string name="network_error">No internet connection. Please check your network settings.</string>
    <string name="server_error">Server error. Please try again later.</string>
</resources>`;

// Create colors.xml
const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#000000</color>
    <color name="colorPrimaryDark">#000000</color>
    <color name="colorAccent">#666666</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
    <color name="gray">#666666</color>
    <color name="light_gray">#CCCCCC</color>
    <color name="background">#F5F5F5</color>
    <color name="surface">#FFFFFF</color>
    <color name="error">#F44336</color>
    <color name="success">#4CAF50</color>
    <color name="warning">#FF9800</color>
</resources>`;

// Create styles.xml
const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
        <item name="android:windowBackground">@color/white</item>
        <item name="android:textColorPrimary">@color/black</item>
    </style>
    
    <style name="AppTheme.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowTranslucentStatus">false</item>
        <item name="android:windowTranslucentNavigation">false</item>
        <item name="android:statusBarColor">@color/colorPrimary</item>
    </style>

    <style name="AppTheme.Splash" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowTranslucentStatus">false</item>
        <item name="android:windowTranslucentNavigation">false</item>
    </style>
</resources>`;

// Android Manifest template
const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
    
    <!-- Optional permissions -->
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <!-- Features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location" android:required="true" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.location.network" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:exported="true"
            android:launchMode="singleTask"
            android:name="com.urbandrive.app.MainActivity"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Queries needed for file operations -->
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="http" />
        </intent>
    </queries>

</manifest>`;

// Build gradle template
const buildGradleTemplate = `apply plugin: 'com.android.application'

android {
    namespace "com.urbandrive.app"
    compileSdkVersion rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.urbandrive.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions {
             // Files and dirs to omit from the packaged APK
             ignoreAssetsPattern "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir{
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}`;

// Create directory structure and files
const resourcesDir = path.join(process.cwd(), 'android-resources');

if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(resourcesDir, 'strings.xml'), stringsXml);
fs.writeFileSync(path.join(resourcesDir, 'colors.xml'), colorsXml);
fs.writeFileSync(path.join(resourcesDir, 'styles.xml'), stylesXml);
fs.writeFileSync(path.join(resourcesDir, 'AndroidManifest.xml'), androidManifestXml);
fs.writeFileSync(path.join(resourcesDir, 'build.gradle'), buildGradleTemplate);

console.log('✅ Android resources generated successfully!');
console.log('📁 Resources saved to:', resourcesDir);
console.log('');
console.log('📋 Files created:');
console.log('  - strings.xml (App strings and messages)');
console.log('  - colors.xml (App color palette)');
console.log('  - styles.xml (App themes and styles)');
console.log('  - AndroidManifest.xml (Permissions and configuration)');
console.log('  - build.gradle (Build configuration)');
console.log('');
console.log('🔧 These files will be automatically copied when you run:');
console.log('   npm run capacitor:add:android');
console.log('');
console.log('📱 Ready for Android development!');