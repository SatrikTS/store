import Handlebars from 'handlebars/dist/handlebars';
// Получаем данные с сервера методом GET,
// где надо только вытянуть инфу о продуктах
export default class GetItem {
    /**
    * компиляция handlebars-template
    */
    static prepareTpl(templateSelector, data) {
        const templateProduct = document.querySelector(templateSelector).innerHTML;
        const containerTpl = Handlebars.compile(templateProduct);
        return containerTpl(data);
    }

    /**
    * Рендерим ответ
    */
    static getResponse(data, template, container, cart) {
        if (cart) {
            container.innerHTML = GetItem.prepareTpl(template, data);
        } else {
            container.insertAdjacentHTML('afterBegin', GetItem.prepareTpl(template, data));
        }
    }

    /**
    * Запрашиваем список товаров
    */
    static getRequest(url, template, container, cart) {

        fetch(url, {
            method: 'GET'
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            GetItem.getResponse(data, template, container, cart);
        })
        .catch((error) => {
            console.log(error);
        })
    }
}
