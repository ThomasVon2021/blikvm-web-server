
import gi
import time
gi.require_version('Gst', '1.0')
from gi.repository import Gst

class RTSPStreamer:
    def __init__(self):
        # 重新初始化环境
        Gst.init(None)
        self.pipeline = None
        self._running = True  # 控制循环的标志位
        self.rtsp_url = "rtsp://127.0.0.1:8554/test"
        self.rtpsessions = {'audio': None, 'video': None}       
    def create_elements(self):
        """创建所有GStreamer元素"""
        # 视频元素
        self.v4l2src = Gst.ElementFactory.make("v4l2src", "v4l2src")
        video_caps = Gst.Caps.from_string("video/x-raw,width=1920,height=1080,framerate=60/1,format=NV12")
        self.video_filter = Gst.ElementFactory.make("capsfilter", "video_filter")
        self.video_filter.set_property("caps", video_caps)  
        self.queue1 = Gst.ElementFactory.make("queue", "queue1")
        self.mpph265enc = Gst.ElementFactory.make("mpph265enc", "mpph265enc")
        self.mpph265enc.set_property("qp-init", 50)
        self.mpph265enc.set_property("qp-max", 51)
        self.mpph265enc.set_property("qp-min", 30)
        self.mpph265enc.set_property("rc-mode", 0)
        self.mpph265enc.set_property("gop", 60)
        self.mpph265enc.set_property("bps-max", 3000000)     
        self.queue2 = Gst.ElementFactory.make("queue", "queue2")
        self.h265parse = Gst.ElementFactory.make("h265parse", "h265parse")
        self.queue3 = Gst.ElementFactory.make("queue", "queue3")
        self.rtspclientsink = Gst.ElementFactory.make("rtspclientsink", "s")
        self.rtspclientsink.set_property("latency", 0)
        self.rtspclientsink.set_property("location", self.rtsp_url)
        # 音频元素
        self.alsasrc = Gst.ElementFactory.make("alsasrc", "alsasrc")
        self.alsasrc.set_property("device", "hw:1")
        audio_caps = Gst.Caps.from_string("audio/x-raw,rate=48000,channels=2")
        self.audio_filter = Gst.ElementFactory.make("capsfilter", "audio_filter")
        self.audio_filter.set_property("caps", audio_caps)   
        self.queue4 = Gst.ElementFactory.make("queue", "queue4")
        self.opusenc = Gst.ElementFactory.make("opusenc", "opusenc")
        self.opusenc.set_property("bitrate", 320000)
        self.opusparse = Gst.ElementFactory.make("opusparse", "opusparse")

    def build_pipeline(self):
        """构建并连接管道"""
        self.pipeline = Gst.Pipeline.new("mypipeline")       
        # 添加所有元素
        elements = [
            self.v4l2src, self.video_filter, self.queue1, self.mpph265enc,
            self.queue2, self.h265parse, self.queue3, self.rtspclientsink,
            self.alsasrc, self.audio_filter, self.queue4, self.opusenc, self.opusparse
        ]
        for elem in elements:
            self.pipeline.add(elem)
        # 连接视频链路
        self.v4l2src.link(self.video_filter)
        self.video_filter.link(self.queue1)
        self.queue1.link(self.mpph265enc)
        self.mpph265enc.link(self.queue2)
        self.queue2.link(self.h265parse)
        self.h265parse.link(self.queue3)
        self.queue3.link(self.rtspclientsink)
        # 连接音频链路
        self.alsasrc.link(self.audio_filter)
        self.audio_filter.link(self.queue4)
        self.queue4.link(self.opusenc)
        self.opusenc.link(self.opusparse)
        self.opusparse.link(self.rtspclientsink)

    def get_bitrate(self, struct):
        """从Gst结构体提取比特率"""
        realtime_bitrate = 0
        if not struct:
            return realtime_bitrate
        for i in range(struct.n_fields()):
            field_name = struct.nth_field_name(i)
            field_value = struct.get_value(field_name)
            if field_name == "source-stats" and isinstance(field_value, list):
                for item in field_value:
                    if isinstance(item, Gst.Structure):
                        bitrate = item.get_value("bitrate")
                        if bitrate > realtime_bitrate:
                            realtime_bitrate = bitrate
        return realtime_bitrate

    def print_stats(self):
        """打印实时统计信息"""
        for session_name, rtpsession in self.rtpsessions.items():
            if rtpsession:
                try:
                    stats = rtpsession.get_property("stats")
                    if stats:
                        bitrate = self.get_bitrate(stats)
                        print(f"Bitrate for {session_name}: {bitrate}", flush=True)
                    else:
                        print(f"Bitrate no {session_name}", flush=True)
                except Exception as e:
                    print(f"Error retrieving stats: {e}", flush=True)
            else:
                print(f"No session", flush=True)

    def stop(self):
            """完整资源清理实现"""
            self._running = False
            self.pipeline.set_state(Gst.State.NULL)
            self.rtpsessions = {'audio': None, 'video': None} 

    def run(self):
        """启动主循环"""
        self._running = True
        self.create_elements()
        self.build_pipeline()
        # 启动管道
        self.pipeline.set_state(Gst.State.PLAYING)
        time.sleep(5)  # 等待初始化
        # 获取RTPSession元素
        self.rtpsessions['audio'] = self.pipeline.get_by_name("rtpsession0")
        self.rtpsessions['video'] = self.pipeline.get_by_name("rtpsession1")

        try:
            while self._running:
                self.print_stats()
                time.sleep(1)
        except KeyboardInterrupt:
            self.pipeline.set_state(Gst.State.NULL)
            print("Pipeline stopped", flush=True)