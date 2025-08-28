/**
 * CSV Template Generator Service
 * Generates downloadable CSV template files for scene imports
 */

export class CSVTemplateGenerator {

  /**
   * Generate and download Template 1 (Vertical List Format)
   * Format: SCENE NAME, ITEM NAME, TYPE, ADDRESS, VALUE
   */
  static downloadTemplate1() {
    const headers = ['SCENE NAME', 'ITEM NAME', 'TYPE', 'ADDRESS', 'VALUE'];
    const sampleData = [
      ['Bedroom Scene', 'Main Light', 'LIGHTING', '1', '100%'],
      ['', 'Side Light', 'LIGHTING', '2', '75%'],
      ['', 'Table Lamp', 'LIGHTING', '3', '50%'],
      ['', 'Ceiling Light', 'LIGHTING', '4', '80%'],
      ['', 'Bedside Lamp', 'LIGHTING', '5', '30%'],
      ['Kitchen Scene', 'Kitchen Light', 'LIGHTING', '6', '100%'],
      ['', 'Under Cabinet', 'LIGHTING', '7', '60%']
    ];

    const csvContent = this.generateCSVContent(headers, sampleData);
    this.downloadFile(csvContent, 'scene_template_1_vertical.csv');
  }

  /**
   * Generate and download Template 2 (Horizontal Layout Format)
   * Format: ITEM NAME, TYPE, ADDRESS, Scene1, Scene2, Scene3, ...
   */
  static downloadTemplate2() {
    const headers = ['ITEM NAME', 'TYPE', 'ADDRESS', 'Living Room Scene', 'Bedroom Scene', 'Kitchen Scene'];
    const sampleData = [
      ['Main Light', 'LIGHTING', '1', '100%', '50%', '50%'],
      ['Side Light', 'LIGHTING', '2', '75%', '50%', '50%'],
      ['Table Lamp', 'LIGHTING', '3', '50%', '50%', '50%'],
      ['Ceiling Light', 'LIGHTING', '4', '50%', '80%', '50%'],
      ['Bedside Lamp', 'LIGHTING', '5', '50%', '30%', '50%'],
      ['Kitchen Light', 'LIGHTING', '6', '50%', '50%', '100%'],
      ['Under Cabinet', 'LIGHTING', '7', '50%', '50%', '60%']
    ];

    const csvContent = this.generateCSVContent(headers, sampleData);
    this.downloadFile(csvContent, 'scene_template_2_horizontal.csv');
  }

  /**
   * Generate CSV content from headers and data
   */
  static generateCSVContent(headers, data) {
    const csvRows = [];

    // Add headers
    csvRows.push(headers.map(header => `"${header}"`).join(','));

    // Add data rows
    data.forEach(row => {
      const csvRow = row.map(cell => `"${cell || ''}"`).join(',');
      csvRows.push(csvRow);
    });

    return csvRows.join('\n');
  }

  /**
   * Download file with given content and filename
   */
  static downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Download both templates as a zip file (if needed in the future)
   */
  static downloadBothTemplates() {
    // For now, download them separately
    this.downloadTemplate1();
    setTimeout(() => {
      this.downloadTemplate2();
    }, 500); // Small delay to avoid browser blocking multiple downloads
  }
}
