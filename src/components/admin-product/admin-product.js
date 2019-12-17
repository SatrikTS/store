import Handlebars from 'handlebars/dist/handlebars';
import GetProducts from '../get-products/get-products';
import ShowMessages from '../show-msg/show-msg';
import Methods from '../methods/methods';

export default class AdminProduct {
    constructor(item) {
        this.el = item;
        this.url = this.el.getAttribute('action');
        this.productList = document.querySelector('.js-products-add-list');
        this.popupEdit = document.querySelector('.js-edit-popup');
        this.formEdit = document.querySelector('.js-edit-form');
        this.inputImg = this.el.querySelector('.js-input-image');
        this.inputImgEdit = document.querySelector('.js-input-image-edit');


        this.sortItem = document.querySelectorAll('.js-sort-item');

        this.messages = {};
        this.imgArrState =this.getProdData() || [];

        this.imgObj = {
            image: ''
        };

        this.templates = {
            product: '#product-add-hbtpl',
            msg: '#product-msg-hbtpl'
        };

        this.ShowMessages = new ShowMessages();


        this.classes = {
            hidden: 'is-hidden',
            error: 'is-error',
            active: 'is-active'
        }

        this.init();
        this.setListeners();
    }

    /**
    * Инициализация при загрузке
    */
    init() {
        this.getProdutList();
    }

    /**
    * Отслеживаем события
    */
    setListeners() {
        this.el.addEventListener('submit', (e) => {
            e.preventDefault();
            // если true, nо отправляем форму
            if(Methods.form(e, this.el)) {
                this.getParams(e);
                this.imgArrState.push(this.imgObj);
                this.sendNewProduct();
                this.clearForm(e);
            }
        })

        this.formEdit.addEventListener('submit', (e) => {
            e.preventDefault();
            // если true, nо отправляем форму
            if(Methods.form(e, this.formEdit)) {
                this.imgArrState[this.formEdit.getAttribute('data-id')] = this.imgObj;
                this.getDataToLocalStr();
                this.editProduct(e, this.productId);
            }
        })

        this.inputImg.addEventListener('change', (e) => {
            this.handleFileSelect(e, this.inputImg);
        })

        this.inputImgEdit.addEventListener('change', (e) => {
            this.handleFileSelect(e, this.inputImgEdit);
        })

    }

    /**
    * компиляция handlebars-template
    */
    static prepareTpl(templateSelector, data) {
        const templateProduct = document.querySelector(templateSelector).innerHTML;
        const containerTpl = Handlebars.compile(templateProduct);
        return containerTpl(data);
    }


    /**
    * Запрашиваем список товаров
    */
    getProdutList() {
        GetProducts.getProducts(this.url, this.templates.product, this.productList, true);
        setTimeout(() => {
            this.renderNewProductList();
        }, 1000)
    }

    /**
    * Очищаем элементы формы
    */
    clearForm(e) {
        for (var i=0; i<e.target.elements.length; i++) {
            e.target.elements[i].value = '';
        }
    }

    /**
    * Получаем данные из loacalstorage
    */
    getProdData() {
        return JSON.parse(localStorage.getItem('img'));
    }


    /**
    *  Получаем список карточек товаров после подгрузки
    */
    renderNewProductList() {
        const products = document.querySelectorAll('.js-product-item');
        products.forEach((item, i) => {
            var productImg = item.querySelector('.js-table-img')
            var img = document.createElement('img');
            var localImg = JSON.parse(localStorage.getItem('img'));
            if(localImg && localImg[i]) {
                img.src = localImg[i].image
                img.width = 200;
                img.height = 200;
                productImg.append(img);
            }

        })
        this.removeList(products);
        this.editList(products);
        this.sortProductTable(products);
    }

    // Апендим полученый массив с объектами в таблицу
    prodtListSort(itemProductArr, item) {
        itemProductArr.forEach((item) => {
            this.productList.append(item)
        })
    }

    // Апендим полученый массив с объектами в таблицу РЕВЕРСНО!
    prodtListSortReverse(itemProductArr, item) {
        itemProductArr.reverse().forEach((item) => {
            this.productList.append(item)
        })
    }

    /**
    * Переключаем класс для сортировки
    */
    toggleClass(sortItem, e) {
        sortItem.forEach((itemProd) => {
            if(e.target === itemProd && !e.target.classList.contains('is-active') ) {
                e.target.classList.add('is-active');
            } else {
                itemProd.classList.remove('is-active');
            }
        })
    }


    /**
    * Сортировка по таблице
    */
    sortProductTable(products) {
        this.sortItem.forEach((item, index) => {
            var itemProductArr = [];
            products.forEach((itemProduct, i) => {
                itemProductArr.push(itemProduct)
            })
            this.flagSort === false;
            item.addEventListener('click', (e) => {
            this.toggleClass(this.sortItem, e);


                if(item.getAttribute('data-sort') === 'code') {
                    this.prodtListSortReverse(itemProductArr, item);
                }

                if(item.getAttribute('data-sort') === 'name' || item.getAttribute('data-sort') === 'av') {
                    itemProductArr.sort((a, b) => {
                        let nameA = a.getAttribute('data-title').toUpperCase();
                        let nameB = b.getAttribute('data-title').toUpperCase();
                        if (nameA < nameB) return -1;
                        if (nameA > nameB) return 1;
                        return 0;
                    })
                   this.toggleSort(itemProductArr, item);
                }

                if(item.getAttribute('data-sort') === 'price') {
                    itemProductArr.sort((a, b) => {
                        let aPrice = a.getAttribute('data-price');
                        let bPrice = b.getAttribute('data-price');
                        if(isNaN(aPrice)) return 1;
                        if(isNaN(bPrice)) return -1;
                        return +aPrice - +bPrice;
                    })
                    this.toggleSort(itemProductArr, item);
                }
            })
        })
    }

    /**
    * Переворчаиваем сортирвоку
    */
    toggleSort(itemProductArr, item) {
        if(this.flagSort === false) {
            this.prodtListSort(itemProductArr, item);
            this.flagSort = true;
        } else {
            this.prodtListSortReverse(itemProductArr, item);
            this.flagSort = false;
        }
    }

    /**
    * Получаем картинку с загрузки и записываем ее в localstorage
    */
    handleFileSelect(e, itemInput) {
        var file = e.target.files;
        var f = file[0];

        if (!f.type.match('image.*')) {
            alert("Image only please....");
        }

        var reader = new FileReader();
        reader.onload = ((theFile) => {
            return (e) => {
                this.imgObj = {
                    image: e.target.result
                }
                itemInput.previousElementSibling.innerHTML = 'uploaded: ' + f.name;
            };
        })(f);
        reader.readAsDataURL(f);
    }

    /**
    * Собираю параметры с формы, для передачи на сервер
    */
    getParams(e) {
        let params = {};
        for (var i=0; i<e.target.elements.length; i++) {
            var elem = e.target.elements[i];
            var value = elem.value;
            if (elem.name === 'price') value = +elem.value;
            if (elem.name === 'available') value = elem.checked;
            params[elem.name] = value;
        }
        this.params = params;
    }

    /**
    * Удаляем товар из списка
    */
    removeList(products) {
        products.forEach((item, index) => {
            const productRemoveBtn = item.querySelector('.js-product-remove')
            productRemoveBtn.addEventListener('click', (e) => {
                if(e.target === productRemoveBtn) {
                    const productId = item.getAttribute('data-id');
                    this.deleteProduct(productId);
                    item.remove();
                    this.imgArrState.splice(index, 1);
                    this.getDataToLocalStr();
                }
            })
        })
    }

    /**
    * Вызываем попап при изменении товара и заполняем инпута текущей информацией
    */
    editList(products) {
        products.forEach((item, i) => {
            const productEditBtn = item.querySelector('.js-product-edit');

            productEditBtn.addEventListener('click', () => {
                this.productId = item.getAttribute('data-id');

                const productEditRole = item.querySelectorAll('.js-edit-role');

                productEditRole.forEach((itemEdit) => {
                    AdminProduct.setInputValue(itemEdit)
                })
                this.formEdit.setAttribute('data-id', i)
                this.popupEdit.classList.remove(this.classes.hidden);
            });

        })
    };

    // Установка значений в форму в попапе при изменении товара
    static setInputValue(itemEdit) {
        const editInput = document.querySelectorAll('.js-input-edit');

        editInput.forEach((itemInput, i) => {
            if (itemInput.name === itemEdit.getAttribute('data-edit')) {
                itemInput.value = itemEdit.innerHTML;
            }
        });
    };

    /**
    * Запись текущего состояния в localstorage
    */
    getDataToLocalStr() {
        localStorage.setItem('img', JSON.stringify(this.imgArrState));
    }

    /**
    * Отправить данные о новом продукте/ Добавляем товар в список
    */
    sendNewProduct() {
        fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(this.params)
        })
        .then(() => {
            this.messages.alert = 'Product was added';
            this.ShowMessages.showMsg(this.messages);
            this.getDataToLocalStr();
            this.getProdutList();
        })
        .catch((error) => {
            console.log(error);
        })
    }


    /**
    * Удалить товар из списка на сервере
    */
    deleteProduct(productId) {
        const url = this.url + '/' + productId
        fetch(url, {
            method: 'DELETE'
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            this.messages.alert = 'Product was removed';
            this.ShowMessages.showMsg(this.messages);
        })
        .catch((error) => {
            console.log(error);
        })
    }

    /**
    * Изменить товар из списка на сервере
    */
    editProduct(e, productId) {
        this.getParams(e);
        const url = this.url + '/' + productId
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(this.params)
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            this.messages.alert = 'Product was edited';
            this.ShowMessages.showMsg(this.messages);
            this.getProdutList();
            this.popupEdit.classList.add(this.classes.hidden);
        })
        .catch((error) => {
            console.log(error);
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.js-product-form')
        .forEach((item) => {
            new AdminProduct(item);
        });
});
