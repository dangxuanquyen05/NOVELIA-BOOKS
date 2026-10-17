package com.novelia.cart.controller;

import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.dto.CartResponse;
import com.novelia.cart.dto.UpdateCartItemRequest;
import com.novelia.cart.service.CartService;
import com.novelia.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getMyCart(Authentication authentication) {
        CartResponse cart = cartService.getMyCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {
        CartResponse cart = cartService.addToCart(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã thêm tác phẩm vào giỏ hàng thành công", cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItemQuantity(
            Authentication authentication,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartResponse cart = cartService.updateCartItemQuantity(authentication.getName(), itemId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật số lượng thành công", cart));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            Authentication authentication,
            @PathVariable Long itemId) {
        CartResponse cart = cartService.removeCartItem(authentication.getName(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng", cart));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<CartResponse>> clearCart(Authentication authentication) {
        CartResponse cart = cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã làm trống giỏ hàng thành công", cart));
    }
}
