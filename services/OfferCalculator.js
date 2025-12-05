/**
 * Offer Calculator Service
 * Handles calculation of discounts for different offer types
 */

class OfferCalculator {
  /**
   * Extract discount percentage from text (e.g., "15% OFF", "Get 20% discount")
   * @param {string} text - Text to search for percentage
   * @returns {number|null} - Discount percentage or null if not found
   */
  static extractDiscountFromText(text) {
    if (!text) return null;
    
    // Match patterns like "15%", "15% OFF", "Get 15% discount", etc.
    const percentageMatch = text.match(/(\d+)\s*%/i);
    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1]);
      if (percentage >= 0 && percentage <= 100) {
        return percentage;
      }
    }
    
    return null;
  }
  /**
   * Calculate discount for an offer based on cart items
   * @param {Object} offer - The offer object
   * @param {Array} cartItems - Array of cart items
   * @returns {Object} - { discount: number, eligibleItems: array, message: string }
   */
  static calculateDiscount(offer, cartItems) {
    if (!offer || !cartItems || cartItems.length === 0) {
      return { discount: 0, eligibleItems: [], message: 'Invalid offer or empty cart' };
    }

    // Check minimum purchase amount if required
    if (offer.minimum_purchase_amount) {
      const cartTotal = this.getCartTotal(cartItems);
      if (cartTotal < parseFloat(offer.minimum_purchase_amount)) {
        return {
          discount: 0,
          eligibleItems: [],
          message: `Minimum purchase of ₹${offer.minimum_purchase_amount} required`
        };
      }
    }

    // Filter eligible items based on product_ids or category_ids
    const eligibleItems = this.getEligibleItems(offer, cartItems);

    if (eligibleItems.length === 0) {
      return {
        discount: 0,
        eligibleItems: [],
        message: 'No eligible items in cart for this offer'
      };
    }

    const normalizedType = this.normalizeOfferType(offer.offer_type);

    // Calculate discount based on offer type
    switch (normalizedType) {
      case 'percentage':
        return this.calculatePercentageDiscount(offer, eligibleItems);
      
      case 'fixed_amount':
        return this.calculateFixedDiscount(offer, eligibleItems);
      
      case 'free_shipping':
        return this.calculateFixedDiscount(offer, eligibleItems, { label: 'Free shipping discount' });
      
      case 'buy_x_get_y':
        return this.calculateBOGODiscount(offer, eligibleItems);
      
      case 'minimum_purchase':
        return this.calculateMinimumPurchaseDiscount(offer, eligibleItems);
      
      case 'referral':
        return this.calculateReferralDiscount(offer, eligibleItems);
      
      default:
        // Fallback: Check for BOGO offers first
        if (offer.buy_quantity && offer.get_quantity) {
          return this.calculateBOGODiscount(offer, eligibleItems);
        }
        // Fallback to percentage if discount_percentage exists or can be extracted
        if (offer.discount_percentage || this.extractDiscountFromText(offer.description) || this.extractDiscountFromText(offer.title)) {
          return this.calculatePercentageDiscount(offer, eligibleItems);
        }
        return { discount: 0, eligibleItems: [], message: 'Unknown offer type' };
    }
  }

  /**
   * Calculate percentage discount
   */
  static calculatePercentageDiscount(offer, eligibleItems) {
    // Try to get discount percentage from offer field, description, or title
    let discountPercentage = offer.discount_percentage;
    
    // If not set, try to extract from description or title
    if (!discountPercentage || discountPercentage <= 0) {
      discountPercentage = this.extractDiscountFromText(offer.description) || 
                          this.extractDiscountFromText(offer.title) ||
                          this.extractDiscountFromText(offer.discount_text);
    }
    
    // If still not found, return error
    if (!discountPercentage || discountPercentage <= 0) {
      return {
        discount: 0,
        eligibleItems,
        message: 'Discount percentage not configured for this offer. Please contact support or check offer details.'
      };
    }
    
    const subtotal = this.getItemsTotal(eligibleItems);
    let discount = (subtotal * discountPercentage) / 100;
    
    // Apply max discount limit if set
    if (offer.max_discount_amount && discount > parseFloat(offer.max_discount_amount)) {
      discount = parseFloat(offer.max_discount_amount);
    }

    return {
      discount: Math.round(discount * 100) / 100,
      eligibleItems,
      message: `${discountPercentage}% discount applied`
    };
  }

  /**
   * Calculate fixed amount discount
   */
  static calculateFixedDiscount(offer, eligibleItems, options = {}) {
    const { label } = options;
    const subtotal = this.getItemsTotal(eligibleItems);
    const discountAmount = parseFloat(offer.discount_amount || 0);
    
    // Don't discount more than the cart total
    const discount = Math.min(discountAmount, subtotal);

    return {
      discount: Math.round(discount * 100) / 100,
      eligibleItems,
      message: label
        ? `${label} applied`
        : `₹${discountAmount} discount applied`
    };
  }

  /**
   * Calculate Buy X Get Y discount
   * Example: "Buy 2 pairs, Get 1 pair free (of equal or lesser value)"
   * - Supports percentage discount on "get" items (e.g., 50% off instead of free)
   * - Discount applies to lowest-priced items first (of equal or lesser value)
   * - Highest-priced items remain at full price
   */
  static calculateBOGODiscount(offer, eligibleItems) {
    const buyQty = parseInt(offer.buy_quantity || 1);
    const getQty = parseInt(offer.get_quantity || 1);
    
    // For BOGO, discount_percentage of 0 or null means 100% off (free)
    // If discount_percentage is set (e.g., 50), it means 50% off instead of free
    let discountPercentage = parseFloat(offer.discount_percentage || 0);
    
    // If discount_percentage is not set but description mentions a percentage, use that
    // Otherwise, default to 0 (100% off = free)
    if (!discountPercentage && offer.description) {
      const extracted = this.extractDiscountFromText(offer.description);
      if (extracted && extracted < 100) {
        discountPercentage = extracted;
      }
    }
    
    // Calculate total quantity of eligible items
    const totalQty = eligibleItems.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
    
    // Calculate how many complete sets we have
    // For "Buy 2 Get 1": need 3 items total (2 to buy + 1 free)
    // Sets = how many times we can apply the offer
    const itemsPerSet = buyQty + getQty;
    const sets = Math.floor(totalQty / itemsPerSet);
    
    if (sets === 0) {
      const discountText = discountPercentage > 0 ? `${discountPercentage}% off` : 'free';
      const needed = itemsPerSet - totalQty;
      const itemType = eligibleItems.length > 0 ? 'eligible item(s)' : 'item(s)';
      return {
        discount: 0,
        eligibleItems,
        discountedItems: [],
        message: `Buy ${buyQty} Get ${getQty} ${discountText} - Add ${needed} more ${itemType} to qualify (You have ${totalQty} eligible ${itemType})`
      };
    }

    // Expand items into individual units for accurate pairing
    // This allows us to handle multiple quantities of the same product
    const expandedItems = [];
    eligibleItems.forEach(item => {
      const itemPrice = parseFloat(item.price || 0);
      const itemQty = parseInt(item.quantity || 1);
      for (let i = 0; i < itemQty; i++) {
        expandedItems.push({
          ...item,
          unitIndex: i,
          price: itemPrice,
          originalItem: item // Keep reference to original item
        });
      }
    });
    
    // Sort by price (ascending) - lowest price first
    // This ensures "of equal or lesser value" - cheapest items get discounted
    expandedItems.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    // Calculate how many items get discounted (free or at discount)
    // For "Buy 2 Get 1" with 2 sets: 2 sets * 1 free = 2 items discounted
    const discountedQty = sets * getQty;
    
    // Total items that will be paid for (at full price)
    const paidQty = sets * buyQty;
    
    // Track which items get discounted (for order creation)
    const discountedItems = [];
    let discount = 0;
    let remainingDiscounted = discountedQty;
    
    // Strategy: Apply discount to the CHEAPEST items (of equal or lesser value)
    // This ensures customers get maximum value - they pay full price for expensive items,
    // and get discount/free on cheaper items
    // Example: Buy 2 Get 1 with items priced ₹1000, ₹800, ₹500
    // Result: Pay for ₹1000 + ₹800, Get ₹500 free
    
    for (let i = 0; i < expandedItems.length && remainingDiscounted > 0; i++) {
      const item = expandedItems[i];
      const itemPrice = parseFloat(item.price || 0);
      
      // Calculate discount for this item
      let itemDiscount = 0;
      if (discountPercentage > 0) {
        // Apply percentage discount (e.g., 50% off on the "get" item)
        itemDiscount = itemPrice * (discountPercentage / 100);
      } else {
        // Make it free (100% discount) - "Get 1 free"
        itemDiscount = itemPrice;
      }
      
      discount += itemDiscount;
      remainingDiscounted--;
      
      // Track this item for checkout/order creation
      const itemId = item.id || item.product_id;
      const existingDiscountedItem = discountedItems.find(di => 
        (di.id === itemId || di.product_id === itemId) && di.unitIndex === item.unitIndex
      );
      
      if (!existingDiscountedItem) {
        discountedItems.push({
          id: itemId,
          product_id: item.product_id || itemId,
          price: itemPrice,
          discount: itemDiscount,
          discountPercentage: discountPercentage > 0 ? discountPercentage : 100,
          quantity: 1,
          originalPrice: itemPrice
        });
      } else {
        existingDiscountedItem.quantity += 1;
        existingDiscountedItem.discount += itemDiscount;
      }
    }

    // Group discounted items by product ID for cleaner response
    const groupedDiscountedItems = {};
    discountedItems.forEach(item => {
      const key = item.id || item.product_id;
      if (!groupedDiscountedItems[key]) {
        groupedDiscountedItems[key] = {
          id: item.id,
          product_id: item.product_id,
          price: item.price,
          discount: 0,
          discountPercentage: item.discountPercentage,
          quantity: 0
        };
      }
      groupedDiscountedItems[key].quantity += item.quantity;
      groupedDiscountedItems[key].discount += item.discount;
    });

    const discountText = discountPercentage > 0 
      ? `${discountPercentage}% off` 
      : 'Free';
    
    // Create a more descriptive message
    let message = `Buy ${buyQty} Get ${getQty} ${discountText}`;
    if (discountPercentage === 0) {
      message += ` (of equal or lesser value)`;
    }
    message += ` - ₹${discount.toFixed(2)} discount applied to lowest-priced items`;
    
    return {
      discount: Math.round(discount * 100) / 100,
      eligibleItems,
      discountedItems: Object.values(groupedDiscountedItems),
      message: message,
      sets: sets,
      paidItems: paidQty,
      freeItems: discountedQty
    };
  }

  /**
   * Calculate minimum purchase discount
   */
  static calculateMinimumPurchaseDiscount(offer, eligibleItems) {
    // This is typically combined with percentage or fixed discount
    // If minimum is met, apply the discount
    const subtotal = this.getItemsTotal(eligibleItems);
    
    // Try to get discount percentage from offer field, description, or title
    let discountPercentage = offer.discount_percentage;
    if (!discountPercentage || discountPercentage <= 0) {
      discountPercentage = this.extractDiscountFromText(offer.description) || 
                          this.extractDiscountFromText(offer.title) ||
                          this.extractDiscountFromText(offer.discount_text);
    }
    
    if (discountPercentage && discountPercentage > 0) {
      let discount = (subtotal * discountPercentage) / 100;
      if (offer.max_discount_amount && discount > parseFloat(offer.max_discount_amount)) {
        discount = parseFloat(offer.max_discount_amount);
      }
      return {
        discount: Math.round(discount * 100) / 100,
        eligibleItems,
        message: `${discountPercentage}% discount on orders above ₹${offer.minimum_purchase_amount}`
      };
    } else if (offer.discount_amount) {
      const discount = Math.min(parseFloat(offer.discount_amount), subtotal);
      return {
        discount: Math.round(discount * 100) / 100,
        eligibleItems,
        message: `₹${offer.discount_amount} discount on orders above ₹${offer.minimum_purchase_amount}`
      };
    }

    return { discount: 0, eligibleItems, message: 'No discount configured' };
  }

  /**
   * Calculate referral discount
   */
  static calculateReferralDiscount(offer, eligibleItems) {
    // Referral offers typically have percentage or fixed discount
    // Try to get discount percentage from offer field, description, or title
    let discountPercentage = offer.discount_percentage;
    if (!discountPercentage || discountPercentage <= 0) {
      discountPercentage = this.extractDiscountFromText(offer.description) || 
                          this.extractDiscountFromText(offer.title) ||
                          this.extractDiscountFromText(offer.discount_text);
    }
    
    if (discountPercentage && discountPercentage > 0) {
      const subtotal = this.getItemsTotal(eligibleItems);
      let discount = (subtotal * discountPercentage) / 100;
      if (offer.max_discount_amount && discount > parseFloat(offer.max_discount_amount)) {
        discount = parseFloat(offer.max_discount_amount);
      }
      return {
        discount: Math.round(discount * 100) / 100,
        eligibleItems,
        message: `Referral discount: ${discountPercentage}% off`
      };
    } else if (offer.discount_amount) {
      const subtotal = this.getItemsTotal(eligibleItems);
      const discount = Math.min(parseFloat(offer.discount_amount), subtotal);
      return {
        discount: Math.round(discount * 100) / 100,
        eligibleItems,
        message: `Referral discount: ₹${offer.discount_amount} off`
      };
    }

    return { discount: 0, eligibleItems, message: 'No referral discount configured' };
  }

  /**
   * Get eligible items based on product_ids or category_ids
   */
  static getEligibleItems(offer, cartItems) {
    let eligibleItems = cartItems;

    // Filter by product IDs if specified
    if (offer.product_ids) {
      const productIdArray = offer.product_ids.split(',').map(id => parseInt(id.trim()));
      eligibleItems = cartItems.filter(item => 
        productIdArray.includes(parseInt(item.id)) || 
        productIdArray.includes(parseInt(item.product_id))
      );
    }

    // Filter by category IDs if specified
    if (offer.category_ids && eligibleItems.length > 0) {
      const categoryIdArray = offer.category_ids.split(',').map(id => parseInt(id.trim()));
      eligibleItems = eligibleItems.filter(item => {
        const itemCategoryId = parseInt(item.category_id || item.categoryId || 0);
        return categoryIdArray.includes(itemCategoryId);
      });
    }

    return eligibleItems;
  }

  /**
   * Get total cart value
   */
  static getCartTotal(cartItems) {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
  }

  /**
   * Get total value of specific items
   */
  static getItemsTotal(items) {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
  }

  /**
   * Check if an offer is applicable to the cart
   */
  static isOfferApplicable(offer, cartItems) {
    if (!offer || !offer.is_active) return false;

    // Check date validity
    const now = new Date();
    if (offer.start_date && new Date(offer.start_date) > now) return false;
    if (offer.end_date && new Date(offer.end_date) < now) return false;

    // Check minimum purchase
    if (offer.minimum_purchase_amount) {
      const cartTotal = this.getCartTotal(cartItems);
      if (cartTotal < parseFloat(offer.minimum_purchase_amount)) return false;
    }

    // Check if there are eligible items
    const eligibleItems = this.getEligibleItems(offer, cartItems);
    if (eligibleItems.length === 0) return false;

    // For BOGO offers, check if there are enough items
    const normalizedType = this.normalizeOfferType(offer.offer_type);
    if (normalizedType === 'buy_x_get_y' || (offer.buy_quantity && offer.get_quantity)) {
      const buyQty = parseInt(offer.buy_quantity || 1);
      const getQty = parseInt(offer.get_quantity || 1);
      const itemsPerSet = buyQty + getQty; // For "Buy 2 Get 1", need 3 items total
      
      // Calculate total quantity of eligible items (only items that match offer's category/product filters)
      const totalQty = eligibleItems.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
      
      // Must have at least enough items for one complete set
      // For "Earring Mania" (Buy 2 Get 1), need exactly 3 or more earrings
      if (totalQty < itemsPerSet) {
        console.log(`BOGO offer validation failed: Need ${itemsPerSet} items, have ${totalQty} eligible items`);
        return false;
      }
      
      console.log(`BOGO offer validation passed: Have ${totalQty} eligible items (need ${itemsPerSet})`);
    }

    return true;
  }

  /**
   * Normalize various stored offer types to a canonical value understood by the calculator
   */
  static normalizeOfferType(offerType) {
    const type = (offerType || '').toString().trim().toLowerCase();

    if ([
      'percentage',
      'fixed_amount',
      'buy_x_get_y',
      'minimum_purchase',
      'referral',
      'free_shipping'
    ].includes(type)) {
      return type;
    }

    if (['flash_sale', 'discount_percentage', 'new_arrival'].includes(type)) {
      return 'percentage';
    }

    if (type === 'discount_fixed') {
      return 'fixed_amount';
    }

    return 'percentage';
  }
}

module.exports = OfferCalculator;


