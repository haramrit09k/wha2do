import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vite';

const root = path.resolve(__dirname, '..');
const here = __dirname;
const rootModules = path.join(root, 'node_modules');

// Turn the `require('./x.jpg')` calls that Metro understands into ES imports.
const wha2doPlugin = () => ({
  name: 'wha2do-preview',
  enforce: 'pre',
  transform(code, id) {
    if (!id.startsWith(path.join(root, 'src')) || !/require\(['"]/.test(code)) {
      return null;
    }
    const imports = [];
    const out = code.replace(
      /require\((['"])([^'"]+\.(?:png|jpe?g))\1\)/g,
      (_, q, p) => {
        const name = `__asset${imports.length}`;
        imports.push(
          `import ${name} from ${JSON.stringify(
            path.resolve(path.dirname(id), p),
          )};`,
        );
        return name;
      },
    );
    return { code: `${imports.join('\n')}\n${out}`, map: null };
  },
  configureServer(server) {
    server.middlewares.use('/fonts/MaterialCommunityIcons.ttf', (req, res) => {
      res.setHeader('Content-Type', 'font/ttf');
      res.end(
        fs.readFileSync(
          path.join(
            rootModules,
            'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf',
          ),
        ),
      );
    });
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'fonts/MaterialCommunityIcons.ttf',
      source: fs.readFileSync(
        path.join(
          rootModules,
          'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf',
        ),
      ),
    });
  },
});

export default defineConfig({
  root: here,
  base: './',
  plugins: [wha2doPlugin()],
  define: { __DEV__: 'false', global: 'window' },
  server: { fs: { allow: [root] } },
  resolve: {
    alias: [
      {
        find: /^react-native$/,
        replacement: path.join(here, 'node_modules/react-native-web'),
      },
      { find: /^react$/, replacement: path.join(here, 'node_modules/react') },
      {
        find: /^react-dom$/,
        replacement: path.join(here, 'node_modules/react-dom'),
      },
      {
        find: /^react-native-web$/,
        replacement: path.join(here, 'node_modules/react-native-web'),
      },
      // Firebase and AsyncStorage are swapped for in-memory stand-ins (preview/mock).
      { find: /^firebase\/app$/, replacement: path.join(here, 'mock/app.js') },
      {
        find: /^firebase\/auth$/,
        replacement: path.join(here, 'mock/auth.js'),
      },
      {
        find: /^firebase\/database$/,
        replacement: path.join(here, 'mock/database.js'),
      },
      {
        find: /^@react-native-async-storage\/async-storage$/,
        replacement: path.join(here, 'stubs/async-storage.js'),
      },
      {
        find: /^react-native-vector-icons\/MaterialCommunityIcons$/,
        replacement: path.join(here, 'stubs/MaterialCommunityIcons.js'),
      },
      {
        find: /^@react-native-community\/datetimepicker$/,
        replacement: path.join(here, 'stubs/datetimepicker.js'),
      },
    ],
    extensions: ['.web.js', '.mjs', '.js', '.jsx', '.json'],
  },
  esbuild: {
    loader: 'jsx',
    include: /(src|App|main|stubs|mock).*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
      resolveExtensions: ['.web.js', '.js', '.jsx', '.json', '.mjs'],
    },
  },
  build: {
    outDir: path.join(here, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // react-native-web and safe-area-context ship "use client" directives that the
      // bundler ignores; that is harmless, so keep the build log quiet.
      onwarn(warning, warn) {
        if (
          warning.code !== 'MODULE_LEVEL_DIRECTIVE' &&
          warning.code !== 'SOURCEMAP_ERROR'
        ) {
          warn(warning);
        }
      },
    },
  },
});
