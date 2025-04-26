'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selectors ---
    const cartToggleButton = document.querySelector('.header-icons a[href="#cart"]');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCartButton = document.getElementById('close-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    const headerCartCountElement = document.querySelector('.cart-count');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.main-nav .nav-menu');

    // --- Cart Logic (using localStorage) ---
    const CART_STORAGE_KEY = 'picklePantryCart'; // Use a unique key

    // Function to get cart from localStorage
    function getCart() {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        try {
            return cartJson ? JSON.parse(cartJson) : [];
        } catch (e) {
            console.error("Error parsing cart from localStorage", e);
            localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted cart
            return []; // Return empty array on error
        }
    }

    // Function to save cart to localStorage
    function saveCart(cart) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }

    // Function to add item to cart
    function addToCart(item) {
        const cart = getCart();
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

        if (existingItemIndex > -1) {
            // Update quantity if item already exists
            cart[existingItemIndex].quantity += item.quantity;
        } else {
            // Add new item
            cart.push(item);
        }
        saveCart(cart);
        renderCart(); // Update the visual cart
        updateHeaderCartCount(); // Update header counter
        openCartDrawer(); // Optionally open cart when item is added
    }

    // Function to remove item from cart
    function removeFromCart(itemId) {
        let cart = getCart();
        cart = cart.filter(item => item.id !== itemId); // Keep items NOT matching the ID
        saveCart(cart);
        renderCart();
        updateHeaderCartCount();
    }

    // Function to render the cart visually
    function renderCart() {
        const cart = getCart();
        cartItemsContainer.innerHTML = ''; // Clear previous items

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-message">Your cart is currently empty.</p>';
            cartTotalPriceElement.textContent = '0.00/-';
            return; // Exit if cart is empty
        }

        let totalPrice = 0;

        cart.forEach(item => {
            // Ensure price and quantity are numbers
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;

            const itemTotalPrice = price * quantity;
            totalPrice += itemTotalPrice;

            const cartItemElement = document.createElement('div');
            cartItemElement.classList.add('cart-item');
            cartItemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image || 'images/placeholder.png'}" alt="${item.name || 'Pickle Product'}">
                </div>
                <div class="cart-item-details">
                    <span class="cart-item-name">${item.name || 'Unknown Item'}</span>
                    <span class="cart-item-price">${price.toFixed(2)}/- each</span>
                    <span class="cart-item-quantity">Qty: ${quantity}</span>
                    <span class="cart-item-subtotal">Subtotal: ${itemTotalPrice.toFixed(2)}/-</span>
                </div>
                <button class="remove-item-btn" data-id="${item.id}" aria-label="Remove ${item.name || 'item'}"><i class="fas fa-trash-alt"></i> Remove</button>
            `;

            // Add event listener to the remove button WITHIN this specific item
            cartItemElement.querySelector('.remove-item-btn').addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return; // Should not happen, but safe check
                const itemIdToRemove = button.dataset.id;
                const itemName = item.name || 'this item'; // Use item name from loop scope

                // Ask for confirmation BEFORE removing
                if (window.confirm(`Are you sure you want to remove "${itemName}" from your cart?`)) {
                    // If user clicks "OK", proceed with removal
                    removeFromCart(itemIdToRemove);
                }
                // If user clicks "Cancel", do nothing
            });

            cartItemsContainer.appendChild(cartItemElement);
        });

        cartTotalPriceElement.textContent = `${totalPrice.toFixed(2)}/-`;
    }

    // Function to update the header cart count bubble
    function updateHeaderCartCount() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0); // Sum quantities, ensure they are numbers
        if (headerCartCountElement) {
            headerCartCountElement.textContent = totalItems;
            // Add a small animation when count changes (optional)
            if (totalItems > Number(headerCartCountElement.textContent || 0) ) { // Animate only if count increases
                 headerCartCountElement.style.transform = 'scale(1.2)';
                 setTimeout(() => { headerCartCountElement.style.transform = 'scale(1)';}, 150);
            }
        }
    }

    // --- Event Listeners ---

    // Add to Cart Button Clicks
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const card = button.closest('.product-card');
            if (!card) {
                console.error("Could not find parent product card for button:", button);
                return;
            }

            const quantityInput = card.querySelector('.quantity-input');
            const quantity = quantityInput ? (parseInt(quantityInput.value, 10) || 1) : 1;

            // Get product data from data attributes
            const productId = card.dataset.productId;
            const productName = card.querySelector('h3')?.textContent; // Optional chaining for safety
            const productPrice = parseFloat(card.dataset.price);
            const productImage = card.dataset.imageSrc;

            if (!productId || !productName || isNaN(productPrice) || !productImage) {
                console.error("Missing or invalid product data on card:", {productId, productName, productPrice, productImage }, card);
                alert("Sorry, there was an error adding this item. Product data missing.");
                return;
            }

            const itemToAdd = {
                id: productId,
                name: productName,
                price: productPrice,
                quantity: Math.max(1, quantity), // Ensure quantity is at least 1
                image: productImage
            };

            addToCart(itemToAdd);

            // Visual feedback on button (optional)
            const originalText = `Add to Cart <i class="fas fa-cart-plus"></i>`;
            button.innerHTML = `Added! <i class="fas fa-check"></i>`;
            button.disabled = true;
            setTimeout(() => {
                // Check if the button still exists before resetting
                if (document.body.contains(button)) {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
                 // Optionally reset quantity input back to 1 after adding?
                 if (quantityInput && document.body.contains(quantityInput)) quantityInput.value = 1;
            }, 1500);
        });
    });

    // Cart Drawer Toggle
    function openCartDrawer() {
        if (cartDrawer && cartOverlay) {
            cartDrawer.classList.add('open');
            cartOverlay.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    function closeCartDrawer() {
         if (cartDrawer && cartOverlay) {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('open');
             document.body.style.overflow = ''; // Allow background scrolling again
         }
    }

    if (cartToggleButton) {
        cartToggleButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            openCartDrawer();
        });
    }
    if (closeCartButton) {
        closeCartButton.addEventListener('click', closeCartDrawer);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartDrawer); // Close on overlay click
    }
    // Close cart drawer with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartDrawer?.classList.contains('open')) {
            closeCartDrawer();
        }
    });


    // Mobile Navigation Toggle
    if (navToggle && navMenu) {
        const navIcon = navToggle.querySelector('i');
        navToggle.addEventListener('click', () => {
            const isNavOpen = navMenu.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', isNavOpen); // ARIA attribute

            if (isNavOpen) {
                navIcon.classList.remove('fa-bars');
                navIcon.classList.add('fa-times');
            } else {
                navIcon.classList.remove('fa-times');
                navIcon.classList.add('fa-bars');
            }
        });
        // Close mobile nav when a link is clicked
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navIcon.classList.remove('fa-times');
                    navIcon.classList.add('fa-bars');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

     // Intersection Observer for scroll animations
     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
     const observerCallback = (entries, observer) => {
         entries.forEach(entry => {
             if (entry.isIntersecting) {
                 entry.target.classList.add('is-visible');
                 // Optionally unobserve after first animation
                 // observer.unobserve(entry.target);
             } else {
                 // Optionally remove class to re-animate on scroll up
                 // entry.target.classList.remove('is-visible');
             }
         });
     };
     const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
     const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
     elementsToAnimate.forEach(el => scrollObserver.observe(el));

    // --- Initial Setup ---
    renderCart(); // Render cart on page load from localStorage
    updateHeaderCartCount(); // Update header count on page load

}); // End DOMContentLoaded
