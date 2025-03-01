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

# Test Website for AutoCSS

This repository contains a simple HTML website template that you can use to test the AutoCSS tool. The website includes common elements and structures that would benefit from responsive styling.

## Files Included

- `test-website.html` - The main HTML file with a complete website structure
- `test-website.js` - JavaScript file with interactive functionality

## How to Use with AutoCSS

1. Download both files to your local machine
2. Go to the AutoCSS application (http://localhost:3001)
3. Click on the "Upload File" button in the input field
4. Select the `test-website.html` file
5. Optionally, you can also upload the `test-website.js` file
6. Enter a prompt describing the style you want (e.g., "Create a modern, responsive design with a dark theme and smooth animations")
7. Click "Generate" to create the CSS
8. View the generated CSS in the output section
9. Use the Preview panel to see how the website looks with the generated CSS
10. Download the complete project when satisfied

## Features to Test

The test website includes various elements that will benefit from responsive styling:

- Navigation menu with mobile toggle
- Hero section with image and call-to-action buttons
- Features grid with cards
- About section with text and image
- Testimonials slider
- Contact form
- Footer with multiple columns

## Responsive Design Testing

Use the Preview panel in AutoCSS to test how the generated CSS looks at different screen sizes:

- Mobile (320px - 425px)
- Tablet (768px)
- Desktop (1024px+)

## Customization

Feel free to modify the HTML or JavaScript files to test different structures or add more elements as needed.

## Troubleshooting

If you encounter a "Failed to generate code" error:

1. Make sure your server is running correctly
2. Check that the HTML file is properly formatted
3. Try uploading just the HTML file without the JavaScript
4. Restart the AutoCSS server if needed

Happy styling!
