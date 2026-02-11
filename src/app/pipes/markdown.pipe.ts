import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private readonly blobUrlPattern = /https?:\/\/[^"'\s]+\.blob\.core\.windows\.net\/[^"'\s)]+/gi;

  constructor(private sanitizer: DomSanitizer) {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return '';
    const html = marked.parse(value) as string;
    const rewritten = this.rewriteBlobUrls(html);
    return this.sanitizer.bypassSecurityTrustHtml(rewritten);
  }

  /**
   * Rewrites direct Azure Blob Storage URLs to proxy through the backend API,
   * since public access is not permitted on the storage account.
   */
  private rewriteBlobUrls(html: string): string {
    return html.replace(this.blobUrlPattern, (blobUrl: string) => {
      const fileName = this.extractBlobName(blobUrl);
      return `${environment.apiBaseUrl2}/ProductDocuments/download?blobName=${encodeURIComponent(fileName)}`;
    });
  }

  /**
   * Extracts the blob name (last path segment) from a full blob storage URL.
   * E.g. https://account.blob.core.windows.net/container/path/to/file.pdf → file.pdf
   */
  private extractBlobName(blobUrl: string): string {
    try {
      const url = new URL(blobUrl);
      const segments = url.pathname.split('/').filter(s => s.length > 0);
      // segments[0] = container, rest = blob path; return everything after the container
      return segments.length > 1 ? segments.slice(1).join('/') : segments[0] || blobUrl;
    } catch {
      // Fallback: grab everything after the last /
      const lastSlash = blobUrl.lastIndexOf('/');
      return lastSlash >= 0 ? blobUrl.substring(lastSlash + 1) : blobUrl;
    }
  }
}
