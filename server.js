const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const archiver = require('archiver');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const { exec } = require('child_process');
const execPromise = promisify(exec);
const axios = require('axios');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create output directory for generated projects
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Create temp directory for GitHub repos
const githubDir = path.join(__dirname, 'github_repos');
if (!fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create project-specific upload directory
    const projectId = Date.now().toString();
    const uploadDir = path.join(__dirname, 'uploads', projectId);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Store projectId in request for later use
    if (!req.projectId) {
      req.projectId = projectId;
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Preserve original path structure
    const relativePath = file.originalname;
    const dirPath = path.dirname(relativePath);
    
    if (dirPath && dirPath !== '.') {
      const targetDir = path.join(req.projectId ? path.join(__dirname, 'uploads', req.projectId) : __dirname, dirPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }
    
    cb(null, relativePath);
  }
});

const upload = multer({ storage });

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Endpoint to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return file information
    res.json({
        file: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            path: `/uploads/${req.file.filename}`
        }
    });
});

// Folder upload endpoint
app.post('/api/upload-folder', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const projectId = req.projectId;
    const projectDir = path.join(__dirname, 'uploads', projectId);
    
    // Analyze the project
    const projectData = await analyzeProject(projectDir);
    
    res.json({
      message: 'Folder uploaded successfully',
      projectId: projectId,
      fileCount: req.files.length,
      projectData: projectData
    });
  } catch (error) {
    console.error('Error uploading folder:', error);
    res.status(500).json({ error: 'Failed to upload folder' });
  }
});

// Helper function to get all files in directory recursively
async function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = await readdir(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  
  return arrayOfFiles;
}

// Helper to create a zip archive of a directory
function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      resolve(outputPath);
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Extract HTML elements, classes, and IDs from HTML files
async function extractHTMLContent(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Simple extraction of class and id attributes (a production version would use a proper HTML parser)
    const classMatches = content.match(/class=["']([^"']+)["']/g) || [];
    const idMatches = content.match(/id=["']([^"']+)["']/g) || [];
    
    const classes = classMatches.map(match => match.replace(/class=["']([^"']+)["']/, '$1')).join(' ').split(/\s+/).filter(Boolean);
    const ids = idMatches.map(match => match.replace(/id=["']([^"']+)["']/, '$1')).join(' ').split(/\s+/).filter(Boolean);
    
    // Extract HTML structure (simplified)
    const bodyContent = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const htmlStructure = bodyContent ? bodyContent[1] : content;
    
    return {
      classes: [...new Set(classes)], // Remove duplicates
      ids: [...new Set(ids)], // Remove duplicates
      htmlStructure: htmlStructure.slice(0, 1500) // Limit size for API calls
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return { classes: [], ids: [], htmlStructure: '' };
  }
}

// Analyze project structure and extract relevant information
async function analyzeProject(projectDir) {
  try {
    // Get all files in the project directory
    const files = await getAllFiles(projectDir);
    
    // Filter files by type
    const htmlFiles = files.filter(file => file.toLowerCase().endsWith('.html'))
      .map(file => path.relative(projectDir, file));
    
    const cssFiles = files.filter(file => file.toLowerCase().endsWith('.css'))
      .map(file => path.relative(projectDir, file));
    
    const jsFiles = files.filter(file => file.toLowerCase().endsWith('.js'))
      .map(file => path.relative(projectDir, file));
    
    // Extract HTML content for analysis
    const elements = { classes: [], ids: [] };
    
    for (const htmlFile of htmlFiles) {
      const filePath = path.join(projectDir, htmlFile);
      const { classes, ids } = await extractHTMLContent(filePath);
      
      elements.classes.push(...classes);
      elements.ids.push(...ids);
    }
    
    // Remove duplicates
    elements.classes = [...new Set(elements.classes)];
    elements.ids = [...new Set(elements.ids)];
    
    return {
      htmlFiles,
      cssFiles,
      jsFiles,
      elements
    };
  } catch (error) {
    console.error('Error analyzing project:', error);
    throw error;
  }
}

// Generate CSS using OpenAI
async function generateCSS(projectData) {
  // Prepare HTML samples (limit to avoid token limits)
  const htmlSamples = projectData.htmlStructure
    .map(item => `File: ${item.file}\n${item.structure}`)
    .join('\n\n')
    .slice(0, 3000);
  
  // Create prompt with project info
  const prompt = `
You are a CSS expert. I have a web project that needs styling.

Project structure:
HTML files: ${projectData.htmlFiles.join(', ')}
CSS files: ${projectData.cssFiles.join(', ') || 'None'}
JS files: ${projectData.jsFiles.join(', ') || 'None'}

Classes used in the project: ${projectData.elements.classes.join(', ')}
IDs used in the project: ${projectData.elements.ids.join(', ')}

HTML structure samples:
${htmlSamples}

Please generate a comprehensive CSS file that styles this project beautifully. Include:
1. A modern, responsive design
2. Clean typography with good readability
3. Consistent spacing and layout
4. Appealing color scheme
5. Hover effects and transitions
6. Mobile-first approach with media queries

Return ONLY the CSS code without any explanations.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a CSS expert who creates beautiful, modern designs. Your task is to generate CSS for web projects based on their HTML structure."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating CSS:', error);
    throw new Error('Failed to generate CSS with OpenAI');
  }
}

// Apply generated CSS to the project
async function applyGeneratedCSS(projectDir, generatedCSS) {
  try {
    // Create enhanced directory
    const originalDir = path.join(projectDir, 'original');
    const enhancedDir = path.join(projectDir, 'enhanced');
    
    // Create the enhanced directory if it doesn't exist
    if (!fs.existsSync(enhancedDir)) {
      await mkdir(enhancedDir, { recursive: true });
    }
    
    // Copy all files from original to enhanced
    const files = await getAllFiles(originalDir);
    
    for (const file of files) {
      const relativePath = path.relative(originalDir, file);
      const targetPath = path.join(enhancedDir, relativePath);
      
      // Create directory if it doesn't exist
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(file, targetPath);
    }
    
    // Create or update the CSS file in the enhanced directory
    const cssFileName = 'autocss-generated.css';
    const cssFilePath = path.join(enhancedDir, cssFileName);
    await writeFile(cssFilePath, generatedCSS);
    
    // Find all HTML files in the enhanced directory
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    // Add the CSS link to each HTML file
    for (const htmlFile of htmlFiles) {
      const relativePath = path.relative(originalDir, htmlFile);
      const enhancedHtmlPath = path.join(enhancedDir, relativePath);
      
      let htmlContent = await readFile(enhancedHtmlPath, 'utf8');
      
      // Check if the CSS is already linked
      if (!htmlContent.includes(cssFileName)) {
        // Add the CSS link before the closing head tag
        htmlContent = htmlContent.replace('</head>', `  <link rel="stylesheet" href="/${cssFileName}">\n</head>`);
        await writeFile(enhancedHtmlPath, htmlContent);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error applying CSS:', error);
    return { success: false, error: error.message };
  }
}

// Generate CSS for a project
app.post('/api/generate-css', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Check if project exists
    const projectDir = path.join(outputDir, projectId);
    const originalDir = path.join(projectDir, 'original');
    
    if (!fs.existsSync(originalDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Analyze the project
    const projectData = await analyzeProject(originalDir);
    
    // Generate CSS
    const generatedCSS = await generateCSS(projectData);
    
    // Apply CSS to the project
    const result = await applyGeneratedCSS(projectDir, generatedCSS);
    
    if (result.success) {
      // Create a zip archive
      const zipPath = path.join(projectDir, 'enhanced-project.zip');
      await createZipArchive(path.join(projectDir, 'enhanced'), zipPath);
      
      res.json({
        message: 'CSS generated successfully',
        projectId: projectId,
        css: generatedCSS,
        downloadUrl: `/api/download/${projectId}`
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error generating CSS:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download enhanced project
app.get('/api/download/:projectId', (req, res) => {
  const { projectId } = req.params;
  const zipPath = path.join(outputDir, projectId, 'enhanced-project.zip');
  
  if (fs.existsSync(zipPath)) {
    res.download(zipPath);
  } else {
    res.status(404).send('Project not found');
  }
});

// Get project preview endpoint
app.get('/api/preview/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const enhancedDir = path.join(__dirname, 'uploads', projectId, 'enhanced');
    
    if (!fs.existsSync(enhancedDir)) {
      return res.status(404).json({ error: 'Enhanced project not found' });
    }
    
    // Find the first HTML file
    const files = await getAllFiles(enhancedDir);
    const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');
    
    if (htmlFiles.length === 0) {
      return res.status(404).json({ error: 'No HTML files found' });
    }
    
    // Get the content of the first HTML file
    const htmlContent = await readFile(htmlFiles[0], 'utf8');
    
    res.json({
      htmlContent: htmlContent
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
});

// Serve static files from enhanced project for preview
app.use('/preview/:projectId', (req, res, next) => {
  const projectId = req.params.projectId;
  const enhancedDir = path.join(__dirname, 'uploads', projectId, 'enhanced');
  
  if (fs.existsSync(enhancedDir)) {
    express.static(enhancedDir)(req, res, next);
  } else {
    next();
  }
});

// Preview HTML template for testing CSS
const previewHtmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>
    /* Generated CSS will be inserted here */
    {{CSS}}
  </style>
</head>
<body>
  <div class="preview-container">
    <header>
      <h1>Preview Header</h1>
      <nav>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Services</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <section class="hero">
        <h2>Welcome to the Preview</h2>
        <p>This is a preview of your generated CSS.</p>
        <button class="cta-button">Call to Action</button>
      </section>
      <section class="features">
        <div class="feature-card">
          <h3>Feature 1</h3>
          <p>Description of feature 1</p>
        </div>
        <div class="feature-card">
          <h3>Feature 2</h3>
          <p>Description of feature 2</p>
        </div>
        <div class="feature-card">
          <h3>Feature 3</h3>
          <p>Description of feature 3</p>
        </div>
      </section>
    </main>
    <footer>
      <p>&copy; 2023 Preview Site</p>
    </footer>
  </div>
</body>
</html>
`;

// Preview endpoint for generated CSS
app.get('/api/css-preview/:generationId', async (req, res) => {
  try {
    const { generationId } = req.params;
    const outputPath = path.join(outputDir, generationId);
    
    // Check if the generation exists
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ error: 'Generated project not found' });
    }
    
    // Find the CSS file
    const files = await readdir(outputPath);
    const cssFile = files.find(file => file.endsWith('.css'));
    
    if (!cssFile) {
      return res.status(404).json({ error: 'No CSS file found in the generated project' });
    }
    
    // Read the CSS content
    const cssContent = await readFile(path.join(outputPath, cssFile), 'utf8');
    
    // Create preview HTML with the CSS
    const previewHtml = previewHtmlTemplate.replace('{{CSS}}', cssContent);
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(previewHtml);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Direct preview endpoint that returns HTML with embedded CSS
app.post('/api/preview-html', (req, res) => {
  try {
    const { css } = req.body;
    
    if (!css) {
      return res.status(400).json({ error: 'CSS is required' });
    }
    
    // Create preview HTML with the CSS
    const previewHtml = previewHtmlTemplate.replace('{{CSS}}', css);
    
    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(previewHtml);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GitHub URL processing endpoint
app.post('/api/process-github', async (req, res) => {
  try {
    const { githubUrl } = req.body;
    
    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }
    
    // Validate GitHub URL format
    const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/tree\/([^\/]+)(\/(.+))?)?$/;
    const match = githubUrl.match(githubRegex);
    
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL format' });
    }
    
    const [, owner, repo, , branch = 'main', , subdir = ''] = match;
    
    // Create a unique project ID
    const projectId = Date.now().toString();
    const projectDir = path.join(githubDir, projectId);
    
    // Create project directory
    await mkdir(projectDir, { recursive: true });
    
    // Clone the repository or download files
    try {
      if (subdir) {
        // If a subdirectory is specified, download files from the GitHub API
        await downloadGitHubDirectory(owner, repo, branch, subdir, projectDir);
      } else {
        // Clone the entire repository
        await execPromise(`git clone --depth 1 --branch ${branch} https://github.com/${owner}/${repo}.git ${projectDir}`);
      }
    } catch (error) {
      console.error('Error fetching GitHub repository:', error);
      return res.status(500).json({ error: 'Failed to fetch GitHub repository' });
    }
    
    // Analyze the project
    const projectData = await analyzeProject(projectDir);
    
    res.json({
      message: 'GitHub repository processed successfully',
      projectId: projectId,
      projectData: projectData
    });
  } catch (error) {
    console.error('Error processing GitHub URL:', error);
    res.status(500).json({ error: 'Failed to process GitHub URL' });
  }
});

// Function to download a directory from GitHub API
async function downloadGitHubDirectory(owner, repo, branch, path, targetDir) {
  try {
    // Get the contents of the directory
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    
    // Process each item in the directory
    for (const item of response.data) {
      const itemPath = `${targetDir}/${item.name}`;
      
      if (item.type === 'dir') {
        // Create directory and download its contents
        await mkdir(itemPath, { recursive: true });
        await downloadGitHubDirectory(owner, repo, branch, `${path}/${item.name}`, itemPath);
      } else if (item.type === 'file') {
        // Download the file
        const fileResponse = await axios.get(item.download_url, { responseType: 'arraybuffer' });
        await writeFile(itemPath, Buffer.from(fileResponse.data));
      }
    }
  } catch (error) {
    console.error('Error downloading from GitHub API:', error);
    throw error;
  }
}

// Generate CSS for GitHub repository
app.post('/api/generate-github-css', async (req, res) => {
  try {
    const { projectId, prompt } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const projectDir = path.join(githubDir, projectId);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'GitHub project not found' });
    }
    
    // Analyze the project
    const projectData = await analyzeProject(projectDir);
    
    // Generate CSS with custom prompt if provided
    let generatedCSS;
    if (prompt) {
      generatedCSS = await generateCSSWithPrompt(projectData, prompt);
    } else {
      generatedCSS = await generateCSS(projectData);
    }
    
    // Apply CSS to the project
    const enhancedDir = await applyGeneratedCSS(projectDir, generatedCSS);
    
    // Create a zip archive
    const zipPath = path.join(projectDir, 'enhanced-project.zip');
    await createZipArchive(enhancedDir, zipPath);
    
    res.json({
      message: 'CSS generated successfully for GitHub project',
      projectId: projectId,
      css: generatedCSS,
      downloadUrl: `/api/download-github/${projectId}`
    });
  } catch (error) {
    console.error('Error generating CSS for GitHub project:', error);
    res.status(500).json({ error: 'Failed to generate CSS' });
  }
});

// Generate CSS with custom prompt
async function generateCSSWithPrompt(projectData, customPrompt) {
  // Prepare HTML samples (limit to avoid token limits)
  const htmlSamples = projectData.htmlStructure
    .map(item => `File: ${item.file}\n${item.structure}`)
    .join('\n\n')
    .slice(0, 3000);
  
  // Create prompt with project info and custom instructions
  const prompt = `
You are a CSS expert. I have a web project that needs styling.

Project structure:
HTML files: ${projectData.htmlFiles.join(', ')}
CSS files: ${projectData.cssFiles.join(', ') || 'None'}
JS files: ${projectData.jsFiles.join(', ') || 'None'}

Classes used in the project: ${projectData.elements.classes.join(', ')}
IDs used in the project: ${projectData.elements.ids.join(', ')}

HTML structure samples:
${htmlSamples}

User's specific requirements:
${customPrompt}

Please generate a comprehensive CSS file that styles this project beautifully. Include:
1. A modern, responsive design
2. Clean typography with good readability
3. Consistent spacing and layout
4. Appealing color scheme
5. Hover effects and transitions
6. Mobile-first approach with media queries

Return ONLY the CSS code without any explanations.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a CSS expert who creates beautiful, modern designs. Your task is to generate CSS for web projects based on their HTML structure."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating CSS with custom prompt:', error);
    throw new Error('Failed to generate CSS with OpenAI');
  }
}

// Download GitHub enhanced project endpoint
app.get('/api/download-github/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const zipPath = path.join(githubDir, projectId, 'enhanced-project.zip');
  
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'Enhanced project not found' });
  }
  
  res.download(zipPath, 'enhanced-project.zip');
});

// API endpoint for generating CSS directly from a prompt
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    let css;
    
    if (projectId) {
      // If a projectId is provided, use it to analyze the project and generate CSS
      const projectDir = path.join(uploadsDir, projectId);
      
      if (!fs.existsSync(projectDir)) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const projectData = await analyzeProject(projectDir);
      css = await generateCSSWithPrompt(projectData, prompt);
    } else {
      // Generate CSS directly from the prompt without a project
      css = await generateCSSFromPrompt(prompt);
    }
    
    res.json({
      code: css,
      language: 'css'
    });
  } catch (error) {
    console.error('Error generating CSS:', error);
    res.status(500).json({ error: 'Failed to generate CSS' });
  }
});

// Generate CSS directly from a prompt without a project
async function generateCSSFromPrompt(prompt) {
  try {
    const systemPrompt = "You are a CSS expert who creates beautiful, modern designs. Generate clean, well-formatted CSS based on the user's request.";
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating CSS from prompt:', error);
    throw new Error('Failed to generate CSS with OpenAI');
  }
}

// Serve static files from the output directory
app.use('/preview', express.static(outputDir));

// Add a specific route for original and enhanced previews
app.get('/preview/:projectId/original/:file(*)', (req, res) => {
  const { projectId, file } = req.params;
  const filePath = path.join(outputDir, projectId, 'original', file);
  
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/preview/:projectId/enhanced/:file(*)', (req, res) => {
  const { projectId, file } = req.params;
  const filePath = path.join(outputDir, projectId, 'enhanced', file);
  
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Process uploaded project
app.post('/api/process-project', upload.array('files'), async (req, res) => {
  try {
    // Generate a unique project ID
    const projectId = Date.now().toString();
    
    // Create project directories
    const projectDir = path.join(outputDir, projectId);
    const originalDir = path.join(projectDir, 'original');
    
    if (!fs.existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
    }
    
    if (!fs.existsSync(originalDir)) {
      await mkdir(originalDir, { recursive: true });
    }
    
    // Move uploaded files to the original directory
    for (const file of req.files) {
      const targetPath = path.join(originalDir, file.originalname);
      
      // Create subdirectories if needed
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }
      
      // Move the file
      fs.renameSync(file.path, targetPath);
    }
    
    // Analyze the project
    const projectData = await analyzeProject(originalDir);
    
    res.json({
      success: true,
      projectId,
      projectData
    });
  } catch (error) {
    console.error('Error processing project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});