package com.novelia.cart.service;

import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.dto.CartResponse;
import com.novelia.cart.dto.UpdateCartItemRequest;

public interface CartService {
    CartResponse getMyCart(String userEmail);
    CartResponse addToCart(String userEmail, AddToCartRequest request);
    CartResponse updateCartItemQuantity(String userEmail, Long itemId, UpdateCartItemRequest request);
    CartResponse removeCartItem(String userEmail, Long itemId);
    CartResponse clearCart(String userEmail);
}
