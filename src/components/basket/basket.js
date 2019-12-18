import Handlebars from 'handlebars/dist/handlebars';
import ShowMessages from '../show-msg/show-msg';
import Methods from '../methods/methods';
import GetItem from '../get-item/get-item';
// Взаимодействие с корзиной
export default class Basket {
    constructor() {
        this.el = document.querySelector('.js-basket');

        this.closeBtnBasket = document.querySelector('.js-basket-close');
        this.basketOrderBtn = this.el.querySelector('.js-basket-order');
        this.basketPopup = document.querySelector('.js-basket-popup');
        this.basketForm = document.querySelector('.js-order-form');
        this.url = document.querySelector('.js-order-form').getAttribute('action');

        this.products = document.querySelector('.js-products');
        this.productList = this.products.querySelector('.js-products-list');
        this.urlProducts = this.products.getAttribute('data-url');

        this.cartWrap = document.querySelector('.js-basket-wrap');

        this.messages = {};
        this.basketCart = document.querySelector('.js-basket-cart');
        this.basketCartCounter = this.basketCart.querySelector('.js-basket-cart-count');

        this.classes = {
            active: 'is-active',
            hidden: 'is-hidden'
        };

        this.basketState = this.getCartData() || [];

        this.templates = {
            msg: '#product-msg-hbtpl',
            product: '#product-hbtpl',
            basket: '#basket-product-tmpl'
        };

        this.ShowMessages = new ShowMessages();
        // this.GetItem = new GetItem();

        this.init();
        this.setListeners();

    }

    init() {
        // this.addToBasket();
        this.renderBsketProducts();
        this.clearCart();
        this.basketItemsAmount()
    }

    setListeners() {
        //Переключаем корзину
        this.basketCart.addEventListener('click', () => {
            this.toggleBasket()
        })

        // закрываем корзину
        this.closeBtnBasket.addEventListener('click', () => {
            this.hideBasket();
        })

        // Вызываем попап
        this.basketOrderBtn.addEventListener('click', () => {
            this.basketPopup.classList.remove(this.classes.hidden);

        })

        // Отправляем заказ
        this.basketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(Methods.form(e, this.basketForm)) {
                this.sendBasketForm(e);
            }
        })

        // Работа с товарами в корзине
        this.basketItem.forEach((itemBasket, index) => {
            this.basketItemCounter(itemBasket, index);
            this.removeItemBasket(itemBasket, index);
        })
    }

    /**
    * Рендерим товары при загрузке страницы
    */
    renderProducts() {
        // Показываем прелоадер
        Methods.showPreloader(this.classes.show);
        // Показываем товары на странице
        GetItem.getRequest(this.urlProducts, this.templates.product, this.productList);
    }

    /*
    * Показываем товары в корзине, если они были добавлены ранее/ Данные берутся из localstorage
    */
    renderBsketProducts() {
        GetItem.getResponse(this.getCartData(),
            this.templates.basket, this.cartWrap, true);
            this.basketItem = document.querySelectorAll('.js-basket-item');
    }

    basketItemsAmount() {
        this.basketCartCounter.innerHTML = this.countAllItems();
    }

    /**
    * Счетчик кол-ва на товарах
    */
    basketItemCounter(itemBasket, index) {
        itemBasket.addEventListener('click', (e) => {
            const basketItemPlus = itemBasket.querySelector('.js-basket-item-plus');
            const basketItemMinus = itemBasket.querySelector('.js-basket-item-minus');
            const basketItemCount = itemBasket.querySelector('.js-basket-item-count');

            if(e.target === basketItemPlus) {
                +basketItemCount.innerHTML++
                this.basketState[index].quant = basketItemCount.innerHTML;
            }

            if(e.target === basketItemMinus) {
                if(+basketItemCount.innerHTML > 1) {
                    +basketItemCount.innerHTML--
                    this.basketState[index].quant = basketItemCount.innerHTML;
                }
            }

            this.getDataToLocalStr();
            this.basketItemsAmount();

        })
    }

    /**
    * Удаляем из списка корзины товар и перезаписываем массив данных
    */
    removeItemBasket(itemBasket, index) {
        itemBasket.addEventListener('click', (e) => {
            const itemRemoveBtn = itemBasket.querySelector('.js-basket-item-remove');
            if(e.target === itemRemoveBtn) {
                itemBasket.remove();
                this.basketState.splice(index, 1);
                this.getDataToLocalStr();
                this.clearCart();
                this.basketItemsAmount();
            }
        })
    }

    /**
    * Обнуление данных при чистой корзине
    */
    clearCart() {
        const basketItem = document.querySelectorAll('.js-basket-item');
        if (basketItem.length < 1) {
            this.basketOrderBtn.classList.add(this.classes.hidden);
            this.basketCart.classList.remove(this.classes.active);
            localStorage.removeItem('cart');
            this.basketCounter = 0;
        } else {
            this.basketOrderBtn.classList.remove(this.classes.hidden);
            this.basketCart.classList.add(this.classes.active);
        }
    }

    /**
    * Получаем данные из loacalstorage
    */
    getCartData() {
        return JSON.parse(localStorage.getItem('cart'));
    }

    /**
    *  Добавляем товар в корзину
    */
    addToBasket(product) {
        product.forEach((item, i) => {
            item.addEventListener('click', (e) => {
                const itemBasketBtn = item.querySelector('.js-add-to-basket')
                if(e.target === itemBasketBtn) {
                    this.addBasketProduct(item);
                }
                this.basketProductEdit();
                this.getDataToLocalStr();
                this.basketItemsAmount();

            })
        });
    }

    /**
     *  Манипуляции с товаром в корзине
    */
    basketProductEdit() {
        const basketItem = document.querySelectorAll('.js-basket-item');
        basketItem.forEach((itemBasket, index) => {
            this.basketItemCounter(itemBasket, index);
            this.removeItemBasket(itemBasket, index);
        });
    }

    /**
    * Появление товара в корзине, а также изменение элементво управления
    */
    addBasketProduct(item) {
        this.pushCartArray(item);
        GetItem.getResponse(
            this.basketState, this.templates.basket, this.cartWrap, true);
        this.basketOrderBtn.classList.remove(this.classes.hidden);
        this.basketCart.classList.add(this.classes.active);
        //this.basketItemsAmount();
    }

    /**
    * Запись текущего состояния в localstorage
    */
    getDataToLocalStr() {
        localStorage.setItem('cart', JSON.stringify(this.basketState));
    }

    countAllItems() {
        let cartItems = this.basketState;
        if(!this.basketState.length) return 0;
        let itemsQty = cartItems.map(item => item.quant);
        return itemsQty.reduce((acc, curItem) => +acc + +curItem);
    }

    /**
    * Собираем данные о товарах, которые пойдут в корзину
    */
    pushCartArray (item) {
        const ident = item.getAttribute('data-id');
        const productName = item.getAttribute('data-title');
        const productPrice = item.getAttribute('data-price');

        let obj = this.basketState.find(item => item.ident === ident);
        if (obj) {
            obj.quant++;
        } else {
            this.basketState.push({
                title: productName,
                price: productPrice,
                ident: ident,
                quant: '1'
            });
        }
    }

    /**
    * Собираю параметры с формы, для передачи на сервер
    */
    getParams(e) {
        let params = {};
        for (let i=0; i<e.target.elements.length; i++) {
            let elem = e.target.elements[i];
            let value = elem.value;
            params[elem.name] = value;
        }
        this.params = params;
    }

    /*
    * Успешная отправка заказа
    */
    succesOrder() {
        this.messages.alert = 'Your order is accepted';
        this.ShowMessages.showMsg(this.messages);
        this.basketPopup.classList.add(this.classes.hidden);
        this.cartWrap.innerHTML = '';
        this.basketOrderBtn.classList.add(this.classes.hidden);
        this.el.classList.remove(this.classes.active);
        this.basketCart.classList.remove(this.classes.active);
        this.basketCartCounter.innerHTML = 0;
        this.basketState = [];
        localStorage.removeItem('cart');
    }

    /**
    * Отправка данных о заказе на сервер
    */
    sendBasketForm(e) {
        this.getParams(e);
        this.productsData = JSON.parse(localStorage.getItem('cart'));
        this.params.products = this.productsData;
        fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(this.params)
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            this.succesOrder();
        })
        .catch((error) => {
            console.log(error);
        })
    }

    /**
     * Открыть/скрыть корзину
    */
    toggleBasket() {
        if(this.el.classList.contains(this.classes.active)) {
            this.el.classList.remove(this.classes.active);
        } else {
            this.el.classList.add(this.classes.active);
        }
    }

    /**
    * Скрыть корзину
    */
    hideBasket() {
        this.el.classList.remove(this.classes.active);
    }
}
