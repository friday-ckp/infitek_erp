import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, type WriteStream } from 'node:fs';
import { join, parse } from 'node:path';
import type { DestinationStream } from 'pino';

type DailyFileStreamOptions = {
  filename: string;
  logsDir: string;
  retentionDays: number;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createDailyFileStream(options: DailyFileStreamOptions): DestinationStream {
  return new DailyFileStream(options);
}

class DailyFileStream implements DestinationStream {
  readonly fd = undefined;
  readonly filename: string;
  readonly logsDir: string;
  readonly retentionDays: number;

  private currentDate: string;
  private currentFilePath: string;
  private stream: WriteStream;

  constructor({ filename, logsDir, retentionDays }: DailyFileStreamOptions) {
    this.filename = filename;
    this.logsDir = logsDir;
    this.retentionDays = retentionDays;
    this.currentFilePath = join(this.logsDir, this.filename);

    mkdirSync(this.logsDir, { recursive: true });

    const today = formatDate(new Date());
    this.rotateExistingCurrentFileIfNeeded(today);
    this.currentDate = today;
    this.stream = createWriteStream(this.currentFilePath, { flags: 'a' });
    this.pruneArchives();
  }

  write(chunk: string | Uint8Array): boolean {
    this.rotateIfNeeded();
    return this.stream.write(chunk);
  }

  end(): void {
    this.stream.end();
  }

  flushSync(): void {
    // pino calls this when present; fs write streams are already flushed on write boundaries here.
  }

  private rotateIfNeeded() {
    const today = formatDate(new Date());
    if (today === this.currentDate) {
      return;
    }

    this.stream.end();
    this.archiveCurrentFile(this.currentDate);
    this.currentDate = today;
    this.stream = createWriteStream(this.currentFilePath, { flags: 'a' });
    this.pruneArchives();
  }

  private rotateExistingCurrentFileIfNeeded(today: string) {
    if (!existsSync(this.currentFilePath)) {
      return;
    }

    const stats = statSync(this.currentFilePath);
    const fileDate = formatDate(stats.mtime);
    if (fileDate === today) {
      return;
    }

    this.archiveCurrentFile(fileDate);
  }

  private archiveCurrentFile(date: string) {
    if (!existsSync(this.currentFilePath)) {
      return;
    }

    const archivePath = this.resolveArchivePath(date);
    renameSync(this.currentFilePath, archivePath);
  }

  private resolveArchivePath(date: string) {
    const { name, ext } = parse(this.filename);
    const extension = ext || '.log';
    let archivePath = join(this.logsDir, `${name}.${date}${extension}`);
    let duplicateIndex = 1;

    while (existsSync(archivePath)) {
      archivePath = join(this.logsDir, `${name}.${date}.${duplicateIndex}${extension}`);
      duplicateIndex += 1;
    }

    return archivePath;
  }

  private pruneArchives() {
    const { name, ext } = parse(this.filename);
    const extension = ext || '.log';
    const archiveFiles = readdirSync(this.logsDir)
      .filter((file) => file.startsWith(`${name}.`) && file.endsWith(extension) && file !== this.filename)
      .filter((file) => {
        const middle = file.slice(name.length + 1, file.length - extension.length);
        const dateSegment = middle.split('.')[0];
        return DATE_PATTERN.test(dateSegment);
      })
      .sort();

    const filesToDelete = archiveFiles.slice(0, Math.max(0, archiveFiles.length - this.retentionDays));
    for (const file of filesToDelete) {
      unlinkSync(join(this.logsDir, file));
    }
  }
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
