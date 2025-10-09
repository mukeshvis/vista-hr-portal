// Test leave application API
const testData = {
  empId: '078',
  empIdNum: 78,
  leavePolicyId: 1,
  companyId: 1,
  leaveType: 1, // Annual Leave
  leaveDayType: 1, // Full Day
  fromDate: '2025-10-10',
  toDate: '2025-10-12',
  numberOfDays: 3,
  halfDayType: '',
  halfDayDate: '',
  returnDate: '2025-10-12',
  reason: 'Test leave application',
  leaveAddress: 'Home',
  username: '078'
}

fetch('http://localhost:3002/api/leaves/applications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Response:', data)
  })
  .catch(err => {
    console.error('❌ Error:', err)
  })
