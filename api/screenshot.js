const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // Parse query parameters
  const { url, width = 1280, height = 720, fullPage = 'false', quality = 80, delay = 0 } = req.query;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height),
      deviceScaleFactor: 1,
    });

    // Navigate to URL
    await page.goto(url.startsWith('http') ? url : `https://${url}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Optional delay before screenshot
    if (parseInt(delay) > 0) {
      await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
    }

    // Take screenshot
    const screenshot = await page.screenshot({
      fullPage: fullPage === 'true',
      quality: parseInt(quality),
      type: 'jpeg',
    });

    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the screenshot
    res.status(200).send(screenshot);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to capture screenshot', details: error.message });
  }
};
