# 项目名称

## 1. 项目结构

项目的文件和目录结构如下：

- src：源代码
  - common：通用代码
  - video_api：视频API
  - ws_api：Websocket API
  - http_api：HTTP API
  - http_server：HTTP服务
  - log：日志
  - index.js：启动程序
- test：测试代码
- lib：依赖的库文件
- doc：文档
- config：配置文件
- scripts：脚本文件
- release：发布版本
- README.md：项目简介
- package.json：项目配置

## 2. 代码逻辑

（1）主要有五个对象：HTTP服务对象、HTTP-API对象、WebSocket-API对象、视频流-API对象、日志对象

（2）KVM开机时启动：HTTP服务对象、日志对象

（3）启动服务时启动：HTTP-API对象、WebSocket-API对象、视频流-API对象

（4）API请求格式：密钥、一次性密码、具体的请求内容

## 3. 待开发项

以下是项目的未完成部分，以及未来的开发计划：

- [ ] 自启动方案
- [ ] 开机生成设备编码和密钥
- [ ] 请求API时校验密钥和一次性密码
- [ ] 启动服务API，返回一次性密码
- [ ] 关闭服务API，一次性密码失效
- [ ] 键盘API
- [ ] 鼠标API
- [ ] 视频API
- [ ] 远程开关机API
- [ ] 调整图像分辨率比例
- [ ] 打包