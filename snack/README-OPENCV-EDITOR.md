# Editor de imagens

O editor web do Meets foi ajustado para não importar `@opencvjs/web` pelo Metro/Expo. Isso elimina o erro `Requiring unknown module "639"` que ocorria ao abrir o editor.

## Processamento local

No navegador, o editor usa Canvas 2D e processamento de pixels localmente. Não há CDN, WebView ou módulo nativo obrigatório para a versão web.

Operações disponíveis:

- original e P&B;
- desfoque, Gaussiano, mediana e bilateral aproximado;
- nitidez;
- contorno;
- threshold, Otsu e adaptativo;
- inversão e equalização;
- erosão, dilatação, abertura, fechamento, gradiente, top-hat e black-hat;
- brilho, contraste e saturação;
- rotação e espelhamento;
- corte real;
- zoom;
- voltar, refazer e redefinir.

A dependência `@opencvjs/web` foi removida do `package.json`, portanto o Metro não tenta mais resolver o módulo que gerava a falha.
