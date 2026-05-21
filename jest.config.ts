import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const baseConfig = {
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // ESM-only packages get manual mocks (Jest's default ts-jest transform
    // can't parse ESM and the project doesn't configure transformIgnorePatterns).
    '^react-markdown$': '<rootDir>/__mocks__/react-markdown.tsx',
    '^remark-gfm$': '<rootDir>/__mocks__/remark-gfm.ts',
    // `server-only` throws unconditionally when imported outside a React Server
    // Components context. Under Jest there's no react-server condition, so we
    // mock it out — the build-time guarantee against client bundling still
    // holds via the real package in the production build.
    '^server-only$': '<rootDir>/__mocks__/server-only.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

const config: Config = {
  projects: [
    {
      ...baseConfig,
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/lib/**/*.test.ts'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { esModuleInterop: true, allowSyntheticDefaultImports: true } }],
      },
    },
    {
      ...baseConfig,
      displayName: 'components',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/components/**/*.test.tsx'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, allowSyntheticDefaultImports: true } }],
      },
    },
    {
      ...baseConfig,
      displayName: 'routes',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/app/api/**/*.test.ts', '<rootDir>/src/middleware.test.ts'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { esModuleInterop: true, allowSyntheticDefaultImports: true } }],
      },
    },
    {
      ...baseConfig,
      displayName: 'pages',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/app/(auth|app)/**/*.test.tsx'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, allowSyntheticDefaultImports: true } }],
      },
    },
  ],
}

export default config
