plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.smsgateway"
    compileSdk = rootProject.ext["compileSdkVersion"] as Int

    defaultConfig {
        applicationId = "com.smsgateway"
        minSdk = rootProject.ext["minSdkVersion"] as Int
        targetSdk = rootProject.ext["targetSdkVersion"] as Int
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("boolean", "IS_NEW_ARCHITECTURE_ENABLED", "false")
        buildConfigField("boolean", "IS_HERMES_ENABLED", "true")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // React Native (provided by the RN framework)
    implementation("com.facebook.react:react-android")
    implementation("com.facebook.soloader:soloader:0.10.5")

    // NanoHTTPD - Embedded HTTP server
    implementation("org.nanohttpd:nanohttpd:2.3.1")

    // Room - SQLite database
    implementation("androidx.room:room-runtime:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")

    // OkHttp - For webhook delivery
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.0")

    // AndroidX
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
}
