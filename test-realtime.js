async function testRealtime() {
  const today = new Date()
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
  
  console.log('Testing real-time fetch for today:', dateStr, '\n')
  
  const response = await fetch('http://localhost:3000/api/attendance/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: dateStr,
      end_date: dateStr
    })
  })
  
  const result = await response.json()
  
  console.log('Response:')
  console.log('- Source:', result.source)
  console.log('- Count:', result.count)
  console.log('- Sample data:', result.data?.slice(0, 2))
}

testRealtime()
