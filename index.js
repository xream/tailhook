import path from "path";
import { Tail } from "tail";
import fs from "fs";
import { Signale } from "signale";

const logger = new Signale({
  scope: "app",
});
const lastNotifyTime = new Map();

const configPath = path.resolve(__dirname, process.env.CONFIG || "./config.js");
logger.log(`配置文件: ${configPath}`);

if (!fs.existsSync(configPath)) {
  logger.error(`配置文件不存在: ${configPath}`);
  logger.log("可以通过设置环境变量 CONFIG 来指定配置文件路径");
  logger.log("例如: CONFIG=./config.js");
  process.exit(1);
}

async function loadConfig() {
  try {
    const { configs, notify, DEBOUNCE_INTERVAL } = await import(configPath);
    return { configs, notify, DEBOUNCE_INTERVAL };
  } catch (error) {
    logger.error(`加载配置文件失败 (${configPath}):`, error);
    process.exit(1);
  }
}

async function handleLine(filePath, line) {
  const { configs, notify, DEBOUNCE_INTERVAL } = await loadConfig();
  const fileConfig = configs[filePath];
  if (!fileConfig) return;

  for (const [name, config] of Object.entries(fileConfig)) {
    if (config.match.test(line)) {
      const key = `${filePath}:${name}`;
      const lastTime = lastNotifyTime.get(key) || 0;
      const now = Date.now();
      const notifyLogger = new Signale({ interactive: true, scope: name });
      notifyLogger.await(`已匹配`);
      if (now - lastTime >= (config.debounceInterval || DEBOUNCE_INTERVAL)) {
        lastNotifyTime.set(key, now);

        try {
          notifyLogger.await(`开始执行通知`);
          const context = { name, Signale };
          const formattedMessage = await config.format(line, context);
          // logger.log(formattedMessage);
          await notify(formattedMessage, context);
          notifyLogger.success(`通知完成`);
        } catch (error) {
          notifyLogger.error(`执行通知失败: ${error.message}`);
        }
      } else {
        notifyLogger.log(`跳过通知: 在防抖时间内`);
      }
    }
  }
}

async function watchFiles() {
  const { configs } = await loadConfig();
  for (let filePath of Object.keys(configs)) {
    try {
      filePath = path.resolve(__dirname, filePath);
      const tail = new Tail(filePath);

      tail.on("line", (line) => {
        handleLine(filePath, line).catch((error) => {
          logger.error(`处理行内容失败: ${error.message}`);
        });
      });

      tail.on("error", (error) => {
        throw error;
      });

      logger.log(`开始监控文件: ${filePath}`);
    } catch (error) {
      logger.error(`监控文件失败: ${filePath}`, error);
    }
  }
}

watchFiles();
