// 配置文件

// 监控文件: /etc/caddy/caddy.log
// 匹配规则: 哪吒探针登录, 哪吒探针终端, 哪吒探针文件(假设域名为 nezha.a.com)
// 防抖时间: 1 分钟
// 格式化: 提取 IP, 使用 ip-api 获取 IP 信息
// 通知: 发送 Telegram 通知

// NOTE: 请在下方填写你的 Telegram API 密钥和目标聊天 ID
const API_KEY = "";
const TARGET_CHAT_ID = "";

const IPV4_REGEX =
  /\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/;

const IPV6_REGEX =
  /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){6}:[A-F0-9]{1,4}|(?:[A-F0-9]{1,4}:){5}(?::[A-F0-9]{1,4}){1,2}|(?:[A-F0-9]{1,4}:){4}(?::[A-F0-9]{1,4}){1,3}|(?:[A-F0-9]{1,4}:){3}(?::[A-F0-9]{1,4}){1,4}|(?:[A-F0-9]{1,4}:){2}(?::[A-F0-9]{1,4}){1,5}|[A-F0-9]{1,4}:(?::[A-F0-9]{1,4}){1,6}|:(?::[A-F0-9]{1,4}){1,7}|fe80:(?::[A-F0-9]{0,4}){0,4}%[0-9a-zA-Z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(?:25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])|(?:[A-F0-9]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\.){3}(?:25[0-5]|(?:2[0-4]|1[0-9]|[1-9])?[0-9])\b/i;

// 构建新的正则表达式，匹配 remote_ip 后的第一个 IP
const AFTER_REMOTE_IP_REGEX = new RegExp(
  `remote_ip.*?(${IPV4_REGEX.source}|${IPV6_REGEX.source})`
);

async function getIpInfo(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(5000), // 5秒超时
    });
    const data = await response.json();
    return {
      country: data.country || "未知",
      region: data.regionName || "未知",
      city: data.city || "未知",
    };
  } catch (error) {
    console.error("获取IP信息失败:", error);
    return;
  }
}

async function getIpAndInfo(line) {
  const ip = line.match(AFTER_REMOTE_IP_REGEX)?.[1];
  let ipInfo = ip ? await getIpInfo(ip) : "未知";
  ipInfo = ipInfo
    ? `${ipInfo.country}, ${ipInfo.region}, ${ipInfo.city}`
    : "未知";

  return {
    ip: ip || "未找到",
    location: ipInfo,
  };
}

export const configs = {
  "/etc/caddy/caddy.log": {
    "哪吒探针 登录": {
      debounceInterval: 60000,
      match: /nezha\.a\.com.*\/api\/v1\/login/,
      async format(line, config) {
        const { ip, location } = await getIpAndInfo(line);
        return `<b>🚨 ${config.name}</b>
        
🔍 检测到可疑访问

ɪᴘ <code>${ip}</code>

📍 <code>${location}</code>`;
      },
    },
    "哪吒探针 终端": {
      debounceInterval: 60000,
      match: /nezha\.a\.com.*\/api\/v1\/ws\/terminal/,
      async format(line, config) {
        const { ip, location } = await getIpAndInfo(line);
        return `<b>🚨 ${config.name}</b>
        
🔍 检测到可疑访问

ɪᴘ <code>${ip}</code>

📍 <code>${location}</code>`;
      },
    },
    "哪吒探针 文件": {
      debounceInterval: 60000,
      match: /nezha\.a\.com.*\/api\/v1\/ws\/file/,
      async format(line, config) {
        const { ip, location } = await getIpAndInfo(line);
        return `<b>🚨 ${config.name}</b>
        
🔍 检测到可疑访问

ɪᴘ <code>${ip}</code>

📍 <code>${location}</code>`;
      },
    },
  },
};

export async function notify(message, { name, Signale }) {
  // const logger = new Signale({ scope: name, interactive: true });
  // logger.await(`开始发送 Telegram 通知`);
  const url = `https://api.telegram.org/bot${API_KEY}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: TARGET_CHAT_ID,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const result = await response.json();
  if (!result.ok) {
    // logger.error(`Telegram 消息发送失败: ${result.description}`);
    throw new Error(`发送消息失败: ${result.description}`);
  }
  // logger.success(`Telegram 消息发送成功`);
  return result;
}

export const DEBOUNCE_INTERVAL = 60000; // 通知的默认防抖间隔为1分钟，可以根据需求调整
