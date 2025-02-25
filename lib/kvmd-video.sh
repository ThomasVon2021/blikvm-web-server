#!/bin/bash

# Define board type names
pi4b_board="Raspberry Pi 4 Model B"
cm4b_board="Raspberry Pi Compute Module 4"
h616_board="MangoPi Mcore"
rk3566_board="Rockchip RK3566 Orange Pi CM4 Board"


# Define board type values
v2_hat="V2_HAT"
v3_pcie="V3_PCIE"
v4_h616="V4_H616"
v5_rk3566="V5_RK3566"
unknown="UNKNOWN"

# Function to execute a command and return the output
exec_cmd() {
  output=$(eval "$1")
  echo "$output"
}

# Function to get the board type
get_board_type() {
  if [[ $(exec_cmd "tr -d '\0' < /proc/device-tree/model") == *"$pi4b_board"* ]] ; then
    type=$v2_hat
  elif [[ $(exec_cmd "tr -d '\0' < /proc/device-tree/model") == *"$cm4b_board"* ]] ; then
    type=$v3_pcie
  elif [[ $(exec_cmd "tr -d '\0' < /proc/device-tree/model") == *"$h616_board"* ]] ; then
    type=$v4_h616
  elif [[ $(exec_cmd "tr -d '\0' < /proc/device-tree/model") == *"$rk3566_board"* ]] ; then
    type=$V5_RK3566
  else
    type=$unknown
    exit 1
  fi
  echo "$type"
}

# Get the board type
board_type=$(get_board_type)
echo "Board type: $board_type"

# Check if the number of command line arguments is not equal to 2
if [ "$#" -ne 7 ]; then
  echo "Usage: $0 <video_bin_path> <port> <fps> <quality> <kbps> <gop> <resolution>"
  exit 1
fi

# Set the path to the ustreamer binary and the port number
video_bin=$1
port=$2
fps=$3
quality=$4
kbps=$5
gop=$6
resolution=$7
ustreamer_pid=""

# Function to clean up the process
cleanup() {
  echo "Cleaning up... Signal received: $1"
  kill $ustreamer_pid
  exit 0
}

# Trap the SIGINT and SIGTERM signals and call the cleanup function
trap "cleanup" SIGINT SIGTERM

# Wait for the network to be up
str1="UP"
while (true)
do
    result=$(ifconfig lo | grep "${str1}")
    if [[ "$result" != "" ]]
    then
        echo "network ok"
        sleep 1
        break
    else
        sleep 1
        echo "network not ok"
    fi
done

# Wait for the video device to be ready
# sleep 5

# Start the ustreamer process based on the board type
if [[ "$board_type" == "$v2_hat" ]] || [[ "$board_type" == "$v3_pcie" ]]; then
    if [ -f "/mnt/exec/release/lib/edid.txt" ]; then
        v4l2-ctl --set-edid=file=/mnt/exec/release/lib/edid.txt --fix-edid-checksums
    elif [ -f "./lib/edid" ]; then
        v4l2-ctl --set-edid=file=./lib/edid.txt --fix-edid-checksums
    else
        echo "no edid"
    fi
    v4l2-ctl --set-dv-bt-timings query
    $video_bin --device=/dev/video0 --host=0.0.0.0 --port=$port --persistent --dv-timings --format=uyvy --encoder=omx --workers=3 --quality=$quality --desired-fps=$fps --h264-bitrate=$kbps --h264-gop=$gop  --drop-same-frames=30 --last-as-blank=0 --h264-sink=demo::ustreamer::h264 &
    ustreamer_pid=$!
elif [[ "$board_type" == "$v4_h616" ]]; then
  jpeg_supported_device=""
  for device in /dev/video*; do
    if v4l2-ctl --list-formats-ext -d "$device" | grep -q "JPEG"; then
        jpeg_supported_device="$device"
        break
    fi
  done
  if [ -n "$jpeg_supported_device" ]; then
      echo "find support JPEG video divice: $jpeg_supported_device"
      $video_bin --format=MJPEG --device=$jpeg_supported_device --resolution=$resolution --host=0.0.0.0 --port=$port --drop-same-frames=30 --desired-fps=$fps --quality=$quality &
      ustreamer_pid=$!
  else
      echo "not find JPEG video device, use video1"
      $video_bin --format=MJPEG --device=/dev/video1 --resolution=1920x1080 --host=0.0.0.0 --port=$port --drop-same-frames=30 &
      ustreamer_pid=$!
  fi
elif [[ "$board_type" == "$v5_rk3566" ]]; then 
  SCRIPT_DIR=$(dirname "$(realpath "$0")")
  SCRIPT_DIR/rk3566/mediamtx SCRIPT_DIR/rk3566/mediamtx.yml &
  su - orangepi -c "python3 $video_bin" &
else
  echo "Unknown board type. No action performed."
fi

# Wait for the ustreamer process to finish
wait $ustreamer_pid
