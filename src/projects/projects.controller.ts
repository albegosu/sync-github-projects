import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Get web UI for project selection
   */
  @Get()
  getProjectsUI(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Projects - Select Projects to Sync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        h1 {
            color: #2d3748;
            margin-bottom: 0.5rem;
        }
        
        .subtitle {
            color: #4a5568;
        }
        
        .config-section {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            margin-bottom: 2rem;
        }
        
        .input-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            color: #2d3748;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
        }
        
        button {
            background: #667eea;
            color: white;
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #5568d3;
        }
        
        button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .project-card {
            background: white;
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
            cursor: pointer;
            border: 3px solid transparent;
        }
        
        .project-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        
        .project-card.selected {
            border-color: #667eea;
            background: #f7fafc;
        }
        
        .project-title {
            color: #2d3748;
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        
        .project-description {
            color: #4a5568;
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
        }
        
        .project-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: #718096;
        }
        
        .loading {
            text-align: center;
            padding: 3rem;
            color: white;
            font-size: 1.2rem;
        }
        
        .error {
            background: #fc8181;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
        }
        
        .success {
            background: #68d391;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
        }
        
        .sync-button {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: #48bb78;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        
        .sync-button:hover {
            background: #38a169;
        }
        
        .selection-count {
            background: white;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            font-weight: 600;
            color: #2d3748;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗂️ GitHub Projects Sync</h1>
            <p class="subtitle">Select which projects to sync to Google Calendar</p>
        </div>
        
        <div class="config-section">
            <div class="input-group">
                <label for="username">GitHub Username or Organization:</label>
                <input type="text" id="username" placeholder="e.g., albegosu" value="albegosu">
            </div>
            <button onclick="loadProjects()">Load Projects</button>
            <div id="message"></div>
        </div>
        
        <div id="selection-info" class="selection-count" style="display: none;">
            <span id="selection-text">0 projects selected</span>
        </div>
        
        <div id="loading" class="loading" style="display: none;">
            Loading projects...
        </div>
        
        <div id="projects" class="projects-grid"></div>
        
        <button class="sync-button" id="syncButton" onclick="saveAndSync()" style="display: none;">
            ✓ Save & Sync Selected Projects
        </button>
    </div>
    
    <script>
        let selectedProjects = new Set();
        
        async function loadProjects() {
            const username = document.getElementById('username').value.trim();
            if (!username) {
                showMessage('Please enter a username or organization', 'error');
                return;
            }
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('projects').innerHTML = '';
            document.getElementById('message').innerHTML = '';
            
            try {
                const response = await fetch(\`/projects/list?username=\${username}\`);
                const data = await response.json();
                
                document.getElementById('loading').style.display = 'none';
                
                if (data.projects && data.projects.length > 0) {
                    displayProjects(data.projects);
                    showMessage(\`Found \${data.projects.length} projects!\`, 'success');
                } else {
                    showMessage('No projects found for this user/organization', 'error');
                }
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                showMessage('Error loading projects: ' + error.message, 'error');
            }
        }
        
        function displayProjects(projects) {
            const container = document.getElementById('projects');
            container.innerHTML = '';
            
            projects.forEach(project => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.onclick = () => toggleProject(project.id, card);
                
                card.innerHTML = \`
                    <div class="project-title">📋 \${project.title}</div>
                    <div class="project-description">\${project.shortDescription || 'No description'}</div>
                    <div class="project-meta">
                        <span>#\${project.number}</span>
                        <span>\${project.public ? '🌐 Public' : '🔒 Private'}</span>
                    </div>
                \`;
                
                container.appendChild(card);
            });
            
            updateSelectionInfo();
        }
        
        function toggleProject(projectId, card) {
            if (selectedProjects.has(projectId)) {
                selectedProjects.delete(projectId);
                card.classList.remove('selected');
            } else {
                selectedProjects.add(projectId);
                card.classList.add('selected');
            }
            updateSelectionInfo();
        }
        
        function updateSelectionInfo() {
            const count = selectedProjects.size;
            const info = document.getElementById('selection-info');
            const text = document.getElementById('selection-text');
            const syncButton = document.getElementById('syncButton');
            
            if (count > 0) {
                info.style.display = 'block';
                syncButton.style.display = 'block';
                text.textContent = \`\${count} project\${count === 1 ? '' : 's'} selected\`;
            } else {
                info.style.display = 'none';
                syncButton.style.display = 'none';
            }
        }
        
        async function saveAndSync() {
            if (selectedProjects.size === 0) {
                showMessage('Please select at least one project', 'error');
                return;
            }
            
            const username = document.getElementById('username').value.trim();
            
            try {
                const response = await fetch('/projects/select', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username,
                        projectIds: Array.from(selectedProjects)
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(\`Configuration saved! Syncing \${selectedProjects.size} projects...\`, 'success');
                    
                    // Trigger sync
                    setTimeout(async () => {
                        const syncResponse = await fetch('/sync/projects', {
                            method: 'POST'
                        });
                        const syncData = await syncResponse.json();
                        
                        showMessage(
                            \`Sync complete! Total items: \${syncData.totalItems}, Created: \${syncData.created}, Updated: \${syncData.updated}\`,
                            'success'
                        );
                    }, 1000);
                } else {
                    showMessage('Error saving configuration: ' + data.message, 'error');
                }
            } catch (error) {
                showMessage('Error: ' + error.message, 'error');
            }
        }
        
        function showMessage(text, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.className = type;
            messageDiv.textContent = text;
        }
        
        // Auto-load projects on page load if username is set
        window.onload = () => {
            const username = document.getElementById('username').value;
            if (username) {
                loadProjects();
            }
        };
    </script>
</body>
</html>
    `;
    
    res.send(html);
  }

  /**
   * List available projects for a user/organization
   */
  @Get('list')
  async listProjects(@Query('username') username: string) {
    return await this.projectsService.listProjects(username);
  }

  /**
   * Save selected projects for syncing
   */
  @Post('select')
  async selectProjects(@Body() body: { username: string; projectIds: string[] }) {
    return await this.projectsService.saveSelectedProjects(body.username, body.projectIds);
  }

  /**
   * Get currently selected projects
   */
  @Get('selected')
  async getSelectedProjects(@Query('username') username: string) {
    return await this.projectsService.getSelectedProjects(username);
  }
}

