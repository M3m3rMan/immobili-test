const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for react-native-maps
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure web platform to exclude native-only modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;