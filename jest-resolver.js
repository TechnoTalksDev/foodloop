// Custom Jest resolver to handle React Native imports
module.exports = (request, options) => {
  // Handle React Native imports that cause issues
  if (request === 'react-native') {
    return require.resolve('./jest-setup.ts');
  }
  
  // Use default resolver for everything else
  return require.resolve(request, {
    basedir: options.basedir,
  });
};
