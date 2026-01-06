/**
 * Mock Filesystem
 * In-memory filesystem mock for testing
 */

export interface MockFile {
  path: string;
  content: string | Buffer;
  mode: number;
  createdAt: Date;
  modifiedAt: Date;
}

export class MockFilesystem {
  private files: Map<string, MockFile> = new Map();
  private directories: Set<string> = new Set(['/']);

  /**
   * Write file
   */
  async writeFile(path: string, content: string | Buffer): Promise<void> {
    this.ensureDirectory(this.dirname(path));

    const existing = this.files.get(path);
    const now = new Date();

    this.files.set(path, {
      path,
      content,
      mode: 0o644,
      createdAt: existing?.createdAt || now,
      modifiedAt: now,
    });
  }

  /**
   * Read file
   */
  async readFile(path: string, encoding?: 'utf8'): Promise<string | Buffer> {
    const file = this.files.get(path);

    if (!file) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }

    if (encoding === 'utf8' && Buffer.isBuffer(file.content)) {
      return file.content.toString('utf8');
    }

    return file.content;
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  /**
   * Delete file
   */
  async unlink(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }

    this.files.delete(path);
  }

  /**
   * Create directory
   */
  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    if (options?.recursive) {
      const parts = path.split('/').filter(Boolean);
      let current = '';

      for (const part of parts) {
        current += '/' + part;
        this.directories.add(current);
      }
    } else {
      const parent = this.dirname(path);
      if (!this.directories.has(parent)) {
        throw new Error(`ENOENT: no such file or directory, mkdir '${path}'`);
      }

      this.directories.add(path);
    }
  }

  /**
   * Remove directory
   */
  async rmdir(path: string): Promise<void> {
    if (!this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, rmdir '${path}'`);
    }

    // Check if directory has files
    const hasFiles = Array.from(this.files.keys()).some((file) => file.startsWith(path + '/'));

    if (hasFiles) {
      throw new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`);
    }

    this.directories.delete(path);
  }

  /**
   * List directory contents
   */
  async readdir(path: string): Promise<string[]> {
    if (!this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }

    const prefix = path === '/' ? '/' : path + '/';
    const contents = new Set<string>();

    // Add files
    for (const file of this.files.keys()) {
      if (file.startsWith(prefix)) {
        const relative = file.slice(prefix.length);
        const firstPart = relative.split('/')[0];
        contents.add(firstPart);
      }
    }

    // Add directories
    for (const dir of this.directories) {
      if (dir.startsWith(prefix) && dir !== path) {
        const relative = dir.slice(prefix.length);
        const firstPart = relative.split('/')[0];
        contents.add(firstPart);
      }
    }

    return Array.from(contents);
  }

  /**
   * Get file stats
   */
  async stat(path: string): Promise<any> {
    const file = this.files.get(path);

    if (file) {
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: Buffer.isBuffer(file.content) ? file.content.length : file.content.length,
        mode: file.mode,
        mtime: file.modifiedAt,
        ctime: file.createdAt,
      };
    }

    if (this.directories.has(path)) {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mode: 0o755,
        mtime: new Date(),
        ctime: new Date(),
      };
    }

    throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
  }

  /**
   * Copy file
   */
  async copyFile(source: string, dest: string): Promise<void> {
    const file = this.files.get(source);

    if (!file) {
      throw new Error(`ENOENT: no such file or directory, copyfile '${source}'`);
    }

    await this.writeFile(dest, file.content);
  }

  /**
   * Get directory name
   */
  private dirname(path: string): string {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectory(path: string): void {
    if (path === '/') return;

    const parts = path.split('/').filter(Boolean);
    let current = '';

    for (const part of parts) {
      current += '/' + part;
      this.directories.add(current);
    }
  }

  /**
   * Clear all files and directories
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
    this.directories.add('/');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      fileCount: this.files.size,
      directoryCount: this.directories.size - 1, // Exclude root
      totalSize: Array.from(this.files.values()).reduce((sum, file) => {
        const size = Buffer.isBuffer(file.content) ? file.content.length : file.content.length;
        return sum + size;
      }, 0),
    };
  }
}

/**
 * Factory function for creating a mock filesystem
 */
export function createMockFilesystem(): MockFilesystem {
  return new MockFilesystem();
}
