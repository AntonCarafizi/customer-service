var u = new Url('https://kcws.spohr.eu', localStorage.getItem('authkey'), '/kc_kundeninfo/', '/kc_rechnung/', '/kc_get_lieferadressen/', '/kc_set_lieferadressen/', '/kc_get_pdf/', '/artikelimg/', '/img/', 'http://spohr.eu/search?sSearch=', 1, 20, 'desc');
var c = new Customer(u.info_url+u.authkey);
var a = new Address();

(function(){
    if(!localStorage.getItem('authkey') && window.location.pathname != '/login') { localStorageClear(); }
    noCache();
    $('#year').text((new Date).getFullYear()); 
    c.getInfo(); 
    a.getInfo();
    window.onscroll = function() {scrollUp()};
})();

$(document).on('keyup', function(e) { if (e.keyCode == 27) { closePopup() } });
$(document).on('mouseup', function(e) { var container = $(".popup_data"); if (!container.is(e.target) && container.has(e.target).length === 0 && container.length > 0) {closePopup(); } });
$('#logout').on('click', function(e){ e.preventDefault(); var href = $(this).attr('href'); var aktion = $(this).text(); var aktionquestion = $(this).attr('data'); confirmAction(false, false, aktion, aktionquestion, href, false); });
$('.search').on('keypress', function(e){ if(e.which == 13) { searchEvents(); } });
$('.search_submit').on('click', function(){ searchEvents(); });
$('input').on('keypress', function(e){ if(e.which == 13) { var form = $(this).parent(); submit(form); } });
$(".submit").on('click', function(e){ var form = $(this).parent(); submit(form); });
$('#menu-button').on('click', function(){ $('#menu').slideToggle('fast'); });
$('input[type=text], input[type=phone], select').on('focus', function(){
    var form  = $(this).parent();
    var submit = form.find('.submit');
    if ($(this).hasClass('input_error')) { 
        $(this).removeClass('input_error');
    }
    submit.removeClass('disabled');
});
$('input[name=PLZ], input[type=phone]').on("keypress keyup blur",function (event) { $(this).val($(this).val().replace(/[^0-9\.]/g,'')); });
$('input[name=Vorname], input[name=Nachname], input[name=Ort]').on("keypress keyup blur",function (event) { $(this).val($(this).val().replace(/[^A-Za-z]/g,'')); });
$('.remove').on('click', function(e){
    e.preventDefault();
    var form = $(this).closest('div').find('form');
    var href = u.set_address_url; 
    var aktion = 'delete'; 
    var aktionquestion = $(this).attr('data');
    if (form.find('input[name=id]').val()) { confirmAction($(this), form, aktion, aktionquestion, href, true); } else { removeAddress($(this), form); }
});

function submit(form) {
    var aktion = (form.find('input[name=id]').val()) ? 'update' : 'insert';
    var input = form.find('input, select option');
    var submit = form.find('.submit');
    input.each(function(){
        if ($(this).prop('required') && !$(this).val()) { $(this).addClass('input_error'); submit.addClass('disabled'); } else { $(this).removeClass('input_error'); }
    });
    if (form.find('.input_error').length == 0) {
        ajaxAction(submit, form, aktion, u.set_address_url, false, submit);
    }
}

function detectmob() {
 var isMobile = (navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
 ) ? true : false;
 return isMobile;
}

function Url(host, authkey, info_url, rechnung_url, get_address_url, set_address_url, file_url, img_path, local_img_path, ext_link, current_page, rechnung_per_page, order){
    this.host = host;
    this.authkey = authkey;
    this.info_url = this.host+info_url;
    this.rechnung_url = this.host+rechnung_url;
    this.get_address_url = this.host+get_address_url+this.authkey;
    this.set_address_url = this.host+set_address_url+this.authkey;
    this.file_url = this.host+file_url;
    this.img_path = img_path;
    this.local_img_path = local_img_path;
    this.ext_link = ext_link;
    this.current_page = current_page;
    this.rechnung_per_page = rechnung_per_page;
    this.order = order;
    this.url = function(){ return this.rechnung_url+this.authkey+'/'+this.current_page+'/'+this.rechnung_per_page+'/order='+this.order; }
}

function Customer(url){
    this.getInfo = function () {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            cache: false,
            beforeSend: function () {
            },
            success: function( data, textStatus, jQxhr ){
                var kundeninfo = data[0];
                if(!$.isEmptyObject(data) && kundeninfo.ERROR) { localStorageClear(); }
                var keys = Object.keys(kundeninfo);
                keys.forEach(function( value, i ){
                    $('#'+value).text(kundeninfo[value]);
                });
                $('.kundeninfo-icon').attr('data', (kundeninfo.Anrede) ? kundeninfo.Anrede : 'Herr');
            },
            error: function( jqXhr, textStatus, errorThrown ){
                popup(+t.service_not_available+'!', 'error_popup');
            },
        });
    }
}

function Address(){
    this.getInfo = function () {
        $.ajax({
            url: u.get_address_url,
            type: 'GET',
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                ajaxBefore($('body'));
            },
            success: function( data, textStatus, jQxhr ){
                if(!$.isEmptyObject(data) && data.ERROR) { localStorageClear(); }
                data.forEach(function( value, i ){
                    getForm();
                    var keys = Object.keys(data[i]);
                    var anrede = (data[i].Anrede) ? data[i].Anrede : 'blank';
                    keys.forEach(function( key, j) {
                        switch (key) {
                            case 'aktiv': $('form:eq('+i+') input[name='+key+']').prop('checked', (data[i].aktiv) ? true : false); break;
                            case 'Anrede': $('form:eq('+i+') option[value='+jsLcfirst(anrede)+']').prop('selected', 'selected'); break;
                            default: $('form:eq('+i+') input[name='+key+']').val(data[i][key]);
                        }
                    }); 
                });
            },
            error: function( jqXhr, textStatus, errorThrown ){
                popup(+t.service_not_available+'!', 'error_popup');
            },
            complete: function( event, xhr, settings ){
                var aktiv = $('form input[name=aktiv]:checked').closest('.address');
                var notAktiv = $('form input[name=aktiv]:not(:checked)').closest('.address');
                aktiv.find('.remove').hide();
                notAktiv.insertAfter(aktiv);
                ajaxComplete();
            },
        });
    }
}

function ajaxAction(el, form, aktion, url, aktioninfo, loading){
    var id = form.find('input[name=id]').val();
    var data = (aktion == 'delete') ? 'id='+id : form.serialize();
    data += '&action='+aktion;
    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        dataType: 'json',
        cache: false,
        beforeSend: function(){
            ajaxBefore(loading);
        },
        success: function( data, textStatus, jQxhr ){
        },
        error: function( jqXhr, textStatus, errorThrown ){
            popup(+t.service_not_available+'!', 'error_popup');
        },
        complete: function(data, textStatus, jQxhr){
            ajaxComplete();
            if (form) { popup(data.responseText, 'success'); }
            switch (aktion) {
                case 'delete' :
                    removeAddress(el, form);
                    break;
                case 'update' :
                    break;
            };
            form.find('.submit').addClass('disabled');
        }
    });
}

function searchEvents(){
    var val_length = $('.search').val().length;
    if(val_length == 0){ window.history.replaceState({}, document.title, "/"); window.location.href = '/'+$('html').attr('lang')+'/?search='+$('.search').val(); }
    if(val_length > 2){ window.location.href = '/'+$('html').attr('lang')+'/?search='+$('.search').val(); }
    if(val_length > 0 && val_length < 3) { 
        $('.search').val(''); $('.search').after('<span class="search_error">3 '+t.letters+' '+t.minimun+'!</span>'); 
        $('.search_error').delay(1000).fadeOut('slow', function(){ this.remove(); }); 
    }
}

function noCache() {
    var links = window.document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href')+'?timestamp='+getRandomNumber();
        links[i].setAttribute('href', href);
    }
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function scrollUp(){
    (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? $("#myBtn").show() : $("#myBtn").hide();
}

function ajaxBefore(elem){
    if($('.wait').length == 0) {
    switch (elem.attr('class')) {
        case 'yes' : 
            (detectmob()) ? elem.addClass('loading_confirm').html('<img src="/img/loading9.gif">') : elem.addClass('loading_confirm').html('<img src="/img/loading12.gif">');
            break;
        case 'submit' :
            elem.addClass('loading_save').html('<img src="/img/loading9.gif">');
            break;
        default:
            if($('.overlay').length == 0) { $('body').append('<div class="overlay white"></div>'); }
            elem.append('<div class="wait"></div>');
        }
    }
}

function ajaxComplete(){
    $('.overlay').remove();
    $('.submit').removeClass('loading_save').html(t.address_save);
    $('.wait, .loading_confirm').remove();
    $('.main').show();
}

function getRandomNumber() {
    return new Date().getTime();
}

function confirmAction(el, form, aktion, aktionquestion, url, is_ajax){
    var html = aktionquestion+'<div class="buttons"><button class="yes">'+t.yes+'</button><button class="no">'+t.no+'</button></div>';
    popup(html, 'confirm');
    $('.yes').on('click', function(){ 
        if(is_ajax) { ajaxAction(el, form, aktion, url, false, $('.yes')); }
        else { if (url === 'login') { localStorageClear(); } window.location.href = url; } });
    $('.no').on('click', function(){ closePopup(); });
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

function getForm(){
    var clone = $('.address:last').clone(true);
    clone.css('display', 'inline-block');
    clone.find('input:text, input[type=phone], select').val('');
    clone.insertBefore('.address:last').hide().fadeIn('fast');
    $('.address:last').hide();
}

function removeAddress(el, form){
    if ($('form').length > 1) {
        form.closest('.address').fadeOut('fast', function(){ $(this).remove(); });
    }
}

function localStorageClear() {
   localStorage.clear();
   window.location.href = '/'+$('html').attr('lang')+'/login';
}

function jsLcfirst(string) 
{
    return string.charAt(0).toLowerCase() + string.slice(1);
}