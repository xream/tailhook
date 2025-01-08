# tailhook

tailhook 是一个用于监控文件变化的工具，当文件发生变化时，会触发相应的回调函数

## 配置文件

配置文件是一个 JavaScript 文件

默认为与可执行文件同目录下的 `config.js` 文件

可以通过设置环境变量 `CONFIG` 来指定配置文件路径

例如: `CONFIG=./config.js`

参考配置文件: [examples](./examples)

简单或复杂, 由你决定
