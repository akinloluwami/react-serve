# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-11-07

### Added

- **Opt-in body parsing**: Added `parseBody` prop to `App`, `RouteGroup`, and `Route` components
- Body parsing is now disabled by default for better control and performance
- Granular control over JSON body parsing at three levels:
  - Global level via `<App parseBody={true}>`
  - Group level via `<RouteGroup parseBody={true}>`
  - Route level via `<Route parseBody={true}>`
- Route-level settings override RouteGroup and App-level settings

### Changed

- **BREAKING**: Removed automatic `express.json()` middleware - body parsing must now be explicitly enabled
- Routes without `parseBody={true}` will have `req.body` as undefined

## [0.5.3] - 2025-08-19

### Fixed

- Fixed middleware execution bug where middlewares were collected but not actually executed
- Middleware functions (both single and arrays) now properly execute in sequence before route handlers
- Updated middleware chain to properly call `next()` function to continue execution

## [0.5.1] - 2025-08-19

### Added

- Support for all HTTP methods (POST, PUT, PATCH, DELETE, OPTIONS, HEAD) in addition to GET
- Unified request handler factory to reduce code duplication
- Improved response handling with `sendResponseFromOutput` function
- Better error handling for unsupported HTTP methods

### Fixed

- Routes with non-GET methods now work properly
- Enhanced middleware execution flow

## [0.5.0] - 2025-08-17

### Added

- Support for arrays of middleware functions in the `<Middleware>` component's `use` prop
- Updated documentation to reflect new functionality

## [0.4.0] - Previous version

Initial release features
