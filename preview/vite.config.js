import path from 'node:path';
import fs from 'node:fs';
import {defineConfig} from 'vite';

const root = path.resolve(__dirname, '..');
const here = __dirname;
const rootModules = path.join(root, 'node_modules');

// Swap the real Firebase module for the in-memory mock, and turn the
// `require('./x.jpg')` calls that Metro understands into ES imports.
const wha2doPlugin = () => ({
  name: 'wha2do-preview',
  enforce: 'pre',
  resolveId(id, importer) {
    if (
      importer &&
      importer.endsWith(path.join('src', 'api.js')) &&
      id === './firebase'
    ) {
      return path.join(here, 'mockFirebase.js');
    }
    return null;
  },
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
    return {code: `${imports.join('\n')}\n${out}`, map: null};
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
  plugins: [wha2doPlugin()],
  define: {__DEV__: 'false', global: 'window'},
  server: {fs: {allow: [root]}},
  resolve: {
    alias: [
      {
        find: /^react-native$/,
        replacement: path.join(here, 'node_modules/react-native-web'),
      },
      {find: /^react$/, replacement: path.join(here, 'node_modules/react')},
      {
        find: /^react-dom$/,
        replacement: path.join(here, 'node_modules/react-dom'),
      },
      {
        find: /^react-native-web$/,
        replacement: path.join(here, 'node_modules/react-native-web'),
      },
      {
        find: /^react-native-gesture-handler$/,
        replacement: path.join(here, 'stubs/empty.js'),
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
    include: /(src|App|main|stubs|mockFirebase).*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {'.js': 'jsx'},
      resolveExtensions: ['.web.js', '.js', '.jsx', '.json', '.mjs'],
    },
  },
  build: {outDir: path.join(here, 'dist'), emptyOutDir: true},
});
