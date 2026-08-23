// Jest cannot parse CSS, and `@uiw/react-md-editor` imports its stylesheet as a
// side effect. Mapping stylesheets to this empty module is the same treatment
// the ESM-only packages above it get: the import exists for the browser bundle,
// and nothing in a test asserts on it.
export default {}
