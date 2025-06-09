import subprocess
import re
import time
import psutil
import os
import threading


class StreamManager:
    def __init__(self):
        self.process = None
        self.output_thread = None
        self.last_state = "NO INPUT"

    def is_mediamtx_running(self):
        """检测mediamtx进程是否运行"""
        for proc in psutil.process_iter(['name', 'cmdline']):
            try:
                if 'mediamtx' in ' '.join(proc.info['cmdline'] or []):
                    return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        return False

    def output_reader(self, process):
        for line in iter(process.stdout.readline, ''):
            print("----------")
            print(line.strip(), flush=True)
            print("=============")

    def kill_gstreamer_and_push(self):
        """强制终止self.process及其所有子进程，包括gst-launch和push.py"""
        current_pid = os.getpid()

        # 1. 终止主进程及其进程树
        if self.process and hasattr(self.process, 'pid'):
            try:
                parent = psutil.Process(self.process.pid)
                # 先终止所有子进程（深度优先）
                for child in parent.children(recursive=True):
                    try:
                        if child.pid != current_pid:
                            child.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
                # 终止主进程
                if parent.pid != current_pid:
                    parent.kill()
            except psutil.NoSuchProcess:
                pass

        # 2. 补充清理残留进程（防御性处理）
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or [])
                if ('gst-launch' in cmdline or 'push.py' in cmdline) and proc.info['pid'] != current_pid:
                    try:
                        proc.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        continue
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # 终止本地线程
        if self.output_thread and self.output_thread.is_alive():
            self.output_thread.join(timeout=1.0)
            if self.output_thread.is_alive():
                print("Warning: Output thread not terminated properly", flush=True)

    def start_push_script(self):
        """启动推流脚本"""
        self.process = subprocess.Popen(
            ['python3', './lib/rk3566/push.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        print("Started push.py", flush=True)
        self.output_thread = threading.Thread(
            target=self.output_reader,
            args=(self.process,)
        )
        self.output_thread.start()
        print("Started push.py end", flush=True)

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
