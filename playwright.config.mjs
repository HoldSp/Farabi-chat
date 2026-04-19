import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "C:/Program Files/Google/Chrome/Application/chrome.exe";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 60_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath
        }
      }
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        launchOptions: {
          executablePath
        }
      }
    }
  ]
});