# Rujooh

Rujooh is a personal Salah and adhkar tracker, available as a React web app and an Expo app for Android and iOS.

## Website

```sh
npm install
npm run dev
```

Build the website with `npm run build`.

## Mobile app

The Expo React Native project lives in `mobile/`.

```sh
npm --prefix mobile install
npm run mobile
```

Scan the Expo Go QR code with a device to run the app. For platform-specific launch commands, use `npm run mobile:android` or `npm run mobile:ios`. Building an iOS binary requires macOS or an Expo cloud build service.

The mobile app stores tracker data locally on the device and requests location permission only when you choose **Use my location**. Prayer times are calculated on-device.
