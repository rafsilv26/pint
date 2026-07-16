# Microsite — Softinsa Badge Platform

Página única de apresentação do projeto (o "microsite" pedido na entrega).
É **estática** e independente da aplicação — não precisa de backend nem build.

## Ver

Abre `index.html` no browser. Nada a instalar.

## Publicar

Um único ficheiro. Qualquer host estático serve:

- **Vercel:** novo projeto → aponta para esta pasta (`microsite/`) → deploy.
- **GitHub Pages:** ativa Pages a partir desta pasta.
- **Netlify / Cloudflare Pages:** arrasta a pasta.

## Editar antes de entregar

Os links vivem num objeto no fim do `index.html`:

```js
const LINKS = {
  app: "...",   // URL de PRODUÇÃO do Vercel (o atual é um preview e vai mudar)
  video: "",    // vídeo demo, se existir
  apk: ""       // APK Android, se existir
};
```

- O link da app é, para já, um **preview do Vercel** (o hash muda a cada deploy).
  Troca pelo domínio de produção fixo assim que o tiverem.
- O repositório e a equipa já estão preenchidos no `index.html`.
