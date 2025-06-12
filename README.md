# HOBBY REEL Application

This project is a React application for creating and sharing video showreels, built with TypeScript and Vite, and styled with Tailwind CSS.

## Project Structure

-   `/components`: Reusable UI components.
-   `/contexts`: React context providers.
-   `/hooks`: Custom React hooks.
-   `/pages`: Top-level page components for different routes.
-   `/services`: Modules for interacting with external APIs (e.g., Vimeo).
-   `/dist`: (Build output directory) Contains the production-ready bundled application.
-   `index.html`: The main HTML entry point for the application.
-   `index.tsx`: The main React application entry point.
-   `App.tsx`: The root React component, handling routing and layout.
-   `vite.config.ts`: Vite build tool configuration.
-   `package.json`: Project dependencies and scripts.
-   `tsconfig.json`: TypeScript compiler configuration.
-   `metadata.json`: Application metadata.
-   `constants.ts`: Application-wide constants.
-   `types.ts`: TypeScript type definitions.
-   `designStyles.ts`: Definitions for different visual themes.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode using Vite.
Open [http://localhost:5173](http://localhost:5173) (or the port Vite chooses) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run preview`

Serves the production build locally from the `dist` folder.

### `npm run serve-dist`

Serves the `dist` folder using the `serve` package. This is useful for quickly testing the production build.

## Learn More

This application utilizes Vimeo API for video fetching and GitHub Gists for creating shareable reel links.