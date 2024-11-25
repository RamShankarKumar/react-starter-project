#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { execa } from 'execa';
import chalk from 'chalk';
import fs from 'fs';

const program = new Command();

// Utility to determine file extensions dynamically
const fileExtension = (typescript, suffix) => (typescript ? `.ts${suffix}` : `.js${suffix}`);

program
  .name('react-starter-project')
  .description('CLI to create a React starter project with Vite, Tailwind, React Router, Redux, TanStack Query, TypeScript, and Git')
  .version('1.2.0');

program.action(async () => {
  console.log(chalk.blueBright('🚀 Welcome to Audvik React starter CLI'));

  // Prompt user for configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Enter your project name:',
      default: 'my-audvik-app',
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: 'Do you want to use TypeScript?',
      default: false,
    },
    {
      type: 'checkbox',
      name: 'libraries',
      message: 'Select additional libraries to include:',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwind' },
        { name: 'React Router', value: 'reactRouter' },
        { name: 'Redux Toolkit', value: 'redux' },
        { name: 'TanStack Query (React Query)', value: 'query' },
      ],
    }
  ]);

  const { projectName, typescript, libraries } = answers;

  try {
    // Step 1: Create Vite project
    console.log(chalk.yellow(`Creating Vite React ${typescript ? 'TypeScript' : 'JavaScript'} app: ${projectName}...`));
    const template = typescript ? 'react-ts' : 'react';
    await execa('npm', ['create', 'vite@latest', projectName, '--', '--template', template], { stdio: 'inherit' });
    console.log(chalk.green(`✔ Vite React app created!`));

    // Change directory to the created project
    process.chdir(projectName);

    // Step 2: Install dependencies
    const dependencies = [];
    const devDependencies = [];

    if (libraries.includes('tailwind')) {
      devDependencies.push('tailwindcss', 'postcss', 'autoprefixer');
    }
    if (libraries.includes('reactRouter')) {
      dependencies.push('react-router-dom');
      if (typescript) devDependencies.push('@types/react-router-dom');
    }
    if (libraries.includes('redux')) {
      dependencies.push('@reduxjs/toolkit', 'react-redux');
      if (typescript) devDependencies.push('@types/react-redux');
    }
    if (libraries.includes('query')) {
      dependencies.push('@tanstack/react-query');
    }
    if (typescript) {
      devDependencies.push('@types/react', '@types/react-dom');
    }

    console.log(chalk.yellow('Installing dependencies...'));
    if (dependencies.length > 0) {
      await execa('npm', ['install', ...dependencies]);
    }
    if (devDependencies.length > 0) {
      await execa('npm', ['install', '--save-dev', ...devDependencies]);
    }
    console.log(chalk.green('✔ Dependencies installed!'));

    // create component folder on any scenario
    fs.mkdirSync('./src/components', { recursive: true });
    fs.mkdirSync('./src/features', { recursive: true });
    

    // Step 3: Configure Tailwind CSS
    if (libraries.includes('tailwind')) {
      console.log(chalk.yellow('Configuring Tailwind CSS...'));
      await execa('npx', ['tailwindcss', 'init', '-p'], { stdio: 'inherit' });

      fs.writeFileSync(
        './tailwind.config.js',
        `
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
      );

      const cssFilePath = './src/index.css';
      fs.mkdirSync('./src/styles', { recursive: true });
      fs.writeFileSync(cssFilePath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;');
    }

    // Step 4: Configure Redux Toolkit
    if (libraries.includes('redux')) {
      console.log(chalk.yellow('Setting up Redux Toolkit...'));

      const reduxFileExtension = fileExtension(typescript, '');
      fs.mkdirSync('./src/redux', { recursive: true });

      fs.writeFileSync(
        `./src/redux/store${reduxFileExtension}`,
        `import { configureStore } from '@reduxjs/toolkit';
import exampleSlice from './exampleSlice';

export const store = configureStore({
  reducer: {
    example: exampleSlice,
  },
});

export default store;
`
      );

      fs.writeFileSync(
        `./src/redux/exampleSlice${reduxFileExtension}`,
        `import { createSlice } from '@reduxjs/toolkit';

const exampleSlice = createSlice({
  name: 'example',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 },
    decrement: (state) => { state.value -= 1 },
    incrementByAmount: (state, action) => { state.value += action.payload },
  },
});

export const { increment, decrement, incrementByAmount } = exampleSlice.actions;

export default exampleSlice.reducer;
`
      );

      console.log(chalk.green(`✔ Redux Toolkit configured!`));
    }

    // Step 5: Configure React Router
    if (libraries.includes('reactRouter')) {
      console.log(chalk.yellow('Setting up React Router...'));

      const pagesFileExtension = fileExtension(typescript, 'x');
      fs.mkdirSync('./src/pages', { recursive: true });

      fs.writeFileSync(
        `./src/pages/Home${pagesFileExtension}`,
        `export default function Home() {
  return <h1>Welcome to Home Page</h1>;
}
`
      );

      fs.writeFileSync(
        `./src/pages/About${pagesFileExtension}`,
        `export default function About() {
  return <h1>About Page</h1>;
}
`
      );

      console.log(chalk.green('✔ React Router configured!'));
    }


    if (libraries.includes('query')) {
      console.log(chalk.yellow('Setting up TanStack Query...'));

      const pagesFileExtension = fileExtension(typescript, 'x');

      fs.writeFileSync(
        `./src/main${pagesFileExtension}`,
        `
        import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App${pagesFileExtension}'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <StrictMode>
      <App />
    </StrictMode>
  </QueryClientProvider>
);
`
      );

      console.log(chalk.green(`✔ TanStack Query configured!`));
    }

    // Step 6: Combine App.jsx/tsx for Redux and Router and query

    const appFileExtension = fileExtension(typescript, 'x');
    const appContent = `
${libraries.includes('redux') ? "import { Provider } from 'react-redux';\nimport store from './redux/store';" : ''}
${libraries.includes('reactRouter') ? "import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';" : ''}
${libraries.includes('reactRouter') ? "import Home from './pages/Home';\nimport About from './pages/About';" : ''}

export default function App() {
  return (
    ${libraries.includes('redux') ? '<Provider store={store}>' : ''}
      ${libraries.includes('reactRouter') ? (
        `<Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Router>`
      ) : '<div>Hello World!</div>'}
    ${libraries.includes('redux') ? '</Provider>' : ''}
  );
}
`;
    fs.writeFileSync(`./src/App${appFileExtension}`, appContent);
    

    // Step 7: Initialize Git Repository
      await execa('git', ['init'], { stdio: 'inherit' });
      fs.writeFileSync(
        '.gitignore',
        `
node_modules
dist
.env
.DS_Store
.vscode
      `
      );
      await execa('git', ['add', '.'], { stdio: 'inherit' });
      await execa('git', ['commit', '-m', 'Initial commit'], { stdio: 'inherit' });

    console.log(chalk.greenBright(`🎉 Project ${projectName} is ready!`));
    console.log(`Navigate to your project folder:\n  cd ${projectName}`);
    console.log(`Run the development server:\n  npm run dev`);
  } catch (err) {
    console.error(chalk.red(`❌ Error: ${err.message}`));
    process.exit(1);
  }
});

program.parse(process.argv);