import dgram from 'unix_dgram';

class ATX {

    static _instance = null;

    constructor() {
        if (!ATX._instance) {
            ATX._instance = this;
          this._init();
        }
    
        return Video._instance;
      }

  constructor(socketPath) {
    if (!UnixDomainSocketServer.instance) {
      this.socketPath = socketPath;
      this.client = dgram.createSocket('unix_dgram');

      // 绑定消息接收和错误事件
      this.client.on('message', this.handleMessage.bind(this));
      this.client.on('error', this.handleError.bind(this));

      // 绑定套接字到指定路径并开始监听
      this.client.bind(this.socketPath, () => {
        console.log(`Socket bound to ${this.socketPath}`);
        console.log('Waiting for messages...');
      });

      UnixDomainSocketServer.instance = this;
    }

    return UnixDomainSocketServer.instance;
  }

  // 处理接收到的消息
  handleMessage(msg, rinfo) {
    console.log(`Received message: ${msg.toString()} from ${rinfo.address}:${rinfo.port}`);
    // 在这里可以添加处理接收到消息的逻辑，例如解析消息内容、调用其他函数等
  }

  // 处理错误
  handleError(err) {
    console.error('Socket error:', err);
  }

  // 关闭套接字
  close() {
    this.client.close();
  }
}

// 导出单例对象，而不是类本身
const socketPath = '/tmp/mysocket';
const instance = new UnixDomainSocketServer(socketPath);
export default instance;
