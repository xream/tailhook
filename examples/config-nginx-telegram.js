// 配置文件

// 监控文件: /var/log/nginx/access.log
// 匹配规则: 哪吒探针登录, 哪吒探针终端, 哪吒探针文件(Nginx 默认日志格式似乎不带 Host, 本示例只写了 URI 匹配. 反正可以自己改)
// 如: 1.2.3.4 - - [09/Jan/2025:10:22:36 +0800] "POST /api/v1/login HTTP/2.0" 200 32 "-" "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; AcooBrowser; .NET CLR 1.1.4322; .NET CLR 2.0.50727)"
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

// 匹配 remote_ip
const REMOTE_IP_REGEX = new RegExp(
  `^(${IPV4_REGEX.source}|${IPV6_REGEX.source})`
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
  const ip = line.match(REMOTE_IP_REGEX)?.[1];
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
  "/var/log/nginx/access.log": {
    "哪吒探针 登录": {
      debounceInterval: 60000,
      match: /\/api\/v1\/login/,
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
      match: /\/api\/v1\/ws\/terminal/,
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
      match: /\/api\/v1\/ws\/file/,
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
