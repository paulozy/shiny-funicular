import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const baseConfig = {
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
