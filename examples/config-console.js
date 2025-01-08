// 配置文件

// 监控文件: /etc/caddy/caddy.log
// 匹配规则: 包含 "nezha.a.com" 和 "/api/v1/login" 的行
// 防抖时间: 1 分钟
// 通知: 输出日志

export const configs = {
  "/root/dockge/stack/caddy/caddy/caddy.log": {
    "哪吒探针 登录请求": {
      debounceInterval: 60000, // 防抖时间, 覆盖全局配置
      match: /nezha\.a\.com.*\/api\/v1\/login/, // 匹配规则
      format: async (line, config) => `🚨 ${config.name}\n📜 ${line}`,
    },
  },
};

export async function notify(message, { name, Signale }) {
  // 通知函数，可以自定义通知方式
  const logger = new Signale({ scope: name });
  logger.log(message);
}

export const DEBOUNCE_INTERVAL = 60000; // 通知的默认防抖间隔为 1 分钟，可以根据需求调整
