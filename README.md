# Ingredient App (Chef's Ingredient Menu)

A mobile and web menu app built with React Native, Expo and TypeScript. You add dishes to a menu with a price, a course and ingredients, filter the menu by course, and see statistics by ingredient.

This was a course project, built last year with guidance from my lecturer. I am now going through the code line by line so I can explain how it works.

## What it does

- **Home:** shows the current menu.
- **Add item:** add a dish with a name, a price, a course (Starter, Main, Dessert or Drink) and its ingredients.
- **Filter:** show only the dishes from one course.
- **Average by ingredient:** a statistics screen with stat cards, based on the menu items.

## Built with

- React Native and Expo (SDK 54)
- TypeScript
- React 19
- `react-native-web`, so it also runs in a browser

## Run it locally

1. Install Node.js, then clone the repo:
   `git clone https://github.com/ethanclaassen-ctrl/ingredient-app.git`
2. In the project folder, install the packages: `npm install`
3. Start the app: `npx expo start --web` for the browser, or run `npx expo start` and press `a` for an Android emulator. You can also scan the QR code with the Expo Go app on a phone.

## Project structure

- `App.tsx` holds the screens, the navigation state and the styles
- `index.ts` is the entry point that registers the app
- `app.json` is the Expo configuration
- `assets/` holds the icons and images
- `tsconfig.json` is the TypeScript configuration

## Known limitations

- The menu is kept in memory only, so it resets every time the app restarts. There is no database yet.
- Everything is in one `App.tsx` file. Splitting it into separate components would be a good next step.
