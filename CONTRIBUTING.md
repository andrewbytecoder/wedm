# How to contribute?

Wanna help out? That's absolutely awesome, thank you! :) We definitely appreciate all contributions. 
In order to contribute any code, please follow these steps: 

- Fork this project on [Github](https://github.com/andrewbytecoder/wedm)
- Implement your changes and then send us a pull request.

Additionally, please make sure the contribution guidelines below are observed, otherwise unfortunately we won't be able to accept your PR.

## Contribution guidelines

### 1. Environment Setup
This project is built with **Wails v2**, **Go**, **Vue 3**, and **TypeScript**. Ensure you have the following installed:
- Go 1.22+
- Node.js (LTS version recommended)
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 2. Development Workflow
Once your changes are ready:

- **Frontend Check**: Build the Vue frontend to ensure it compiles without errors:
```
npm run frontend:build
```

- **Code Style**: Your TypeScript and Vue code should follow sensible style consistent with the existing codebase (see also the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) as a general reference).

- **Testing**: End-to-end UI automation for the Wails shell is not wired up in this fork yet; please smoke-test your changes with `wails dev` and describe what you verified in the PR.
- **Accessibility**: All visible UI elements in templates shall have data-test attributes with uniqe string value. Tests use these atributes as selectors. Name conventions of attributes: name of component + ui operation + type of element. E.g.: data-test="config.settings-actions-submit.v-btn"

## Contributing translations

We would like to make this application available in as many languages as possible. The i18n support is already there, but we definitely need help with translations.

Here is how to help us:

- Clone the project
- Open **`frontend/src/i18n/locales/en.ts`** in your favorite text editor (or add a sibling locale module and register it in `frontend/src/i18n/`).
- Translate the strings and send a PR.

That's it!

