# Vanilla Worker Playground

**Vanilla Worker Playground** is a modular AI Playground built with vanilla JavaScript, leveraging Cloudflare Workers as a proxy to interact with various AI models. This project provides a user-friendly interface for interacting with AI-powered chatbots, supporting features like voice input, image uploads, and model selection.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Available Models](#available-models)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- **Interactive Chat Interface**: Engage in conversations with AI models using a simple and intuitive interface.
- **Voice Input**: Utilize voice recognition to input prompts seamlessly.
- **Export Conversations**: Save your chat history as Markdown files for future reference.
- **Model Selection**: Choose from a variety of AI models to tailor your interactions.
- **Image Uploads**: Some models support image inputs, enhancing the versatility of interactions.
- **Keyboard Shortcuts**: Enhance productivity with shortcuts like `[Alt-S]` to send prompts.
- **Streaming Responses**: Receive AI responses in real-time as they are generated.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Clipboard Integration**: Easily copy conversation snippets to your clipboard.
- **Speech Synthesis**: Listen to AI responses using text-to-speech functionality.

## Installation

### Prerequisites

- **Node.js** (v14 or later)
- **npm** (v6 or later)
- **Cloudflare Account** with Workers access

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/seu-usuario/vanilla-worker-playground.git
   cd vanilla-worker-playground

   ```

2. **Install Dependencies**

   ```bash
   npm install

   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory and add your Cloudflare credentials:

   ```
   CLOUDFLARE_AC_ID=your_account_id
   CLOUDFLARE_API_KEY=your_api_key
   CLOUDFLARE_GATEWAY_ID=your_gateway_id

   ```

## Usage

### Development

To start the development server with live reloading:

```bash
npm run start

```

- **Webpack** will watch for changes and bundle your JavaScript.
- **Live Server** will serve the `public` directory and refresh the browser on changes.

### Building for Production

To build the project for production:

```bash
npm run build

```

This will bundle and optimize your JavaScript files into the `public` directory.

### Running Locally

After building, you can serve the `public` directory using any static server. For example:

```bash
npx live-server public/

```

## Deployment

The project uses **Cloudflare Workers** for backend functionalities. Follow these steps to deploy:

1. **Install Wrangler**

   Wrangler is Cloudflare’s CLI tool for Workers.

   ```bash
   npm install -g wrangler

   ```

2. **Login to Cloudflare**

   ```bash
   wrangler login

   ```

3. **Publish the Worker**

   ```bash
   npm run deploy

   ```

   This command runs `wrangler publish`, deploying your Worker to Cloudflare.

4. **Development Mode**

   For testing your Worker locally:

   ```bash
   npm run dev

   ```

   This runs `wrangler dev`, allowing you to interact with your Worker in a development environment.

   Run frontend with `live-server` in `public` aplication:

   ```bash
   npm run start
   ```

## Project Structure

```
vanilla-worker-playground/
├── public/
│   ├── index.html
│   ├── main.js
│   ├── styles.css
│   └── bundle.js
├── worker/
│   └── worker.js
├── .github/
│   └── dependabot.yml
├── package.json
├── webpack.config.js
├── wrangler.toml
└── README.md

```

- **public/**: Contains all frontend assets.
  - `index.html`: The main HTML file.
  - `main.js`: Vanilla JavaScript handling the frontend logic.
  - `styles.css`: Styling for the application.
  - `bundle.js`: Bundled JavaScript generated by Webpack.
- **worker/**: Contains Cloudflare Worker scripts.
  - `worker.js`: The main Worker script acting as a proxy to the AI API.
- **.github/**: GitHub configuration files.
  - `dependabot.yml`: Configuration for Dependabot to keep dependencies updated.
- **package.json**: Project metadata and scripts.
- **webpack.config.js**: Configuration for Webpack bundler.
- **wrangler.toml**: Configuration for Cloudflare Wrangler.
- **README.md**: Project documentation.

## Available Models

The playground supports a variety of AI models. Below is the list of currently available models:

- `@cf/meta/llama-3.2-11b-vision-instruct`
- `@cf/google/gemma-2b-it-lora`
- `@cf/google/gemma-7b-it-lora`
- `@cf/meta-llama/llama-2-7b-chat-hf-lora`
- `@cf/meta/llama-2-7b-chat-fp16`
- `@cf/meta/llama-2-7b-chat-int8`
- `@cf/microsoft/phi-2`
- `@cf/mistral/mistral-7b-instruct-v0.1`
- `@cf/mistral/mistral-7b-instruct-v0.1-vllm`
- `@cf/mistral/mistral-7b-instruct-v0.2-lora`
- `@cf/openchat/openchat-3.5-0106`
- `@cf/qwen/qwen1.5-14b-chat-awq`
- `@cf/qwen/qwen1.5-7b-chat-awq`
- `@cf/tiiuae/falcon-7b-instruct`
- `@cf/tinyllama/tinyllama-1.1b-chat-v1.0`
- `@hf/google/gemma-7b-it`
- `@hf/mistral/mistral-7b-instruct-v0.2`
- `@hf/nousresearch/hermes-2-pro-mistral-7b`
- `@hf/thebloke/llama-2-13b-chat-awq`

**Note**: Some models require user agreement before use. These models are listed in `main.js` under `modelsRequiringAgreement`.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature

   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add your feature"

   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature

   ```

5. **Open a Pull Request**

Please ensure your code adheres to the project's coding standards and includes necessary tests.

## License

This project is licensed under the [MIT License](https://www.notion.so/jogajunto/LICENSE).
