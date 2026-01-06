interface GitHubCommitResponse {
  sha: string;
  url: string;
}

interface GitHubFileContent {
  name: string;
  path: string;
  sha?: string;
  size?: number;
  url?: string;
  html_url?: string;
  git_url?: string;
  download_url?: string;
  type: string;
  content?: string;
  encoding?: string;
}

export class GitHubUploadService {
  private owner: string;
  private repo: string;
  private token: string;
  private baseUrl: string;

  constructor() {
    this.owner = 'TrainingTWC';
    this.repo = 'LMSdashboard';
    this.token = ''; // Will be set by admin
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Set GitHub token for authentication
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Check if GitHub token is configured
   */
  isConfigured(): boolean {
    return !!this.token;
  }

  /**
   * Convert File to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:text/csv;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Get existing file SHA if it exists
   */
  private async getFileSha(path: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const data: GitHubFileContent = await response.json();
        return data.sha || null;
      }
      return null;
    } catch (error) {
      console.log('File does not exist yet, will create new file');
      return null;
    }
  }

  /**
   * Upload or update a file in the GitHub repository
   */
  async uploadFile(file: File, path: string, commitMessage?: string): Promise<GitHubCommitResponse> {
    if (!this.token) {
      throw new Error('GitHub token not configured. Please set up GitHub integration first.');
    }

    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);
      
      // Check if file already exists to get SHA
      const existingSha = await this.getFileSha(path);
      
      // Prepare commit data
      const commitData = {
        message: commitMessage || `Upload ${file.name} - ${new Date().toISOString()}`,
        content: base64Content,
        ...(existingSha && { sha: existingSha })
      };

      // Upload to GitHub
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commitData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub upload failed: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.commit;
    } catch (error) {
      console.error('Error uploading to GitHub:', error);
      throw error;
    }
  }

  /**
   * Upload training data CSV file
   */
  async uploadTrainingData(file: File): Promise<GitHubCommitResponse> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `lms-completion-${timestamp}.csv`;
    const path = `public/data/${fileName}`;
    
    const commitMessage = `📊 Update training data: ${fileName}`;
    
    return this.uploadFile(file, path, commitMessage);
  }

  /**
   * Test GitHub connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  /**
   * List files in the data directory
   */
  async listDataFiles(): Promise<GitHubFileContent[]> {
    if (!this.token) {
      throw new Error('GitHub token not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/public/data`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (response.ok) {
        const files: GitHubFileContent[] = await response.json();
        return files.filter(file => file.name.endsWith('.csv'));
      }
      return [];
    } catch (error) {
      console.error('Error listing data files:', error);
      return [];
    }
  }

  /**
   * Get the last commit date for a specific file
   */
  async getFileLastModified(path: string): Promise<Date | null> {
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      // Add token if available (optional for public repos)
      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }
      
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/commits?path=${path}&page=1&per_page=1`;
      
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const commits = await response.json();
        if (commits && commits.length > 0) {
          const lastCommitDate = commits[0].commit.committer.date;
          return new Date(lastCommitDate);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting file last modified date:', error);
      return null;
    }
  }
}

// Export singleton instance
export const githubUploadService = new GitHubUploadService();