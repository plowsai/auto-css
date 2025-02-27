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
  const files = await getAllFiles(projectDir);
  
  const projectData = {
    htmlFiles: [],
    cssFiles: [],
    jsFiles: [],
    otherFiles: [],
    elements: { classes: [], ids: [] },
    htmlStructure: []
  };
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const relativePath = path.relative(projectDir, file);
    
    switch (ext) {
      case '.html':
      case '.htm':
        projectData.htmlFiles.push(relativePath);
        const htmlContent = await extractHTMLContent(file);
        projectData.elements.classes.push(...htmlContent.classes);
        projectData.elements.ids.push(...htmlContent.ids);
        projectData.htmlStructure.push({
          file: relativePath,
          structure: htmlContent.htmlStructure
        });
        break;
      case '.css':
        projectData.cssFiles.push(relativePath);
        break;
      case '.js':
        projectData.jsFiles.push(relativePath);
        break;
      default:
        projectData.otherFiles.push(relativePath);
    }
  }
  
  // Remove duplicates
  projectData.elements.classes = [...new Set(projectData.elements.classes)];
  projectData.elements.ids = [...new Set(projectData.elements.ids)];
  
  return projectData;
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
  // Create enhanced directory for the processed project
  const enhancedDir = path.join(projectDir, 'enhanced');
  if (!fs.existsSync(enhancedDir)) {
    await mkdir(enhancedDir, { recursive: true });
  }
  
  // Copy all files to enhanced directory
  const files = await getAllFiles(projectDir);
  
  for (const file of files) {
    // Skip files in the enhanced directory
    if (file.includes(path.sep + 'enhanced' + path.sep)) continue;
    
    const relativePath = path.relative(projectDir, file);
    const targetPath = path.join(enhancedDir, relativePath);
    const targetDir = path.dirname(targetPath);
    
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(file, targetPath);
    
    // For HTML files, add link to the generated CSS
    if (path.extname(file).toLowerCase() === '.html') {
      let content = await readFile(file, 'utf8');
      
      // Check if there's a head tag
      if (content.includes('</head>')) {
        // Add link to generated.css before closing head tag
        content = content.replace('</head>', '  <link rel="stylesheet" href="generated.css">\n</head>');
      } else if (content.includes('<html>') || content.includes('<html ')) {
        // Add head with CSS link after html tag
        content = content.replace(/(<html[^>]*>)/, '$1\n<head>\n  <link rel="stylesheet" href="generated.css">\n</head>');
      } else {
        // Add at the beginning of the file
        content = `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="generated.css">\n</head>\n${content}`;
      }
      
      await writeFile(targetPath, content, 'utf8');
    }
  }
  
  // Write generated CSS to file
  await writeFile(path.join(enhancedDir, 'generated.css'), generatedCSS, 'utf8');
  
  return enhancedDir;
}

// Generate CSS endpoint
app.post('/api/generate-css', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const projectDir = path.join(__dirname, 'uploads', projectId);
    
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Analyze the project
    const projectData = await analyzeProject(projectDir);
    
    // Generate CSS
    const generatedCSS = await generateCSS(projectData);
    
    // Apply CSS to the project
    const enhancedDir = await applyGeneratedCSS(projectDir, generatedCSS);
    
    // Create a zip archive
    const zipPath = path.join(projectDir, 'enhanced-project.zip');
    await createZipArchive(enhancedDir, zipPath);
    
    res.json({
      message: 'CSS generated successfully',
      projectId: projectId,
      css: generatedCSS,
      downloadUrl: `/api/download/${projectId}`
    });
  } catch (error) {
    console.error('Error generating CSS:', error);
    res.status(500).json({ error: 'Failed to generate CSS' });
  }
});

// Download enhanced project endpoint
app.get('/api/download/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const zipPath = path.join(__dirname, 'uploads', projectId, 'enhanced-project.zip');
  
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'Enhanced project not found' });
  }
  
  res.download(zipPath, 'enhanced-project.zip');
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

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});