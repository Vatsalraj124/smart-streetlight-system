import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_URL = 'http://localhost:5000/api';

const testReports = async () => {
  console.log('🧪 Testing Report System...\n');
  
  let token;
  
  try {
    // Login first
    console.log('1️⃣ Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    token = loginRes.data.token;
    console.log('✅ Login successful');
    
    // Test 2: Create Report
    console.log('\n2️⃣ Creating Report...');
    
    const formData = new FormData();
    formData.append('title', 'Test Streetlight Fault');
    formData.append('description', 'This is a test report for a faulty streetlight');
    formData.append('latitude', '19.0760');
    formData.append('longitude', '72.8777');
    formData.append('lightCondition', 'not_working');
    formData.append('severity', 'medium');
    formData.append('city', 'Mumbai');
    formData.append('pincode', '400001');
    
    // Add a test image if available
    if (fs.existsSync('./test-image.jpg')) {
      formData.append('images', fs.createReadStream('./test-image.jpg'));
    }
    
    const reportRes = await axios.post(`${API_URL}/reports`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Report created:', reportRes.data.message);
    const reportId = reportRes.data.data.report._id;
    
    // Test 3: Get All Reports
    console.log('\n3️⃣ Getting All Reports...');
    const allReportsRes = await axios.get(`${API_URL}/reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Reports retrieved:', allReportsRes.data.results, 'reports found');
    
    // Test 4: Get Single Report
    console.log('\n4️⃣ Getting Single Report...');
    const singleReportRes = await axios.get(`${API_URL}/reports/${reportId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Report retrieved:', singleReportRes.data.data.report.title);
    
    // Test 5: Get Nearby Reports
    console.log('\n5️⃣ Getting Nearby Reports...');
    const nearbyRes = await axios.get(`${API_URL}/reports/nearby`, {
      params: { lat: '19.0760', lng: '72.8777', radius: 1000 }
    });
    
    console.log('✅ Nearby reports:', nearbyRes.data.results, 'reports found');
    
    console.log('\n🎉 All report tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testReports();