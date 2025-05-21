![FoodLoop Logo](src/routes/logo.png)

# Foodloop

## 🌱 About Foodloop

FoodLoop is a sustainable food marketplace that connects consumers with local businesses to purchase surplus food at discounted prices. Our platform helps:

- **Reduce food waste** by giving businesses a way to sell food that would otherwise go to waste
- **Save consumers money** with great discounts on quality food items
- **Help the environment** by reducing CO₂ emissions from food waste
- **Support local businesses** by creating a new revenue stream

Partnering with local buisnesses such as our own student store to reduce waste in our community!

## ⚡ Quick Start

### Prerequisites

- Node.js
- npm, bun, etc.

### Installation

```bash
# Clone the repository
git clone https://github.com/TechnoTalksDev/foodloop

# Navigate to the project directory
cd foodloop

# Install dependencies
npm install
# or
bun install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

### Building

Simeo can either be built as a standalone Node server, a Docker container, or a Azure Static Web Application.

#### How to change platforms

In order to build for either a standalone server or docker container you must first change `svelte.config.js` to reflect this

**For Azure SWA:**

This is the default configuration

```js
import azure from 'svelte-adapter-azure-swa';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [vitePreprocess()],
	kit: {
		adapter: azure()
	}
};
export default config;
```

**Node/Docker**

```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter()
	}
};
```

## 🛠️ Tech Stack & Best Practices

### SvelteKit

Foodloop is built with SvelteKit, a framework for building web applications of all sizes that delivers exceptional performance with minimal JavaScript by compiling to native JavaScript vs. React's virutal DOM approach.

### TypeScript

We use TypeScript throughout the project to catch errors early and improve the developer experience:

- Provides type safety and better tooling
- Improves code maintainability and refactoring
- Makes collaboration easier with explicit interfaces

### Code Formatting & Style

We follow consistent coding styles with:

- **Prettier**: Keeps code formatting consistent
- **ESLint**: Ensures code quality and catches potential issues

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint
```

### Component Structure

The UI is built with reusable components following these principles:

- Small, single-responsibility components
- Clearly documented props and events
- Consistent naming conventions

### Accessibility

We prioritize accessibility in our UI components:

- Semantic HTML5 elements
- ARIA attributes when necessary
- Keyboard navigation support

## 🚀 Features

- Business dashboard for listing surplus food items
- Consumer interface for discovering and purchasing deals
- SmartPlate AI recipe generation to reduce home food waste
- Location-based food discovery
- Mobile-friendly responsive design



