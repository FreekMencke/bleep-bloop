module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: [".eslintrc.js"],
  rules: {
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
      },
    ],
    "@typescript-eslint/quotes": [
      "error",
      "single",
      {
        avoidEscape: true,
      },
    ],
    "@typescript-eslint/semi": ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "max-classes-per-file": "off",
    "no-console": "error",
    "no-multiple-empty-lines": ["error", { max: 1 }],
    "no-redeclare": "error",
    "no-return-await": "error",
    "prefer-const": "error",
  },
};
