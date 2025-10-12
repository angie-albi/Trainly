const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePrice = (price) => {
    return price >= 0;
};

const validateQuantity = (quantity) => {
    return quantity > 0;
};

module.exports = {
    validateEmail,
    validatePrice,
    validateQuantity
};
