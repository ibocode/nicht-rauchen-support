const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Simple plugin to set Xcode build settings that allow non-modular includes
 */
const withReactNativeFix = (config) => {
  return withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const configs = project.pbxXCBuildConfigurationSection();
    
    Object.keys(configs).forEach((key) => {
      if (typeof configs[key] !== 'object') return;
      const settings = configs[key].buildSettings;
      if (!settings) return;
      
      settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES';
      settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO';
    });
    
    return config;
  });
};

module.exports = withReactNativeFix;
