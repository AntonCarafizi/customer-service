(function(){
    noCache();
    $('#year').text((new Date).getFullYear());
    if (getUrlParam()) {
        $('#email').hide();
        $('#password').before('<span class="login_msg">'+t.address_change_confirmation+'</span>');
        $('.submit').text(t.confirm);
    }
})();

var host = 'https://kcws.spohr.eu';
var login_url = host+'/kc_get_authkey/';

$(document).on('mouseup', function(e) { var container = $(".popup_data"); if (!container.is(e.target) && container.has(e.target).length === 0 && container.length > 0) {closePopup(); } });
$('input').on('keypress', function(e){ if(e.which == 13) { var form = $(this).closest('form'); submit(form); } });
$('input').on('focus', function(){ if ($(this).hasClass('input_error')) { $(this).removeClass('input_error'); } });
$('.submit').on('click', function(e){ var form = $(this).closest('form'); submit(form); });

function noCache() {
    var links = window.document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href')+'?timestamp='+getRandomNumber();
        links[i].setAttribute('href', href);
    }
}

function popup(data, attr){
  var body = $('body');
  $('.popup').remove();
  $('.overlay').remove();
  body.addClass('popup_opened');
  body.append('<div class="overlay black"></div>');
  body.append('<div class="popup"><div class="inner"><div class="popup_data '+attr+'"><div class="close"></div>'+data+'</div></div></div>');
  $('.close').on('click', function(){ closePopup(); });
}

function closePopup(){
  var body = $('body');
  body.removeClass('popup_opened');
  $('.overlay').remove();
  $('.popup').remove();
}

function getUrlParam() {
    var queryString = window.location.search;
    var search = queryString.substring( queryString.indexOf('=') + 1, queryString.indexOf('&'));
    return search;
}

function ajaxBefore(elem){
    if($('.wait').length == 0) {
    switch (elem.attr('class')) {
        case 'yes' : 
            elem.addClass('loading_confirm').html('<img src="/img/loading9.gif">');
            break;
        case 'submit' :
            elem.addClass('loading_save').html('<img src="/img/loading9.gif">');
            break;       
        default:
            if($('.overlay').length == 0) { $('body').append('<div class="overlay black"></div>'); }
            elem.append('<div class="wait"></div>');
        }
    }
}

function ajaxComplete(){
    var label = (getUrlParam()) ? t.confirm : t.login;
    $('.submit').removeClass('loading_save').html(label);
    $('.wait, .loading_confirm').remove();
    $('.main').show();
}

function getRandomNumber() {
    return new Date().getTime();
}

function submit(form) { 
    var url = login_url;
    var email = $('input[type=email]').val();
    var password = md5($('input[type=password]').val());
    var input = form.find('input');
    url = url+email+'/'+password;
    input.each(function(){
        ($(this).prop('required') && !$(this).val()) ? $(this).addClass('input_error') : $(this).removeClass('input_error');
    });
    if (form.find('.input_error').length == 0) {
        $.ajax({
            url: url,
            dataType: 'json',
            type: 'POST',
            data: $('#login').serialize(),
            beforeSend: function(){
               ajaxBefore($('.submit'));
            },
            success: function( data, textStatus, jQxhr )
            {
                localStorage.setItem('authkey', data[0].authkey);
                var authkey = localStorage.getItem('authkey');
                if(authkey == 'false') {
                    var error = (getUrlParam()) ? t.password_wrong : t.password_or_username_wrong;
                    $('#login').after('<div class="error"><span>'+error+'</span></div>');
                    $('.error').delay(1000).fadeOut('slow', function(){ $(this).remove(); });
                    email = '';
                    password = '';
                    url = '';
                }
                else {
                    (getUrlParam()) ? addressChange() : window.location.href = '/'+$('html').attr('lang')+'/';
                }
            },
            error: function( jqXhr, textStatus, errorThrown ){
                popup(+t.service_not_available+'!', 'error_popup');
            },
            complete: function( event, xhr, settings ){
                ajaxComplete();
            }
        });
    }
}

function addressChange() {
    $.ajax({
        url: 'https://kcws.spohr.eu/kc_set_adresschange/'+getUrlParam(),
        dataType: 'json',
        type: 'GET',
        beforeSend: function(){
           ajaxBefore($('.submit'));
        },
        success: function ( data, textStatus, jQxhr ) {
            if ($('.error').length == 0) { popup(data[0].message, 'success'); } else { closePopup(); }
            setTimeout(function(){ window.location.href = '/'+$('html').attr('lang')+'/catalog-addresses'; }, 3000);
        },
        error: function( jqXhr, textStatus, errorThrown ){
            popup(+t.service_not_available+'!', 'error_popup');
        },
        complete: function( event, xhr, settings ){
            ajaxComplete();
        }
    });
}