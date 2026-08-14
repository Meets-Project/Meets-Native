# 📦 GUIA: Como Gerar APK do Meets

**Data:** Junho 2026  
**Status:** Pronto para Build  
**Versão App:** 1.0.0  

---

## ✅ Requisitos Atendidos

- ✅ Aplicativo configurado (app.json)
- ✅ Dependências instaladas (npm install)
- ✅ EAS CLI instalado globalmente
- ✅ eas.json configurado
- ✅ Prebuild Android completo

---

## 🚀 Opção 1: Build Local (Recomendado para Desenvolvimento)

### Requisitos
- Java 17 (não Java 25)
- Android SDK
- Gradle

### Passos

```bash
# 1. Navegar para o projeto
cd /workspaces/Meets_Mobile/snack

# 2. Instalar Java 17 (se necessário)
sdk install java 17.0.19-amzn
sdk use java 17.0.19-amzn

# 3. Compilar APK
cd android
./gradlew assembleRelease

# 4. APK será gerado em:
# android/app/build/outputs/apk/release/app-release.apk
```

### Resultado Esperado
```
BUILD SUCCESSFUL

APK compilado em:
✅ app-release.apk (~50-80 MB)
```

---

## 🌐 Opção 2: Build com EAS (Recomendado para Produção)

### Vantagens
- ✅ Sem dependências locais
- ✅ Build na nuvem
- ✅ Assinatura automática
- ✅ Mais rápido e confiável

### Passos

```bash
# 1. Navegar para o projeto
cd /workspaces/Meets_Mobile/snack

# 2. Fazer login no Expo
npx eas login
# Criar conta em https://expo.dev se necessário

# 3. Inicializar EAS (já feito - eas.json existe)
# npx eas build --platform android --profile preview

# 4. Fazer o build
npx eas build --platform android --profile preview

# 5. Acompanhar o build em:
# https://expo.dev/builds
```

### Saída Esperada
```
✅ Build enviado para EAS
📊 Build em progresso...
🔗 Link: https://expo.dev/builds/...
⏱️ Tempo: 10-15 minutos
📱 APK pronto para download
```

---

## 📦 Estrutura de Build Gerada

```
snack/
├── android/                          ← Código Android nativo (gerado)
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               ├── release/
│   │               │   └── app-release.apk    ← APK final ⭐
│   │               └── debug/
│   ├── build.gradle
│   ├── gradlew
│   └── gradle.properties
├── app.json                         ← Configuração Expo (atualizado)
├── package.json                     ← Dependências (atualizado)
├── eas.json                         ← Configuração EAS ✅
└── index.js                         ← Entry point
```

---

## 🔧 Configurações Atualizadas

### app.json ✅
```json
{
  "expo": {
    "name": "Meets",
    "slug": "meets",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light"
  }
}
```

### eas.json ✅
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

---

## 📱 Teste do APK

### Instalar em Dispositivo Físico

```bash
# 1. Conectar dispositivo via USB
adb devices

# 2. Transferir APK
adb push app-release.apk /data/local/tmp/

# 3. Instalar
adb install -r /data/local/tmp/app-release.apk

# 4. Executar
adb shell am start -n com.anonymous.meets/com.anonymous.meets.MainActivity
```

### Instalar em Emulador

```bash
# 1. Iniciar emulador
emulator -avd MyEmulator

# 2. Esperar inicialização
# adb devices  # Verificar

# 3. Instalar
adb install -r app-release.apk

# 4. Verificar
adb shell pm list packages | grep meets
```

### Verificar Informações do APK

```bash
# Usar aapt (Android Asset Packaging Tool)
aapt dump badging app-release.apk

# Exemplo de saída:
# package: name='com.anonymous.meets' versionCode='1' versionName='1.0.0'
# application: label='Meets' icon='res/mipmap-mdpi/ic_launcher.png'
```

---

## ✨ Próximos Passos

### Antes de Produção

- [ ] Adicionar ícone customizado (ic_launcher.png)
- [ ] Adicionar splash screen
- [ ] Configurar keystore para assinatura
- [ ] Testar em múltiplos dispositivos
- [ ] Versionar APK corretamente
- [ ] Criar changelog

### Comandos Úteis

```bash
# Aumentar versão
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Limpar build
rm -rf android/
npx expo prebuild --platform android --clean

# Rebuild rápido
cd android && ./gradlew clean assembleRelease
```

---

## 🆘 Troubleshooting

### Erro: "Unsupported class file major version 69"
**Solução:** Use Java 17, não Java 25
```bash
sdk use java 17.0.19-amzn
```

### Erro: "Android SDK not found"
**Solução:** Instalar Android SDK
```bash
# Linux/macOS
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Erro: "eas.json not found"
**Solução:** Arquivo já foi criado em `/snack/eas.json`

### Build muito lento
**Solução:** Usar EAS Build (opção 2)
- Mais rápido e confiável
- Sem consumir CPU local
- Build em paralelo

---

## 📊 Informações do Build

| Aspecto | Detalhes |
|---------|----------|
| **Nome do App** | Meets |
| **Package** | com.anonymous.meets |
| **Versão** | 1.0.0 |
| **Tipo Build** | APK (debug) ou AAB (production) |
| **Tamanho** | ~60-80 MB |
| **Dependências** | React Native 0.81.5, Expo 54 |
| **API Mínima** | Android 5.0 (API 21) |
| **Java Necessário** | 17+ |

---

## 🎯 Resumo Rápido

### Build Local
```bash
cd snack/android
./gradlew assembleRelease
# ✅ APK em: android/app/build/outputs/apk/release/app-release.apk
```

### Build com EAS
```bash
cd snack
npx eas build --platform android --profile preview
# ✅ APK disponível em: https://expo.dev/builds/
```

---

## 📚 Recursos Adicionais

- [Expo Build Documentation](https://docs.expo.dev/build/setup/)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Play Store Requirements](https://play.google.com/console/about/gsi/)
- [React Native Android Guide](https://reactnative.dev/docs/android-setup)

---

**Próximo Passo:** Executar `npx eas build --platform android --profile preview` ou `cd android && ./gradlew assembleRelease`

**Última Atualização:** Junho 2026  
**Status:** ✅ Pronto para Build
