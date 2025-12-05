const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const diagnoseIssues = async () => {
  console.log('🔍 Diagnosing CRUD Issues...\n');

  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    try {
      const response = await axios.get(`${API_URL}/categories`);
      console.log('✅ Basic connectivity working');
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response data type: ${typeof response.data}`);
      console.log(`   Response data length: ${Array.isArray(response.data) ? response.data.length : 'Not an array'}`);
    } catch (error) {
      console.log('❌ Basic connectivity failed:', error.message);
      return;
    }

    // Test admin categories endpoint
    console.log('\n2. Testing admin categories endpoint...');
    try {
      const response = await axios.get(`${API_URL}/categories/admin`);
      console.log('✅ Admin categories endpoint working');
      console.log(`   Found ${response.data.length} categories`);
      if (response.data.length > 0) {
        console.log(`   First category: ${response.data[0].name}`);
      }
    } catch (error) {
      console.log('❌ Admin categories endpoint failed:', error.response?.data || error.message);
    }

    // Test admin subcategories endpoint
    console.log('\n3. Testing admin subcategories endpoint...');
    try {
      const response = await axios.get(`${API_URL}/subcategories/admin`);
      console.log('✅ Admin subcategories endpoint working');
      console.log(`   Found ${response.data.length} subcategories`);
      if (response.data.length > 0) {
        console.log(`   First subcategory: ${response.data[0].name}`);
      }
    } catch (error) {
      console.log('❌ Admin subcategories endpoint failed:', error.response?.data || error.message);
    }

    // Test create category
    console.log('\n4. Testing create category...');
    try {
      const testCategory = {
        name: 'Diagnostic Test Category',
        slug: 'diagnostic-test-category',
        description: 'Category created during diagnosis',
        is_active: true
      };
      const response = await axios.post(`${API_URL}/admin/categories`, testCategory);
      console.log('✅ Create category working');
      console.log(`   Created category ID: ${response.data.id}`);
      
      // Clean up - delete the test category
      await axios.delete(`${API_URL}/admin/categories/${response.data.id}`);
      console.log('   Test category cleaned up');
    } catch (error) {
      console.log('❌ Create category failed:', error.response?.data || error.message);
    }

    // Test create subcategory
    console.log('\n5. Testing create subcategory...');
    try {
      // Get a category first
      const categoriesResponse = await axios.get(`${API_URL}/categories/admin`);
      if (categoriesResponse.data.length > 0) {
        const testSubcategory = {
          name: 'Diagnostic Test Subcategory',
          slug: 'diagnostic-test-subcategory',
          description: 'Subcategory created during diagnosis',
          category_id: categoriesResponse.data[0].id,
          is_active: true
        };
        const response = await axios.post(`${API_URL}/admin/subcategories`, testSubcategory);
        console.log('✅ Create subcategory working');
        console.log(`   Created subcategory ID: ${response.data.id}`);
        
        // Clean up - delete the test subcategory
        await axios.delete(`${API_URL}/admin/subcategories/${response.data.id}`);
        console.log('   Test subcategory cleaned up');
      } else {
        console.log('⚠️ No categories found, cannot test subcategory creation');
      }
    } catch (error) {
      console.log('❌ Create subcategory failed:', error.response?.data || error.message);
    }

    // Test frontend API endpoints
    console.log('\n6. Testing frontend API endpoints...');
    try {
      // Test categories API
      const categoriesResponse = await axios.get(`${API_URL}/categories/admin`);
      console.log('✅ Frontend categories API working');
      
      // Test subcategories API
      const subcategoriesResponse = await axios.get(`${API_URL}/subcategories/admin`);
      console.log('✅ Frontend subcategories API working');
    } catch (error) {
      console.log('❌ Frontend API endpoints failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ General error:', error.message);
  }

  console.log('\n🏁 Diagnosis completed!');
  console.log('\nIf all tests passed, the issue might be in the frontend.');
  console.log('If some tests failed, the issue is in the backend.');
};

// Run the diagnosis
diagnoseIssues();
