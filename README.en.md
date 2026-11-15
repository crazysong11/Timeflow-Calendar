# Timeflow Calendar

[项目首页 / Project home](https://github.com/crazysong11/Timeflow-Calendar#readme)

A continuous timeline calendar for Windows. Start planning from this moment.

## The idea

Timeflow Calendar explores a continuous view of your schedule: 23:00 today sits naturally next to 00:00 tomorrow. Even when part of the morning has passed, the time ahead is still yours to use.

The design centers on three ideas:

- **Browse time continuously.** Drag or scroll left and right, with evenly spaced hourly markers across midnight.
- **Schedule at any time.** Place events within an hour or across several hours, keeping events that span midnight together.
- **Keep dates in view.** Date headers show which day each part of the timeline belongs to.

## Current status

Timeflow Calendar is in early development. The Windows app currently opens a welcome screen; the timeline and scheduling features described above are planned. The next step is an interactive prototype to explore navigation, date headers, and event layouts.

## Run from source

Set up the prerequisites using the [Windows development guide](docs/development.md) (Chinese), then run these commands in PowerShell:

```powershell
git clone https://github.com/crazysong11/Timeflow-Calendar.git
cd Timeflow-Calendar
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

The development guide also covers frontend previews, builds, and dependency setup.

## Documentation and contributing

Project documentation is currently available in Chinese:

- [Requirements and use cases](docs/requirements.md)
- [Technical design](docs/technical-design.md)
- [Windows development guide](docs/development.md)

Share use cases, interaction ideas, and bug reports through [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues). Contributions to code, documentation, and translations are welcome through [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls).

For bug reports, include reproduction steps and the expected and actual behavior. For feature suggestions, describe the situation in which you would use them.

## License

License selection is pending. The chosen license will be published in the repository's root `LICENSE` file before the first release.
