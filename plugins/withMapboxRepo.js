const { withProjectBuildGradle } = require("@expo/config-plugins");

module.exports = function withMapboxRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{/,
        `allprojects {
    repositories {
        mavenCentral()
        google()
        maven { url 'https://api.mapbox.com/downloads/v2/releases/maven' }
        maven { url 'https://jitpack.io' }
    }`
      );
    }
    return config;
  });
};
