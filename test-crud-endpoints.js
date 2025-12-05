const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testEndpoints = async () => {
  console.log('🧪 Testing CRUD endpoints...\n');

  try {
    // Test 1: Get categories
    console.log('1. Testing GET /api/categories/admin');
    try {
      const response = await axios.get(`${API_URL}/categories/admin`);
      console.log('✅ Categories endpoint working');
      console.log(`   Found ${response.data.length} categories`);
    } catch (error) {
      console.log('❌ Categories endpoint failed:', error.response?.data || error.message);
    }

    // Test 2: Get subcategories
    console.log('\n2. Testing GET /api/subcategories/admin');
    try {
      const response = await axios.get(`${API_URL}/subcategories/admin`);
      console.log('✅ Subcategories endpoint working');
      console.log(`   Found ${response.data.length} subcategories`);
    } catch (error) {
      console.log('❌ Subcategories endpoint failed:', error.response?.data || error.message);
    }

    // Test 3: Create a test category
    console.log('\n3. Testing POST /api/admin/categories');
    try {
      const testCategory = {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for CRUD testing',
        is_active: true
      };
      const response = await axios.post(`${API_URL}/admin/categories`, testCategory);
      console.log('✅ Create category working');
      console.log(`   Created category with ID: ${response.data.id}`);
      
      const categoryId = response.data.id;

      // Test 4: Update the test category
      console.log('\n4. Testing PUT /api/admin/categories/:id');
      try {
        const updateData = {
          name: 'Updated Test Category',
          slug: 'updated-test-category',
          description: 'Updated test category',
          is_active: true
        };
        const updateResponse = await axios.put(`${API_URL}/admin/categories/${categoryId}`, updateData);
        console.log('✅ Update category working');
        console.log(`   Updated category: ${updateResponse.data.message}`);
      } catch (error) {
        console.log('❌ Update category failed:', error.response?.data || error.message);
      }

      // Test 5: Delete the test category
      console.log('\n5. Testing DELETE /api/admin/categories/:id');
      try {
        const deleteResponse = await axios.delete(`${API_URL}/admin/categories/${categoryId}`);
        console.log('✅ Delete category working');
        console.log(`   Deleted category: ${deleteResponse.data.message}`);
      } catch (error) {
        console.log('❌ Delete category failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Create category failed:', error.response?.data || error.message);
    }

    // Test 6: Create a test subcategory (if categories exist)
    console.log('\n6. Testing POST /api/admin/subcategories');
    try {
      // First get a category to link to
      const categoriesResponse = await axios.get(`${API_URL}/categories/admin`);
      if (categoriesResponse.data.length > 0) {
        const testSubcategory = {
          name: 'Test Subcategory',
          slug: 'test-subcategory',
          description: 'Test subcategory for CRUD testing',
          category_id: categoriesResponse.data[0].id,
          is_active: true
        };
        const response = await axios.post(`${API_URL}/admin/subcategories`, testSubcategory);
        console.log('✅ Create subcategory working');
        console.log(`   Created subcategory with ID: ${response.data.id}`);
        
        const subcategoryId = response.data.id;

        // Test 7: Update the test subcategory
        console.log('\n7. Testing PUT /api/admin/subcategories/:id');
        try {
          const updateData = {
            name: 'Updated Test Subcategory',
            slug: 'updated-test-subcategory',
            description: 'Updated test subcategory',
            category_id: categoriesResponse.data[0].id,
            is_active: true
          };
          const updateResponse = await axios.put(`${API_URL}/admin/subcategories/${subcategoryId}`, updateData);
          console.log('✅ Update subcategory working');
          console.log(`   Updated subcategory: ${updateResponse.data.message}`);
        } catch (error) {
          console.log('❌ Update subcategory failed:', error.response?.data || error.message);
        }

        // Test 8: Delete the test subcategory
        console.log('\n8. Testing DELETE /api/admin/subcategories/:id');
        try {
          const deleteResponse = await axios.delete(`${API_URL}/admin/subcategories/${subcategoryId}`);
          console.log('✅ Delete subcategory working');
          console.log(`   Deleted subcategory: ${deleteResponse.data.message}`);
        } catch (error) {
          console.log('❌ Delete subcategory failed:', error.response?.data || error.message);
        }
      } else {
        console.log('⚠️ No categories found, skipping subcategory tests');
      }
    } catch (error) {
      console.log('❌ Create subcategory failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ General error:', error.message);
  }

  console.log('\n🏁 CRUD endpoint testing completed!');
};

// Run the test
testEndpoints();
