import subprocess
import re
def get_video_timings():
    global res, fps
    while True:
        result = subprocess.run(['v4l2-ctl', '-d', '/dev/v4l-subdev3', '--query-dv-timings'], stdout=subprocess.PIPE)
        output = result.stdout.decode()

        if "failed" in output:
            res = "NO  INPUT"
            fps = "XXXXX"
            print(res)
            print(fps)
            return False

        else:
            width = re.search(r"Active width: (\d+)", output).group(1)
            height = re.search(r"Active height: (\d+)", output).group(1)
            res = f"{width}x{height}"

            fps = re.search(r"(\d+\.\d+) frames per second", output).group(1)
            print(res)
            print(fps)
            return True
        time.sleep(1)
while True:
    print(get_video_timings())