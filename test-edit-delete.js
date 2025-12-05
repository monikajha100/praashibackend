const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testEditDelete = async () => {
  console.log('🧪 Testing Edit and Delete Operations...\n');

  try {
    // Test 1: Create a test category
    console.log('1. Creating test category...');
    const testCategory = {
      name: 'Test Edit Delete Category',
      slug: 'test-edit-delete-category',
      description: 'Category for testing edit and delete',
      is_active: true
    };
    
    const createResponse = await axios.post(`${API_URL}/admin/categories`, testCategory);
    console.log('✅ Category created with ID:', createResponse.data.id);
    const categoryId = createResponse.data.id;

    // Test 2: Edit the category
    console.log('\n2. Testing edit operation...');
    const updateData = {
      name: 'Updated Test Category',
      slug: 'updated-test-category',
      description: 'This category was updated',
      is_active: true
    };
    
    const editResponse = await axios.put(`${API_URL}/admin/categories/${categoryId}`, updateData);
    console.log('✅ Edit operation successful:', editResponse.data.message);

    // Test 3: Delete the category
    console.log('\n3. Testing delete operation...');
    const deleteResponse = await axios.delete(`${API_URL}/admin/categories/${categoryId}`);
    console.log('✅ Delete operation successful:', deleteResponse.data.message);

    // Test 4: Test subcategory operations
    console.log('\n4. Testing subcategory operations...');
    
    // Get a category to link subcategory to
    const categoriesResponse = await axios.get(`${API_URL}/categories/admin`);
    if (categoriesResponse.data.length > 0) {
      const parentCategoryId = categoriesResponse.data[0].id;
      
      // Create test subcategory
      const testSubcategory = {
        name: 'Test Edit Delete Subcategory',
        slug: 'test-edit-delete-subcategory',
        description: 'Subcategory for testing edit and delete',
        category_id: parentCategoryId,
        is_active: true
      };
      
      const createSubResponse = await axios.post(`${API_URL}/admin/subcategories`, testSubcategory);
      console.log('✅ Subcategory created with ID:', createSubResponse.data.id);
      const subcategoryId = createSubResponse.data.id;

      // Edit subcategory
      const updateSubData = {
        name: 'Updated Test Subcategory',
        slug: 'updated-test-subcategory',
        description: 'This subcategory was updated',
        category_id: parentCategoryId,
        is_active: true
      };
      
      const editSubResponse = await axios.put(`${API_URL}/admin/subcategories/${subcategoryId}`, updateSubData);
      console.log('✅ Subcategory edit successful:', editSubResponse.data.message);

      // Delete subcategory
      const deleteSubResponse = await axios.delete(`${API_URL}/admin/subcategories/${subcategoryId}`);
      console.log('✅ Subcategory delete successful:', deleteSubResponse.data.message);
    } else {
      console.log('⚠️ No categories found, skipping subcategory tests');
    }

    console.log('\n🎉 All edit and delete operations working!');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('💡 500 error suggests backend needs to be restarted with fixes');
    }
  }
};

// Run the test
testEditDelete();
