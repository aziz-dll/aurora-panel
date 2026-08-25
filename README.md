# aurora-panel

![GitHub stars](https://img.shields.io/github/stars/aziz-dll/aurora-panel?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/aziz-dll/aurora-panel?style=for-the-badge&logo=github) ![GitHub issues](https://img.shields.io/github/issues/aziz-dll/aurora-panel?style=for-the-badge&logo=github) ![Last commit](https://img.shields.io/github/last-commit/aziz-dll/aurora-panel?style=for-the-badge&logo=github)

## 📑 Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Key Dependencies](#key-dependencies)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Contributors](#contributors)
- [Contributing](#contributing)

## 📝 Description

aurora-panel — a mobile app built with Android (Native), Java (Gradle), React, Tailwind CSS, TypeScript, Vite.

## 🛠️ Tech Stack

![Android (Native)](https://img.shields.io/badge/Android%20(Native)-3DDC84?style=for-the-badge&logo=android&logoColor=white) ![Java (Gradle)](https://img.shields.io/badge/Java%20(Gradle)-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ⚡ Quick Start

```bash

# 1. Clone the repository
git clone https://github.com/aziz-dll/aurora-panel.git

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

## 📦 Key Dependencies

```
@capacitor/android: ^8.5.0
@capacitor/core: ^8.5.0
@capacitor/local-notifications: ^8.3.1
@fontsource-variable/bricolage-grotesque: ^5.3.0
date-fns: ^4.4.0
react: ^19.2.8
react-dom: ^19.2.8
```

## 🚀 Available Scripts

- **dev** — `npm run dev`
- **build** — `npm run build`
- **lint** — `npm run lint`
- **preview** — `npm run preview`
- **start** — `npm run start`
- **start:termux** — `npm run start:termux`
- **apk** — `npm run apk`
- **pack** — `npm run pack`

## 📁 Project Structure

```
.
├── apk-loader
│   ├── aurora.svg
│   └── index.html
├── aurora_app_icon_final_playfair.svg
├── capacitor.config.ts
├── index.html
├── package.json
├── public
│   ├── aurora.svg
│   ├── favicon.png
│   └── icons.svg
├── scripts
│   └── build-apk.sh
├── server.mjs
├── src
│   ├── App.tsx
│   ├── components
│   │   ├── Dialog.tsx
│   │   ├── Page.tsx
│   │   ├── Sidebar.tsx
│   │   └── TermuxBadge.tsx
│   ├── index.css
│   ├── lib
│   │   ├── actions.ts
│   │   ├── fitness.ts
│   │   ├── icons.tsx
│   │   ├── nav.ts
│   │   ├── reminders.ts
│   │   ├── serverBattery.ts
│   │   ├── store.ts
│   │   ├── termux.ts
│   │   ├── types.ts
│   │   ├── useTermuxStatus.ts
│   │   └── utils.ts
│   ├── main.tsx
│   └── pages
│       ├── Dashboard.tsx
│       ├── Files.tsx
│       ├── Fitness.tsx
│       ├── Notes.tsx
│       ├── Schedule.tsx
│       ├── Settings.tsx
│       ├── Student.tsx
│       └── Todos.tsx
├── start.sh
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 🛠️ Development Setup

### Node.js / JavaScript
1. Install Node.js (v18+ recommended)
2. Install dependencies: `npm install` (or `yarn` / `pnpm install` / `bun install`)
3. Start the dev server: see the **Quick Start** above

## 👥 Contributors

Thanks to everyone who has contributed to this project:

<p align="left">
<a href="https://github.com/aziz-dll" title="aziz-dll"><img src="https://avatars.githubusercontent.com/u/194628751?v=4&s=64" width="64" height="64" alt="aziz-dll" style="border-radius:50%" /></a>
</p>

[See the full list of contributors →](https://github.com/aziz-dll/aurora-panel/graphs/contributors)

## 👥 Contributing

Contributions are welcome! Here's the standard flow:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/aziz-dll/aurora-panel.git`
3. **Branch**: `git checkout -b feature/your-feature`
4. **Commit**: `git commit -m 'feat: add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open** a pull request

Please follow the existing code style and include tests for new behavior where applicable.

---

<div align="center">

[![Made with ReadmeBuddy](https://img.shields.io/badge/Made%20with-ReadmeBuddy-8B5CFF?style=for-the-badge&logo=markdown&logoColor=white)](https://readmebuddy.com)

<sub>Generate beautiful READMEs in seconds → <a href="https://readmebuddy.com">readmebuddy.com</a></sub>

</div>
