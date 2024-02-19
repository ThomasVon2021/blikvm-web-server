## Table of Contents

- [1. Project Structure](#1-project-structure)
- [2. Call Hierarchy](#2-call-hierarchy)
- [3. Code Logic](#3-code-logic)
- [4. To-Do Items](#4-to-do-items)
- [5. Naming Conventions](#5-naming-conventions)
- [6. Commit Guidelines](#6-commit-guidelines)


## 1. Project Structure

The file and directory structure of the project is as follows:

- src: Source code
  - common: Common code
  - video_api: Video API
  - ws_api: Websocket API
  - http_api: HTTP API
  - http_server: HTTP server
  - log: Log
  - index.js: Startup program
- test: Test code
- lib: Dependency libraries
- doc: Documentation
- config: Configuration files
- scripts: Script files
- release: Release versions
- README.md: Project overview
- package.json: Project configuration

## 2. Call Hierarchy

The call hierarchy is divided into six layers, where upper layers can call lower layers, but lower layers cannot call upper layers.

| Layer | Contents |
|---------|---------|
| 1 | index.js |
| 2 | http_server |
| 3 | http_api, ws_api, video_api |
| 4 | log |
| 5 | common |
| 6 | lib, config |

## 3. Code Logic

(1) The core code consists of five objects: HTTP server object, HTTP API object, WebSocket API object, video stream API object, and log object.

(2) All five objects are implemented using the singleton design pattern to ensure uniqueness.

(3) The HTTP server object and log object start when the KVM is powered on.

(4) The HTTP API object, WebSocket API object, and video stream API object start only when the service is started.

(5) All APIs consist of three parts: key, one-time password, and specific request content.

## 4. To-Do Items

The following are the unfinished parts of the project and future development plans:

- [ ] Auto-startup solution
- [ ] Generate device code and key on startup
- [ ] Validate key and one-time password when requesting API
- [ ] Start service API and return one-time password
- [ ] Close service API and invalidate one-time password
- [ ] Keyboard API
- [ ] Mouse API
- [ ] Video API
- [ ] Remote power on/off API
- [ ] Adjust image resolution ratio
- [ ] Packaging

## 5. Naming Conventions

In programming, there are several common naming conventions:

Camel Case: The first word starts with a lowercase letter, and the first letter of each subsequent word is capitalized. Example: firstName.

Pascal Case: The first letter of each word is capitalized. Example: FirstName.

Snake Case: Words are connected with underscores (_), and all letters are lowercase. Example: first_name.

Kebab Case: Words are connected with hyphens (-), and all letters are lowercase. Example: first-name.

Constant Case: All letters are capitalized, and words are connected with underscores (_). Example: FIRST_NAME.

| Naming Content | Naming Convention | Example |
|--|--|--|
| Enum Type | Pascal Case | Direction |
| Enum Value | Constant Case | UP_LEFT |
| Constant | Constant Case | MATH_VALUE |
| Class | Pascal Case | HttpServer |
| Class Property | Camel Case with underscore prefix | _value |
| Class Getter/Setter | Camel Case | value |
| Class Private Method | Camel Case with underscore prefix | _test() |
| Class Public Method | Camel Case | test() |
| Class Private Static Property | Camel Case with underscore prefix | _value |
| Class Public Static Property | Camel Case | value |
| Class Private Static Method | Camel Case with underscore prefix | _test() |
| Class Public Static Method | Camel Case | test() |
| Global Variable | Camel Case | value |
| Local Variable | Camel Case | value |
| Function Name | Camel Case | runServer() |
| File Name | Snake Case | http_server.js |

## 6. Commit Guidelines

The recommended format is as follows:
```
<type>: <subject>
```
`type` is the change category, with the following options:

- `feature` or `feat`: new function
- `fix`: fix bug
- `docs`: Documentation changes
- `style`: format (changes that do not affect code operation)
- `refactor`: Refactoring (that is, code changes that are not new features or bug fixes)
- `test`: add test
- `merge`: code merge
- `revert`: roll back to a certain commit
- `build`: used to update build configurations, development tools, etc.
- `chore`: Miscellaneous, other non-functional changes

`subject` is a short description of the commit, which is recommended to be no more than 50 characters.
