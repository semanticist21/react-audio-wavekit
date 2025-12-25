import { pluginReact } from "@rsbuild/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import type { StorybookConfig } from "storybook-react-rsbuild";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  staticDirs: ["../public"],
  framework: {
    name: "storybook-react-rsbuild",
    options: {},
  },
  rsbuildFinal: (config) => {
    // React plugin for automatic JSX runtime
    config.plugins = [...(config.plugins || []), pluginReact()];

    // Tailwind CSS v4 via PostCSS
    config.tools = {
      ...config.tools,
      postcss: {
        postcssOptions: {
          plugins: [tailwindcss],
        },
      },
    };
    return config;
  },
};

export default config;
