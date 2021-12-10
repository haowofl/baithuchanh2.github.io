//Đối tượng Validator
function Validator(options) {

    //Lấy ra parentElement có tên class la form-group cho dù thẻ input có con của bn thẻ cha khác nữa thì vẫn lấy ra được   
    function getParent(element,selector) {
        // dung vong lặp để lặp lân lượt các thẻ cha của thẻ input
        while(element.parentElement){// nếu mà có thẻ cha thì sẽ chạy xuống if
            if(element.parentElement.matches(selector)){// if để đối chiếu xem trong thẻ cha ý có class form-group không
               return element.parentElement;
            }
            element=element.parentElement;//nếu đối chiếu không có thì sẽ gán cho element = cái thẻ cha vừa đc rồi
        }// để tiếp tục lặp qua thẻ cha cấp trên nữa cứ như thế đến khi tìm thấy
    }

    var selectorRules = {};
    
    //hàm thực hiện validate
    function validate(inputElement,rule) {
        let errorMessage;
        let errorElement = getParent(inputElement,options.formGroup).querySelector(options.errorSelector)

        // lấy ra các rule của selector
        let rules = selectorRules[rule.selector]
        
        //lặp qua các rules để lấy ra các phần tử trong rules
        for(let i = 0;i<rules.length;i++) {
            switch(inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            // kiểm tra lần lượt các rules nếu mà có lỗi thì dừng không kiểm tra các rules tiếp theo nữa và đưa ra lỗi
            if(errorMessage) break;
        }
        if(errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement,options.formGroup).classList.add('invalid')
        }
        else {
            errorElement.innerText = '';
            getParent(inputElement,options.formGroup).classList.remove('invalid')
        }
        return !errorMessage // retur convert sang bolean validate không có lỗi sẽ trả về true có lỗi sẽ trả về false
    }

    //lấy element của form cần validate
    let formElement = document.querySelector(options.form)
    if (formElement) {
        // khi submit form
        formElement.onsubmit = function (e){
            e.preventDefault();
            let isFormvalid = true;
            // lặp qua từng rule và validate tất cả các selector
            options.rules.forEach(rule => {
                let inputElement = formElement.querySelector(rule.selector)
                let isValid = validate(inputElement,rule);
                if(!isValid){// !isValid được hiểu là nếu isValid = false thì isFormvalid = false
                    isFormvalid = false;
                }
            });
            var enableInput = formElement.querySelectorAll('[name]:not([disabled])')// lấy ra tất cả thẻ input có attribute name và không có disabled
            var formValues = Array.from(enableInput).reduce(function(values,input){
                switch(input.type){
                    case 'radio':// lấy ra value của radio
                        values[input.name] = formElement.querySelector('input[name = "'+ input.name + '"]:checked').value;// nhắm thẳng đến thẻ input đang đc check để lấy ra value
                        break;
                    case 'checkbox':// lấy ra tất cả value của checked
                        if(!input.matches(':checked')) {// kiểm tra xem checkbox có được checked k nếu không trả ra value rỗng
                            values[input.name] = '';
                            return values
                        };

                        if(!Array.isArray(values[input.name])){
                            values[input.name] = [];
                        }
                        values[input.name].push(input.value)
                        break;
                    case 'file':
                        values[input.name] = input.files;// với ảnh thi lấy dữ liệu là dạng file chứ không lấy đương dẫn
                        break;
                    default:
                        values[input.name] = input.value;
                }

                return  values
            },{})

             if(isFormvalid){
                if(typeof options.onsubmit === 'function'){
                    options.onsubmit(formValues)
                }else {
                    formElement.submit();
                }
            }
        }

        //Lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur oninput)
        options.rules.forEach(rule => {
        //lưu lại các rules cho mỗi input
        if (Array.isArray(selectorRules[rule.selector])) {
            selectorRules[rule.selector].push(rule.test)
        } else {
            selectorRules[rule.selector] = [rule.test];//dung toán tử gán thì phần tử đc trc đó sẽ bị ghi đe
        }// nên dùng push để thêm phần tử vào mảng mà như thế trước hết các rules phải là 1 mảng
        
        let inputElements = formElement.querySelectorAll(rule.selector)

        Array.from(inputElements).forEach(function(inputElement){

            // xử lý khi blur
            inputElement.onblur = function() {
                validate(inputElement,rule)
            }
            // xử lý khi người dùng nhập vào input
            inputElement.oninput = function () {
                let errorElement = getParent(inputElement,options.formGroup).querySelector(options.errorSelector);
                errorElement.innerText = '';
                getParent(inputElement,options.formGroup).classList.remove('invalid')
            }

        });
    });
    }
}

// Định nghĩa các rules
// Nguyên tắc của các reles:
//1. Khi có lỗi trả ra message lỗi
//2. khi hợp lệ => undifined
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function(value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'//methor .trim() loại bỏ dấu cách
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function(value) {
            let regex =/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email'
        }
    }
}

Validator.minLength= function (selector, min, message) {
    return {
    selector: selector,
    test: function(value) {
        return value.length >= min ? undefined : message || `Vui lòng nhập ${min}`
    }
    }
}
Validator.isConirmaed = function (selector, getConfirmed, message) {
    return {
    selector: selector,
    test: function(value) {
        return value === getConfirmed() ? undefined : message || 'Giá trị không đúng vui lòng nhập lại';
    }
    }

}
