# HomeFood (móvil)

App React que consume la API Laravel en `/api/v1`. Capacitor empaqueta el mismo build para Android e iOS.

## Web

```bash
cd mobile
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` apunta por defecto a `http://127.0.0.1:8000/api/v1`.

## Android e iOS

Tras `npm run build`:

```bash
npx cap sync
npx cap open android
npx cap open ios
```

`android/` e `ios/` ya están generados (`appId` `com.homefood.app`, nombre HomeFood, `webDir` `dist`). Abrirlos en Android Studio o Xcode exige el SDK correspondiente.
