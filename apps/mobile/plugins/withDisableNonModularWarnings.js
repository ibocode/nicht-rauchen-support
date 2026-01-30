const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin to fix "include of non-modular header inside framework module" error
 * 
 * This adds a post_install hook to the Podfile that disables the warning.
 */

const withPodfilePostInstall = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (!fs.existsSync(podfilePath)) {
        console.log('[withDisableNonModularWarnings] Podfile not found, skipping');
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, 'utf8');
      
      // Check if already applied
      if (podfile.includes('# NONMODULAR_FIX')) {
        console.log('[withDisableNonModularWarnings] Already applied');
        return config;
      }

      // The code to inject into post_install
      const fixCode = `
    # NONMODULAR_FIX
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        
        cflags = config.build_settings['OTHER_CFLAGS'] || ['$(inherited)']
        cflags = [cflags] if cflags.is_a?(String)
        ['-Wno-error=non-modular-include-in-framework-module', '-Wno-non-modular-include-in-framework-module', '-Wno-error'].each do |f|
          cflags << f unless cflags.include?(f)
        end
        config.build_settings['OTHER_CFLAGS'] = cflags
      end
    end
    
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
    end
`;

      // Find post_install block and inject our code
      if (podfile.includes('post_install do |installer|')) {
        // Insert after the post_install line
        podfile = podfile.replace(
          /(post_install do \|installer\|)/,
          `$1${fixCode}`
        );
      } else {
        // No post_install block, add one at the end before final 'end'
        podfile = podfile.replace(
          /(\nend\s*)$/,
          `\n  post_install do |installer|${fixCode}  end\n$1`
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      console.log('[withDisableNonModularWarnings] Podfile modified');
      
      return config;
    },
  ]);
};

const withXcodeSettings = (config) => {
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

module.exports = (config) => {
  config = withPodfilePostInstall(config);
  config = withXcodeSettings(config);
  return config;
};
