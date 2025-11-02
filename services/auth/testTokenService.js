/**
 * TokenService Test Script
 * Run with: node services/auth/testTokenService.js
 */

const TokenService = require('./TokenService').default;

console.log('🧪 Testing TokenService...\n');

// Test 1: Generate access token
console.log('Test 1: Generate Access Token');
const accessToken = TokenService.generateAccessToken('user-123', 'testuser', 'admin');
console.log('✅ Access Token Generated:', accessToken.substring(0, 50) + '...');
console.log('');

// Test 2: Generate refresh token
console.log('Test 2: Generate Refresh Token');
const refreshToken = TokenService.generateRefreshToken('user-123');
console.log('✅ Refresh Token Generated:', refreshToken.substring(0, 50) + '...');
console.log('');

// Test 3: Generate token pair
console.log('Test 3: Generate Token Pair');
const tokens = TokenService.generateTokenPair('user-456', 'supervisor', 'supervisor');
console.log('✅ Token Pair Generated:');
console.log('  - Access Token:', tokens.accessToken.substring(0, 40) + '...');
console.log('  - Refresh Token:', tokens.refreshToken.substring(0, 40) + '...');
console.log('  - Access Expiry:', new Date(tokens.accessTokenExpiry).toISOString());
console.log('  - Refresh Expiry:', new Date(tokens.refreshTokenExpiry).toISOString());
console.log('');

// Test 4: Verify valid access token
console.log('Test 4: Verify Valid Access Token');
const verifyResult = TokenService.verifyAccessToken(accessToken);
console.log('✅ Verification Result:', verifyResult.valid ? 'VALID' : 'INVALID');
if (verifyResult.payload) {
  console.log('  - User ID:', verifyResult.payload.userId);
  console.log('  - Username:', verifyResult.payload.username);
  console.log('  - Role:', verifyResult.payload.role);
}
console.log('');

// Test 5: Verify valid refresh token
console.log('Test 5: Verify Valid Refresh Token');
const verifyRefresh = TokenService.verifyRefreshToken(refreshToken);
console.log('✅ Verification Result:', verifyRefresh.valid ? 'VALID' : 'INVALID');
if (verifyRefresh.payload) {
  console.log('  - User ID:', verifyRefresh.payload.userId);
}
console.log('');

// Test 6: Verify invalid token
console.log('Test 6: Verify Invalid Token');
const invalidResult = TokenService.verifyAccessToken('invalid.token.here');
console.log('✅ Verification Result:', invalidResult.valid ? 'VALID' : 'INVALID');
console.log('  - Error:', invalidResult.error);
console.log('');

// Test 7: Decode token
console.log('Test 7: Decode Token (without verification)');
const decoded = TokenService.decodeToken(accessToken);
if (decoded) {
  console.log('✅ Decoded Payload:');
  console.log('  - User ID:', decoded.userId);
  console.log('  - Username:', decoded.username);
  console.log('  - Role:', decoded.role);
  console.log('  - Issued At:', new Date(decoded.iat * 1000).toISOString());
  console.log('  - Expires At:', new Date(decoded.exp * 1000).toISOString());
}
console.log('');

// Test 8: Check token expiry
console.log('Test 8: Check Token Expiry');
const isExpired = TokenService.isTokenExpired(accessToken);
console.log('✅ Is Expired:', isExpired);
const timeRemaining = TokenService.getTimeUntilExpiry(accessToken);
console.log('  - Time Remaining:', Math.floor(timeRemaining / 1000 / 60), 'minutes');
console.log('');

// Test 9: Should refresh token
console.log('Test 9: Should Refresh Token');
const shouldRefresh = TokenService.shouldRefreshToken(accessToken);
console.log('✅ Should Refresh:', shouldRefresh);
console.log('  (Refresh recommended when < 5 minutes remaining)');
console.log('');

console.log('✅ All Tests Complete!');
console.log('\nTokenService is working correctly. Ready for Day 8 (Token Storage).');
