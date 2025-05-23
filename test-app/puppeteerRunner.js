const puppeteer = require('puppeteer');

async function runNextUrl(browser) {
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text(); // Use msg.text() instead of msg._text
    if (text) {
      console.log(`Browser console: ${text}`);
    } else {
      // Log the type and arguments if text is not available for better debugging
      console.log(`Browser console (raw): type=${msg.type()}, args=${JSON.stringify(msg.args())}`);
    }
  });

  if (!process.env.URL) {
    process.exit(1);
    return;
  }

  await page.goto(process.env.URL);

  async function poll() {
    if (await isDone(page)) {
      let failCount = await getFailCount(page);
      if (failCount > 0) {
        await page.close();
        await browser.close();
        process.exit(1);
      } else {
        await page.close();
        await browser.close();
        process.exit(0);
      }
    } else {
      setTimeout(poll, 1000);
    }
  }

  poll();
}

async function isDone(page) {
  return await page.evaluate(function() {
    if (typeof TEST_STATUS !== 'undefined') {
      return TEST_STATUS.DONE;
    }

    return typeof DONE !== 'undefined' && DONE;
  });
}

async function getFailCount(page) {
  return await page.evaluate(function() {
    if (typeof TEST_STATUS !== 'undefined') {
      return TEST_STATUS.FAILURES;
    }

    if (typeof FAILURES === 'undefined') {
      return 1;
    }

    return 0;
  });
}

async function runTests() {
  console.log(`Running test with Puppeteer at ${process.env.URL}`);

  // --no-sandbox and --disable-setuid-sandbox must be disabled for CI compatibility
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  console.log(`Using version: ${await browser.version()}`);
  runNextUrl(browser);
}

runTests();