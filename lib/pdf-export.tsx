"use client"

interface PressReleaseData {
  agencyName: string
  city: string
  state: string
  releaseDate: string
  caseNumber?: string
  content: string
  contactName: string
  contactPhone: string
  contactPhone2?: string
  contactEmail: string
  logoUrl?: string
  boilerplate?: string
  documentLabel?: string
  includeContactSection?: boolean
}

export async function generatePressReleasePDF(data: PressReleaseData): Promise<void> {
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to download PDF')
    return
  }

  const logoHtml = data.logoUrl 
    ? `<img src="${data.logoUrl}" alt="${data.agencyName} Logo" style="max-height: 80px; max-width: 160px; object-fit: contain; display: block;" />`
    : ''

  // Header: logo left, agency name + details center, logo right
  const headerLeft = data.logoUrl ? `<div class="header-logo">${logoHtml}</div>` : '<div class="header-logo"></div>'
  const headerRight = data.logoUrl ? `<div class="header-logo">${logoHtml}</div>` : '<div class="header-logo"></div>'
  const headerCenter = `
    <h1 class="agency-name">${data.agencyName}</h1>
    <div class="release-type">${data.documentLabel || "PRESS RELEASE"}</div>
    <div class="release-info">
      ${data.caseNumber ? `Case #: ${data.caseNumber}<br>` : ''}
      FOR IMMEDIATE RELEASE
    </div>
  `

  const boilerplateHtml = data.boilerplate
    ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; line-height: 1.6;">
        ${data.boilerplate}
       </div>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Press Release - ${data.agencyName}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0;
    }
    
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1a365d;
    }
    
    .header-logo {
      flex: 0 0 auto;
      width: 160px;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .header-center {
      flex: 1 1 auto;
      text-align: center;
      min-width: 0;
      padding: 0 12px;
    }
    
    .agency-name {
      font-size: 18pt;
      font-weight: bold;
      color: #1a365d;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 5px 0;
    }
    
    .release-type {
      font-size: 14pt;
      font-weight: bold;
      color: #1a365d;
      margin: 10px 0;
    }
    
    .release-info {
      font-size: 11pt;
      color: #4a5568;
      margin-top: 10px;
    }
    
    .dateline {
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .content {
      text-align: justify;
      margin: 20px 0;
    }
    
    .content p {
      margin-bottom: 15px;
      text-indent: 0;
    }
    
    .contact-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .contact-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 10px;
      color: #1a365d;
    }
    
    .contact-info {
      font-size: 11pt;
      line-height: 1.8;
    }
    
    .end-marker {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 40px;
      color: #1a365d;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10pt;
      color: #6b7280;
      text-align: center;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    ${headerLeft}
    <div class="header-center">
      ${headerCenter}
    </div>
    ${headerRight}
  </div>
  
  <div class="dateline">
    ${data.city.toUpperCase()}, ${data.state.toUpperCase()} — ${data.releaseDate}
  </div>
  
  <div class="content">
    ${data.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
  </div>
  
  ${data.includeContactSection !== false ? `
  <div class="contact-section">
    <div class="contact-title">Media Contact:</div>
    <div class="contact-info">
      ${data.contactName}<br>
      ${data.agencyName}<br>
      Phone: ${data.contactPhone}${data.contactPhone2 ? `<br>Secondary: ${data.contactPhone2}` : ''}<br>
      Email: ${data.contactEmail}
    </div>
  </div>
  ` : ""}
  
  <div class="end-marker">###</div>
  
  ${boilerplateHtml}
</body>
</html>
`

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for images to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// Alternative: Generate PDF using canvas/jsPDF approach for better control
export async function downloadPressReleasePDF(data: PressReleaseData): Promise<void> {
  // For now, use the print approach which works reliably
  // In production, you could use a library like jsPDF or html2pdf.js
  await generatePressReleasePDF(data)
}
