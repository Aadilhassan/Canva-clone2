import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@nkyo/scenify-sdk',
    'baseui',
    'styletron-react',
    'styletron-engine-atomic'
  ]
})
