//Возможность отчекивать радиокнопки
$(document).on("click", ".form [type=radio]", function() {
	var previousValue = $(this).attr('previousValue');
	var name = $(this).attr('name');
	if (previousValue == 'checked'){
		$(this).removeAttr('checked');
		$(this).prop('checked', false);

		$(this).attr('previousValue', false);
	} else {
		$("input[name="+name+"]:radio").attr('previousValue', false);
		$(this).attr('previousValue', 'checked');
	}
	$(this).trigger('change');
});


function date_fix(form){
	form.find("[type=date],[type=time]").each(function (){
		$(this).attr('data-type',$(this).attr('type'));
		$(this).attr('type','text');
	});

	form.find("[data-type]").on("focus click hover mouseenter",function(){
		console.log('123');
		$(this).attr('type',$(this).attr('data-type'));
	});

	form.find("[data-type]").on("blur",function(){
		$(this).attr('type','text');
	});
}






//активируем маску
function mask_go(form){
	var phoneInput = form.find('input[name="phone"]');

	phoneInput.inputmask("+7 (999) 999-99-99", {
		clearIncomplete: false,
		showMaskOnHover: false,
		showMaskOnFocus: true
	});

	form.find('[data-inputmask-mask]').not(phoneInput).each(function() {
		$(this).inputmask();
	});
}

//заменяем селекты
function select2_go(form){
	form.find('.select2 select').each(function() {
		var label_not_found = "Ничего не найдено";

		if(!$(this).attr('data-ajax')) {
			$(this).select2({
				"language": {"noResults": function () {return label_not_found;}},
				placeholder: $(this).attr('data-placeholder'),
				allowClear: false,
				dropdownParent: $(this).parent(),
				minimumResultsForSearch: Infinity,
				templateResult: iconFromValue,
				templateSelection: iconFromValue,
				escapeMarkup: function(m) { return m; }
			});
		} else {
			var select = $(this);
			$(this).select2({"language": {"noResults": function () {return label_not_found;},"searching": function () {return 'Секундочку';}},
				placeholder:  $(this).attr('data-placeholder'),
				dropdownParent: $(this).parent(),
				ajax: {
					delay: 500,
					url: '/wp-admin/admin-ajax.php',
					dataType: 'json',
					data: function (params) {
						var query = {
							action:'get_tax_childs',
							search: params.term,
							tax:select.attr('data-tax'),
							parent_id:0,
							popular_5:select.attr('data-popular'),
							type: 'public'}
						return query;
					},
					processResults: function (data, params) {
						return {
							results: data.child
						};
					},
					cache: true
				}
			});
		}
		$(this).trigger('change');
	});
}

function iconFromValue (state) {
	if (!state.id) { return state.text; }
	let new_state = '<i class="icon '+state.element.value.toLowerCase()+'"></i>'+state.text;
	return new_state;
}


//Валидатор формы
function validate_form(form){
    var flag = true;
    form.find('.alert').remove();
    form.find('.is-invalid').removeClass('is-invalid');

    form.find('.required, [required]').each(function(){
        var error = '';
        var isCheckbox = $(this).is(':checkbox');
        var val = isCheckbox ? $(this).prop('checked') : $(this).val();

        if(isCheckbox ? !val : (!val || val.trim() === '')) {
            if(isCheckbox) {
                error = 'Необходимо подтвердить согласие';
            } else if($(this).is('select')) {
                error = 'Нужно выбрать вариант связи';
            } else {
                // Ищем текст плейсхолдера для ошибки: сначала обычный placeholder, потом data-placeholder (для Select2)
                var placeholderText = $(this).attr('placeholder') || $(this).attr('data-placeholder') || 'поле';
                error = 'Нужно заполнить: ' + placeholderText;
            }
        }
        else if($(this).attr('name') === 'phone') {
            if ($(this).inputmask && !$(this).inputmask("isComplete")) {
                error = 'Введите полный номер телефона';
            } else {
                var digitsOnly = val.replace(/\D/g, '');
                if(digitsOnly.length < 11) {
                    error = 'Введите полный номер телефона';
                }
            }
        }

        if(error !== ''){
            // Если это скрытый select, у которого рядом создан контейнер Select2 (.select2-container)
            if($(this).is('select') && $(this).next('.select2-container').length) {
                $(this).next('.select2-container').addClass('is-invalid').after("<div class='alert'>" + error + "</div>");
            } else if(isCheckbox && $(this).closest('.policy').length) {
                // Для чекбоксов согласия выводим ошибку после всего блока с текстом/ссылками
                $(this).closest('.policy').after("<div class='alert'>" + error + "</div>");
            } else {
                $(this).addClass('is-invalid').after("<div class='alert'>" + error + "</div>");
            }

            if($(window).width() <= 900) {
                // Скроллим к контейнеру Select2, если валидируем его, иначе к обычному полю
                var scrollTarget = $(this).is('select') && $(this).next('.select2-container').length ? $(this).next('.select2-container') : $(this);
                $('html,body').animate({ scrollTop: scrollTarget.offset().top - 100 }, { duration: 600 });
            }

            // Фокусируем элемент, только если он не скрыт (Select2 скрывает оригинальный select)
            if ($(this).is(':visible')) {
                $(this).focus();
            }
            flag = false;
        }
    });
    return flag;
}

function forms_init(form){
	mask_go(form);
	date_fix(form);
	select2_go(form);
	if(form.hasClass('init')) return false;
	form.addClass('init');
	form.find('.form-check-hover').click(function(){
		var inp = $(this).find('input');
		$(this).find('input').prop( "checked", !inp.prop( "checked") );
	});

	//Запрет ввода букв в числовом поле
	form.find("input[type=number],input[type=tel]" ).on('change keyup', function() {
		var text = $(this).val();
		$(this).val(text.replace(/[^\d]/g,''));
	});

	form.find("select#messenger" ).on('change', function() {
		$(this).closest('.select').attr('data-type',$(this).val());
	});

	//Отключаем нативные всплывающие подсказки браузера — валидируем сами, подписью под полем
	form.attr('novalidate','novalidate');

	//Убираем сообщение об ошибке, как только поле исправили
	form.on('change input', '.required, [required]', function(){
		var el = $(this);
		var anchor = el;
		if(el.is('select') && el.next('.select2-container').length) {
			anchor = el.next('.select2-container');
		} else if(el.is(':checkbox') && el.closest('.policy').length) {
			anchor = el.closest('.policy');
		}
		anchor.removeClass('is-invalid');
		el.removeClass('is-invalid');
		anchor.next('.alert').remove();
	});



	//Отправка файла при нажатии
	form.submit(function(event) {
		event.preventDefault();
		if(validate_form(form)==true){
			var data = {action: form.attr("action"),form: form.attr("data"),fields:form.serialize(),utm:$('body').data('session')};
			form.find('>*:not(.messages)').hide();
			form.append('<div class="loading"></div>');
			form.find('.fail.temp').remove();

			$.post('/wp-admin/admin-ajax.php', data, function(response){
				console.log(response);
				form.find('.loading').remove();
			},'json').done(function(response){

				//console.log(response);

				//Вывод сообщения
				if(response.flag==true) {
					form.find('.succes, .messages').show();
					form.find('.succes, .messages').removeClass('d-none');

                    // B24 Integration | PinscherCRM
					sendB24(form);

					setTimeout(function(){
						location.href = '/spasibo/';
					},1500);
				}
				else if(response.message) {
					form.find('.messages').append('<div class="fail temp">'+response.message+'</div>');
					form.find('>*:not(.messages)').show();
				}else{
					form.find('.fail, .messages').removeClass('d-none');
					form.find('>*:not(.messages)').show();
				}

				//Метрика цели
				if(form.attr('data-ym')){
					var res = form.attr('data-ym').split('||');
					$.each(res,function(index,value){
						ym(93219915, 'reachGoal',value);
					});
				}

			}).fail(function() {
				form.find('.fail,.messages').removeClass('d-none');
			});
		} else {
			return false;
		}
		return false;
	});
}


$("form[action='send_form']").each(function(){
	forms_init($(this));
});

$("form#review-filter").each(function(){
	select2_go($(this));
});

// -- B24 Integration | PinscherCRM
function sendB24(form) {
    const utmList = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_term', 'utm_content', '_ym_uid'];
    const secretKey = 'lEXK1tzckCFSLyuGumsboYfQnpTiswmi';
    const formData = new FormData(form[0]);

    utmList.forEach(utm => {
        const value = getCookie(utm);
        if (value) {
            formData.append(utm, value);
        }
    });

    formData.append('secret_key', secretKey);
    formData.append('form_id', form.attr('id') || form.attr('name') || 'form_' + Date.now());
    formData.append('form_name', form.attr('data') || 'Неизвестно');
    formData.append('url', window.location.href);
    formData.append('http_referer', document.referrer || '');

    fetch('https://manager-integrations.pinscherdev.ru/2026/b24/mir-dental/modules/mir.dental/', {
        method: 'POST',
        body: formData
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}
// -- / B24 Integration | PinscherCRM