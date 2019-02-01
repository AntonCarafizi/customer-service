var u = new Url('https://kcws.spohr.eu', localStorage.getItem('authkey'), '/kc_kundeninfo/', '/kc_rechnung/', '/kc_get_pdf/', '/artikelimg/', '/img/', 'https://spohr.arvatis.net/development/search?sSearch=', 1, 20, 'desc');
var c = new Customer(u.info_url+u.authkey);
var r = new Rechnung(u.url());

(function(){
    if(!localStorage.getItem('authkey') && window.location.pathname != '/login') { localStorageClear(); }
    noCache();
    $('#year').text((new Date).getFullYear()); 
    r.reload();
    c.getInfo();
    window.onscroll = function() {scrollUp()};
})();

$(document).on('keyup', function(e) { if (e.keyCode == 27) { closePopup() } });
$(document).on('mouseup', function(e) { var container = $(".popup_data"); if (!container.is(e.target) && container.has(e.target).length === 0 && container.length > 0) {closePopup(); } });
$('#order').on('click', function(){ $(this).toggleClass('asc desc'); u.order = $(this).attr('class'); r.reload(); });
$('#logout').on('click', function(e){ e.preventDefault(); var href = $(this).attr('href'); var aktion = $(this).text(); var aktionquestion = $(this).attr('data'); confirmAction(aktion, aktionquestion, href, false); });
$('.search').on('keypress', function(e){ if(e.which == 13) { searchEvents(); } });
$('.search_submit').on('click', function(){ searchEvents(); });
//$(window).scroll(function() { scrollDown(); });
$('#menu-button').on('click', function(){ $('#menu').slideToggle('fast'); });
$('body').on('click', function(e){
    var target = $(e.target);
    var target_tr = target.parent().parent().prev();
    var target_tr_menu = target_tr.find('.status_action').length;
    var target_td = target.parent().next();
    var target_td_menu = target_td.find('.status_action').length;
    var target_menu = (target.hasClass('select_menu') && window.innerWidth > 1100) ?  target_tr : target_td;
    if (target.hasClass('select_menu')) { if (target_tr_menu > 0 && target_td_menu > 0) target_menu.slideToggle('fast'); }
});

function Url(host, authkey, info_url, rechnung_url, file_url, img_path, local_img_path, ext_link, current_page, rechnung_per_page, order){
    this.host = host;
    this.authkey = authkey;
    this.info_url = this.host+info_url;
    this.rechnung_url = this.host+rechnung_url;
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

function Rechnung(){
    this.getInfo = function (el) {
    //console.log(u.url());
     $.ajax({
        url: u.url(),
        type: 'GET',
        dataType: 'json',
        cache: false,
        beforeSend: function () {
            ajaxBefore(el);
        },
        success: function( data, textStatus, jQxhr ){
            var html = '';
            if(!$.isEmptyObject(data) && data[0].ERROR) { localStorageClear(); }
            data.forEach(function( value ) {
                html += '<div class="tr menu relative">'+getAktionDropdown(value.Rechnungsnummer, value.Typ, u.file_url)+'</div>';
                html += '<div class="tr info_row">';
                html += '<div class="td art relative">';
                html += '<div class="select_menu">&#9776;</div>';
                html += '<span><img src="'+u.local_img_path+value.Art+'.png?timestamp='+getRandomNumber()+'" /></span><a class="bold" href="/?search=RE'+value.Rechnungsnummer+'">'+value.Rechnungsnummer+'</a></div>';
                html += '<div class="td menu relative">'+getAktionDropdown(value.Rechnungsnummer, value.Typ, u.file_url)+'</div>';
                html += '<div class="td rechnungsnummer relative"><a class="bold" href="/?search=RE'+value.Rechnungsnummer+'">'+value.Rechnungsnummer+'</a></div>';
                html += '<div class="td artikel_col">'+getBilderliste(value.Bilderliste, value.Rechnungsnummer)+'</div>';
                html += '<div class="td rechnungsbetrag price right"><span>'+value.Rechnungsbetrag+' &#8364;</span></div>';
                html += '<div class="td auftragsnummer bold"><span>'+value.Auftragsnummer+'</span></div>';
                html += '<div class="td datum bold relative"><span>'+value.Datum+'</span></div>';
                html += '</div>';
            });
            $('#rechnung').append(html);
            if($.isEmptyObject(data)) { var more = ($('.info_row').length > 0) ?  t.more : ''; noResults(); }
        },
        error: function( jqXhr, textStatus, errorThrown ){
            popup(+t.service_not_available+'!', 'error_popup');
        },
        complete: function(){
            ajaxComplete();
            ($('#no_results').length > 0) ? $('#more-results').hide() : $('#more-results').show();
            $('.info_row').find('button').on('click', function(){  });
        },
    });
    }
    this.reload = function () {
        $('.info_row').remove();
        if ($('#no_results').length > 0) { $('#no_results').remove(); }
        u.current_page = 1;
        r.getInfo($('body'));
        $('#more-results').hide();
    }
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

function scrollDown(){
    if ($('#no_results').length == 0) {
        if($(window).scrollTop() == $(document).height() - $(window).height()) {
            u.current_page++;
            r.getInfo($('body'));
        }
    }
}

function scrollUp(){
    (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? $("#myBtn").show() : $("#myBtn").hide();
}

function moreResults() {
    u.current_page++; r.getInfo($('.more-results'));
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function noResults(){
    $('#rechnung').after('<div id="no_results">'+t.none+' '+t.more+' '+t.results+'!</div>');
}

function ajaxBefore(elem){
    if($('.wait').length == 0) {
    switch (elem.attr('class')) {
        case 'yes' : 
            elem.before('<div class="loading"></div>');
            break;
        case 'more-results':
            elem.html('<img src="/img/loading9.gif">');
            break;    
        default:
            if($('.overlay').length == 0) { $('body').append('<div class="overlay white"></div>'); }
            elem.append('<div class="wait"></div>');
        }
    }
}

function ajaxComplete(){
    $('.overlay').remove();
    $('.more-results').html(t.more+' '+t.results);
    $('.wait').remove();
    $('.main').show();
}

function getNextImage(e){
    var carousel = e.closest('div').find('.carousel');
    var items = carousel.find('.items');
    var items_qty = items.children().length;
    var item_width = items.children().width();
    var items_width = items_qty*item_width;
    var items_left = parseInt(items.css('left'));
    if( items_width + items_left > item_width*2 )
    { e.prev().show(); items.animate({ left: items_left - item_width}, 100);}
}

function getPrevImage(e){
    var carousel = e.closest('div').find('.carousel');
    var items = carousel.find('.items');
    var item_width = items.children().width();
    var items_left = parseInt(items.css('left'));
    if( items_left < 0 )
    {items.animate({left: items_left + item_width}, 100); }
    if(items_left + item_width == 0)
    { e.hide(); }
}


function getAktionDropdown(id, type, url) {
    var html = '<div class="status_action"><ul>';
    if(type !== '-') {
        html += '<li><a href="'+url+u.authkey+'/rechnung/'+id+'" target="_blank" title="PDF '+t.download+'" alt="PDF '+t.download+'">'+t.show_invoices+'</a></li>';
    }
    html += '<li><a href="/?search=RE'+id+'">'+t.show_articles+'</a></li></ul></div>';
    return html;
}


function getBilderliste(artikel, rechnungsnummer){
    var comma = artikel.indexOf(",");
    var html = '';
    var obj = '';
    if (comma) {
        var artikel_split = artikel.split(",");
        artikel_split.forEach(function( value ){
            obj += getBild(u.img_path, value, rechnungsnummer);
        });
        if (artikel_split.length > 3) {
            html = '<div class="carousel_wrapper"><button class="prev-image" onclick="getPrevImage($(this));">&#8249;</button><button class="next-image" onclick="getNextImage($(this));">&#8250;</button><div class="carousel"><div class="items">'+obj+'</div></div></div>';
        } else {         
            html = '<div class="carousel"><div class="items">'+obj+'</div></div>';
        }
    } else {
        html = getBild(u.img_path, artikel, rechnungsnummer);
    }
    return html;
}

function getBild(img_path, file, rechnungsnummer){
    var img_fullpath = img_path+file;
    var onerror = "errorImage('"+img_fullpath+".jpg?timestamp="+getRandomNumber()+"')";
    var bild = '';
    if(file) {
        bild += '<div class="item"><a href="'+u.ext_link+file+'" target=_blank><div class="item_img"><img class="artikel_img" src="'+img_fullpath+'.jpg?timestamp='+getRandomNumber()+'" alt="'+t.rechnung+' '+rechnungsnummer+' '+t.articles+'" onerror="'+onerror+'" /></div></a></div>';
    }
    return bild;
}

function getRandomNumber() {
    return new Date().getTime();
}

function errorImage(file){
    $('[src="'+file+'"]').attr('src', u.local_img_path+'kein_bild_100_100.png');
}

function confirmAction(aktion, aktionquestion, url, is_ajax){
    var html = aktionquestion+'<div class="buttons"><button class="yes">'+t.yes+'</button><button class="no">'+t.no+'</button></div>';
    popup(html, 'confirm');
    $('.yes').on('click', function(){ 
        if(is_ajax) { ajaxAction(aktion, url, false); }
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

function localStorageClear() {
   localStorage.clear();
   window.location.href = '/'+$('html').attr('lang')+'/login';
}
