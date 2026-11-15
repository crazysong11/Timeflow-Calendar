# Timeflow Calendar

[项目首页 / Project home](https://github.com/crazysong11/Timeflow-Calendar#readme)

A continuous timeline calendar for Windows. Start planning from this moment.

## About

Timeflow Calendar places your schedule on a timeline you can drag left and right. Hours provide a scale, dates provide context, and 11 PM today sits naturally next to midnight tomorrow.

The idea comes from an everyday experience: once half the morning has passed, the remaining time can feel less worth using because the whole block is no longer intact. Timeflow Calendar aims to make the time ahead clearly visible through a continuous view, helping you start whenever you are ready.

## Core design

The following features will take shape through the development roadmap:

- **Continuous timeline**: drag through time with a consistent scale and layout across midnight.
- **Hourly markers**: use hours as a visual reference while scheduling within or across them.
- **Date headers**: see which date each part of the timeline belongs to, including when browsing across days.
- **Flexible scheduling**: start at any time and keep events that cross midnight together.
- **Focus on now**: locate the current moment with a time marker and a “Back to now” action.
- **Local storage**: keep your schedule on your computer for everyday use.

## Project status

The technology stack and desktop foundation are in place, and the app currently opens a welcome screen. The next milestone is an interactive timeline prototype to explore continuous navigation, date transitions, and event layouts.

## Technology stack

- **Desktop application**: Tauri 2 + Rust
- **Interface and interactions**: React + TypeScript + CSS
- **Development and builds**: Vite + npm
- **Local storage**: SQLite + the Tauri SQL plugin

## Local development

Install Node.js 24 LTS, the Rust MSVC toolchain, Microsoft C++ Build Tools, and WebView2. See the [Windows development guide](docs/development.md) (Chinese) for setup details. From the project root, run:

```powershell
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

Common commands:

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Preview the frontend in a browser |
| `npm.cmd run desktop:dev` | Start Windows desktop development mode |
| `npm.cmd run build` | Check TypeScript and build the frontend |
| `npm.cmd run desktop:build` | Build the Windows application and installer |

For system proxy configuration, see the dependency management section of the development guide.

## Roadmap

- [x] Define the basic requirements and use cases
- [ ] Design the main interface and timeline interactions
- [x] Choose the technology stack
- [x] Set up the development environment and desktop project
- [ ] Build an interactive prototype
- [ ] Implement the continuous timeline, hourly markers, and date headers
- [ ] Add event creation, editing, deletion, and display across midnight
- [ ] Add current-time navigation and local persistence
- [ ] Validate everyday use and publish the first Windows release

## Documentation

The project documentation is currently available in Chinese:

- [Requirements and acceptance scenarios](docs/requirements.md)
- [Technical design](docs/technical-design.md)
- [Windows development guide](docs/development.md)

## Contributing

Ideas about timeline interactions, use cases, and feature design are welcome. Use [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues) to report problems or discuss ideas, and [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls) to contribute improvements.

For bug reports, include reproduction steps, expected behavior, and actual behavior. For feature suggestions, describe the use case and the problem you want to solve.

## License

An open-source license will be selected before the first release and published in the repository's root `LICENSE` file.
