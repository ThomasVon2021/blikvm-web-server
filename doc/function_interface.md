
## 1. index.js

## 2. http_server

| http_server.js| | | | |
|---------|---------|---------|---------|---------|
| class | HttpServer | properties|  state| Service State |
| class | HttpServer | methods|  construct| Constructor |
|       |        |        |  startService    | Start Service |
|       |        |        |  closeService    | Close Service |

## 3. http_api,ws_api,video_api

### 3.1 http_api

| http_api.js| | | | |
|---------|---------|---------|---------|---------|
| class | HttpApi | methods|  construct| Constructor |
|       |        |        |  startService    | Start Service |
|       |        |        |  closeService    | Close Service |

### 3.2 ws_api

| ws_api.js| | | | |
|---------|---------|---------|---------|---------|
| class | WebSocketApi | methods|  construct| Constructor |
|       |        |        |  startService    | Start Service |
|       |        |        |  closeService    | Close Service |

### 3.3 video_api

| video_api.js| | | | |
|---------|---------|---------|---------|---------|
| class | VideoApi | methods|  construct| Constructor |
|       |        |        |  startService    | Start Service |
|       |        |        |  closeService    | Close Service |

## 4. log

| logger.js| | | | |
|---------|---------|---------|---------|---------|
| class | Logger | methods|  construct| Constructor |
|       |        |        |  trace    | Print logs with TRACE level |
|       |        |        |  debug    | Print logs with DEBUG level |
|       |        |        |  info    | Print logs with INFO level |
|       |        |        |  warn    | Print logs with WARN level |
|       |        |        |  error    | Print logs with ERROR level |
|       |        |        |  fatal    | Print logs with FATAL level | 

## 5. common

| tool.js| | | | |
|---------|---------|---------|---------|---------|
| function | createDir | | | Create directory |
| function | createFile | | | Create file |
| function | existDir | | | Determine whether directory exists |
| function | existFile | | | Determine file Is there |
| function | generateUniqueCode | | | Generate unique code|
| function | generateSecret | | | Generate key |

## 6. lib,config