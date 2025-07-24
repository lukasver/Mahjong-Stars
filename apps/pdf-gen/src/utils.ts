const typographyStyles = `
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Sora', Arial, sans-serif;
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    page-break-after: avoid;
    break-after: avoid;
  }
  p {
    font-family: 'Overpass', Arial, sans-serif;
    margin-top: 0;
    margin-bottom: 0.5em;
    orphans: 3;
    widows: 3;
  }
`;

const pageBreakStyles = `
  .page-break {
    page-break-before: always;
    break-before: page;
    height: 0;
    margin: 0;
    border: 0;
  }
  .no-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  ul, ol, table, figure {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

const htmlHead = `
 <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PDF Document</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;500;600&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Overpass', Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          position: relative;
          min-height: 100vh;
        }
        .container {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          padding: 1cm;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Sora', Arial, sans-serif;
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        p {
          font-family: 'Overpass', Arial, sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        ${typographyStyles}
        ${pageBreakStyles}
      </style>
    </head>`;

export const getHtmlTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
  ${htmlHead}
  <body>
    <div class="container">
      ${content}
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        // Handle image loading
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        
        const markAsReady = () => {
          document.body.setAttribute('data-ready', 'true');
        };

        if (images.length === 0) {
          markAsReady();
          return;
        }

        images.forEach(img => {
          if (img.complete) {
            loadedImages++;
            if (loadedImages === images.length) markAsReady();
          } else {
            img.addEventListener('load', () => {
              loadedImages++;
              if (loadedImages === images.length) markAsReady();
            });
            img.addEventListener('error', () => {
              loadedImages++;
              if (loadedImages === images.length) markAsReady();
            });
          }
        });
      });
    </script>
  </body>
  </html>
`;

// Process content to handle manual page breaks
export function processHtmlContent(html: string): string {
  return html
    .replace(/<!--\s*PAGE_BREAK\s*-->/gi, '<div class="page-break"></div>')
    .replace(/\[PAGE_BREAK\]/gi, '<div class="page-break"></div>')
    .replace(
      /<hr\s+class=["']page-?break["'][^>]*>/gi,
      '<div class="page-break"></div>'
    )
    .replace(
      /<div\s+class=["']page-?break["'][^>]*>.*?<\/div>/gi,
      '<div class="page-break"></div>'
    )
    .replace(
      /<table(?!\s+class=["'][^"']*no-break[^"']*["'])/gi,
      '<table class="no-break"'
    )
    .replace(
      /<figure(?!\s+class=["'][^"']*no-break[^"']*["'])/gi,
      '<figure class="no-break"'
    );
}
