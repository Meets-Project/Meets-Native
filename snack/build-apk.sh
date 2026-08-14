#!/bin/bash
echo "🚀 Compilando APK do Meets..."
echo ""
echo "Opções:"
echo "1. Build local (requer Android SDK + Java 17)"
echo "2. Build com EAS (online, sem dependências locais)"
echo ""
read -p "Escolha uma opção (1 ou 2): " option

if [ "$option" = "1" ]; then
    echo "❌ Não foi possível compilar localmente (Java incompatível)"
    echo "Tente a opção 2"
elif [ "$option" = "2" ]; then
    echo "📤 Preparando para build com EAS..."
    npx eas build --platform android --profile preview
else
    echo "❌ Opção inválida"
fi
