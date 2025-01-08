# tailhook

`tailhook` 是一个用于监控文件变化并根据内容执行相应操作的工具

注意: 生产环境中, 您应该选择更成熟的工具

## 使用场景

例:

- 监控日志文件, 匹配特定内容, 发送 Telegram 通知

  - 监控 Caddy 日志文件, 当有人访问 `哪吒探针登录` / `哪吒探针终端` / `哪吒探针文件` 时, 发送如图的 Telegram 通知

    <img src="./examples/config-caddy-telegram.png" alt="哪吒探针" width="200" />

## 社群

👏🏻 欢迎加入社群进行交流讨论

👥 群组 [折腾啥(群组)](https://t.me/zhetengsha_group)

📢 频道 [折腾啥(频道)](https://t.me/zhetengsha)

## 下载

已打包为可执行文件

[Releases](./releases)

## 配置文件

配置文件是一个 JavaScript 文件

默认为与可执行文件同目录下的 `config.js` 文件

可以通过设置环境变量 `CONFIG` 来指定配置文件路径

例如: `CONFIG=./config.js tailhook`

参考配置文件: [examples](./examples)

## 一个 systemd 管理的例子

1. 下载 `tailhook-linux-arm64` 到 `/usr/local/bin/tailhook`

2. 给权限 `chmod +x /usr/local/bin/tailhook`

3. 创建配置文件 `/etc/tailhook.config.js`

4. 创建 systemd 服务文件 `/etc/systemd/system/tailhook.service`

```
[Unit]
Description=tailhook
After=network-online.target
Wants=network-online.target systemd-networkd-wait-online.service
[Service]
Type=simple
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/tailhook
Environment=CONFIG=/etc/tailhook.config.js
[Install]
WantedBy=multi-user.target
```

5. 启动服务 `systemctl daemon-reload; systemctl enable --now tailhook`

6. 查看日志 `journalctl -f -o cat -n 100 -u tailhook`
