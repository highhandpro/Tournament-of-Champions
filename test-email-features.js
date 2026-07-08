// Test script for email features
// Run with: node test-email-features.js

const { getJoinRequestEmail, getApprovalEmail, getDenialEmail } = require('./lib/email.ts');

async function testEmailFeatures() {
  console.log('Testing email features...');
  
  // Test data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com'
  };
  
  const testEvent = {
    title: 'Poker Tournament',
    dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    location: 'Poker Club HQ'
  };

  try {
    console.log('1. Testing join request email...');
    const joinRequestEmail = getJoinRequestEmail(testUser.firstName, testUser.email);
    console.log('Join request email created:', joinRequestEmail.subject);
    
    console.log('2. Testing approval email...');
    const approvalEmail = getApprovalEmail(testUser.firstName, testUser.email);
    console.log('Approval email created:', approvalEmail.subject);
    
    console.log('3. Testing denial email...');
    const denialEmail = getDenialEmail(testUser.firstName, testUser.email);
    console.log('Denial email created:', denialEmail.subject);
    
    console.log('✅ All email templates created successfully!');
    
    // Note: Actual email sending is disabled in test mode to avoid spam
    // Uncomment the lines below to test actual email sending
    
    // console.log('5. Testing actual email sending...');
    // const emailSent = await sendEmail(joinRequestEmail);
    // console.log('Email sent:', emailSent);
    
  } catch (error) {
    console.error('❌ Error testing email features:', error);
  }
}

// Run the test
testEmailFeatures();