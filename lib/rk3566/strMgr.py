import subprocess
import re
import time
import psutil
import os
import threading
from streamer import RTSPStreamer


class StreamManager:
    def __init__(self):
        self.process = None
        self.output_thread = None
        self.last_state = "NO INPUT"
        self.rstpstr = RTSPStreamer()

    def is_mediamtx_running(self):
        """检测mediamtx进程是否运行"""
        for proc in psutil.process_iter(['name', 'cmdline']):
            try:
                if 'mediamtx' in ' '.join(proc.info['cmdline'] or []):
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False

    def kill_gstreamer_and_push(self):

        # 终止本地线程
        if self.output_thread and self.output_thread.is_alive():
            self.rstpstr.stop()
            self.output_thread.join(timeout=3)
            if self.output_thread.is_alive():
                print("Warning: Output thread not terminated properly", flush=True)
                if self.output_thread and self.output_thread.is_alive():
                    tid = self.output_thread.ident
                    try:
                        self._async_raise(tid, SystemExit)
                    except ValueError:
                        pass  # 线程已自然终止
                    self.output_thread = None  # 重置线程引用:ml-citation{ref="5" data="citationList"}
            else:
                self.output_thread = None


    def start_push_script(self):
        """启动推流脚本"""

        print("Started push.py", flush=True)
        self.output_thread = threading.Thread(
            target=self.rstpstr.run
        )
        self.output_thread.start()

    def check_video_input(self):
        """检测视频输入状态"""
        result = subprocess.run(
            ['v4l2-ctl', '-d', '/dev/v4l-subdev3', '--query-dv-timings'],
            stdout=subprocess.PIPE
        )
        output = result.stdout.decode()
        return "failed" not in output

    def get_video_params(self):
        """获取视频参数"""
        result = subprocess.run(
            ['v4l2-ctl', '-d', '/dev/v4l-subdev3', '--query-dv-timings'],
            stdout=subprocess.PIPE
        )
        output = result.stdout.decode()
        width = re.search(r"Active width: (\d+)", output).group(1)
        height = re.search(r"Active height: (\d+)", output).group(1)
        fps = re.search(r"(\d+\.\d+) frames per second", output).group(1)
        return f"{width}x{height}", fps

    def _async_raise(tid, exctype):
        """向指定线程ID注入异常"""
        tid = ctypes.c_long(tid)
        if not inspect.isclass(exctype):
            exctype = type(exctype)
        res = ctypes.pythonapi.PyThreadState_SetAsyncExc(tid, ctypes.py_object(exctype))
        if res == 0:
            raise ValueError("Invalid thread ID")
        elif res != 1:
            ctypes.pythonapi.PyThreadState_SetAsyncExc(tid, None)

    def run(self):
        """主运行循环"""
        while True:
            has_input = self.check_video_input()
            mediamtx_ready = self.is_mediamtx_running()

            if not (has_input and mediamtx_ready):
                print("NO INPUT", flush=True)
                if self.last_state != "NO INPUT":
                    self.kill_gstreamer_and_push()
                self.last_state = "NO INPUT"
            else:
                res, fps = self.get_video_params()
                print(f"Input detected: {res} @ {fps}fps")
                if self.last_state == "NO INPUT":
                    print(f"enter: {res} @ {fps}fps", flush=True)
                    self.start_push_script()
                self.last_state = "INPUT"

            time.sleep(2)


if __name__ == "__main__":
    manager = StreamManager()
    manager.run()
