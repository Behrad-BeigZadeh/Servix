/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/backend/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
