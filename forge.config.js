const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "assets/app",
    executableName: "toolkit-engine",
    appCopyright: "Copyright © 2025 VIS Solutions.",
    ignore: [/node_modules\/(?!(better-sqlite3|bindings|file-uri-to-path)\/)/],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        productName: "GNT Toolkit Engine",
        executableName: "toolkit-engine",
        setupIcon: "assets/app.ico",
        iconUrl: "https://raw.githubusercontent.com/meokisama/toolkit-engine/refs/heads/master/assets/app.ico",
        authors: "VIS Solutions",
        description: "Professional automation and control toolkit",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          icon: "assets/app.png",
          productName: "GNT Toolkit Engine",
          executableName: "toolkit-engine",
          maintainer: "VIS Solutions",
          description: "Professional automation and control toolkit",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          productName: "GNT Toolkit Engine",
          executableName: "toolkit-engine",
          maintainer: "VIS Solutions",
          description: "Professional automation and control toolkit",
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    {
      name: "@electron-forge/plugin-vite",
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: "src/main.js",
            config: "vite.main.config.mjs",
            target: "main",
          },
          {
            entry: "src/preload.js",
            config: "vite.preload.config.mjs",
            target: "preload",
          },
        ],
        renderer: [
          {
            name: "main_window",
            config: "vite.renderer.config.mjs",
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
