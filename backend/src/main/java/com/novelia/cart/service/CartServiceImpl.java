package com.novelia.cart.service;

import com.novelia.book.entity.Book;
import com.novelia.book.repository.BookRepository;
import com.novelia.cart.dto.AddToCartRequest;
import com.novelia.cart.dto.CartItemResponse;
import com.novelia.cart.dto.CartResponse;
import com.novelia.cart.dto.UpdateCartItemRequest;
import com.novelia.cart.entity.Cart;
import com.novelia.cart.entity.CartItem;
import com.novelia.cart.repository.CartItemRepository;
import com.novelia.cart.repository.CartRepository;
import com.novelia.common.exception.BadRequestException;
import com.novelia.common.exception.ResourceNotFoundException;
import com.novelia.inventory.entity.Inventory;
import com.novelia.inventory.repository.InventoryRepository;
import com.novelia.user.entity.User;
import com.novelia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public CartResponse getMyCart(String userEmail) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCart(user);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(String userEmail, AddToCartRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng thêm vào giỏ phải lớn hơn 0");
        }

        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCart(user);

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác phẩm với ID: " + request.getBookId()));

        if (book.getStatus() != Book.BookStatus.PUBLISHED) {
            throw new BadRequestException("Tác phẩm '" + book.getTitle() + "' hiện không mở bán");
        }

        int availableStock = getAvailableStock(book.getId());
        if (availableStock <= 0) {
            throw new BadRequestException("Tác phẩm '" + book.getTitle() + "' hiện đã tạm hết hàng");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndBookId(cart.getId(), book.getId());

        int targetQuantity = request.getQuantity();
        CartItem cartItem;

        if (existingItemOpt.isPresent()) {
            cartItem = existingItemOpt.get();
            targetQuantity = cartItem.getQuantity() + request.getQuantity();

            if (targetQuantity > availableStock) {
                throw new BadRequestException("Số lượng yêu cầu (" + targetQuantity + " cuốn) vượt quá số lượng tồn kho khả dụng (" + availableStock + " cuốn) của tác phẩm '" + book.getTitle() + "'");
            }
            cartItem.setQuantity(targetQuantity);
        } else {
            if (targetQuantity > availableStock) {
                throw new BadRequestException("Số lượng yêu cầu (" + targetQuantity + " cuốn) vượt quá số lượng tồn kho khả dụng (" + availableStock + " cuốn) của tác phẩm '" + book.getTitle() + "'");
            }
            cartItem = CartItem.builder()
                    .cart(cart)
                    .book(book)
                    .quantity(targetQuantity)
                    .build();
        }

        cartItemRepository.save(cartItem);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItemQuantity(String userEmail, Long itemId, UpdateCartItemRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng cập nhật phải lớn hơn hoặc bằng 1");
        }

        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCart(user);

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giỏ hàng với ID: " + itemId));

        // Security check: verify this cart item belongs to the authenticated user's cart
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa mục giỏ hàng của người khác");
        }

        Book book = cartItem.getBook();
        int availableStock = getAvailableStock(book.getId());

        if (request.getQuantity() > availableStock) {
            throw new BadRequestException("Số lượng yêu cầu (" + request.getQuantity() + " cuốn) vượt quá số lượng tồn kho khả dụng (" + availableStock + " cuốn) của tác phẩm '" + book.getTitle() + "'");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(String userEmail, Long itemId) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCart(user);

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giỏ hàng với ID: " + itemId));

        // Security check: verify this cart item belongs to the authenticated user's cart
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa mục giỏ hàng của người khác");
        }

        cartItemRepository.delete(cartItem);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse clearCart(String userEmail) {
        User user = getUserByEmail(userEmail);
        Cart cart = getOrCreateCart(user);

        cartItemRepository.deleteByCartId(cart.getId());
        return mapToCartResponse(cart);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    private int getAvailableStock(Long bookId) {
        return inventoryRepository.findByBookId(bookId)
                .map(Inventory::getAvailableQuantity)
                .orElse(0);
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartItemResponse> itemResponses = new ArrayList<>();

        int totalItemsCount = 0;
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem item : items) {
            Book book = item.getBook();
            BigDecimal unitPrice = book.getSalePrice();
            int qty = item.getQuantity();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            int availableStock = getAvailableStock(book.getId());
            boolean isAvailable = availableStock >= qty && book.getStatus() == Book.BookStatus.PUBLISHED;

            itemResponses.add(CartItemResponse.builder()
                    .id(item.getId())
                    .bookId(book.getId())
                    .bookTitle(book.getTitle())
                    .bookSlug(book.getSlug())
                    .bookCover(book.getCoverImage())
                    .unitPrice(unitPrice)
                    .originalPrice(book.getOriginalPrice())
                    .quantity(qty)
                    .totalPrice(lineTotal)
                    .stockQuantity(availableStock)
                    .isAvailable(isAvailable)
                    .build());

            totalItemsCount += qty;
            subtotal = subtotal.add(lineTotal);
        }

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(itemResponses)
                .totalItems(totalItemsCount)
                .totalDistinctItems(itemResponses.size())
                .subtotal(subtotal)
                .build();
    }
}
