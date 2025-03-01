# AutoCSS

Make any webapp mobile responsive using AI.

## Description

AutoCSS is a tool that helps you generate CSS for your web projects using AI. It can analyze your HTML structure and generate responsive CSS that makes your website look great on all devices.

## Features

- Generate CSS using AI
- Upload individual files or entire project folders
- Download generated projects as a zip file
- View generation history
- Copy generated code to clipboard

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/plowsai/auto-css.git
   cd auto-css
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PORT=3001
   ```

## Usage

### Starting the Application

To start the application in production mode:

```
npm start
```

This will start the server at http://localhost:3001 (or the port specified in your .env file).

For development with auto-restart on file changes:

```
npm run dev
```

### Using the Application

1. Open your browser and navigate to http://localhost:3001
2. Upload a file or folder using the upload buttons
3. Enter a prompt describing the CSS you want to generate
4. Click "Generate" to create the CSS
5. View the generated CSS in the output section
6. Copy the code to clipboard or download the entire project

## Project Structure

- `server.js` - Express server and API endpoints
- `public/` - Static files and browser-compatible React app
- `src/` - React components (for development)
- `lib/` - Utility functions and API helpers
- `uploads/` - Temporary storage for uploaded files
- `output/` - Generated project files

## License

ISC


# This project is not complete. Feel free to contribute.
